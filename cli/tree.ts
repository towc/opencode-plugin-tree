#!/usr/bin/env bun

import { readFile } from "fs/promises"
import { existsSync } from "fs"
import { homedir } from "os"
import { join } from "path"

const STATE_FILE = join(homedir(), ".config", "opencode", "plugins", "tree", "sessions.json")

async function showTree() {
  if (!existsSync(STATE_FILE)) {
    console.log("🌳 No session tree found. Start OpenCode and spawn some agents!")
    process.exit(0)
  }

  try {
    const data = await readFile(STATE_FILE, "utf-8")
    const tree = JSON.parse(data)

    const renderNode = (nodeId, prefix = "", isLast = true) => {
      const node = tree.nodes[nodeId]
      if (!node) return

      const connector = isLast ? "└── " : "├── "
      const statusIcon = node.status === "active" ? "🟢" : node.status === "idle" ? "🟡" : "⚪"
      const agentType = node.agent_type ? `[${node.agent_type}]` : ""
      const task = node.task_description ? `: ${node.task_description.split('\n')[0].substring(0, 50)}...` : ""
      
      console.log(`${prefix}${connector}${statusIcon} ${node.name} ${agentType}${task}`)

      const childPrefix = prefix + (isLast ? "    " : "│   ")
      const children = node.children || []
      children.forEach((childId, index) => {
        renderNode(childId, childPrefix, index === children.length - 1)
      })
    }

    // Find root nodes
    const rootNodes = Object.keys(tree.nodes).filter(id => !tree.nodes[id].parent)

    if (rootNodes.length === 0) {
      console.log("🌳 No active sessions")
      process.exit(0)
    }

    console.log(`\n🌳 Session Tree (${Object.keys(tree.nodes).length} sessions)\n`)

    rootNodes.forEach((rootId, index) => {
      renderNode(rootId, "", index === rootNodes.length - 1)
    })

    console.log("")
  } catch (error) {
    console.error("❌ Failed to read session tree:", error.message)
    process.exit(1)
  }
}

showTree()
