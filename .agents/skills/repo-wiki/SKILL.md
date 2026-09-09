---
name: repo-wiki
description: "Persistent, agent-maintained repo wiki — the durable state-of-the-repo, not short-term plans. Lives at /wiki/ in the repo root. TRIGGER when: exploring unfamiliar code, completing a significant task, noticing outdated documentation, planning architectural changes, or when the user asks about project knowledge/documentation. Also triggers for wiki maintenance or verification requests."
---

# Repo Wiki

A persistent, agent-maintained knowledge base that lives at `/wiki/` in the repo root. Browsable on GitHub. All markdown.

This skill has three parts:

1. **[SKILL.md](SKILL.md)** — Core skill: structure, philosophy, when to read/write/fix
2. **[getting-started.md](getting-started.md)** — Bootstrapping: fresh setup or migrating from existing knowledge systems (MIM, memory files, fat CLAUDE.md)
3. **[maintenance.md](maintenance.md)** — Deep verification: periodic checks, haiku subagent pattern

## Install

To enable in a repo:

1. Create `/wiki/` at the repo root with an `index.md`
2. Add `@wiki/index.md` to the repo's `CLAUDE.md` so the index loads into context
3. Install this skill via marketplace or copy `skills/repo-wiki/` into the target repo

Only the index goes into context. Agents read/grep individual pages on demand.

## Structure

```
/wiki/
  index.md          <- loaded into context via CLAUDE.md
  architecture/     <- what & why: design, history, decisions
  development/      <- how: gotchas, setup, processes
```

The two-directory split is a starting point. Repos can organize differently — the only hard requirement is `index.md` at the wiki root.

## Index Format

```markdown
- [Page Title](path/to/page.md) — what's in this page, specific enough to know when to read it
```

One line per page. Keep descriptions tight — this is loaded into every conversation.

## Terseness

North star. Wiki pages must be:

- **Short.** Say it once. No restating.
- **Specific.** Code paths, table names, concrete details. Not generalities.
- **Scannable.** Headers, bullets, code blocks. No prose paragraphs.
- **No filler.** No "This document describes..." or "Overview" sections.

A wiki page reads like a senior engineer's notes, not documentation.

## When to Read

- **Before planning.** Check the index for pages related to what you're about to touch.
- **Before any big change.** Read relevant architecture pages so you don't contradict existing design.
- **When you hit something unexpected.** Grep the wiki before investigating from scratch.
- **When the index description sounds relevant.** Read the page.

Search order: `index.md` first. If that doesn't help, grep `/wiki/`.

## What the Wiki Is (and Isn't)

The wiki is the **state of the repo** — a durable, accurate snapshot of how things work right now. It answers: "What does this system do? How is it structured? What are the non-obvious rules?"

**It is not:**

- A place for short-term plans, sprint goals, or "what we're working on this week"
- A scratchpad for in-progress thinking or brainstorming
- A changelog or activity log — git history covers that
- A project management surface — use issues, boards, or planning docs

If it would be stale in a month, it doesn't belong in the wiki. Plans change; the wiki should describe what *is*, not what *might be*.

## When to Write

- **After completing a big task.** If you learned something non-obvious, add it.
- **When you discover a gotcha.** Write it up immediately.
- **When you find the wiki was wrong.** Fix it right then. Code is truth.
- **When you explain something to the user that isn't in the wiki.** That explanation probably belongs there.

Don't write pages for things obvious from the code. Write them for things you'd forget in two weeks.

## When to Fix (No Asking)

- A page contradicts the code — fix it now.
- A referenced file/function/table doesn't exist — fix or remove the reference.
- A page is redundant with another — merge them, update the index.

These are factual corrections. Just do them.

## When to Ask the Human

- Reorganizing wiki structure
- Deleting a page entirely
- Design philosophy where you're unsure of intent

## Page Template

```markdown
# Title

One-line summary.

## Section

Content. Be terse.
```

No frontmatter. No metadata. No timestamps — git handles history.

## Improving This Skill

This skill is designed to get better over time. When you use it and notice something:

- A wiki pattern that works well or poorly -> update this skill
- A missing guideline for when to write vs. not write -> add it
- A maintenance pattern that should be documented -> update maintenance.md
- An edge case in the read/write/fix decision tree -> clarify it

If you're unsure whether a change is right, open an issue describing what you noticed.
