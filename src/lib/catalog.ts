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

export async function getProvenance(limit = 1000) {
  const { data, error } = await supabase
    .from("provenance_records")
    .select("*")
    .order("fetched_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data ?? [];
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