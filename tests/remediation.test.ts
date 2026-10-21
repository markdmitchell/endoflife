import { describe, expect, it } from "vitest";
import { prepareRemediationAssets, remediationInput } from "../src/lib/remediation";
import { parseSbom } from "../src/lib/sbom";

describe("AI inventory data minimization", () => {
  const rows = parseSbom(JSON.stringify({ bomFormat: "CycloneDX", components: [{ name: "nodejs", version: "18.19.0" }] }), [], "private-payments-host").matchedEnvironments;
  it("excludes asset identities and owner details by default", () => {
    const assets = prepareRemediationAssets(rows, false);
    expect(assets[0]?.asset).toBe("Asset 1");
    expect(JSON.stringify(assets)).not.toContain("private-payments-host");
    expect(JSON.stringify(assets)).not.toContain("business_owner");
  });
  it("includes asset names only with explicit selection", () => {
    expect(prepareRemediationAssets(rows, true)[0]?.asset).toBe("private-payments-host");
  });
  it("requires an inventory before prioritization", () => {
    expect(remediationInput.safeParse({ assets: [], context: "" }).success).toBe(false);
  });
  it("validates the full provided inventory without silent truncation", () => {
    const asset = prepareRemediationAssets(rows, false)[0];
    expect(remediationInput.safeParse({ assets: Array(201).fill(asset), context: "" }).success).toBe(false);
    expect(remediationInput.safeParse({ assets: Array(200).fill(asset), context: "" }).success).toBe(true);
  });
});