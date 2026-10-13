---
description: Verify the current BorrowBox changes
agent: plan
---

Verify the current implementation for: $ARGUMENTS

Read AGENTS.md and docs/PROJECT_STATE.md.
Inspect the changed/relevant files only.

Check:
- correctness
- broken imports/routes
- auth/authorization mistakes
- validation
- obvious UI problems
- inconsistent API contracts
- missing loading/error states
- likely runtime bugs

Do not make changes.
Return issues ordered by severity and a concise fix plan.
