#!/usr/bin/env node
"use strict";

// src/claude.ts
var import_child_process = require("child_process");
var import_fs = require("fs");
var import_os = require("os");
var import_path = require("path");

// src/types.ts
var Colors = {
  RED: "\x1B[0;31m",
  GREEN: "\x1B[0;32m",
  YELLOW: "\x1B[1;33m",
  BLUE: "\x1B[0;34m",
  NC: "\x1B[0m"
  // No Color
};

// src/claude.ts
var import_readline = require("readline");
var ALLOWED_TOOLS = "Read,Write,Edit,MultiEdit,Glob,Grep,LS,Bash,Git";
function streamClaudeOutput(line) {
  try {
    const data = JSON.parse(line);
    if (data.type === "system" && data.subtype === "init" && data.session_id) {
      return data.session_id;
    }
    if (data.message?.content?.[0]?.type === "text") {
      const text = data.message.content[0].text;
      if (text) {
        console.log(text);
      }
    } else if (data.message?.content?.[0]?.type === "tool_use") {
      const toolName = data.message.content[0].name;
      if (toolName) {
        console.log(`[Using tool: ${toolName}]`);
      }
    }
  } catch {
    if (line.trim()) {
      console.log(line);
    }
  }
  return null;
}
async function runClaude(options) {
  const {
    prompt,
    tools = ALLOWED_TOOLS,
    resumeSessionId,
    systemPrompt,
    captureOutput = false
  } = options;
  const args = [];
  if (resumeSessionId) {
    args.push("--resume", resumeSessionId);
  }
  args.push("--verbose");
  args.push("--allowedTools", tools);
  if (systemPrompt) {
    args.push("--append-system-prompt", systemPrompt);
  }
  args.push("--print");
  args.push("--output-format", "stream-json");
  args.push(prompt);
  return new Promise((resolve) => {
    let tempFile;
    let sessionId;
    let fullOutput = "";
    if (captureOutput) {
      const tempDir = (0, import_fs.mkdtempSync)((0, import_path.join)((0, import_os.tmpdir)(), "mim-"));
      tempFile = (0, import_path.join)(tempDir, "output.txt");
    }
    const writeStream = tempFile ? (0, import_fs.createWriteStream)(tempFile) : null;
    const child = (0, import_child_process.spawn)("claude", args, {
      shell: false,
      stdio: ["inherit", "pipe", "pipe"]
    });
    const rl = (0, import_readline.createInterface)({
      input: child.stdout,
      crlfDelay: Infinity
    });
    rl.on("line", (line) => {
      if (captureOutput) {
        fullOutput += line + "\n";
        if (writeStream) {
          writeStream.write(line + "\n");
        }
      }
      const extractedSessionId = streamClaudeOutput(line);
      if (extractedSessionId && !sessionId) {
        sessionId = extractedSessionId;
      }
    });
    child.stderr.on("data", (data) => {
      const text = data.toString();
      if (captureOutput) {
        fullOutput += text;
        if (writeStream) {
          writeStream.write(text);
        }
      }
      process.stderr.write(data);
    });
    child.on("close", (code) => {
      if (writeStream) {
        writeStream.end();
      }
      resolve({
        success: code === 0,
        sessionId,
        tempFile
      });
    });
    child.on("error", (err) => {
      console.error(`${Colors.RED}Failed to start claude: ${err.message}${Colors.NC}`);
      resolve({ success: false });
    });
  });
}
async function runSession(session, options = {}) {
  const {
    tools = ALLOWED_TOOLS,
    systemPrompts = [],
    captureFirstOutput = true
  } = options;
  let sessionId;
  for (let i = 0; i < session.prompts.length; i++) {
    const prompt = session.prompts[i];
    const systemPrompt = systemPrompts[i];
    console.log(`
\u{1F4CB} Running prompt ${i + 1}/${session.prompts.length}...`);
    const result = await runClaude({
      prompt,
      tools,
      systemPrompt,
      resumeSessionId: i > 0 ? sessionId : void 0,
      captureOutput: i === 0 && captureFirstOutput
    });
    if (!result.success) {
      console.error(`${Colors.RED}\u274C Prompt ${i + 1} failed${Colors.NC}`);
      return { success: false, sessionId };
    }
    if (i === 0 && result.sessionId) {
      sessionId = result.sessionId;
      console.log(`\u{1F4DD} Session ID: ${sessionId}`);
    }
    if (result.tempFile) {
      try {
        (0, import_fs.unlinkSync)(result.tempFile);
      } catch (e) {
      }
    }
  }
  return { success: true, sessionId };
}
function ensureInquisitorAgent() {
  const fs = require("fs");
  const path = require("path");
  const agentPath = path.join(process.cwd(), ".claude", "agents", "inquisitor.md");
  if (!fs.existsSync(agentPath)) {
    console.warn(`${Colors.YELLOW}\u26A0\uFE0F  Inquisitor agent not found at ${agentPath}${Colors.NC}`);
    console.warn("   Please ensure Mim is properly installed");
    return false;
  }
  return true;
}

// src/prompts.ts
var COALESCE_COMMAND = {
  name: "coalesce",
  sessions: [
    {
      prompts: [
        `You are processing remembered knowledge. Execute this MANDATORY checklist:

1. **MUST READ** .claude/knowledge/session.md - Even if empty
2. **MUST PROCESS** each entry from session.md:
   - Determine category (architecture/patterns/dependencies/workflows/gotchas/etc)
   - **MUST CREATE OR UPDATE** appropriate file in .claude/knowledge/{category}/
   - Keep dated entries only for gotchas
3. **MUST UPDATE OR CREATE** BOTH knowledge maps:
   - **KNOWLEDGE_MAP.md** (user-facing): Use markdown links like [Topic Name](path/file.md)
   - **KNOWLEDGE_MAP_CLAUDE.md** (Claude-facing): Use RELATIVE @ references like @patterns/file.md or @gotchas/file.md (NOT full paths)
   - Both maps should have identical structure, just different link formats
   - Include last updated timestamps in user-facing map only
4. **MUST CLEAR** session.md after processing - use Write tool with empty content

**VERIFICATION CHECKLIST - ALL MUST BE TRUE:**
- [ ] Read session.md (even if empty)
- [ ] Created/updated .claude/knowledge/ category files for any new knowledge
- [ ] Created/updated BOTH KNOWLEDGE_MAP.md (markdown links) and KNOWLEDGE_MAP_CLAUDE.md (@ references)
- [ ] Verified no knowledge was lost in the transfer
- [ ] Cleared session.md by writing empty content to it

**IF YOU SKIP ANY STEP, YOU HAVE FAILED THE TASK**

IMPORTANT: CLAUDE.md uses @ references to .claude/knowledge/INSTRUCTIONS.md and .claude/knowledge/KNOWLEDGE_MAP_CLAUDE.md
IMPORTANT: KNOWLEDGE_MAP_CLAUDE.md uses RELATIVE @ references (e.g., @patterns/file.md NOT @.claude/knowledge/patterns/file.md)

Documentation structure to create and maintain:
.claude/knowledge/
|-- session.md           # Current session's raw captures (you must clear this)
|-- INSTRUCTIONS.md     # Knowledge remembering instructions (referenced by CLAUDE.md)
|-- architecture/        # System design, component relationships
|-- patterns/           # Coding patterns, conventions
|-- dependencies/       # External services, libraries
|-- workflows/          # How to do things in this project
|-- gotchas/           # Surprises, non-obvious behaviors
|-- KNOWLEDGE_MAP.md        # User-facing index with markdown links
|-- KNOWLEDGE_MAP_CLAUDE.md # Claude-facing index with RELATIVE @ references

After completing all updates, inform the user that documentation has been updated.`
      ]
    }
  ]
};
var DISTILL_COMMAND = {
  name: "distill",
  sessions: [
    // Generate session (3 prompts)
    {
      prompts: [
        // Phase 1: Launch inquisitor agents
        `Launch parallel inquisitor agents to research each knowledge entry.

Your task:
1. Read ALL *.md files in .claude/knowledge/ EXCEPT session.md
2. For EACH substantive knowledge entry found, launch an inquisitor agent
3. Each inquisitor researches ONE specific entry to verify it against the codebase
4. Collect all their research findings

The inquisitor agents will return structured reports with:
- What I Found (current state)
- Changes Detected (recent modifications)
- Related Knowledge (similar entries)
- Observations (discrepancies/issues)

Launch as many inquisitor agents as needed to thoroughly verify the knowledge base.
Aim for comprehensive coverage of all knowledge entries.`,
        // Phase 2: Process findings
        `Process all inquisitor findings and create distill-report.md.

Based on the research from all inquisitor agents:

1. **ANALYZE ALL FINDINGS**:
   - Synthesize research from all inquisitors
   - Identify exact duplicates, near-duplicates, conflicts, outdated info, junk
   - Categorize: AUTO_FIX (clear issues) vs REQUIRES_REVIEW (ambiguous)

2. **AUTO-FIX CLEAR ISSUES**:
   - Remove exact duplicate sections
   - Delete junk/useless information
   - Fix broken references
   - Consolidate redundant information
   - Track all changes made

3. **GENERATE ./distill-report.md** with:
   ## Automated Changes
   [List all auto-fixes made with file names and descriptions]

   ## Requires Review
   [List conflicts needing human guidance]

   For each review item:
   - **Issue**: Clear description
   - **Location**: File path(s)
   - **Current State**: What exists now
   - **Options**: Suggested resolutions

   <!-- USER INPUT START -->
   [Your decisions here]
   <!-- USER INPUT END -->

4. **CRITICAL VERIFICATION**: Double-check that EVERY review item has both:
   - <!-- USER INPUT START --> delimiter before the input area
   - <!-- USER INPUT END --> delimiter after the input area
   - These delimiters MUST be present for EACH individual review item

5. Save to ./distill-report.md (repository root)
6. DO NOT commit changes`,
        // Phase 3: Edge case review
        `think hard

Review your synthesis and distill-report.md:

1. **EDGE CASE REVIEW**:
   - Check for circular duplicates (A->B->C->A)
   - Identify partial overlaps with unique info
   - Consider context-dependent accuracy
   - Look for recently deleted code references
   - Flag ambiguous references

2. **VALIDATION**:
   - Ensure no valuable knowledge is accidentally deleted
   - Verify auto-fixes are truly safe
   - Double-check categorization (auto-fix vs review)
   - Confirm all inquisitor findings were addressed

3. **USER INPUT DELIMITER VERIFICATION**:
   - CRITICAL: Verify EACH review item has <!-- USER INPUT START --> and <!-- USER INPUT END --> delimiters
   - Each review item MUST have its own pair of delimiters
   - No review item should be missing these delimiters
   - Fix any missing delimiters immediately

4. **REFINEMENT**:
   - Adjust recommendations if needed
   - Add any missed issues
   - Improve clarity of review items
   - Update distill-report.md with any changes

Take your time to think through edge cases and ensure the report is thorough and accurate.`
      ]
    },
    // Refine session (1 prompt)
    {
      prompts: [
        `Execute this MANDATORY refinement process:

1. **READ DISTILL REPORT FROM ./distill-report.md**:
   - Read ./distill-report.md (repository root) completely
   - Check if there are any <!-- USER INPUT START --> ... <!-- USER INPUT END --> blocks
   - If present, parse the user's decisions/instructions from between these tags

2. **APPLY USER DECISIONS TO KNOWLEDGE FILES (if any)**:
   - If user input blocks exist, apply the requested changes to the appropriate files
   - Knowledge files are in .claude/knowledge/ (various topic .md files)
   - Special files: KNOWLEDGE_MAP.md (user index) and KNOWLEDGE_MAP_CLAUDE.md (Claude index)
   - DO NOT DELETE either KNOWLEDGE_MAP, we want both the markdown-link and claude-reference versions
   - Make precise edits based on user instructions
   - If changes affect the knowledge maps, update both consistently

3. **DELETE THE REPORT**:
   - After successfully applying any refinements (or if only auto-fixes), delete ./distill-report.md
   - This indicates the refinement session is complete

4. **VERIFICATION**:
   - If user decisions were applied, ensure all changes were applied correctly
   - Verify consistency between KNOWLEDGE_MAP.md and KNOWLEDGE_MAP_CLAUDE.md if modified
   - Report completion status and list of files modified (if any)

IMPORTANT: The report is at ./distill-report.md (repository root). If there are no user input blocks, just delete the report to mark completion (changes were already made during distill).`
      ]
    }
  ]
};
var SYSTEM_PROMPTS = {
  coalesce: "You are M\xEDm's knowledge processor. Your role is to organize raw captured knowledge into structured documentation. You must process every entry, categorize it appropriately, update knowledge maps, and ensure no knowledge is lost.",
  distillPhase1: "You are M\xEDm's distillation orchestrator, Phase 1: Knowledge Verification. You coordinate multiple inquisitor agents to research and verify each knowledge entry against the current codebase. Launch agents systematically to ensure comprehensive coverage.",
  distillPhase2: "You are M\xEDm's distillation synthesizer, Phase 2: Finding Analysis. You process all inquisitor research to identify duplicates, conflicts, and outdated information. You must create a clear distill-report.md with proper USER INPUT delimiters for each review item.",
  distillPhase3: "You are M\xEDm's distillation validator, Phase 3: Quality Assurance. You perform edge case analysis and validation of the distill report. Ensure all USER INPUT delimiters are present, no valuable knowledge is lost, and all recommendations are accurate.",
  refine: "You are M\xEDm's refinement executor. Your role is to apply user decisions from the distill report to the knowledge base. Parse user input sections carefully, apply changes precisely, and clean up the report when complete."
};

// src/commands/coalesce.ts
async function coalesce() {
  console.log("\u{1F504} Running mim coalesce...");
  console.log("Processing remembered knowledge from session.md...");
  console.log("");
  const session = COALESCE_COMMAND.sessions[0];
  const prompt = session.prompts[0];
  const result = await runClaude({
    prompt,
    systemPrompt: SYSTEM_PROMPTS.coalesce
  });
  if (result.success) {
    console.log("");
    console.log("\u2728 Coalesce complete!");
    console.log("");
    console.log("\u{1F4DA} Knowledge processed and organized");
    console.log("\u{1F4CD} Check .claude/knowledge/ for updated documentation");
  } else {
    console.error(`${Colors.RED}\u274C Coalesce failed${Colors.NC}`);
    process.exit(1);
  }
}

// src/commands/distill.ts
var import_fs2 = require("fs");
var import_child_process2 = require("child_process");
var ALLOWED_TOOLS2 = "Read,Write,Edit,MultiEdit,Glob,Grep,LS,Bash,Git";
var ALLOWED_TOOLS_WITH_TASK = `${ALLOWED_TOOLS2},Task`;
async function distillGenerate() {
  if (!ensureInquisitorAgent()) {
    return false;
  }
  const generateSession = DISTILL_COMMAND.sessions[0];
  console.log("\u{1F50D} Starting distill generation...");
  console.log("Phase 1: Launching inquisitor agents...");
  console.log("Phase 2: Processing findings...");
  console.log("Phase 3: Edge case review...");
  const result = await runSession(generateSession, {
    // First prompt uses Task tool for agents, others use regular tools
    // TODO: Consider allowing per-prompt tools configuration in runSession
    tools: ALLOWED_TOOLS_WITH_TASK,
    systemPrompts: [
      SYSTEM_PROMPTS.distillPhase1,
      SYSTEM_PROMPTS.distillPhase2,
      SYSTEM_PROMPTS.distillPhase3
    ],
    captureFirstOutput: true
  });
  if (!result.success) {
    console.error(`${Colors.RED}\u274C Distill generation failed${Colors.NC}`);
    return false;
  }
  if (!result.sessionId) {
    console.error(`${Colors.RED}\u274C Failed to extract session ID${Colors.NC}`);
    return false;
  }
  console.log("");
  console.log("\u2728 Distillation complete!");
  if ((0, import_fs2.existsSync)("./distill-report.md")) {
    console.log("");
    console.log("\u{1F4CB} Distill report generated at ./distill-report.md");
    const report = (0, import_fs2.readFileSync)("./distill-report.md", "utf-8");
    if (report.includes("## Requires Review")) {
      return true;
    } else {
      console.log("   \u2713 Only automatic fixes found, no manual review needed");
      return true;
    }
  }
  return true;
}
async function distillRefine() {
  if (!(0, import_fs2.existsSync)("./distill-report.md")) {
    console.warn(`${Colors.YELLOW}\u26A0\uFE0F  No distill report found at ./distill-report.md${Colors.NC}`);
    console.warn("   Run 'mim distill' first to generate a report");
    return;
  }
  console.log("\u{1F4CB} Applying refinements from distill-report.md...");
  console.log("");
  const refineSession = DISTILL_COMMAND.sessions[1];
  const prompt = refineSession.prompts[0];
  const result = await runClaude({
    prompt,
    systemPrompt: SYSTEM_PROMPTS.refine
  });
  if (result.success) {
    console.log("");
    console.log("\u2728 Refinement complete!");
    console.log("");
    if ((0, import_fs2.existsSync)("./distill-report.md")) {
      console.warn(`${Colors.YELLOW}\u26A0\uFE0F  Note: distill-report.md still exists${Colors.NC}`);
      console.warn("   This might indicate the refinement was incomplete");
    } else {
      console.log("\u2713 All refinements applied successfully");
      console.log("\u2713 Distill report cleaned up");
    }
  } else {
    console.error(`${Colors.RED}\u274C Refinement failed${Colors.NC}`);
    console.error("   Check distill-report.md and try again");
    process.exit(1);
  }
}
async function distill(options) {
  console.log("\u{1F9F9} Running mim distill...");
  console.log("\u{1F50D} Scanning documentation for duplicates, conflicts, junk, and outdated information...");
  console.log("");
  console.log("   [This may take several minutes to analyze all documentation]");
  console.log("");
  const { noInteractive, customEditor, refineOnly } = options;
  const editorCmd = customEditor || process.env.EDITOR || "nano";
  if (refineOnly) {
    if (!(0, import_fs2.existsSync)("./distill-report.md")) {
      console.warn(`${Colors.YELLOW}\u26A0\uFE0F  No distill-report.md found. Run 'mim distill' first.${Colors.NC}`);
      process.exit(1);
    }
    console.log("\u{1F4CB} Found existing distill-report.md");
    console.log("\u{1F504} Applying refinements...");
    await distillRefine();
    return;
  }
  const generateSuccess = await distillGenerate();
  if (!generateSuccess) {
    process.exit(1);
  }
  if (noInteractive) {
    console.log("");
    console.log(`${Colors.YELLOW}\u{1F4CB} Review required before applying changes${Colors.NC}`);
    console.log("");
    console.log("Next steps:");
    console.log(`  1. Review and edit: ${Colors.BLUE}${editorCmd} ./distill-report.md${Colors.NC}`);
    console.log("  2. Add your decisions in the <!-- USER INPUT --> sections");
    console.log(`  3. Apply changes: ${Colors.BLUE}mim distill --refine-only${Colors.NC}`);
    console.log("");
    console.log(`Or use interactive mode: ${Colors.BLUE}mim distill${Colors.NC} (opens editor automatically)`);
  } else {
    if ((0, import_fs2.existsSync)("./distill-report.md")) {
      const report = (0, import_fs2.readFileSync)("./distill-report.md", "utf-8");
      if (report.includes("## Requires Review")) {
        await new Promise((resolve) => {
          console.log("");
          console.log("\u{1F4DD} Opening distill-report.md for your review...");
          console.log("   Please add your decisions in the <!-- USER INPUT --> sections");
          console.log("");
          const child = (0, import_child_process2.spawn)(editorCmd, ["./distill-report.md"], {
            stdio: "inherit",
            shell: true
          });
          child.on("close", () => {
            resolve();
          });
          child.on("error", (err) => {
            console.error(`${Colors.RED}Failed to open editor: ${err.message}${Colors.NC}`);
            resolve();
          });
        });
        console.log("");
        console.log("\u{1F504} Applying your refinements...");
        await distillRefine();
      } else {
        console.log("");
        console.log("\u2728 No manual review needed - only automatic fixes were found");
        console.log("\u{1F504} Applying automatic fixes...");
        await distillRefine();
      }
    } else {
      console.log("");
      console.log("\u2728 Distillation complete! No issues found.");
    }
  }
}

// src/commands/help.ts
function showHelp() {
  console.log(`M\xEDm - Persistent Memory for Claude Code

Usage: mim <command> [options]

Commands:
  coalesce    Process session.md into organized documentation
  distill     Clean duplicates, conflicts, and outdated information
              Options:
                --no-interactive, -n   Manual two-step process (no auto-editor)
                --editor <cmd>         Override $EDITOR for this session
                --refine-only         Skip to applying existing distill report
  help        Show this help message

Examples:
  mim coalesce              # Process remembered knowledge
  mim distill               # Interactive cleanup (auto-opens editor)
  mim distill -n            # Non-interactive (manual review)
  mim distill --refine-only # Apply existing distill-report.md

Learn more: https://github.com/lucianHymer/mim`);
}

// src/mim.ts
function parseDistillOptions(args) {
  const options = {
    noInteractive: false,
    refineOnly: false
  };
  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    switch (arg) {
      case "--no-interactive":
      case "-n":
        options.noInteractive = true;
        i++;
        break;
      case "--editor":
        options.customEditor = args[i + 1];
        if (!options.customEditor) {
          console.error(`${Colors.RED}--editor requires a value${Colors.NC}`);
          console.error("Usage: mim distill [--no-interactive|-n] [--editor <command>] [--refine-only]");
          process.exit(1);
        }
        i += 2;
        break;
      case "--refine-only":
        options.refineOnly = true;
        i++;
        break;
      default:
        console.error(`${Colors.RED}Unknown option: ${arg}${Colors.NC}`);
        console.error("Usage: mim distill [--no-interactive|-n] [--editor <command>] [--refine-only]");
        process.exit(1);
    }
  }
  return options;
}
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  switch (command) {
    case "coalesce":
      await coalesce();
      break;
    case "distill":
      const distillOptions = parseDistillOptions(args.slice(1));
      await distill(distillOptions);
      break;
    case "help":
    case "--help":
    case "-h":
    case void 0:
      showHelp();
      break;
    default:
      console.error(`${Colors.RED}Unknown command: ${command}${Colors.NC}`);
      console.error("");
      showHelp();
      process.exit(1);
  }
}
process.on("uncaughtException", (err) => {
  console.error(`${Colors.RED}Uncaught error: ${err.message}${Colors.NC}`);
  process.exit(1);
});
process.on("unhandledRejection", (err) => {
  console.error(`${Colors.RED}Unhandled rejection: ${err}${Colors.NC}`);
  process.exit(1);
});
main().catch((err) => {
  console.error(`${Colors.RED}Fatal error: ${err.message}${Colors.NC}`);
  process.exit(1);
});
