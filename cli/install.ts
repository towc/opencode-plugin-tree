#!/usr/bin/env node

import { readFile, writeFile, mkdir, cp } from "fs/promises"
import { existsSync } from "fs"
import { homedir } from "os"
import { join, dirname } from "path"
import { fileURLToPath } from "url"
import yaml from "js-yaml"

const CONFIG_PATH = join(homedir(), ".config", "opencode", "opencode.json")
const PLUGIN_CONFIG_DIR = join(homedir(), ".config", "opencode", "plugins", "tree")
const PLUGIN_CONFIG_PATH = join(PLUGIN_CONFIG_DIR, "tree.yml")

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DEFAULT_CONFIG_PATH = join(__dirname, "..", "tree.default.yml")

async function install() {
  console.log("📦 Installing opencode-plugin-tree...")
  
  // Detect if in tmux
  const inTmux = !!process.env.TMUX
  console.log(inTmux ? "✓ Detected tmux environment" : "⚠ Not in tmux, will use terminal spawn mode")

  // Check if config file exists
  if (!existsSync(CONFIG_PATH)) {
    console.log(`\n⚠️  OpenCode config not found at: ${CONFIG_PATH}`)
    console.log("\nCreate it manually:")
    console.log(`
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-plugin-tree"]
}
`)
    process.exit(1)
  }

  try {
    // Read existing config
    const configContent = await readFile(CONFIG_PATH, "utf-8")
    const config = JSON.parse(configContent)

    // Ensure plugin array exists
    if (!config.plugin) {
      config.plugin = []
    }

    // Check if already installed
    if (config.plugin.includes("opencode-plugin-tree")) {
      console.log("✅ Plugin already installed!")
      console.log("\nRestart OpenCode to apply changes:")
      console.log("  Ctrl+C (in OpenCode) then restart")
      process.exit(0)
    }

    // Add plugin
    config.plugin.push("opencode-plugin-tree")

    // Write back to file
    await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2))

    console.log("✅ Plugin added to OpenCode config!")
    
    // Create plugin config directory
    await mkdir(PLUGIN_CONFIG_DIR, { recursive: true })
    
    // Create/update plugin configuration with detected spawn mode
    if (!existsSync(PLUGIN_CONFIG_PATH)) {
      // Load default config and update spawn_mode
      const defaultConfig = yaml.load(await readFile(DEFAULT_CONFIG_PATH, "utf-8")) as any
      defaultConfig.spawn_mode = inTmux ? "tmux" : "terminal"
      
      await writeFile(PLUGIN_CONFIG_PATH, yaml.dump(defaultConfig))
      console.log(`✅ Created config with spawn_mode: ${defaultConfig.spawn_mode}`)
    }
    
    console.log("\nNext steps:")
    console.log("  1. Restart OpenCode: Ctrl+C then restart")
    console.log("  2. Try playground: npx opencode-plugin-tree playground bug-fix")
    console.log("  3. In OpenCode, use: tree-spawn-child agent_type=\"web\" task_description=\"Your task\"")
    console.log("  4. View tree: tree-show")
    console.log("\nConfiguration file: ~/.config/opencode/plugins/tree/tree.yml")
  } catch (error: any) {
    console.error("❌ Failed to install plugin:", error.message)
    process.exit(1)
  }
}

install()
