import type { SbomParsedEnvironment } from "./sbom";

export const ACTION_STATUSES = ["Planned", "In progress", "Remediated"] as const;
export type ActionStatus = typeof ACTION_STATUSES[number];
export type ActionRecord = { status: ActionStatus; updatedAt: string };
export type ActionRecords = Record<string, ActionRecord>;

export function isActionStatus(value: string): value is ActionStatus {
  return ACTION_STATUSES.some(status => status === value);
}

// Version-specific identity intentionally survives reordered/reimported files, not upgrades.
export function actionKey(env: Pick<SbomParsedEnvironment, "deployment_env" | "platform" | "version">) {
  return JSON.stringify([env.deployment_env.trim(), env.platform.trim().toLowerCase(), env.version.trim()]);
}

export function actionStatus(env: SbomParsedEnvironment, records: ActionRecords): ActionStatus {
  return records[actionKey(env)]?.status ?? (env.migration_status === "In Progress" ? "In progress" : "Planned");
}

export function actionSummary(environments: SbomParsedEnvironment[], records: ActionRecords, date: string) {
  const eol = environments.filter(env => env.eol_date !== null && env.eol_date <= date);
  return {
    outstandingEol: eol.filter(env => actionStatus(env, records) !== "Remediated").length,
    reportedEol: eol.length,
    unknown: environments.filter(env => !env.eol_date).length,
    planned: environments.filter(env => actionStatus(env, records) === "Planned").length,
    inProgress: environments.filter(env => actionStatus(env, records) === "In progress").length,
    remediated: environments.filter(env => actionStatus(env, records) === "Remediated").length,
  };
}