#!/usr/bin/env node

import { readFile } from "fs/promises"
import { existsSync } from "fs"
import { homedir } from "os"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import yaml from "js-yaml"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DEFAULT_CONFIG = join(__dirname, "..", "tree.default.yml")
const USER_CONFIG = join(homedir(), ".config", "opencode", "plugins", "tree", "tree.yml")

async function listAgents() {
  try {
    // Try user config first, fall back to default
    const configPath = existsSync(USER_CONFIG) ? USER_CONFIG : DEFAULT_CONFIG
    const configContent = await readFile(configPath, "utf-8")
    const config = yaml.load(configContent)

    console.log("\n🤖 Available Agent Types:\n")

    for (const [type, agentConfig] of Object.entries(config.agents)) {
      console.log(`  ${type}`)
      console.log(`    Description: ${agentConfig.description}`)
      console.log(`    Default directory: ${agentConfig.default_dir}`)
      console.log(`    Color: ${agentConfig.color}`)
      console.log("")
    }

    console.log("Usage in OpenCode:")
    console.log('  spawn-agent agent_type="web" task_description="Build login page"')
    console.log("")
  } catch (error) {
    console.error("❌ Failed to list agents:", error.message)
    process.exit(1)
  }
}

listAgents()
