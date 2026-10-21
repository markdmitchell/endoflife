import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/remediation")({
  server: { handlers: { POST: async ({ request }) => {
    const { handleRemediation } = await import("@/lib/remediation.server");
    return handleRemediation(request);
  } } },
});