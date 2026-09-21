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
  const { data, error } = await supabase
    .from("products")
    .select("*, release_cycles(*)")
    .order("name")
    .range(0, 4999);
  if (error) throw error;
  return data ?? [];
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
  const { data, error } = await supabase.from("provenance_records").select("source_name").order("source_name");
  if (error) {
    const { data: sources } = await supabase.from("data_sources").select("name").order("name");
    return (sources ?? []).map((s) => s.name);
  }
  return Array.from(new Set((data ?? []).map((row) => row.source_name)));
}

export function statusLabel(status: LifecycleStatus) {
  if (status === "end_of_life") return "End of life";
  if (status === "approaching_eol") return "Action needed";
  return "Supported";
}

export function formatDate(value: string | null) {
  if (!value) return "Not published";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(
    new Date(`${value}T00:00:00`),
  );
}