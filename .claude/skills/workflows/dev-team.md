# Dev Team Workflow

Use this workflow when a task requires planning, implementation, review, and knowledge capture.

## Workspace Isolation

Before creating team members, you MUST create a git worktree:
```
git worktree add .borg/worktrees/{team-name} -b team/{team-name}
```
Set all team members' working directory to the worktree path. This is not
optional — teams must work in isolation from the main branch.

## GitHub Integration

- **Planner**: If given a GitHub issue, overwrite its body with the full plan (no comments — comments create conflicting information). If no issue exists, create one. The issue body IS the plan.
- **Worker**: Always opens a pull request on the worktree branch referencing the issue (`Closes #N`). Never merge — that's the master thread's job.
- **Reviewer**: Approves the PR on GitHub when satisfied. Review commentary stays in-thread.
- Store issue/PR numbers in task metadata (`issueNumber`, `prNumber`) for visibility across the team.

## Shared Task List

All team members share a task list. **Be proactive about it:**
- Check `TaskList` at the start of every session and after completing any task
- Claim tasks by setting yourself as owner and status `in_progress` BEFORE starting work
- Mark tasks `completed` immediately when done — teammates may be waiting for blockers to clear
- Never start a task that is blocked or already owned by someone else

## Standard Tasks (Planner always creates these)

The Planner creates ALL tasks upfront at the start — both standard workflow tasks and dynamic implementation subtasks. Standard tasks are always the same regardless of what's being built:

| # | Owner | Subject | Blocked by |
|---|-------|---------|------------|
| 1 | Planner | Create implementation plan | — |
| 2 | Planner | Create or update GitHub issue with plan | #1 |
| 3 | Worker | Review plan; clarify with Planner if unclear, then proceed | #2 |
| 4–N | Worker | [Dynamic implementation subtasks — see below] | #3 |
| N+1 | Worker | Open pull request | all impl tasks |
| N+2 | Reviewer | Review PR; ask Planner to confirm plan was implemented | #N+1 |
| N+3 | Documenter | Interview team and capture learnings | #N+2 |

Use `addBlockedBy` when creating tasks so blockers are enforced and agents see work unlock in sequence.

## Dynamic Implementation Tasks

After the standard tasks, Planner creates the actual work subtasks (tasks #4–N). These are specific to the feature — e.g., "Add router module", "Write unit tests", "Update schema". Rules:
- All blocked by task #3 (Worker: review plan)
- All block the PR task (Worker: open pull request)
- Be granular enough that Worker can check them off as it goes
- Each should be completable in one focused session

## Roles

### Planner
- Goes first: receives the initial task/issue from the user
- Creates ALL tasks (standard + dynamic) upfront with correct blockers
- Uses `/compound-engineering:workflows:plan` to produce a structured plan with research, spec analysis, and acceptance criteria
- Creates or overwrites the GitHub issue body with the full plan
- Sends plan to master thread for approval before Worker begins
- Answers Worker questions if plan is unclear
- Validates Reviewer's "does this match the plan?" check at the end

### Worker
- Waits for task #3 to unblock before starting implementation
- Claims task #3, reviews plan, messages Planner if anything is unclear, then marks it done
- Uses `/compound-engineering:workflows:work` to execute the plan — this handles branch setup, incremental commits, test-as-you-go, and quality checks
- Uses **blocking sub-agents** for parallelism within tasks (see `.claude/skills/sub-agents.md`)
- Runs tests, fixes issues
- Opens the PR when all implementation tasks are completed

### Reviewer
- Claims the review task when it unblocks (after PR is open)
- Uses `/compound-engineering:workflows:review` to run multi-agent code review — this discovers and delegates to review sub-agents (security-sentinel, performance-oracle, architecture-strategist, kieran-typescript-reviewer, etc.) in parallel, synthesizes findings, and creates actionable todo files
- MUST ask the Planner: "Does this implementation match your plan?" — required step
- Approves the PR on GitHub when satisfied
- If issues found: uses `/compound-engineering:resolve_todo_parallel` to fix review findings, or sends specific feedback to Worker for complex issues
- Never rubber-stamp — if you can't point to specific code you verified, you haven't reviewed

### Documenter
- Claims the docs task when it unblocks (after review approved)
- Interviews each teammate (one message each, expect one reply each)
- Captures learnings into CLAUDE.md and into the project knowledge system (use the `mim-ai:remember` skill if available — see Mim instructions for how knowledge is structured)
- Keeps CLAUDE.md tight and token-efficient — every line costs tokens in every future session
- Trims stale or redundant entries while adding new ones
- Sends final summary to master thread — this is the team's "done" signal

Note: model selection is handled by the message router, not per-role.

## Sub-Agent Usage

All roles should use **blocking sub-agents** for parallel work within their role. See `.claude/skills/sub-agents.md` for the full guide. Key rules:
- Launch multiple Agent calls in a single message when tasks are independent — they run concurrently
- Never use `run_in_background: true` for work you need to see — use blocking
- The compound-engineering slash commands already use sub-agents internally (research agents in plan, review agents in review) — you don't need to wrap them

## Multiple Workers (Rare)

For exceptionally large tasks where a single Worker's context would be insufficient, the Planner may recommend splitting into multiple Worker roles with clearly separated file boundaries. Each Worker gets its own worktree branch and PR. The Reviewer reviews all PRs. The master thread merges them in order.

This is rare — most tasks are better served by a single Worker using parallel blocking sub-agents. Only split workers when:
- The task has genuinely independent streams (e.g., new service + separate frontend)
- Each stream is large enough to fill a worker's context on its own
- The streams don't share files (otherwise merge conflicts negate the benefit)

## Message Discipline

**The #1 rule: only send a message if the recipient needs to act on it.**

Every cross-thread message triggers a response (and burns tokens). So:

- NEVER send acknowledgments ("Got it!", "Thanks!", "Great work!")
- NEVER send status updates to teammates — update the task list instead, they can see it
- NEVER broadcast to multiple agents — message only the NEXT agent in the chain
- NEVER congratulate or celebrate with teammates

Legitimate messages (recipient must act):
- Planner → Worker: "Here is the plan, implement tasks #4–N" (deliverable, includes plan)
- Worker → Planner: "The plan says X but I found Y, how should I handle this?" (question)
- Worker → Reviewer: "PR ready for review: #N" (with PR link)
- Reviewer → Planner: "Does this implement what you planned?" (required validation)
- Reviewer → Worker: "These issues need fixing: ..." (actionable feedback with specifics)
- Documenter → each teammate: interview question (one message, expects one reply)
- Documenter → master thread: final summary (done signal)

When you finish a workflow step, update the task status — don't message teammates to tell them you're done.

## Coordination Flow

1. Create a thread for each role
2. Give the Planner the task (issue, description, context)
3. Planner runs `/compound-engineering:workflows:plan`, creates all tasks with blockers, creates/updates GitHub issue
4. Planner sends plan to **master thread for approval**
5. Master/user approves or rejects the plan
6. If approved, Planner sends plan to Worker: "implement tasks #4–N"
7. Worker claims task #3, reviews plan, asks Planner if unclear, marks #3 done
8. Worker runs `/compound-engineering:workflows:work` with the plan file, implements tasks, opens PR
9. Reviewer's task unblocks — runs `/compound-engineering:workflows:review` on the PR
10. Reviewer asks Planner to confirm plan match (required)
11. If issues: Reviewer → Worker with specific fixes OR runs `/compound-engineering:resolve_todo_parallel`; Worker fixes and updates PR, goto 9
12. If approved: Reviewer approves PR on GitHub; Documenter's task unblocks
13. Documenter sends ONE interview message to each teammate, waits for replies
14. Documenter writes docs, sends summary to master thread (DONE)
15. All agents go silent — no farewell messages

## After Completion

- Only the Documenter's message to master thread signals "done"
- Agents do NOT message each other after the Documenter finishes
- The master thread handles PR merge and team cleanup (`/clear_team`)
- If an agent receives a message after completing its role, it responds briefly but does not initiate new cross-thread messages

## When to Use

When the user describes a task that would benefit from structured development:
suggest creating a dev team. Ask first — this is a big operation.
