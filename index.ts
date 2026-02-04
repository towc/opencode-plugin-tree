import type { Plugin } from "@opencode-ai/plugin"
import { tool } from "@opencode-ai/plugin"
import yaml from "js-yaml"
import { existsSync } from "fs"
import { readFile, writeFile, mkdir } from "fs/promises"
import { homedir } from "os"
import { join, dirname, basename } from "path"
import { fileURLToPath } from "url"
import { execSync, exec } from "child_process"
import { promisify } from "util"

const execAsync = promisify(exec)

// Load configuration
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const defaultConfigPath = join(__dirname, "tree.default.yml")

interface AgentConfig {
  description: string
  color: string
  default_dir: string
}

interface TreeConfig {
  tmux: {
    root_session: string
    child_pattern: string
    window_pattern: string
  }
  agents: Record<string, AgentConfig>
  tracking: {
    state_file: string
    active_sessions_file: string
    auto_update: boolean
    metadata: string[]
  }
  events: Record<string, any>
  cleanup: {
    idle_timeout: number
    confirm_kill: boolean
    preserve_tree: boolean
  }
  templates: {
    agent_prompt: string
  }
  cli: {
    show_tree_on_spawn: boolean
    confirm_spawn: boolean
    editor: string
  }
}

interface SessionNode {
  id: string
  name: string
  parent?: string
  agent_type?: string
  working_dir: string
  task_description?: string
  created_at: string
  tmux_window?: string
  children: string[]
  status: "active" | "idle" | "completed" | "killed"
}

interface SessionTree {
  root: string
  nodes: Record<string, SessionNode>
}

export const TreePlugin: Plugin = async ({ client }) => {
  const log = async (message: string, extra?: any) => {
    await client.app.log({
      service: "opencode-plugin-tree",
      level: "info",
      message,
      extra
    })
  }

  // Get configuration directory
  const configDir = join(homedir(), ".config", "opencode", "plugins", "tree")
  const configPath = join(configDir, "tree.yml")
  const stateDir = join(homedir(), ".config", "opencode", "plugins", "tree")
  
  // Ensure directories exist
  try {
    await mkdir(configDir, { recursive: true })
    await mkdir(stateDir, { recursive: true })
  } catch (error) {
    // Directories might already exist
  }

  // Load configuration
  const loadConfig = async (): Promise<TreeConfig> => {
    // Load default config
    const defaultConfig = yaml.load(await readFile(defaultConfigPath, "utf-8")) as TreeConfig
    
    // Try to load user config
    if (existsSync(configPath)) {
      try {
        const userConfig = yaml.load(await readFile(configPath, "utf-8")) as Partial<TreeConfig>
        return { ...defaultConfig, ...userConfig }
      } catch (error) {
        await log("Failed to load user config, using defaults", { error: String(error) })
      }
    } else {
      // Create default config file
      await writeFile(configPath, await readFile(defaultConfigPath, "utf-8"))
      await log("Created default configuration", { path: configPath })
    }
    
    return defaultConfig
  }

  let config = await loadConfig()

  // Get state file path (expanding ~ to home directory)
  const getStateFilePath = (): string => {
    const path = config.tracking.state_file.replace(/^~/, homedir())
    return path
  }

  // Load session tree state
  const loadTree = async (): Promise<SessionTree> => {
    const stateFile = getStateFilePath()
    
    if (existsSync(stateFile)) {
      try {
        const data = await readFile(stateFile, "utf-8")
        return JSON.parse(data)
      } catch (error) {
        await log("Failed to load session tree, initializing new tree", { error: String(error) })
      }
    }
    
    // Initialize new tree
    return {
      root: config.tmux.root_session,
      nodes: {}
    }
  }

  // Save session tree state
  const saveTree = async (tree: SessionTree) => {
    const stateFile = getStateFilePath()
    await mkdir(dirname(stateFile), { recursive: true })
    await writeFile(stateFile, JSON.stringify(tree, null, 2))
  }

  // Get current tmux window name
  const getCurrentTmuxWindow = (): string | null => {
    try {
      return execSync('tmux display-message -p "#W"', { encoding: "utf-8" }).trim()
    } catch {
      return null
    }
  }

  // Get current working directory
  const getCurrentWorkingDir = (): string => {
    return process.cwd()
  }

  // Check if running in tmux
  const isInTmux = (): boolean => {
    return !!process.env.TMUX
  }

  // Create a new tmux window
  const createTmuxWindow = async (
    windowName: string,
    workingDir: string,
    command?: string
  ): Promise<boolean> => {
    try {
      const tmuxCmd = `tmux new-window -n "${windowName}" -c "${workingDir}"`
      execSync(tmuxCmd)
      
      if (command) {
        // Send command to the new window
        const sendCmd = `tmux send-keys -t "${windowName}" '${command}' Enter`
        execSync(sendCmd)
      }
      
      return true
    } catch (error) {
      await log("Failed to create tmux window", { error: String(error) })
      return false
    }
  }

  // Format agent prompt with variables
  const formatPrompt = (
    template: string,
    vars: Record<string, string>
  ): string => {
    let result = template
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, "g"), value)
    }
    return result
  }

  // Generate session ID
  const generateSessionId = (): string => {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  // Get date string for today
  const getDateString = (): string => {
    const now = new Date()
    return now.toISOString().split("T")[0]
  }

  // Spawn a new agent session
  const spawnAgent = async (
    agentType: string,
    taskDescription: string,
    workingDir?: string
  ): Promise<{ success: boolean; sessionId?: string; message: string }> => {
    if (!isInTmux()) {
      return {
        success: false,
        message: "Not running in tmux. This plugin requires tmux."
      }
    }

    // Reload config
    config = await loadConfig()

    // Check if agent type exists
    if (!config.agents[agentType]) {
      return {
        success: false,
        message: `Unknown agent type: ${agentType}. Available: ${Object.keys(config.agents).join(", ")}`
      }
    }

    // Load current tree
    const tree = await loadTree()

    // Get current window as parent
    const parentWindow = getCurrentTmuxWindow()
    const parentNode = Object.values(tree.nodes).find(n => n.tmux_window === parentWindow)

    // Determine working directory
    const agentConfig = config.agents[agentType]
    const dir = workingDir || join(getCurrentWorkingDir(), agentConfig.default_dir)

    // Generate session info
    const sessionId = generateSessionId()
    const windowName = config.tmux.window_pattern
      .replace("{agent}", agentType)
      .replace("{parent}", parentWindow || "root")

    // Create tmux window
    const projectName = basename(getCurrentWorkingDir())
    const date = getDateString()
    
    const prompt = formatPrompt(config.templates.agent_prompt, {
      AGENT_TYPE: agentType.toUpperCase(),
      PROJECT_NAME: projectName,
      PARENT_NAME: parentWindow || "root",
      DATE: date,
      TASKS: taskDescription
        .split("\n")
        .map((t, i) => `${i + 1}. ${t}`)
        .join("\n"),
      TASK_NAME: taskDescription.split("\n")[0]?.replace(/[^a-z0-9]/gi, "-").toLowerCase() || "task"
    })

    const command = `op "${prompt}"`
    const success = await createTmuxWindow(windowName, dir, command)

    if (!success) {
      return {
        success: false,
        message: "Failed to create tmux window"
      }
    }

    // Add node to tree
    const node: SessionNode = {
      id: sessionId,
      name: windowName,
      parent: parentNode?.id,
      agent_type: agentType,
      working_dir: dir,
      task_description: taskDescription,
      created_at: new Date().toISOString(),
      tmux_window: windowName,
      children: [],
      status: "active"
    }

    tree.nodes[sessionId] = node

    // Update parent's children
    if (parentNode) {
      parentNode.children.push(sessionId)
    }

    // Save tree
    await saveTree(tree)

    // Fire event
    if (config.events.session_created?.log) {
      await log("Agent session spawned", {
        sessionId,
        agentType,
        parent: parentNode?.id || "root",
        window: windowName
      })
    }

    return {
      success: true,
      sessionId,
      message: `Spawned ${agentType} agent in window: ${windowName}`
    }
  }

  // Build tree visualization
  const buildTreeVisualization = (tree: SessionTree): string => {
    const lines: string[] = []
    const visited = new Set<string>()

    const renderNode = (nodeId: string, prefix: string, isLast: boolean) => {
      if (visited.has(nodeId)) return
      visited.add(nodeId)

      const node = tree.nodes[nodeId]
      if (!node) return

      const connector = isLast ? "└── " : "├── "
      const statusIcon = node.status === "active" ? "🟢" : node.status === "idle" ? "🟡" : "⚪"
      const agentType = node.agent_type ? `[${node.agent_type}]` : ""
      
      lines.push(`${prefix}${connector}${statusIcon} ${node.name} ${agentType}`)

      const childPrefix = prefix + (isLast ? "    " : "│   ")
      const children = node.children
      children.forEach((childId, index) => {
        renderNode(childId, childPrefix, index === children.length - 1)
      })
    }

    // Find root nodes (nodes without parents)
    const rootNodes = Object.keys(tree.nodes).filter(id => !tree.nodes[id].parent)

    if (rootNodes.length === 0) {
      return "No active sessions"
    }

    lines.push(`🌳 Session Tree (${Object.keys(tree.nodes).length} sessions)`)
    lines.push("")

    rootNodes.forEach((rootId, index) => {
      renderNode(rootId, "", index === rootNodes.length - 1)
    })

    return lines.join("\n")
  }

  // Initialize plugin
  await log("Tree plugin initialized", {
    configPath,
    stateFile: getStateFilePath(),
    inTmux: isInTmux()
  })

  return {
    event: async ({ event }) => {
      // Reload config on events
      config = await loadConfig()

      // Handle session events
      if (event.type === "session.idle") {
        // Update session status to idle
        const tree = await loadTree()
        const currentWindow = getCurrentTmuxWindow()
        const node = Object.values(tree.nodes).find(n => n.tmux_window === currentWindow)
        
        if (node) {
          node.status = "idle"
          await saveTree(tree)
        }
      }
    },

    tool: {
      "spawn-agent": tool({
        description: "Spawn a new agent session in tmux with parent-child tracking",
        args: {
          agent_type: tool.schema.string().describe("Agent type (web, pipeline, db, research, test, general)"),
          task_description: tool.schema.string().describe("Task description for the agent"),
          working_dir: tool.schema.string().optional().describe("Working directory (defaults to agent's default_dir)")
        },
        async execute(args) {
          const result = await spawnAgent(args.agent_type, args.task_description, args.working_dir)
          return result.message
        }
      }),

      "show-tree": tool({
        description: "Show the current session tree visualization",
        args: {},
        async execute() {
          const tree = await loadTree()
          return buildTreeVisualization(tree)
        }
      }),

      "kill-session": tool({
        description: "Kill a session and optionally its children",
        args: {
          session_name: tool.schema.string().describe("Session/window name to kill"),
          kill_children: tool.schema.boolean().optional().describe("Also kill child sessions (default: false)")
        },
        async execute(args) {
          const tree = await loadTree()
          const node = Object.values(tree.nodes).find(n => 
            n.name === args.session_name || n.tmux_window === args.session_name
          )

          if (!node) {
            return `Session not found: ${args.session_name}`
          }

          const killNodeAndChildren = async (nodeId: string) => {
            const n = tree.nodes[nodeId]
            if (!n) return

            // Kill tmux window if it exists
            if (n.tmux_window) {
              try {
                execSync(`tmux kill-window -t "${n.tmux_window}"`)
              } catch {
                // Window might already be closed
              }
            }

            // Update status
            n.status = "killed"

            // Kill children if requested
            if (args.kill_children) {
              for (const childId of n.children) {
                await killNodeAndChildren(childId)
              }
            }
          }

          await killNodeAndChildren(node.id)
          await saveTree(tree)

          return `Killed session: ${args.session_name}${args.kill_children ? " (and children)" : ""}`
        }
      }),

      "list-agents": tool({
        description: "List available agent types and their descriptions",
        args: {},
        async execute() {
          config = await loadConfig()
          const agents = Object.entries(config.agents)
            .map(([type, config]) => `- **${type}**: ${config.description}`)
            .join("\n")
          
          return `Available agent types:\n\n${agents}`
        }
      })
    }
  }
}
