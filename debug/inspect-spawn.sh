#!/bin/bash
# Quick inspection script for existing spawned windows

echo "=== Inspecting Spawned Windows ==="
echo ""

# Find all windows with 'agent' in the name
echo "1. Windows that look like agents:"
tmux list-windows | grep -E "agent|playground" || echo "No agent windows found"
echo ""

# For each agent window, show what's in it
echo "2. Inspecting agent window contents:"
for window in $(tmux list-windows -F "#{window_name}" | grep -E "agent|playground"); do
    echo ""
    echo "=== Window: $window ==="
    echo "Full pane capture:"
    tmux capture-pane -t "$window" -p || echo "Could not capture pane"
    echo "--- End of $window ---"
    echo ""
done

# Check for OpenCode processes
echo "3. OpenCode processes:"
ps aux | grep -E "opencode|op " | grep -v grep || echo "No opencode processes found"
echo ""

# Check state file
echo "4. Session tree state:"
STATE_FILE=~/.config/opencode/plugins/tree/sessions.json
if [ -f "$STATE_FILE" ]; then
    echo "State file exists, content:"
    cat "$STATE_FILE" 2>/dev/null || echo "Could not read state file"
else
    echo "No state file found"
fi
echo ""

# Recent logs
echo "5. Recent OpenCode logs (last 20 lines with 'tree'):"
LOG_DIR=~/.local/share/opencode/log
if [ -d "$LOG_DIR" ]; then
    grep -h "tree" "$LOG_DIR"/*.log 2>/dev/null | tail -20 || echo "No tree-related logs"
else
    echo "Log directory not found"
fi

echo ""
echo "=== Inspection Complete ==="
