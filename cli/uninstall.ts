#!/usr/bin/env bun

import { readFile, writeFile, rm } from "fs/promises"
import { existsSync } from "fs"
import { homedir } from "os"
import { join } from "path"
import * as readline from "readline"

const CONFIG_PATH = join(homedir(), ".config", "opencode", "opencode.json")
const PLUGIN_DIR = join(homedir(), ".config", "opencode", "plugins", "tree")

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close()
      resolve(answer)
    })
  })
}

async function uninstall() {
  console.log("📦 Uninstalling opencode-plugin-tree...")

  // Check if config file exists
  if (!existsSync(CONFIG_PATH)) {
    console.log("⚠️  OpenCode config not found. Plugin may not be installed.")
    process.exit(0)
  }

  try {
    // Read existing config
    const configContent = await readFile(CONFIG_PATH, "utf-8")
    const config = JSON.parse(configContent)

    // Check if plugin array exists
    if (!config.plugin || !config.plugin.includes("opencode-plugin-tree")) {
      console.log("⚠️  Plugin not found in OpenCode config.")
    } else {
      // Remove plugin
      config.plugin = config.plugin.filter(p => p !== "opencode-plugin-tree")

      // Write back to file
      await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2))
      console.log("✅ Plugin removed from OpenCode config")
    }

    // Ask about data cleanup
    const fullUninstall = process.argv.includes("--full")
    let shouldCleanup = fullUninstall

    if (!fullUninstall) {
      const answer = await askQuestion("\nRemove plugin data (session tree, config)? [y/N]: ")
      shouldCleanup = answer.toLowerCase() === "y"
    }

    if (shouldCleanup && existsSync(PLUGIN_DIR)) {
      await rm(PLUGIN_DIR, { recursive: true, force: true })
      console.log("✅ Plugin data removed")
    }

    console.log("\n✨ Uninstall complete!")
    console.log("\nRestart OpenCode to apply changes:")
    console.log("  Ctrl+C (in OpenCode) then restart")
  } catch (error) {
    console.error("❌ Failed to uninstall plugin:", error.message)
    process.exit(1)
  }
}

uninstall()
