import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const cycleSchema = z.object({
  name: z.string(),
  releaseDate: z.string().nullable().optional(),
  eolFrom: z.string().nullable().optional(),
  latest: z.object({ name: z.string().optional(), date: z.string().nullable().optional() }).optional(),
});

export const syncProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ slug: z.string().regex(/^[a-z0-9.-]+$/).max(80) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: allowed } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!allowed) throw new Error("Administrator access is required.");
    const response = await fetch(`https://endoflife.date/api/v1/products/${data.slug}`);
    if (!response.ok) throw new Error(`Source request failed [${response.status}]: ${await response.text()}`);
    const raw = await response.json() as { name?: string; label?: string; category?: string; releases?: unknown[] };
    const releases = z.array(cycleSchema).parse(raw.releases ?? []);
    const { data: source } = await context.supabase.from("data_sources").select("id").eq("name", "endoflife.date API v1").single();
    const { data: product, error } = await context.supabase.from("products").upsert({ slug: data.slug, name: raw.label ?? raw.name ?? data.slug, category: raw.category ?? "software", vendor: "Community", source_id: source?.id, updated_at: new Date().toISOString() }, { onConflict: "slug" }).select("id").single();
    if (error || !product) throw new Error(error?.message ?? "Product update failed.");
    for (const release of releases) {
      const eol = release.eolFrom ?? null;
      const days = eol ? Math.ceil((new Date(eol).getTime() - Date.now()) / 86400000) : 9999;
      const status = days < 0 ? "end_of_life" : days < 365 ? "approaching_eol" : "supported";
      const { error: releaseError } = await context.supabase.from("release_cycles").upsert({ product_id: product.id, cycle: release.name, release_date: release.releaseDate ?? null, eol_date: eol, support_end: eol, latest_version: release.latest?.name ?? null, latest_release_date: release.latest?.date ?? null, status }, { onConflict: "product_id,cycle" });
      if (releaseError) throw new Error(releaseError.message);
    }
    return { product: raw.label ?? raw.name ?? data.slug, cycles: releases.length };
  });