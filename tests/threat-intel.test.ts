import { describe, it, expect } from "vitest";
import {
  getThreatIntel,
  findMatchingKevEntries,
  UNIVERSAL_EOL_COMPLIANCE_IMPACTS,
  type CisaKevEntry,
} from "../src/lib/threat-intel";

describe("Threat Intelligence & Compliance Engine", () => {
  describe("Universal EOL Compliance Impacts", () => {
    it("contains PCI-DSS 4.0, NIST SP 800-53, ISO 27001, SOC 2, and HIPAA", () => {
      const standards = UNIVERSAL_EOL_COMPLIANCE_IMPACTS.map((c) => c.standard);
      expect(standards).toContain("PCI-DSS 4.0");
      expect(standards).toContain("NIST SP 800-53");
      expect(standards).toContain("ISO 27001");
      expect(standards).toContain("SOC 2");
      expect(standards).toContain("HIPAA");
    });

    it("designates PCI-DSS and NIST 800-53 as CRITICAL audit risk", () => {
      const pci = UNIVERSAL_EOL_COMPLIANCE_IMPACTS.find((c) => c.standard === "PCI-DSS 4.0");
      const nist = UNIVERSAL_EOL_COMPLIANCE_IMPACTS.find((c) => c.standard === "NIST SP 800-53");
      expect(pci?.auditRisk).toBe("CRITICAL");
      expect(nist?.auditRisk).toBe("CRITICAL");
    });
  });

  describe("Curated Threat Profiles (e.g., Node.js, Python, Ubuntu)", () => {
    it("returns curated threat intel for Node 18 EOL", () => {
      const intel = getThreatIntel("Node.js", "18.19.0", true);
      expect(intel.hasCisaKev).toBe(true);
      expect(intel.knownExploitedCves.length).toBeGreaterThan(0);
      expect(intel.complianceImpacts.length).toBe(UNIVERSAL_EOL_COMPLIANCE_IMPACTS.length);
      expect(intel.recommendedUpgrade.targetCycle).toBe("22");
    });

    it("returns Ubuntu ESM commercial bridge for Ubuntu 18.04", () => {
      const intel = getThreatIntel("Ubuntu", "18.04", true);
      expect(intel.commercialBridge).toBeDefined();
      expect(intel.commercialBridge?.provider).toContain("Canonical");
      expect(intel.commercialBridge?.programName).toContain("Ubuntu Pro");
    });

    it("returns Red Hat ELS commercial bridge for RHEL 7", () => {
      const intel = getThreatIntel("Red Hat Enterprise Linux", "7.9", true);
      expect(intel.commercialBridge).toBeDefined();
      expect(intel.commercialBridge?.provider).toContain("Red Hat");
      expect(intel.commercialBridge?.programName).toContain("Extended Life Cycle Support");
    });

    it("suppresses compliance impacts when asset is not EOL", () => {
      const intel = getThreatIntel("Node.js", "22.0.0", false);
      expect(intel.complianceImpacts.length).toBe(0);
    });
  });

  describe("findMatchingKevEntries", () => {
    const mockKev: CisaKevEntry[] = [
      {
        cveID: "CVE-2023-46805",
        vendorProject: "Ivanti",
        product: "Connect Secure",
        vulnerabilityName: "Ivanti Connect Secure Authentication Bypass",
        dateAdded: "2024-01-10",
        shortDescription:
          "Ivanti Connect Secure and Policy Secure authentication bypass vulnerability",
        requiredAction: "Apply vendor mitigations",
        dueDate: "2024-01-22",
        knownRansomwareCampaignUse: "Known",
        notes: "",
        cwes: ["CWE-287"],
      },
      {
        cveID: "CVE-2021-44228",
        vendorProject: "Apache",
        product: "Log4j",
        vulnerabilityName: "Apache Log4j Remote Code Execution Vulnerability",
        dateAdded: "2021-12-10",
        shortDescription: "Apache Log4j2 contains an RCE vulnerability in JNDI lookup",
        requiredAction: "Upgrade to Log4j 2.15.0 or later",
        dueDate: "2021-12-24",
        knownRansomwareCampaignUse: "Known",
        notes: "",
        cwes: ["CWE-502"],
      },
    ];

    it("matches vendor project and product name", () => {
      const matches = findMatchingKevEntries("Log4j", mockKev);
      expect(matches.length).toBe(1);
      expect(matches[0]?.cveId).toBe("CVE-2021-44228");
      expect(matches[0]?.ransomwareUse).toBe(true);
      expect(matches[0]?.cvss).toBe(9.8);
    });

    it("returns empty array when query does not match", () => {
      const matches = findMatchingKevEntries("nonexistent-software-xyz", mockKev);
      expect(matches).toEqual([]);
    });
  });
});
