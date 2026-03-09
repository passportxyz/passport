### [16:18] [workflow] Verify urgent flags before human notification
**Details**: Before notifying Lucian about urgent flags in HEARTBEAT.md, ALWAYS verify the current status first:

1. Check if the item is still relevant (e.g., if it's about a PR, check if it's already merged)
2. Use gh pr view or gh issue view to get current status
3. Clear the flag from HEARTBEAT.md if it's obsolete
4. Only notify if the urgent item is still pending and actionable

Example: PR #916 urgent flag was set for Monday 2026-02-23, but the PR was already merged that morning. Should have checked status before including it in heartbeat message.

This prevents bothering Lucian with already-completed items and keeps HEARTBEAT.md accurate.
**Files**: HEARTBEAT.md
---

### [17:53] [gotcha] GitHub Apps cannot modify .github/workflows files
**Details**: GitHub Apps do not have permission to create or modify files in `.github/workflows/` directory. This is a platform limitation — the `workflows` permission scope is not available to GitHub Apps.

**Workaround pattern:**
1. Create PR branch with all non-workflow changes
2. Document the exact workflow file diff in PR description (show the full file content needed)
3. Have human apply workflow changes locally after PR is reviewed
4. This avoids blocking PRs on workflow files

**Example:** ID Staking App thread, PR #94 used this pattern

**Key point:** This affects any automated code generation or PR creation that touches CI/CD workflows. Plan accordingly when designing automation.
**Files**: .github/workflows/*
---

