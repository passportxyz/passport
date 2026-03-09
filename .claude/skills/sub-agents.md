# Sub-Agent Delegation

Use the `Agent` tool to delegate work to sub-agents. Sub-agents run Claude Code as a subprocess with full tool access and return their result to you.

## When to use sub-agents

**Always delegate when:**
- The task is significant (more than a few file reads or edits)
- The work can be described as a self-contained unit
- You're doing research, exploration, or analysis
- You need to implement a feature, fix a bug, or write code
- Multiple independent tasks can be done in parallel

**Do it inline when:**
- It's a trivial lookup you can do in one tool call
- The task is small AND heavily depends on nuanced context you've built up over many conversation turns

This is a tradeoff, not a hard rule. Sub-agents always need context passed via the prompt, and your conversation context is always *somewhat* relevant. The question is whether the task is big enough that preserving your context window is worth the cost of summarizing context for the sub-agent. For any significant work, it almost always is. When in doubt, delegate.

## Always use blocking sub-agents

**Blocking** means you `await` the agent's result before continuing. This is always correct for any work you need to see done.

**The ideal pattern — multiple blocking agents in parallel:**

Launch multiple Agent tool calls in a single message when the tasks are independent. They run concurrently and you get all results back before proceeding.

```
[Message with multiple Agent tool calls]
→ Agent 1: research authentication patterns  (blocking, parallel)
→ Agent 2: read existing auth code           (blocking, parallel)
→ Agent 3: check test coverage               (blocking, parallel)
[All three complete, results returned to you]
```

## Never use non-blocking sub-agents for work

`run_in_background: true` is for genuinely background processes — running a dev server, watching files, something that should persist independently of your work. It is NOT for tasks where you want to see the result.

**The anti-pattern that destroys context:**
1. Launch non-blocking agent
2. Continue doing other work
3. Check on the agent's status
4. Check again
5. Your context is now full of polling overhead and partial state

If you find yourself wanting to "check on" a sub-agent, you should have used blocking. The result of a blocking agent costs zero context overhead — it returns once, you read it, you move on.

## Summary

> Use blocking sub-agents. Do not use non-blocking sub-agents and check on them — that wastes your context. Blocking sub-agents preserve your context orders of magnitude better.
