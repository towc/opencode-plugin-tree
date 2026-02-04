#!/bin/bash
# Debug script to test tree-spawn-child command step by step

set -x

echo "=== Testing tree-spawn-child Tool ==="
echo ""

# Check if OpenCode is running
if ! pgrep -f "opencode" > /dev/null; then
    echo "✗ OpenCode is not running!"
    echo "Start OpenCode in a tmux window first: tmux new-window -n opencode && op"
    exit 1
fi

echo "✓ OpenCode is running"
echo ""

# Test 1: Check if plugin is loaded
echo "Test 1: Checking if plugin tools are available..."
echo "Run this in OpenCode:"
echo '  tree-list-agents'
echo ""
read -p "Press Enter after running tree-list-agents in OpenCode..."

# Test 2: Check config file
echo ""
echo "Test 2: Checking plugin config..."
if [ -f ~/.config/opencode/plugins/tree/tree.yml ]; then
    echo "✓ Config file exists"
    echo "spawn_mode: $(grep spawn_mode ~/.config/opencode/plugins/tree/tree.yml)"
else
    echo "✗ Config file not found!"
fi

# Test 3: Check state file location
echo ""
echo "Test 3: Checking state file..."
STATE_FILE=~/.config/opencode/plugins/tree/sessions.json
if [ -f "$STATE_FILE" ]; then
    echo "✓ State file exists"
    echo "Content:"
    cat "$STATE_FILE" | head -20
else
    echo "○ State file doesn't exist yet (will be created on first spawn)"
fi

# Test 4: Manual tmux spawn test
echo ""
echo "Test 4: Manual tmux window creation..."
TEST_WINDOW="manual-test-$$"
TEST_DIR="/tmp/test-spawn-$$"
mkdir -p "$TEST_DIR"

echo "Creating test window: $TEST_WINDOW in $TEST_DIR"
tmux new-window -n "$TEST_WINDOW" -c "$TEST_DIR"
sleep 0.3

echo "Sending test command..."
tmux send-keys -t ":$TEST_WINDOW" 'echo "Test window works!"'

echo ""
echo "Test window created. Check tmux window: $TEST_WINDOW"
echo "To clean up: tmux kill-window -t $TEST_WINDOW && rm -rf $TEST_DIR"
echo ""

# Test 5: Instructions for tree-spawn-child
echo "Test 5: Now test tree-spawn-child in OpenCode:"
echo ""
echo "Run this command in your OpenCode session:"
echo '  tree-spawn-child agent_type="test" task_description="Debug test task"'
echo ""
echo "Expected:"
echo "  - New tmux window 'test-agent' should be created"
echo "  - That window should have an 'opencode --prompt' command ready to run"
echo "  - Press Enter in that window to start OpenCode"
echo ""
echo "If you see a black screen:"
echo "  1. Check if the window exists: tmux list-windows"
echo "  2. Check what's in it: tmux capture-pane -t test-agent -p"
echo "  3. Try manually switching to it: Ctrl+b w (choose window)"
echo ""
read -p "Press Enter after testing tree-spawn-child..."

# Test 6: Examine logs
echo ""
echo "Test 6: Checking OpenCode logs for errors..."
LOG_DIR=~/.local/share/opencode/log
if [ -d "$LOG_DIR" ]; then
    echo "Recent plugin errors:"
    tail -100 "$LOG_DIR"/*.log | grep -A5 "tree\|error\|Error" | tail -20
else
    echo "Log directory not found at $LOG_DIR"
fi

echo ""
echo "=== Debug test complete ==="
