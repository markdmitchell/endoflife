import { describe, it, expect } from "vitest";
import { parseSbom } from "../src/lib/sbom";
import { type CatalogProduct } from "../src/lib/catalog";

describe("Machine-Readable SBOM Ingestion Engine", () => {
  const mockCatalog: CatalogProduct[] = [
    {
      id: 1,
      slug: "nodejs",
      name: "Node.js",
      category: "lang",
      description: "JavaScript runtime built on V8",
      release_cycles: [
        {
          id: 101,
          product_id: 1,
          cycle: "18",
          release_date: "2022-04-19",
          eol_date: "2025-04-30", // Past date -> EOL
          status: "end_of_life",
          latest_release: "18.20.5",
        },
        {
          id: 102,
          product_id: 1,
          cycle: "22",
          release_date: "2024-04-23",
          eol_date: "2027-04-30", // Future date -> Supported
          status: "supported",
          latest_release: "22.11.0",
        },
      ],
    },
    {
      id: 2,
      slug: "python",
      name: "Python",
      category: "lang",
      description: "Python programming language",
      release_cycles: [
        {
          id: 201,
          product_id: 2,
          cycle: "3.8",
          release_date: "2019-10-14",
          eol_date: "2024-10-07", // Past -> EOL
          status: "end_of_life",
          latest_release: "3.8.20",
        },
      ],
    },
  ];

  describe("CycloneDX Parser", () => {
    it("parses CycloneDX 1.5 JSON with components", () => {
      const cyclonedxJson = JSON.stringify({
        bomFormat: "CycloneDX",
        specVersion: "1.5",
        metadata: {
          component: {
            name: "api-backend-container",
          },
        },
        components: [
          {
            name: "nodejs",
            version: "18.19.0",
          },
          {
            name: "python3",
            version: "3.8.10",
          },
        ],
      });

      const parsed = parseSbom(cyclonedxJson, mockCatalog, "Production Kubernetes Cluster");
      expect(parsed.format).toBe("CycloneDX");
      expect(parsed.totalComponentsFound).toBe(2);
      expect(parsed.matchedEnvironments.length).toBe(2);

      const nodeEnv = parsed.matchedEnvironments.find((e) => e.platform.includes("Node.js"));
      expect(nodeEnv).toBeDefined();
      expect(nodeEnv?.risk_level).toBe("CRITICAL (EOL)");
      expect(nodeEnv?.threatIntel.hasCisaKev).toBe(true);
      expect(nodeEnv?.threatIntel.complianceImpacts.length).toBeGreaterThan(0);
    });
  });

  describe("SPDX Parser", () => {
    it("parses SPDX 2.3 JSON with packages", () => {
      const spdxJson = JSON.stringify({
        spdxVersion: "SPDX-2.3",
        name: "Enterprise Microservice Package",
        packages: [
          {
            name: "nodejs",
            versionInfo: "18.20.1",
          },
        ],
      });

      const parsed = parseSbom(spdxJson, mockCatalog);
      expect(parsed.format).toBe("SPDX");
      expect(parsed.totalComponentsFound).toBe(1);
      expect(parsed.matchedEnvironments[0]?.version).toBe("18.20.1");
      expect(parsed.matchedEnvironments[0]?.risk_level).toBe("CRITICAL (EOL)");
    });
  });

  describe("Trivy Scanner JSON Parser", () => {
    it("parses Trivy container scanner JSON format", () => {
      const trivyJson = JSON.stringify({
        SchemaVersion: 2,
        ArtifactName: "registry.gitlab.com/ops/payments-service:v2.4",
        Results: [
          {
            Target: "payments-service (alpine 3.18)",
            Class: "os-pkgs",
            Packages: [
              {
                Name: "nodejs",
                Version: "18.16.0",
              },
            ],
          },
        ],
      });

      const parsed = parseSbom(trivyJson, mockCatalog);
      expect(parsed.format).toBe("Trivy");
      expect(parsed.totalComponentsFound).toBe(1);
      expect(parsed.matchedEnvironments[0]?.platform).toBe("Node.js");
      expect(parsed.matchedEnvironments[0]?.deployment_env).toBe(
        "registry.gitlab.com/ops/payments-service:v2.4",
      );
    });
  });

  describe("Error handling & Unmatched Components", () => {
    it("throws a descriptive error on invalid JSON", () => {
      expect(() => parseSbom("not-valid-json{{{", mockCatalog)).toThrow(/Invalid JSON/);
    });

    it("throws error on unrecognized JSON schemas", () => {
      expect(() => parseSbom(JSON.stringify({ randomKey: "value" }), mockCatalog)).toThrow(
        /Unrecognized inventory format/,
      );
    });

    it("categorizes components not in catalog as unmatched", () => {
      const sbom = JSON.stringify({
        bomFormat: "CycloneDX",
        components: [
          {
            name: "proprietary-inhouse-lib",
            version: "1.0.0",
          },
        ],
      });

      const parsed = parseSbom(sbom, mockCatalog);
      expect(parsed.totalComponentsFound).toBe(1);
      expect(parsed.matchedEnvironments.length).toBe(0);
      expect(parsed.unmatchedComponents.length).toBe(1);
      expect(parsed.unmatchedComponents[0]?.name).toBe("proprietary-inhouse-lib");
    });
  });
});
