CREATE TABLE public.inventory_action_status (
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  asset_key text NOT NULL,
  status text NOT NULL DEFAULT 'Planned' CHECK (status IN ('Planned', 'In progress', 'Remediated')),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (owner_id, asset_key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.inventory_action_status TO authenticated;
GRANT ALL ON public.inventory_action_status TO service_role;
ALTER TABLE public.inventory_action_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners read action status" ON public.inventory_action_status FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "Owners insert action status" ON public.inventory_action_status FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners update action status" ON public.inventory_action_status FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Owners delete action status" ON public.inventory_action_status FOR DELETE TO authenticated USING (owner_id = auth.uid());
COMMENT ON TABLE public.inventory_action_status IS 'Private per-user remediation tracking keyed by exact asset identity and installed version; no raw inventory or AI output.';