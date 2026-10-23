import { describe, expect, it } from "vitest";
import { actionKey, actionStatus, actionSummary, isActionStatus, type ActionRecords } from "../src/lib/action-tracking";
import { parseSbom } from "../src/lib/sbom";

const base = parseSbom(JSON.stringify({ bomFormat: "CycloneDX", components: [{ name: "nodejs", version: "18" }] }), [], "payments").matchedEnvironments[0];
if (!base) throw new Error("Missing fixture");
const env = { ...base, eol_date: "2026-04-30", migration_status: "Migration Planned" as const };

describe("remediation action tracking", () => {
  it("supports planned, in progress, and remediated statuses", () => {
    expect(["Planned", "In progress", "Remediated"].map(isActionStatus)).toEqual([true, true, true]);
    expect(isActionStatus("No Action Needed")).toBe(false);
  });
  it("restores status for reimported assets but not a different version", () => {
    const records: ActionRecords = { [actionKey(env)]: { status: "In progress", updatedAt: "2026-10-23" } };
    expect(actionStatus({ ...env, id: "reimported-id" }, records)).toBe("In progress");
    expect(actionStatus({ ...env, version: "22" }, records)).toBe("Planned");
  });
  it("keeps planned and in-progress EOL assets outstanding", () => {
    const second = { ...env, deployment_env: "orders" };
    const records: ActionRecords = { [actionKey(second)]: { status: "In progress", updatedAt: "2026-10-23" } };
    expect(actionSummary([env, second], records, "2026-10-23").outstandingEol).toBe(2);
  });
  it("closes remediated actions without claiming observed EOL risk is resolved", () => {
    const records: ActionRecords = { [actionKey(env)]: { status: "Remediated", updatedAt: "2026-10-23" } };
    expect(actionSummary([env], records, "2026-10-23")).toMatchObject({ outstandingEol: 0, reportedEol: 1, remediated: 1 });
  });
  it("does not let waivers close outstanding actions or unknown dates count as supported", () => {
    const waived = { ...env, riskAccepted: { approvedBy: "SecOps", expiresAt: "2027-01-01", compensatingControl: "Isolated", acceptedAt: "2026-10-23" } };
    expect(actionSummary([waived, { ...env, eol_date: null }], {}, "2026-10-23")).toMatchObject({ outstandingEol: 1, unknown: 1 });
  });
});