import { supabase } from "@/integrations/supabase/client";

export type LifecycleStatus = "supported" | "approaching_eol" | "end_of_life";

export interface CatalogStats {
  products: number;
  cycles: number;
  provenance: number;
}

export async function getCatalogStats(): Promise<CatalogStats> {
  const [prodRes, cycRes, provRes] = await Promise.all([
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("release_cycles").select("*", { count: "exact", head: true }),
    supabase.from("provenance_records").select("*", { count: "exact", head: true }),
  ]);
  return {
    products: prodRes.count ?? 0,
    cycles: cycRes.count ?? 0,
    provenance: provRes.count ?? 0,
  };
}

export async function getCatalog() {
  const batches = await Promise.all([
    supabase.from("products").select("*, release_cycles(*)").order("name").range(0, 999),
    supabase.from("products").select("*, release_cycles(*)").order("name").range(1000, 1999),
    supabase.from("products").select("*, release_cycles(*)").order("name").range(2000, 2999),
    supabase.from("products").select("*, release_cycles(*)").order("name").range(3000, 3999),
  ]);

  const all: any[] = [];
  for (const b of batches) {
    if (b.data) all.push(...b.data);
  }

  const seen = new Set<number>();
  return all.filter((p) => {
    if (!p || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });
}

export async function getProduct(slug: string) {
  const { data, error } = await supabase
    .from("products")
    .select("*, release_cycles(*), data_sources(*)")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getSources() {
  const { data, error } = await supabase.from("data_sources").select("*").order("name");
  if (error) throw error;
  return data ?? [];
}

export async function getProvenance(options?: { source?: string; entityType?: string; limit?: number }) {
  let query = supabase.from("provenance_records").select("*");
  if (options?.source && options.source !== "all") {
    query = query.eq("source_name", options.source);
  }
  if (options?.entityType && options.entityType !== "all") {
    query = query.eq("entity_type", options.entityType);
  }
  const { data, error } = await query
    .order("id", { ascending: true })
    .limit(options?.limit ?? 1000);
  if (error) throw error;
  return data ?? [];
}

export async function getProvenanceSources(): Promise<string[]> {
  const { data: rpcData, error: rpcErr } = await supabase.rpc("get_provenance_sources");
  if (!rpcErr && rpcData && Array.isArray(rpcData) && rpcData.length > 0) {
    return rpcData.map((r: { source_name: string }) => r.source_name);
  }
  const { data: sources } = await supabase.from("data_sources").select("name").order("name");
  return (sources ?? []).map((s) => s.name);
}

export function statusLabel(status: LifecycleStatus) {
  if (status === "end_of_life") return "End of life";
  if (status === "approaching_eol") return "Action needed";
  return "Supported";
}

export function formatDate(value: string | null) {
  if (!value) return "Not published";
  try {
    const trimmed = value.trim();
    const dateStr = trimmed.includes("T") ? trimmed : `${trimmed}T00:00:00`;
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(d);
    }
    const fallback = new Date(trimmed);
    if (!isNaN(fallback.getTime())) {
      return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(fallback);
    }
    return trimmed;
  } catch {
    return value;
  }
}