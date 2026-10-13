# OpenCode Workflow for BorrowBox

## Golden rule
Never ask the agent to build the entire project in one prompt.

Work one phase and one coherent feature at a time.

## Before every task
1. Open the project root.
2. Run `opencode`.
3. Check `docs/PROJECT_STATE.md`.
4. Tell the agent exactly one feature/bug to work on.
5. Ask it to inspect only relevant files.
6. Let it implement.
7. Ask it to verify.
8. Review the diff.
9. Update PROJECT_STATE.

## Useful commands
Inside OpenCode:
- `/help`
- `/models`
- `/compact` or `/summarize`
- `/details`
- `@path/to/file` to attach a specific file
- `!git status` to run a shell command

OpenCode documents `/compact` as manual session compaction. Automatic compaction
is enabled in this project configuration.

Outside OpenCode:
- `opencode stats` -> inspect token/cost statistics
- `opencode session list` -> list sessions
- `opencode session export ...` -> export a session
- `opencode --continue` -> continue last session

## Context-saving rules
GOOD:
"Fix the borrow request status bug. Inspect the borrow-request controller,
service, model, and the related frontend request-status component. Do not
change unrelated files."

BAD:
"Check the whole project and improve everything."

GOOD:
"Review @backend/src/controllers/borrowRequestController.js"

BAD:
"Read all files."

## Session strategy
Use one session for a coherent feature while it remains manageable.

When the session becomes long:
1. Finish the current coherent task.
2. Verify the work.
3. Update docs/PROJECT_STATE.md.
4. Run `/compact`.
5. If the session is still unwieldy, start a new session.
6. In the new session say:
   "Read AGENTS.md, docs/PROJECT_STATE.md and the relevant docs. Continue only
   the next task."

Do not depend on old chat history as the project's memory.

## Prompt strategy
Each implementation prompt should contain:
- objective
- scope
- constraints
- files/areas to inspect
- verification requirement
- documentation update requirement

## Avoid token waste
- Do not ask the agent to explain every file.
- Do not ask for huge code dumps in chat.
- Let the agent edit files directly.
- Do not repeat the complete project description every turn.
- Use docs as persistent memory.
- Use focused @file attachments.
- Use Plan agent for architecture/review when you do not want changes.
- Use Build agent for implementation.

## Safe stopping point
At the end of every feature:
- working tree reviewed
- focused test/lint/build passed where available
- PROJECT_STATE updated
- next task written down

This makes it safe to stop and resume later.
