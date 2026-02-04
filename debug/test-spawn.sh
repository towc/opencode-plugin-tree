#!/bin/bash
# Debug script to test session spawning step by step

set -x  # Print each command before executing

echo "=== Testing OpenCode Plugin Tree Spawn ==="
echo ""

# Step 1: Check if we're in tmux
echo "Step 1: Checking tmux environment..."
if [ -n "$TMUX" ]; then
    echo "✓ Running in tmux"
    tmux display-message "Running spawn debug test"
else
    echo "✗ NOT in tmux!"
    exit 1
fi

# Step 2: Check current directory
echo ""
echo "Step 2: Current working directory..."
pwd

# Step 3: Try creating a simple tmux window
echo ""
echo "Step 3: Creating test tmux window..."
tmux new-window -n "test-debug" -c "$(pwd)"
sleep 1

# Step 4: Send a simple command
echo ""
echo "Step 4: Sending simple command..."
tmux send-keys -t ":test-debug" 'echo "Hello from test window"'
sleep 1

# Step 5: Check if window exists
echo ""
echo "Step 5: Listing tmux windows..."
tmux list-windows | grep test-debug

# Step 6: Capture what's in the window
echo ""
echo "Step 6: Capturing window content..."
tmux capture-pane -t ":test-debug" -p

# Step 7: Try sending opencode command
echo ""
echo "Step 7: Sending opencode command..."
tmux send-keys -t ":test-debug" 'opencode --prompt "test prompt"'
sleep 1

# Step 8: Capture again
echo ""
echo "Step 8: Capturing after opencode command..."
tmux capture-pane -t ":test-debug" -p | tail -5

echo ""
echo "=== Test window created. Switch to 'test-debug' window to see it ==="
echo "Press Enter in that window to run the opencode command"
echo ""
echo "To clean up: tmux kill-window -t test-debug"
