# Future AI surface

- Status: UI/context scaffolding only; no model provider, message persistence, or real tool execution is connected.
- Owner: `context/ai`, `hooks/ai`, `pages/ai`, `components/ai`, `services/ai/client.js`, `tools/ai/registry.js`, `types/ai`.
- AIContext is in-memory and carries calculator, calculatorResults, portfolio, goals, savedPlans, userProfile, conversation. `DiscussWithAIButton` attaches calculator context then routes to `/ai`.
- `AIClient` deliberately throws “No AI provider is configured.” Registry tool handlers are placeholders returning `not-connected`.
- Before integration, define server-side provider boundary, data minimization/consent, authorization for every tool, persistence/retention, streaming/error states, and financial-safety copy. Never expose Supabase service credentials or blindly trust client context.
- Keep provider adapters separate from calculator engines; tool ids are the future integration contract.
