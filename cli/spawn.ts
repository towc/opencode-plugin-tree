#!/usr/bin/env node

import { execSync } from "child_process"

// This is a convenience CLI wrapper
// The actual spawning happens via OpenCode tools

const agentType = process.argv[3]

if (!agentType) {
  console.error("Usage: npx opencode-plugin-tree spawn <agent-type>")
  console.error("\nAvailable agent types:")
  console.error("  web, pipeline, db, research, test, general")
  console.error("\nFor full control, use the OpenCode tool:")
  console.error('  spawn-agent agent_type="web" task_description="Your task"')
  process.exit(1)
}

console.log(`\n⚠️  Direct spawning from CLI is limited.`)
console.log(`\nFor best results, use the OpenCode tool:`)
console.log(`  spawn-agent agent_type="${agentType}" task_description="Your task description"`)
console.log(`\nOr manually create a tmux window:`)
console.log(`  tmux new-window -n "${agentType}-agent"`)
console.log(`  tmux send-keys -t "${agentType}-agent" 'op "Your prompt"' Enter`)
console.log("")
