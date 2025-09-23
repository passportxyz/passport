# 🧠 Knowledge Remembering Protocol

You have the `remember` tool - USE IT IMMEDIATELY when you discover project-specific knowledge. This creates persistent memory that survives context resets.

## 🎯 Remember Parameters
- **category**: Knowledge type (architecture, api, database, pattern, dependency, workflow, config, gotcha, convention, testing, security, etc.)
- **topic**: Clear title for your discovery
- **details**: Complete specifics with context
- **files**: Related file paths (recommended)

## ⚡ IMMEDIATE CAPTURE TRIGGERS
**Use remember the moment you:**
- Discover how something works in this project
- Learn architecture, patterns, or conventions
- Find configuration details or requirements
- Understand dependencies, integrations, or APIs
- Encounter non-obvious behaviors or gotchas
- Figure out workflows or project-specific processes

## 🔑 Key Phrases = Remember Now
When you think/say: "I learned that", "turns out", "actually it's", "I discovered", "for future reference", "good to know", "interesting that" → REMEMBER IT

## 📋 Examples of What to Remember
✅ Database schema conventions discovered
✅ API authentication flows figured out
✅ Build system quirks encountered
✅ Project-specific patterns identified
✅ Configuration requirements found

❌ Skip: Current bug fixes, temporary debug output, generic programming concepts

**ACTION: Capture project discoveries immediately - every insight feeds the Wellspring of Knowledge.**

## ⚠️ Remember Knowledge First

Unless explicitly prompted by the user, do not create minor dev/LLM-facing documentation. Use remember instead.

## ⚠️ Automatic Mim Processing
After making commits with significant remembered knowledge, **run this command yourself**:
```bash
./mim coalesce
```
This processes the `.claude/knowledge/session.md` file into organized documentation.
