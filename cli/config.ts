#!/usr/bin/env node

import { execSync } from "child_process"
import { existsSync } from "fs"
import { readFile, writeFile, mkdir } from "fs/promises"
import { homedir } from "os"
import { join, dirname } from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const DEFAULT_CONFIG = join(__dirname, "..", "tree.default.yml")
const CONFIG_DIR = join(homedir(), ".config", "opencode", "plugins", "tree")
const CONFIG_PATH = join(CONFIG_DIR, "tree.yml")

async function editConfig() {
  try {
    // Ensure config directory exists
    await mkdir(CONFIG_DIR, { recursive: true })

    // Copy default config if user config doesn't exist
    if (!existsSync(CONFIG_PATH)) {
      const defaultContent = await readFile(DEFAULT_CONFIG, "utf-8")
      await writeFile(CONFIG_PATH, defaultContent)
      console.log("✅ Created default configuration")
    }

    // Open in editor
    const editor = process.env.EDITOR || process.env.VISUAL || "nano"
    console.log(`\nOpening config in ${editor}...`)
    console.log(`Config file: ${CONFIG_PATH}\n`)

    try {
      execSync(`${editor} "${CONFIG_PATH}"`, { stdio: "inherit" })
      console.log("\n✅ Config edited successfully!")
      console.log("\nChanges take effect immediately (no restart needed)")
    } catch (error) {
      console.error("\n❌ Editor exited with error")
      process.exit(1)
    }
  } catch (error) {
    console.error("❌ Failed to edit config:", error.message)
    process.exit(1)
  }
}

editConfig()
