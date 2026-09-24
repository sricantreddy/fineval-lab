# FinEval Lab working agreement

## Product rule

The evaluation system is the product. A banking support chat interface is only a test subject.

## Safety rules

- Use synthetic banking data only.
- Never commit credentials, customer data, or real transaction records.
- Keep authentication and authorization outside model prompts.
- Require explicit confirmation before any state-changing banking action.
- Use deterministic checks for tool selection, authorization, latency, and cost.
- Use model-based judges only for qualities that code cannot check reliably.

## Engineering rules

- Put pure evaluation logic in `src/domain` and cover it with tests.
- Keep Convex functions narrow and validate every argument.
- New support-derived cases require human approval before joining the regression suite.
- A pull request must pass tests and the production build.
- Update product and architecture documentation when behavior changes.
