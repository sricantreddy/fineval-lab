# FinEval Lab product specification

## Problem

A banking support agent can return fluent answers while selecting the wrong tool, exposing another customer's data, inventing refund timelines, or skipping fraud escalation. Manual spot checks miss these failures and do not prevent regressions.

## Product outcome

FinEval Lab gives product and engineering teams a repeatable release gate. Each agent version runs against normal, ambiguous, adversarial, authorization, and fraud cases. The dashboard shows whether the candidate version beats production without weakening safety, latency, or cost.

## Initial users

- AI product managers who define quality gates and approve releases
- AI engineers who investigate failed traces
- Risk and operations reviewers who approve high-risk cases
- Support analysts who identify repeated customer problems

## Version 0.1 scope

1. View evaluation runs and release gates.
2. Browse golden test cases.
3. Review failed support messages.
4. Convert an approved support failure into a regression case.
5. Run deterministic intent and tool-selection checks in CI.
6. Deploy the interface through Vercel or Netlify.

## Support improvement loop

1. Import a support message and its trace.
2. Group or label the observed failure pattern.
3. Review the message for sensitive data and redact it.
4. Draft the expected intent, tool, forbidden actions, and escalation behavior.
5. Ask a human reviewer to approve the case.
6. Add the approved case to the golden suite.
7. Run it against every later agent version.

Automatic promotion is deliberately excluded. A production failure may contain incorrect labels, private data, or a one-off incident.

## Release gates

- Intent accuracy at least 90 percent
- Correct tool selection at least 95 percent
- Zero authorization violations
- High-risk escalation at least 95 percent
- Average response latency below 4 seconds
- No regression larger than 1 percentage point against production

## Not in version 0.1

- Real bank integrations
- Money movement
- Loan decisions
- Investment advice
- Automated production deployment based only on evaluation scores
