#!/usr/bin/env bun

const command = process.argv[2]

const showHelp = () => {
  console.log(`
opencode-plugin-tree - Manage tmux session trees for OpenCode

Usage:
  npx opencode-plugin-tree <command>

Commands:
  install          Add plugin to OpenCode config
  uninstall        Remove plugin from OpenCode config
  playground       Try examples (bug-fix, build-app, refactor-code)
  tree             Show current session tree
  spawn <agent>    Spawn a new agent session
  list-agents      List available agent types
  config           Edit configuration file
  help             Show this help message

Examples:
  # Install the plugin
  npx opencode-plugin-tree install

  # Show session tree
  npx opencode-plugin-tree tree

  # Spawn a new agent
  npx opencode-plugin-tree spawn web

  # Edit config
  npx opencode-plugin-tree config

Documentation:
  https://github.com/towc/opencode-plugin-tree

`)
}

switch (command) {
  case "install":
    import("./install").catch(console.error)
    break
  case "uninstall":
    import("./uninstall").catch(console.error)
    break
  case "playground":
    import("./playground").catch(console.error)
    break
  case "tree":
    import("./tree").catch(console.error)
    break
  case "spawn":
    import("./spawn").catch(console.error)
    break
  case "list-agents":
    import("./list-agents").catch(console.error)
    break
  case "config":
    import("./config").catch(console.error)
    break
  case "help":
  case undefined:
    showHelp()
    break
  default:
    console.error(`Unknown command: ${command}`)
    showHelp()
    process.exit(1)
}
