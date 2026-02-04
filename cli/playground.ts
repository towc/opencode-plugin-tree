#!/usr/bin/env bun

import { readFile, writeFile, cp, mkdir } from "fs/promises"
import { existsSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { execSync } from "child_process"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const EXAMPLES_DIR = join(__dirname, "..", "examples")
const PLAYGROUND_DIR = "/tmp/ocp-tree"

const exampleName = process.argv[3]

async function listExamples() {
  console.log("\n🎮 Available playground examples:\n")
  console.log("  bug-fix        - Fix bugs in a calculator app")
  console.log("  build-app      - Build a CLI todo application")
  console.log("  refactor-code  - Refactor messy code to clean code")
  console.log("\nUsage:")
  console.log("  npx opencode-plugin-tree playground <example-name>")
  console.log("\nExample:")
  console.log("  npx opencode-plugin-tree playground bug-fix")
  console.log("")
}

async function runPlayground(example) {
  const exampleDir = join(EXAMPLES_DIR, example)
  const targetDir = join(PLAYGROUND_DIR, example)

  // Check if example exists
  if (!existsSync(exampleDir)) {
    console.error(`❌ Example not found: ${example}`)
    console.log("\nAvailable examples: bug-fix, build-app, refactor-code")
    process.exit(1)
  }

  try {
    // Create playground directory
    await mkdir(PLAYGROUND_DIR, { recursive: true })

    // Copy example to playground
    console.log(`📦 Copying ${example} to ${targetDir}...`)
    await cp(exampleDir, targetDir, { recursive: true, force: true })

    // Read the prompt
    const promptFile = join(targetDir, ".opencode-prompt")
    let prompt = ""
    if (existsSync(promptFile)) {
      prompt = await readFile(promptFile, "utf-8")
    }

    // Check if in tmux
    const inTmux = !!process.env.TMUX

    if (inTmux) {
      // Create new tmux window
      const windowName = `playground-${example}`
      console.log(`🚀 Creating tmux window: ${windowName}`)
      
      // Create window and leave it with a shell running
      execSync(`tmux new-window -n "${windowName}" -c "${targetDir}"`)
      
      // Wait for window to be fully ready
      execSync('sleep 0.2')
      
      if (prompt) {
        // Write prompt to file to avoid all escaping issues
        const promptFile = join(targetDir, '.prompt')
        await writeFile(promptFile, prompt)
        
        // Send command that reads from file
        // Using $(<file) is more reliable than cat with command substitution
        execSync(`tmux send-keys -t ":${windowName}" 'opencode --prompt "$(<.prompt)"'`)
        
        console.log(`✅ Ready! Switch to window "${windowName}" and press Enter to start.`)
      } else {
        execSync(`tmux send-keys -t ":${windowName}" 'opencode --prompt'`)
        console.log(`✅ Ready! Switch to window "${windowName}" and start coding.`)
      }
    } else {
      // Not in tmux - just show instructions
      console.log(`\n✅ Example copied to: ${targetDir}`)
      console.log(`\nNext steps:`)
      console.log(`  cd ${targetDir}`)
      console.log(`  opencode --prompt`)
      
      if (prompt) {
        console.log(`\nSuggested prompt:`)
        console.log(`  ${prompt}`)
      }
      console.log("")
    }

  } catch (error) {
    console.error("❌ Failed to set up playground:", error.message)
    process.exit(1)
  }
}

if (!exampleName) {
  listExamples()
} else {
  runPlayground(exampleName)
}
