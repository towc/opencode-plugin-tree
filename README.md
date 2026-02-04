# opencode-plugin-tree 🌳

OpenCode plugin for managing tmux session trees with parent-child relationships. Perfect for coordinating multiple AI agent instances working on different parts of your project.

## Features

- 🌳 **Session Tree Management** - Track parent-child relationships between OpenCode sessions
- 🎯 **Agent Types** - Pre-configured agent types (web, pipeline, db, research, test, general)
- 📊 **Tree Visualization** - See your entire agent hierarchy at a glance
- 🔄 **Auto-tracking** - Sessions are automatically tracked when spawned
- ⚙️ **Configurable** - YAML configuration for agent types, templates, and behavior
- 🎨 **Tmux Integration** - Seamless integration with tmux windows and sessions
- 📝 **Prompt Templates** - Customizable agent prompts with variable substitution

## Use Case

This plugin is designed for complex projects where you need multiple AI agents working in parallel on different aspects of your codebase. For example:

- **Web agent** working on frontend components
- **Pipeline agent** working on backend processing
- **DB agent** handling database migrations
- **Research agent** analyzing requirements

Each agent tracks its parent, avoiding duplicate work and maintaining coordination through shared documentation files.

## Installation

### Quick Install (Recommended)

```bash
npx opencode-plugin-tree install
```

Then restart OpenCode.

### Manual Installation

Add to your OpenCode config (`~/.config/opencode/opencode.json`):

```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-plugin-tree"]
}
```

Then restart OpenCode.

## Requirements

- OpenCode 1.0+
- tmux
- Running OpenCode inside a tmux session

## Usage

### Spawning Agents

From within OpenCode:

```
spawn-agent agent_type="web" task_description="Build login page component"
```

This will:
1. Create a new tmux window named `web-agent`
2. Initialize an OpenCode session with a pre-configured prompt
3. Track the session in the tree with parent-child relationship
4. Set the working directory to the agent's default directory

### Viewing the Session Tree

```
show-tree
```

Output example:
```
🌳 Session Tree (3 sessions)

└── 🟢 root [general]
    ├── 🟢 web-agent [web]: Build login page component
    └── 🟡 pipeline-agent [pipeline]: Process user data pipeline
```

Icons:
- 🟢 Active session
- 🟡 Idle session
- ⚪ Completed/killed session

### Listing Available Agents

```
list-agents
```

Or from command line:
```bash
npx opencode-plugin-tree list-agents
```

### Killing Sessions

```
kill-session session_name="web-agent" kill_children=false
```

### Viewing Tree from CLI

```bash
npx opencode-plugin-tree tree
```

## Configuration

Configuration file: `~/.config/opencode/plugins/tree/tree.yml`

Edit with:
```bash
npx opencode-plugin-tree config
```

### Default Agent Types

- **web** - Web UI, TypeScript, Next.js, React components
- **pipeline** - Pipeline engine, data processing, AI calls
- **db** - Database migrations, schema changes, queries
- **research** - Document analysis, requirements gathering
- **test** - Testing, validation, QA
- **general** - General-purpose tasks

### Adding Custom Agent Types

Edit `tree.yml`:

```yaml
agents:
  # Add your custom agent
  devops:
    description: "Infrastructure and deployment tasks"
    color: "red"
    default_dir: "infrastructure"
```

### Customizing Agent Prompts

The plugin uses a template system for agent prompts. Edit `templates.agent_prompt` in `tree.yml`:

```yaml
templates:
  agent_prompt: |
    You are the {AGENT_TYPE} AGENT for {PROJECT_NAME}.
    
    PARENT INSTANCE: {PARENT_NAME}
    
    Your tasks:
    {TASKS}
    
    # ... rest of your template
```

Available variables:
- `{AGENT_TYPE}` - Agent type (uppercase)
- `{PROJECT_NAME}` - Current project directory name
- `{PARENT_NAME}` - Parent session/window name
- `{DATE}` - Current date (YYYY-MM-DD)
- `{TASKS}` - Task description (auto-numbered)
- `{TASK_NAME}` - First task (sanitized for filenames)

### Configuration Options

See `tree.default.yml` for all available options:

- **tmux** - Session and window naming patterns
- **agents** - Agent type definitions
- **tracking** - Session tracking settings
- **events** - Event logging configuration
- **cleanup** - Auto-cleanup settings
- **templates** - Prompt templates
- **cli** - CLI behavior settings

## Session Tracking

Sessions are tracked in `~/.config/opencode/plugins/tree/sessions.json`:

```json
{
  "root": "opencode-root",
  "nodes": {
    "session-123": {
      "id": "session-123",
      "name": "web-agent",
      "parent": null,
      "agent_type": "web",
      "working_dir": "/project/web",
      "task_description": "Build login page",
      "created_at": "2026-02-04T10:30:00Z",
      "tmux_window": "web-agent",
      "children": ["session-456"],
      "status": "active"
    }
  }
}
```

## Multi-Agent Workflow Pattern

This plugin implements a multi-agent workflow pattern:

1. **Root instance** coordinates overall project
2. **Spawns child agents** for specific tasks (web, pipeline, etc.)
3. **Agents read shared context** from AGENTS.md and docs/active-sessions.md
4. **Agents avoid duplicate work** by checking active sessions
5. **Clear parent-child hierarchy** prevents confusion

### Example Workflow

**Root Session:**
```
spawn-agent agent_type="web" task_description="
1. Create login component
2. Add form validation
3. Integrate with API
"
```

**Web Agent (Child Session):**
- Reads AGENTS.md for project rules
- Reads docs/active-sessions.md to see other agents
- Works on assigned tasks
- Creates report when complete
- Notifies parent

### Communication Files

The plugin expects these files for coordination:

- **AGENTS.md** - Multi-agent workflow protocol and rules
- **docs/active-sessions.md** - Currently running agents
- **docs/daily/YYYY-MM-DD.md** - Daily progress logs

## CLI Commands

```bash
# Installation
npx opencode-plugin-tree install          # Add to OpenCode config
npx opencode-plugin-tree uninstall        # Remove from config
npx opencode-plugin-tree uninstall --full # Remove config + data

# Session Management
npx opencode-plugin-tree tree             # Show session tree
npx opencode-plugin-tree list-agents      # List agent types

# Configuration
npx opencode-plugin-tree config           # Edit config file
npx opencode-plugin-tree help             # Show help
```

## OpenCode Tools

When the plugin is installed, these tools are available in OpenCode:

- **spawn-agent** - Spawn a new agent session
- **show-tree** - Show session tree visualization
- **kill-session** - Kill a session and optionally its children
- **list-agents** - List available agent types

## Advanced Usage

### Parent-Child Relationships

When you spawn an agent from within another OpenCode session, the parent-child relationship is automatically tracked:

```
Root Session (in tmux window "main")
  ↓ spawns
  Web Agent (in tmux window "web-agent")
    ↓ spawns
    Test Agent (in tmux window "test-agent")
```

Each child knows its parent and can report back accordingly.

### Working Directories

Each agent type has a default working directory (configurable in `tree.yml`):

- **web** → `web/`
- **pipeline** → `pipeline/`
- **db** → `pipeline/`
- **research** → `docs/`
- **test** → `.`
- **general** → `.`

Override with:
```
spawn-agent agent_type="web" task_description="..." working_dir="/custom/path"
```

### Session Lifecycle

1. **Created** - `spawn-agent` creates tmux window and session node
2. **Active** - Agent is working (status: "active")
3. **Idle** - Agent completes work (status: "idle")
4. **Killed** - Window closed manually or via `kill-session` (status: "killed")

### Event Tracking

The plugin logs events to OpenCode logs:

```bash
tail -f ~/.local/share/opencode/log/*.log | grep tree
```

Configure event logging in `tree.yml`:

```yaml
events:
  session_created:
    log: true      # Log to OpenCode logs
    notify: true   # Fire notification
  session_destroyed:
    log: true
    notify: false
```

## Troubleshooting

### Plugin not loading

1. Check OpenCode config: `cat ~/.config/opencode/opencode.json`
2. Restart OpenCode completely
3. Check OpenCode logs for errors

### Not running in tmux

The plugin requires tmux. Start OpenCode inside a tmux session:

```bash
tmux new-session -s opencode
op  # Start OpenCode
```

### Sessions not tracked

The plugin tracks sessions when spawned via `spawn-agent`. Manual tmux windows aren't tracked automatically.

### Tree visualization empty

Run `show-tree` from within OpenCode (not from command line). The CLI `tree` command shows the saved state.

## Examples

### Example 1: Parallel Web and Pipeline Work

**Root Session:**
```
spawn-agent agent_type="web" task_description="Build user dashboard"
spawn-agent agent_type="pipeline" task_description="Create data processing pipeline"
```

Both agents work in parallel, each in their own tmux window.

### Example 2: Sequential Tasks with Parent-Child

**Root Session:**
```
spawn-agent agent_type="db" task_description="Run database migrations"
```

**Wait for completion, then:**
```
spawn-agent agent_type="web" task_description="Test new database schema in UI"
```

### Example 3: Deep Nesting

**Root → Web Agent → Test Agent**

Root spawns Web agent, Web agent spawns Test agent to validate components.

## Comparison with opencode-plugin-boops

Both plugins follow the same design pattern:

| Feature | boops | tree |
|---------|-------|------|
| Configuration | TOML | YAML |
| Purpose | Sound notifications | Session management |
| External resources | Audio files | Tmux sessions |
| CLI commands | install, browse, test | install, tree, list-agents |
| Hot reload | ✅ | ✅ |
| State tracking | Cache files | Session tree JSON |

## Contributing

Contributions welcome! Especially:

- Additional agent type presets
- Better tree visualization
- Auto-cleanup of stale sessions
- Integration with project management tools
- Terminal UI for interactive session management

## License

MIT

## Author

Created by [towc](https://github.com/towc)

## Related Projects

- [opencode-plugin-boops](https://github.com/towc/opencode-plugin-boops) - Sound notifications for OpenCode
