# Getting Started

How to set up a code wiki in a repo — especially one that already has scattered knowledge.

## Fresh Repo (No Existing Knowledge)

1. Create `/wiki/index.md` at the repo root (empty is fine)
2. Add `@wiki/index.md` to the repo's `CLAUDE.md`
3. Install this skill
4. Start writing pages as you work — the wiki grows organically

## Repo With Existing Knowledge

Most repos accumulate knowledge in ad-hoc systems before adopting a wiki. Common patterns:

- **Inlined knowledge files** — directories like `.claude/knowledge/` with a map file that `@`-references everything into context (e.g., MIM systems). Problem: hundreds/thousands of lines loaded into every conversation.
- **Memory files** — `/memory/` or `.claude/memory/` with frontmatter-indexed entries. Similar to wiki but typically less structured.
- **Fat CLAUDE.md** — knowledge crammed directly into CLAUDE.md sections. Works until it doesn't.
- **Scattered READMEs** — tribal knowledge buried in subdirectory READMEs, inline comments, or doc strings.

### Migration Process

#### 1. Audit

Find where knowledge lives:

```
# Common locations
.claude/knowledge/    # MIM-style knowledge systems
.claude/memory/       # Memory files
memory/               # Borg-style memory
wiki/                 # Maybe someone already started one
```

Read the index/map file if one exists. Count files, estimate total lines. Check how it's loaded — is everything inlined into context via `@` refs?

#### 2. Triage

Not everything migrates. For each existing entry, ask:

- **Still accurate?** Grep referenced files/functions. If they don't exist, the entry is stale — skip or rewrite.
- **Non-obvious?** If you'd learn it in 5 minutes of reading the code, it doesn't need a wiki page.
- **Worth the index line?** Every wiki page costs one line in the index that loads into every conversation. Merge small related entries into single pages.

Typical migration keeps 50-70% of entries. Small entries get merged, stale ones get dropped, obvious ones get skipped.

#### 3. Restructure

Map existing categories to wiki directories. The split doesn't need to match 1:1 — optimize for how agents will look things up.

Example mapping from a MIM-style system:
```
architecture/ + patterns/ + deployment/  →  wiki/architecture/
gotchas/ + config/ + workflows/          →  wiki/development/
api/ + database/                         →  wiki/architecture/  (or own dirs if large)
```

Start with two directories (`architecture/`, `development/`). Split further only when a directory gets unwieldy (15+ files).

#### 4. Migrate Pages

For each entry that passed triage:

1. Copy content to the wiki location
2. Strip any metadata/frontmatter — wiki pages are plain markdown
3. Tighten prose — apply the terseness standard from [SKILL.md](SKILL.md)
4. Verify `See:` references and code paths still exist
5. Add an entry to `/wiki/index.md`

Use parallel haiku subagents for bulk migration — one per file, each verifies and rewrites.

#### 5. Wire Up

1. Add `@wiki/index.md` to CLAUDE.md
2. Remove the old `@` reference that inlined everything (e.g., `@.claude/knowledge/KNOWLEDGE_MAP_CLAUDE.md`)
3. Keep the old knowledge directory around temporarily — delete after confirming nothing was lost

#### 6. Verify

Run a quick maintenance check (see [maintenance.md](maintenance.md)) to confirm all index entries link to real files and descriptions are accurate.

### Local Knowledge

Some repos have subdirectory-level knowledge (e.g., `subproject/.knowledge/`). These can either:

- **Stay local** — if the knowledge is only relevant to that subdirectory, keep it there and reference it from a local CLAUDE.md
- **Promote to wiki** — if it's useful repo-wide, move it into `/wiki/` and add an index entry

The test: would an agent working in a different part of the repo benefit from knowing this? If yes, promote it.

## After Setup

The wiki is now live. From here:

- Follow the read/write/fix rules in [SKILL.md](SKILL.md)
- Pages accumulate naturally as agents work
- Run maintenance when drift is suspected — see [maintenance.md](maintenance.md)
