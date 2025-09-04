#!/usr/bin/env node
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Helper to send JSON-RPC responses
function respond(id, result) {
    const response = { jsonrpc: '2.0', id, result };
    console.log(JSON.stringify(response));
}

function respondError(id, code, message) {
    const response = { jsonrpc: '2.0', id, error: { code, message } };
    console.log(JSON.stringify(response));
}

// The actual remembering function
function remember(args) {
    const { category, topic, details, files } = args;
    
    // Ensure knowledge directory exists
    const knowledgeDir = path.join(process.cwd(), '.claude', 'knowledge');
    if (!fs.existsSync(knowledgeDir)) {
        fs.mkdirSync(knowledgeDir, { recursive: true });
    }
    
    const sessionFile = path.join(knowledgeDir, 'session.md');
    
    // Create session file header if it doesn't exist
    if (!fs.existsSync(sessionFile)) {
        const date = new Date().toISOString().split('T')[0];
        fs.writeFileSync(sessionFile, `# Knowledge Capture Session - ${date}\n\n`);
    }
    
    // Format the entry
    const time = new Date().toTimeString().slice(0, 5);
    let entry = `### [${time}] [${category}] ${topic}\n`;
    entry += `**Details**: ${details}\n`;
    if (files) {
        entry += `**Files**: ${files}\n`;
    }
    entry += `---\n\n`;
    
    // Atomic append
    fs.appendFileSync(sessionFile, entry);
    
    return `✓ Remembered in .claude/knowledge/session.md: [${category}] ${topic}`;
}

// Set up stdin reader for JSON-RPC
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

// Handle incoming JSON-RPC requests
rl.on('line', (line) => {
    try {
        const request = JSON.parse(line);
        
        if (request.method === 'initialize') {
            respond(request.id, {
                protocolVersion: '2024-11-05',
                serverInfo: { name: 'mim', version: '1.0.0' },
                capabilities: {
                    tools: {}
                }
            });
        } else if (request.method === 'tools/list') {
            respond(request.id, {
                tools: [{
                    name: 'remember',
                    description: `Capture learned information about the project for automatic documentation. Use PROACTIVELY when discovering architecture, patterns, dependencies, workflows, configurations, or surprising behaviors.

⚠️ MANDATORY TRIGGERS - Use this tool IMMEDIATELY when:
• You say/think: "for future reference", "I learned that", "turns out", "actually it's", "I discovered", "good to know", "I see that", "interesting that"
• You made a mistake and learned the correct approach
• You discovered how something actually works (vs what you assumed)
• You found a project-specific convention, pattern, or requirement
• You figured out why something wasn't working
• You're about to explain something important about this codebase
• You realize your initial assumption was wrong

❌ BAD: Saying "for future reference, use yarn not npm" without using this tool
✅ GOOD: Immediately remembering this knowledge when you realize it`,
                    inputSchema: {
                        type: 'object',
                        properties: {
                            category: {
                                type: 'string',
                                description: 'Category name for organizing this knowledge. Use descriptive categories like: architecture, api, database, pattern, dependency, workflow, config, gotcha, convention, testing, security, deployment, frontend, backend, auth, etc. Any relevant category name is acceptable.',
                                examples: ['architecture', 'api', 'database', 'pattern', 'dependency', 'workflow', 'config', 'gotcha', 'testing', 'security', 'auth', 'frontend', 'backend']
                            },
                            topic: {
                                type: 'string',
                                description: 'Brief, descriptive title for what you learned (e.g., "Redis caching strategy", "JWT authentication flow", "MongoDB connection pooling")'
                            },
                            details: {
                                type: 'string',
                                description: 'Complete details of what you discovered. Include specifics, configuration values, important notes, and any context that would help understand this knowledge later.'
                            },
                            files: {
                                type: 'string',
                                description: 'Comma-separated list of related file paths where this knowledge was discovered (optional but recommended)',
                                examples: ['app.js', 'src/auth/jwt.js, src/middleware/auth.js', 'config/database.yml']
                            }
                        },
                        required: ['category', 'topic', 'details']
                    }
                }]
            });
        } else if (request.method === 'tools/call') {
            if (request.params.name === 'remember') {
                try {
                    const result = remember(request.params.arguments);
                    respond(request.id, {
                        content: [{ type: 'text', text: result }]
                    });
                } catch (error) {
                    respondError(request.id, -32603, `Remembering failed: ${error.message}`);
                }
            } else {
                respondError(request.id, -32601, `Unknown tool: ${request.params.name}`);
            }
        } else if (request.method === 'shutdown') {
            respond(request.id, {});
            process.exit(0);
        } else {
            respondError(request.id, -32601, `Method not found: ${request.method}`);
        }
    } catch (error) {
        // Invalid JSON or other parsing errors
        console.error('Error processing request:', error);
    }
});

// Handle clean shutdown
process.on('SIGTERM', () => process.exit(0));
process.on('SIGINT', () => process.exit(0));