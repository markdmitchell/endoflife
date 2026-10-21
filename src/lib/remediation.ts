import { z } from "zod";
import type { SbomParsedEnvironment } from "./sbom";

export const remediationInput = z.object({
  assets: z.array(z.object({
    asset: z.string().min(1).max(200),
    platform: z.string().min(1).max(200),
    version: z.string().min(1).max(100),
    eolDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
    target: z.string().max(300),
    migrationStatus: z.string().max(100),
    waiverExpires: z.string().max(40).nullable(),
  }).strict()).min(1).max(200),
  context: z.string().max(2000),
}).strict();

export function prepareRemediationAssets(environments: SbomParsedEnvironment[], includeNames: boolean) {
  return environments.map((env, index) => ({
    asset: includeNames ? env.deployment_env : `Asset ${index + 1}`,
    platform: env.platform,
    version: env.version,
    eolDate: env.eol_date,
    target: env.target_upgrade_path,
    migrationStatus: env.migration_status,
    waiverExpires: env.riskAccepted?.expiresAt ?? null,
  }));
}