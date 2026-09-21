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
    const payload = await response.json() as { result?: { name?: string; label?: string; category?: string; releases?: unknown[] } };
    const raw = payload.result;
    if (!raw) throw new Error("The lifecycle source returned an unexpected response.");
    const releases = z.array(cycleSchema).parse(raw.releases ?? []);
    const { data: source } = await context.supabase.from("data_sources").select("id").eq("name", "endoflife.date API v1").single();
    const { data: product, error } = await context.supabase.from("products").upsert({ slug: data.slug, name: raw.label ?? raw.name ?? data.slug, category: raw.category ?? "software", vendor: "Community", source_id: source?.id ?? null, updated_at: new Date().toISOString() }, { onConflict: "slug" }).select("id").single();
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

const inventoryRow = z.object({ environment: z.string().min(1), product_name: z.string().min(1), installed_version: z.string().min(1), business_owner: z.string().optional(), migration_status: z.string().optional(), eol_date: z.string().nullable().optional() });
export const importInventory = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input) => z.object({ rows: z.array(inventoryRow).min(1).max(1000) }).parse(input)).handler(async ({data,context}) => {
  const records=data.rows.map(row=>{const days=row.eol_date?Math.ceil((new Date(row.eol_date).getTime()-Date.now())/86400000):9999;return {...row,business_owner:row.business_owner??null,migration_status:row.migration_status??"Not started",eol_date:row.eol_date??null,risk_status:(days<0?"end_of_life":days<365?"approaching_eol":"supported") as "end_of_life"|"approaching_eol"|"supported",owner_id:context.userId}});
  const {error}=await context.supabase.from("environment_inventories").insert(records); if(error)throw new Error(error.message); return {count:records.length};
});

export const addCustomProduct = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input)=>z.object({slug:z.string().regex(/^[a-z0-9.-]+$/),name:z.string().min(2),vendor:z.string().min(2),category:z.string().min(2),cycle:z.string().min(1),eolDate:z.string(),sourceName:z.string().min(2),sourceUrl:z.string().url().optional().or(z.literal(""))}).parse(input)).handler(async({data,context})=>{
  const {data:allowed}=await context.supabase.rpc("has_role",{_user_id:context.userId,_role:"admin"}); if(!allowed)throw new Error("Administrator access is required.");
  const {data:product,error}=await context.supabase.from("products").upsert({slug:data.slug,name:data.name,vendor:data.vendor,category:data.category,description:"Custom lifecycle record"},{onConflict:"slug"}).select("id").single(); if(error||!product)throw new Error(error?.message??"Record creation failed.");
  const days=Math.ceil((new Date(data.eolDate).getTime()-Date.now())/86400000); const status=days<0?"end_of_life":days<365?"approaching_eol":"supported";
  const {data:cycle,error:cycleError}=await context.supabase.from("release_cycles").upsert({product_id:product.id,cycle:data.cycle,eol_date:data.eolDate,support_end:data.eolDate,status},{onConflict:"product_id,cycle"}).select("id").single(); if(cycleError||!cycle)throw new Error(cycleError?.message??"Cycle creation failed.");
  const {error:provError}=await context.supabase.from("provenance_records").insert({entity_type:"release_cycle",entity_id:cycle.id,source_name:data.sourceName,source_url:data.sourceUrl||null,confidence_score:1,notes:"Administrator supplied lifecycle record"}); if(provError)throw new Error(provError.message); return {name:data.name};
});