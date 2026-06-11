# Wiki Maintenance

Periodic verification that the wiki matches reality. Not scheduled — triggered when the human asks or when you notice significant drift.

## Quick Check

Scan `index.md`. For each entry:

1. Does the linked file exist?
2. Does the one-line description still fit the page content?

Fix broken links and stale descriptions immediately.

## Deep Verification

Use parallel haiku subagents — one per wiki page. Each agent:

1. Reads the wiki page
2. Checks every referenced file, function, table, or path against the codebase (read, grep, glob)
3. Reports: **accurate**, **needs update** (with specifics), or **obsolete**

```
Agent({
  model: "haiku",
  prompt: "Read wiki page at {path}. For every file path, function name, table name,
           or technical claim, verify it exists/is accurate in the codebase.
           Report: accurate, needs update (say what changed), or obsolete."
})
```

Launch all agents in parallel. Collect results. Apply fixes for clear inaccuracies. Flag ambiguous cases for the human.

## Post-Maintenance

After fixes:

1. Update `index.md` — add new pages, remove deleted ones, fix descriptions
2. Keep entries alphabetical within sections
3. Commit wiki fixes separately from feature work
