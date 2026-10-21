import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getUser: vi.fn(), state: vi.fn(), upsert: vi.fn(), status: 200 }));
vi.mock("@supabase/supabase-js", () => ({ createClient: () => ({ auth: { getUser: mocks.getUser } }) }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { from: () => ({
  select: () => ({ eq: () => ({ maybeSingle: mocks.state }) }), upsert: mocks.upsert,
}) } }));
vi.mock("../src/lib/ai/responses.server.ts", () => ({ createResponsesCall: (_request: Request, config: { inspectResponse: (response: Response) => Promise<void> }) => {
  const responseInspected = config.inspectResponse(Response.json({ message: "Access blocked" }, { status: mocks.status }));
  return { responseInspected, gateway: { getRunId: () => "gateway-issued-id" }, result: { fullStream: (async function* () {
    yield { type: "start" };
    yield { type: "text-delta", text: "1. Asset 1: validate support and schedule migration." };
  })() } };
} }));
import { handleRemediation } from "../src/lib/remediation.server";

const body = { assets: [{ asset: "Asset 1", platform: "Python", version: "3.10", eolDate: "2026-10-04", target: "", migrationStatus: "Planned", waiverExpires: null }], context: "" };
const request = () => new Request("http://localhost:8080/api/remediation", { method: "POST", headers: { Authorization: "Bearer test-token" }, body: JSON.stringify(body) });
beforeEach(() => {
  vi.stubEnv("SUPABASE_URL", "https://example.invalid"); vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "publishable-test"); vi.stubEnv("LOVABLE_API_KEY", "test-key");
  mocks.getUser.mockResolvedValue({ data: { user: { id: "verified-user" } }, error: null });
  mocks.state.mockResolvedValue({ data: null, error: null }); mocks.upsert.mockResolvedValue({ error: null }); mocks.upsert.mockClear(); mocks.status = 200;
});
describe("AI remediation server boundary", () => {
  it("rejects signed-out calls before AI access", async () => {
    const response = await handleRemediation(new Request("http://localhost/api/remediation", { method: "POST" }));
    expect(response.status).toBe(401);
  });
  it("streams recommendations and completion with a gateway-issued run ID", async () => {
    const response = await handleRemediation(request());
    expect(response.headers.get("X-Lovable-AIG-Run-ID")).toBe("gateway-issued-id");
    expect(await response.text()).toContain('"type":"done"');
  });
  it("preserves insufficient-credit status and safe message", async () => {
    mocks.status = 402;
    const response = await handleRemediation(request());
    expect(response.status).toBe(402);
    expect(await response.json()).toEqual({ message: "Access blocked" });
  });
  it("persists provider denials and preserves 403", async () => {
    mocks.status = 403;
    expect((await handleRemediation(request())).status).toBe(403);
    expect(mocks.upsert).toHaveBeenCalledWith({ model: "openai/gpt-6-astra", message: "Access blocked" });
  });
  it("blocks new calls after a persisted provider denial", async () => {
    mocks.state.mockResolvedValue({ data: { message: "Provider access denied" }, error: null });
    const response = await handleRemediation(request());
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ message: "Provider access denied" });
  });
});