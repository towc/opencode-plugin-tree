# Testing Guide - opencode-plugin-tree

Manual testing checklist for local development.

## Prerequisites

- [ ] Bun installed
- [ ] tmux installed
- [ ] Running inside a tmux session
- [ ] OpenCode installed

## Test Suite

### 1. Installation & Setup

#### 1.1 Fresh Install
```bash
cd /path/to/opencode-plugin-tree
npx . install
```

**Expected:**
- [x] ✅ Plugin added to OpenCode config message
- [x] ✅ Created config with spawn_mode: tmux (if in tmux)
- [x] Config file created at `~/.config/opencode/plugins/tree/tree.yml`
- [x] `spawn_mode` set to `tmux` in config

**Verify:**
```bash
cat ~/.config/opencode/opencode.json | grep opencode-plugin-tree
cat ~/.config/opencode/plugins/tree/tree.yml | grep spawn_mode
```

#### 1.2 Duplicate Install
```bash
npx . install
```

**Expected:**
- [x] "Plugin already installed!" message
- [x] No errors

#### 1.3 Install Detection (Not in tmux)
```bash
# Exit tmux first
tmux detach
npx . install
```

**Expected:**
- [x] ⚠ Not in tmux warning
- [x] Config created with `spawn_mode: terminal`

**Cleanup:**
```bash
# Get back into tmux
tmux attach
```

---

### 2. CLI Commands

#### 2.1 Help Command
```bash
npx . help
```

**Expected:**
- [x] Shows usage information
- [x] Lists all commands including `playground`
- [x] Shows examples

#### 2.2 List Agents
```bash
npx . list-agents
```

**Expected:**
- [x] Shows 6 agent types
- [x] Each has description, default_dir, color
- [x] Usage example shown

#### 2.3 Tree Command (Empty State)
```bash
npx . tree
```

**Expected:**
- [x] "No session tree found" message OR
- [x] Shows existing sessions if any

#### 2.4 Config Command
```bash
npx . config
```

**Expected:**
- [x] Opens editor with tree.yml
- [x] Shows spawn_mode, agents, interaction settings
- [x] Can edit and save

**Test:** Change `auto_focus_parent: true` and save

---

### 3. Playground Examples

#### 3.1 Playground - No Arguments
```bash
npx . playground
```

**Expected:**
- [x] Shows list of 3 examples
- [x] Usage instructions

#### 3.2 Playground - Bug Fix
```bash
npx . playground bug-fix
```

**Expected:**
- [x] 📦 Copying bug-fix to /tmp/ocp-tree/bug-fix
- [x] 🚀 Creating tmux window: playground-bug-fix
- [x] ✅ Ready! Switch to window message
- [x] New tmux window created
- [x] `op` command visible but not executed (no Enter pressed)

**Verify:**
```bash
# In the new window
ls
# Should see: app.js, README.md, .opencode-prompt

# Press Enter to start OpenCode
# Should see prompt about fixing bugs
```

#### 3.3 Playground - Build App
```bash
npx . playground build-app
```

**Expected:**
- [x] Creates playground-build-app window
- [x] Files: package.json, README.md, .opencode-prompt
- [x] op command ready

#### 3.4 Playground - Refactor Code
```bash
npx . playground refactor-code
```

**Expected:**
- [x] Creates playground-refactor-code window
- [x] Files: messy.js, README.md, .opencode-prompt
- [x] op command ready

#### 3.5 Playground - Invalid Example
```bash
npx . playground nonexistent
```

**Expected:**
- [x] ❌ Example not found error
- [x] Shows available examples

---

### 4. OpenCode Tools Integration

**Setup:** Start OpenCode in a tmux window
```bash
tmux new-window -n "test-root"
op
```

#### 4.1 tree-list-agents
In OpenCode:
```
tree-list-agents
```

**Expected:**
- [x] Returns list of 6 agent types
- [x] Markdown formatted with **bold** agent names

#### 4.2 tree-show (Empty State)
```
tree-show
```

**Expected:**
- [x] "No active sessions" or shows existing tree

#### 4.3 tree-spawn-child - Basic
```
tree-spawn-child agent_type="web" task_description="Build login page"
```

**Expected:**
- [x] New tmux window created: `web-agent`
- [x] Window contains OpenCode session
- [x] Prompt includes:
  - "You are the WEB AGENT"
  - "PARENT INSTANCE: test-root"
  - "Build login page"
  - AGENTS.md references
  - docs/active-sessions.md references
- [x] Returns success message with window name

**Verify:**
```bash
tmux list-windows
# Should see: test-root and web-agent
```

#### 4.4 tree-show (After Spawn)
In root session:
```
tree-show
```

**Expected:**
- [x] Shows tree with 2 sessions
- [x] Root (test-root) with child (web-agent)
- [x] Icons: 🟢 active
- [x] Shows agent type [web]
- [x] Shows truncated task description

#### 4.5 tree-spawn-child - Nested
In web-agent window:
```
tree-spawn-child agent_type="test" task_description="Test login component"
```

**Expected:**
- [x] New window: test-agent
- [x] Prompt shows PARENT: web-agent
- [x] Tree now has 3 levels

#### 4.6 tree-spawn-child - With Custom Dir
```
tree-spawn-child agent_type="db" task_description="Create schema" working_dir="/tmp"
```

**Expected:**
- [x] Creates db-agent window
- [x] Working directory is /tmp (not default "pipeline")

#### 4.7 tree-focus-parent
In test-agent (child) window:
```
tree-focus-parent
```

**Expected:**
- [x] If `auto_focus_parent: true` in config:
  - [x] tmux switches to parent window (web-agent)
  - [x] Returns success message
- [x] If `auto_focus_parent: false`:
  - [x] Returns "Auto-focus disabled" message
  - [x] No window switch

#### 4.8 tree-report-parent - Basic
In test-agent window:
```
tree-report-parent report_content="# Test Report\n\nAll tests passed!" report_name="test-results"
```

**Expected:**
- [x] File created: `docs/reports/test-results.md`
- [x] Contains: "# Test Report\n\nAll tests passed!"
- [x] Returns parent window name
- [x] If `notify_method: tmux-message`:
  - [x] Parent window shows tmux display-message
  - [x] Message includes report filename

**Verify:**
```bash
cat docs/reports/test-results.md
# Should show the report content
```

#### 4.9 tree-report-parent - Different Notify Methods
Edit config:
```bash
npx . config
# Set notify_method: file
```

Then in child window:
```
tree-report-parent report_content="Test 2" report_name="test-2"
```

**Expected:**
- [x] Creates report file
- [x] Creates `.notifications` file in parent's working directory
- [x] No tmux display-message

Test with `notify_method: both`:
**Expected:**
- [x] Both file and tmux message

Test with `notify_method: none`:
**Expected:**
- [x] Only creates report, no notifications

#### 4.10 tree-truncate-children - Single Session
In root window:
```
tree-truncate-children session_name="test-agent" kill_children=false
```

**Expected:**
- [x] test-agent tmux window killed
- [x] tree-show shows status: killed
- [x] Message: "Killed session: test-agent"

**Verify:**
```bash
tmux list-windows
# test-agent should be gone
```

#### 4.11 tree-truncate-children - With Children
Spawn a new tree:
```
tree-spawn-child agent_type="web" task_description="Parent task"
# Switch to web-agent window
tree-spawn-child agent_type="test" task_description="Child task"
```

Then in root:
```
tree-truncate-children session_name="web-agent" kill_children=true
```

**Expected:**
- [x] Both web-agent and test-agent windows killed
- [x] Message: "Killed session: web-agent (and children)"

#### 4.12 tree-truncate-children - Without Children Flag
Spawn again, then:
```
tree-truncate-children session_name="web-agent" kill_children=false
```

**Expected:**
- [x] Only web-agent killed
- [x] test-agent still running (orphaned)

---

### 5. Session Lifecycle

#### 5.1 Session Status - Active
```
tree-spawn-child agent_type="general" task_description="Test"
tree-show
```

**Expected:**
- [x] New session shows 🟢 active

#### 5.2 Session Status - Idle
In the child session, let OpenCode become idle (wait for response to complete)

In root:
```
tree-show
```

**Expected:**
- [x] Session shows 🟡 idle

#### 5.3 Manual Window Close
```bash
# Manually close a tmux window
tmux kill-window -t general-agent
```

Then:
```
tree-show
```

**Expected:**
- [x] Session still in tree (preserve_tree: true)
- [x] Status might still show last known state

---

### 6. Configuration Changes

#### 6.1 Hot Reload - Agent Types
```bash
npx . config
# Add a new agent type:
# custom:
#   description: "Custom agent"
#   color: "purple"
#   default_dir: "."
```

Without restarting OpenCode:
```
tree-list-agents
```

**Expected:**
- [x] Shows new "custom" agent type

#### 6.2 Hot Reload - Prompt Template
Edit template in config, then spawn new agent

**Expected:**
- [x] New agent uses updated template

#### 6.3 Spawn Mode Change
```bash
npx . config
# Change spawn_mode: terminal
```

Then:
```
tree-spawn-child agent_type="web" task_description="Test"
```

**Expected:**
- [x] Opens new terminal window (not tmux)
- [x] OpenCode starts in new terminal

**Note:** May not work on all systems - terminal command needs to be correct

---

### 7. Edge Cases

#### 7.1 Spawn Without Tmux
Exit tmux and start OpenCode normally:
```
tree-spawn-child agent_type="web" task_description="Test"
```

**Expected:**
- [x] Error: "Not running in tmux" OR
- [x] Falls back to terminal mode

#### 7.2 Invalid Agent Type
```
tree-spawn-child agent_type="invalid" task_description="Test"
```

**Expected:**
- [x] Error message listing available types

#### 7.3 Long Task Description
```
tree-spawn-child agent_type="web" task_description="This is a very long task description with multiple lines and lots of text to test how the system handles it
Line 2
Line 3
Line 4"
```

**Expected:**
- [x] Agent spawned successfully
- [x] Full description in prompt
- [x] Tree view shows truncated description

#### 7.4 Special Characters in Task
```
tree-spawn-child agent_type="web" task_description="Fix bug: User's name doesn't display \"quotes\" correctly"
```

**Expected:**
- [x] Spawns successfully
- [x] Quotes properly escaped in tmux command

#### 7.5 Session Not Found
```
tree-truncate-children session_name="nonexistent"
```

**Expected:**
- [x] "Session not found: nonexistent"

#### 7.6 Missing Report Name
```
tree-report-parent report_content="Test" report_name=""
```

**Expected:**
- [x] Error or uses default name

---

### 8. File System

#### 8.1 State File
```bash
cat ~/.config/opencode/plugins/tree/sessions.json
```

**Expected:**
- [x] Valid JSON
- [x] Contains root and nodes
- [x] Each node has all required fields

#### 8.2 Config File
```bash
cat ~/.config/opencode/plugins/tree/tree.yml
```

**Expected:**
- [x] Valid YAML
- [x] Contains spawn_mode
- [x] Contains all agent types
- [x] Contains interaction settings

#### 8.3 Reports Directory
After using tree-report-parent:
```bash
ls -la docs/reports/
```

**Expected:**
- [x] Directory exists
- [x] Contains .md report files
- [x] Files have correct content

---

### 9. Performance

#### 9.1 Many Sessions
Spawn 10+ sessions:
```bash
for i in {1..10}; do
  echo "tree-spawn-child agent_type=\"general\" task_description=\"Task $i\""
done
```

Then:
```
tree-show
```

**Expected:**
- [x] Shows all sessions
- [x] Tree structure correct
- [x] No performance issues
- [x] Rendering is reasonable

#### 9.2 Deep Nesting
Create deeply nested sessions (5+ levels)

**Expected:**
- [x] All sessions tracked
- [x] Tree visualization shows proper indentation
- [x] Parent-child relationships correct

---

### 10. Cleanup

#### 10.1 Uninstall
```bash
npx . uninstall
```

**Expected:**
- [x] Asks about removing data
- [x] Removes plugin from OpenCode config
- [x] Option to keep or remove plugin data

#### 10.2 Uninstall --full
```bash
npx . uninstall --full
```

**Expected:**
- [x] Removes plugin from config
- [x] Deletes ~/.config/opencode/plugins/tree/
- [x] No leftover files

---

## Test Matrix

| Feature | tmux | terminal | Notes |
|---------|------|----------|-------|
| Installation | ✅ | ✅ | Auto-detects |
| Playground | ✅ | ⚠️ | May not work in terminal mode |
| tree-spawn-child | ✅ | ⚠️ | Depends on terminal config |
| tree-show | ✅ | ✅ | Works everywhere |
| tree-focus-parent | ✅ | ❌ | tmux only |
| tree-report-parent | ✅ | ✅ | Notifications differ |
| tree-truncate-children | ✅ | ⚠️ | Depends on mode |

---

## Automated Testing TODO

Future improvements:
- [ ] Unit tests for tree operations
- [ ] Integration tests with mock tmux
- [ ] CI/CD pipeline
- [ ] Snapshot testing for tree visualization
- [ ] Config validation tests

---

## Known Issues / Expected Behaviors

1. **Orphaned sessions**: If parent is killed without `kill_children=true`, children become orphaned but remain in tree
2. **Manual window close**: Closing tmux window manually doesn't update session status immediately
3. **Terminal mode limitations**: Not all terminal emulators supported yet
4. **Report directory**: Must be relative to working dir, no absolute paths
5. **State file corruption**: If manually edited incorrectly, may cause errors

---

## Debug Commands

```bash
# View logs
tail -f ~/.local/share/opencode/log/*.log | grep tree

# Check tmux windows
tmux list-windows

# View state file
cat ~/.config/opencode/plugins/tree/sessions.json | jq

# Test YAML parsing
bun -e "import yaml from 'js-yaml'; console.log(yaml.load(Bun.file('~/.config/opencode/plugins/tree/tree.yml')))"

# Check if in tmux
echo $TMUX
```

---

## Test Results Template

```
Date: ____________________
Tester: __________________
Environment: tmux version ____ / bun version ____ / OpenCode version ____

### Test Results
- [ ] Section 1: Installation & Setup
- [ ] Section 2: CLI Commands
- [ ] Section 3: Playground Examples
- [ ] Section 4: OpenCode Tools Integration
- [ ] Section 5: Session Lifecycle
- [ ] Section 6: Configuration Changes
- [ ] Section 7: Edge Cases
- [ ] Section 8: File System
- [ ] Section 9: Performance
- [ ] Section 10: Cleanup

### Bugs Found:
1. 
2. 
3. 

### Notes:
```
