CREATE TABLE public.ai_gateway_access_state (
  model text PRIMARY KEY,
  message text NOT NULL,
  blocked_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.ai_gateway_access_state TO service_role;
REVOKE ALL ON public.ai_gateway_access_state FROM anon, authenticated;
ALTER TABLE public.ai_gateway_access_state ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.ai_gateway_access_state IS 'Server-only durable circuit breaker for denied AI access; contains no asset inventory.';