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
  const deduped = all.filter((p) => {
    if (!p || seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  // Prioritize products that have release cycles over empty stubs
  deduped.sort((a, b) => {
    const aCount = Array.isArray(a.release_cycles) ? a.release_cycles.length : 0;
    const bCount = Array.isArray(b.release_cycles) ? b.release_cycles.length : 0;
    if (aCount > 0 && bCount === 0) return -1;
    if (aCount === 0 && bCount > 0) return 1;
    return a.name.localeCompare(b.name);
  });

  return deduped;
}

export async function getProduct(slug: string) {
  let { data, error } = await supabase
    .from("products")
    .select("*, release_cycles(*), data_sources(*)")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;

  // If product not found or has 0 release cycles, check known aliases or canonical products by name
  if (!data || !data.release_cycles || data.release_cycles.length === 0) {
    const aliasMap: Record<string, string> = {
      "microsoft-windows": "windows",
      "microsoft-office": "office",
      "microsoft-exchange-server": "exchange-server",
      "microsoft-visual-studio": "visual-studio",
      "microsoft-sql-server": "mssqlserver",
      "joomla-joomla!": "joomla",
    };

    const targetSlug = aliasMap[slug] || slug.replace(/^microsoft-/, "");
    if (targetSlug !== slug) {
      const { data: aliasData } = await supabase
        .from("products")
        .select("*, release_cycles(*), data_sources(*)")
        .eq("slug", targetSlug)
        .maybeSingle();

      if (aliasData && aliasData.release_cycles && aliasData.release_cycles.length > 0) {
        data = aliasData;
      }
    }

    // If still no cycles, attempt lookup by matching name for products that HAVE cycles
    if (data && (!data.release_cycles || data.release_cycles.length === 0)) {
      const { data: namedMatch } = await supabase
        .from("products")
        .select("*, release_cycles(*), data_sources(*)")
        .eq("name", data.name)
        .neq("id", data.id)
        .limit(5);

      const withCycles = (namedMatch || []).find((p) => p.release_cycles && p.release_cycles.length > 0);
      if (withCycles) {
        data = withCycles;
      }
    }
  }

  // Enrich with provenance record
  if (data) {
    const { data: prov } = await supabase
      .from("provenance_records")
      .select("*")
      .eq("entity_id", data.id)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    return {
      ...data,
      provenance: prov || null,
    };
  }

  return null;
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