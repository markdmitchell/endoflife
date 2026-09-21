INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
WHERE lower(email) IN ('fragglemark@gmail.com','markdmitchell@outlook.com','jbshenberger@gmail.com')
ON CONFLICT (user_id, role) DO NOTHING;

DROP TRIGGER IF EXISTS on_auth_user_created_admin ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_admin_user();

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  );
$function$;

REVOKE EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated;

DROP POLICY "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));
DROP POLICY "Users can read own roles" ON public.user_roles;
CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(),'admin'));

DROP POLICY "Admins manage sources" ON public.data_sources;
CREATE POLICY "Admins manage sources" ON public.data_sources FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

DROP POLICY "Admins manage products" ON public.products;
CREATE POLICY "Admins manage products" ON public.products FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

DROP POLICY "Admins manage release cycles" ON public.release_cycles;
CREATE POLICY "Admins manage release cycles" ON public.release_cycles FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

DROP POLICY "Admins manage provenance" ON public.provenance_records;
CREATE POLICY "Admins manage provenance" ON public.provenance_records FOR ALL TO authenticated
  USING (private.has_role(auth.uid(),'admin')) WITH CHECK (private.has_role(auth.uid(),'admin'));

DROP POLICY "Users read own inventory" ON public.environment_inventories;
CREATE POLICY "Users read own inventory" ON public.environment_inventories FOR SELECT TO authenticated
  USING (owner_id = auth.uid() OR private.has_role(auth.uid(),'admin'));
DROP POLICY "Users update own inventory" ON public.environment_inventories;
CREATE POLICY "Users update own inventory" ON public.environment_inventories FOR UPDATE TO authenticated
  USING (owner_id = auth.uid() OR private.has_role(auth.uid(),'admin'))
  WITH CHECK (owner_id = auth.uid() OR private.has_role(auth.uid(),'admin'));
DROP POLICY "Users delete own inventory" ON public.environment_inventories;
CREATE POLICY "Users delete own inventory" ON public.environment_inventories FOR DELETE TO authenticated
  USING (owner_id = auth.uid() OR private.has_role(auth.uid(),'admin'));
DROP POLICY "Users insert own inventory" ON public.environment_inventories;
CREATE POLICY "Users insert own inventory" ON public.environment_inventories FOR INSERT TO authenticated
  WITH CHECK (owner_id = auth.uid() OR private.has_role(auth.uid(),'admin'));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.get_provenance_sources();