import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { actionKey, isActionStatus, type ActionRecords, type ActionStatus } from "@/lib/action-tracking";
import type { SbomParsedEnvironment } from "@/lib/sbom";

export function useActionTracking(isSampleData: boolean) {
  const [ownerId, setOwnerId] = useState<string | null>(null);
  const [saved, setSaved] = useState<ActionRecords>({});
  const [demo, setDemo] = useState<ActionRecords>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pending, setPending] = useState<Set<string>>(new Set());
  const generation = useRef(0);
  const locks = useRef(new Set<string>());

  useEffect(() => {
    let active = true;
    async function load() {
      const run = ++generation.current;
      setLoading(true); setSaved({}); setOwnerId(null); setError("");
      const { data: auth } = await supabase.auth.getUser();
      if (!active || run !== generation.current) return;
      const user = auth.user;
      if (!user) { setLoading(false); return; }
      setOwnerId(user.id);
      const result = await supabase.from("inventory_action_status").select("asset_key,status,updated_at").eq("owner_id", user.id);
      if (!active || run !== generation.current) return;
      if (result.error) setError("Saved action statuses could not be loaded. Refresh to try again.");
      else {
        const records: ActionRecords = {};
        for (const row of result.data ?? []) {
          if (isActionStatus(row.status)) records[row.asset_key] = { status: row.status, updatedAt: row.updated_at };
        }
        setSaved(records);
      }
      setLoading(false);
    }
    void load();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(event => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") void load();
    });
    return () => { active = false; generation.current++; subscription.unsubscribe(); };
  }, []);

  async function update(env: SbomParsedEnvironment, status: ActionStatus) {
    const key = actionKey(env);
    if (locks.current.has(key)) return;
    const record = { status, updatedAt: new Date().toISOString() };
    if (isSampleData) { setDemo(previous => ({ ...previous, [key]: record })); return; }
    if (!ownerId || loading || error) return;
    const run = generation.current;
    locks.current.add(key); setPending(new Set(locks.current));
    try {
      const result = await supabase.from("inventory_action_status")
        .upsert({ owner_id: ownerId, asset_key: key, status, updated_at: record.updatedAt }, { onConflict: "owner_id,asset_key" })
        .select("status,updated_at").single();
      if (run !== generation.current) return;
      if (result.error) { toast.error("Action status was not saved. Please try again."); return; }
      setSaved(previous => ({ ...previous, [key]: { status, updatedAt: result.data.updated_at } }));
      toast.success("Action status saved.");
    } catch { toast.error("Action status was not saved. Please try again."); }
    finally { locks.current.delete(key); setPending(new Set(locks.current)); }
  }

  return { records: isSampleData ? demo : saved, update, pending, loading, error, signedIn: Boolean(ownerId), canEdit: isSampleData || (!loading && Boolean(ownerId) && !error) };
}