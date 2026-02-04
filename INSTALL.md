# Installation Guide

## Prerequisites

### Bun Runtime

OpenCode uses Bun internally (bundled as a compiled binary). For the CLI commands to work, you need `bun` accessible in your PATH.

**Quick Fix:**

```bash
# Create symlink to OpenCode's bundled Bun
ln -s $(dirname $(which op))/../lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode ~/.local/bin/bun

# Or find it manually:
find ~/.local -name "opencode-linux-x64" 2>/dev/null
# Then symlink: ln -s /path/to/opencode-linux-x64/bin/opencode ~/.local/bin/bun
```

**Verify:**
```bash
bun --version
# Should show: 1.3.5 or similar
```

## Plugin Installation

### Method 1: NPX (Recommended - for published package)

```bash
npx opencode-plugin-tree install
```

This will:
1. Add the plugin to `~/.config/opencode/opencode.json`
2. Create default config at `~/.config/opencode/plugins/tree/tree.yml`
3. Auto-detect spawn mode (tmux vs terminal)

Then restart OpenCode.

### Method 1b: Local Development

```bash
cd /path/to/opencode-plugin-tree

# Install dependencies
bun install

# Install plugin in dev mode
npx . install --dev
```

This installs the plugin using the local directory path instead of npm package.

Then restart OpenCode.

### Method 2: Manual

1. Add to `~/.config/opencode/opencode.json`:
```json
{
  "$schema": "https://opencode.ai/config.json",
  "plugin": ["opencode-plugin-tree"]
}
```

2. Restart OpenCode

3. The plugin will auto-create its config on first run

## Verify Installation

In OpenCode:
```
tree-list-agents
```

Should show available agent types.

## Try the Playground

```bash
npx opencode-plugin-tree playground bug-fix
```

This will copy the example to `/tmp/ocp-tree/bug-fix` and open it in a new tmux window.

## Troubleshooting

### "bun: command not found"

You need to symlink OpenCode's bundled Bun binary (see Prerequisites above).

### "Not in tmux"

If you're not in a tmux session, the plugin will use terminal mode. You can:
- Start OpenCode inside tmux: `tmux new-session -s opencode && op`
- Or use terminal mode (edit config: `spawn_mode: terminal`)

### Plugin not loading

1. Check OpenCode config:
```bash
cat ~/.config/opencode/opencode.json | grep tree
```

2. Check OpenCode logs:
```bash
tail -f ~/.local/share/opencode/log/*.log | grep tree
```

3. Restart OpenCode completely

## Uninstall

```bash
# Remove plugin only
npx opencode-plugin-tree uninstall

# Remove plugin + all data
npx opencode-plugin-tree uninstall --full
```
