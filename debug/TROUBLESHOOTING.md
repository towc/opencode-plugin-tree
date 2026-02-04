# Troubleshooting Guide

## Black Screen / Nothing Happens

### Symptom
- Run `tree-spawn-child` command
- New tmux window created
- Window shows black screen or hangs
- OpenCode never starts

### Root Cause
Plugin dependencies not installed!

### Solution
```bash
cd /path/to/opencode-plugin-tree
bun install
```

Then restart OpenCode.

### How to Verify
Check OpenCode logs:
```bash
tail -f ~/.local/share/opencode/log/*.log | grep error
```

If you see:
```
ERROR Cannot find module '@opencode-ai/plugin'
```

You need to run `bun install`.

---

## Plugin Not Loading

### Check 1: Is it in the config?
```bash
cat ~/.config/opencode/opencode.json | grep tree
```

Should show:
```json
"/home/user/git/github/towc/opencode-plugin-tree"
```

### Check 2: Dependencies installed?
```bash
ls node_modules/@opencode-ai/plugin
```

Should exist. If not: `bun install`

### Check 3: Restart OpenCode
Plugin changes require full restart (Ctrl+C then restart)

---

## Tools Not Available

### Symptom
Commands like `tree-list-agents` not found

### Solution
1. Check plugin is loaded:
```bash
tail ~/.local/share/opencode/log/*.log | grep "Tree plugin initialized"
```

2. If not found, check for errors:
```bash
tail ~/.local/share/opencode/log/*.log | grep tree
```

3. Restart OpenCode completely

---

## Window Created But Command Not Working

### Check what's in the window:
```bash
tmux capture-pane -t <window-name> -p
```

Should show:
```
opencode --prompt "$(<.prompt)"
```

### If it shows old `op` command:
You have an old version. Pull latest:
```bash
git pull origin main
```

---

## Debug Scripts

### Quick Inspection
```bash
./debug/inspect-spawn.sh
```

Shows:
- Current agent windows
- Window contents
- OpenCode processes
- Session state
- Recent logs

### Test Basic Spawn
```bash
./debug/test-spawn.sh
```

Creates test window to verify tmux works

### Test Full Flow
```bash
./debug/test-tree-spawn-child.sh
```

Interactive test of tree-spawn-child command

---

## Common Issues

### Issue: "bun: command not found"
**Solution:** Symlink OpenCode's bun:
```bash
ln -s $(dirname $(which opencode))/../lib/node_modules/opencode-ai/node_modules/opencode-linux-x64/bin/opencode ~/.local/bin/bun
```

### Issue: "Not running in tmux"
**Solution:** Start OpenCode inside tmux:
```bash
tmux new-session -s opencode
opencode --prompt
```

### Issue: Tools work but spawn doesn't create window
**Solution:** Check spawn_mode in config:
```bash
grep spawn_mode ~/.config/opencode/plugins/tree/tree.yml
```

Should be `tmux` if you're in tmux.

### Issue: Window created but empty
**Solution:** Check if opencode is in PATH:
```bash
which opencode
```

If not found, check your shell configuration.

---

## Getting Help

1. Run inspection script: `./debug/inspect-spawn.sh`
2. Check logs: `tail -100 ~/.local/share/opencode/log/*.log | grep -i error`
3. Open issue with:
   - Output from inspection script
   - Relevant log excerpts
   - What you were trying to do
   - What happened vs what you expected

---

## Clean Start

If everything is broken, start fresh:

```bash
# 1. Uninstall
npx . uninstall --full

# 2. Clean dependencies
rm -rf node_modules bun.lock

# 3. Reinstall dependencies
bun install

# 4. Reinstall plugin
npx . install --dev

# 5. Restart OpenCode
# (Ctrl+C in OpenCode then restart)

# 6. Test
# In OpenCode: tree-list-agents
```
