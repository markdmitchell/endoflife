<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history: force pushing, or rebasing/amending/squashing commits
> that are already pushed: as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## AI remediation
- Keep AI remediation on the existing Risk inventory screen and project asset labels locally; send only the explicitly selected analysis fields to minimize enterprise data disclosure.
- Use authenticated streaming server routes for AI remediation and server-only AI SDK Responses helpers; this keeps secrets off the browser and supports explicit cancellation.
- Persist AI provider access denials in the service-only circuit breaker table; stateless workers cannot safely retain terminal denial state in memory.

## Remediation action tracking
- Store user-authored action statuses in a separate owner-scoped record keyed by environment, product, and installed version, so reimported inventories retain progress without applying it to upgraded versions.
- Keep observed lifecycle risk separate from self-reported action completion; show outstanding EOL actions and still-reported EOL versions independently to avoid claiming verified resolution.
- Keep demo statuses ephemeral and separate from account-saved statuses; do not persist raw uploads or send tracking updates to AI automatically.
