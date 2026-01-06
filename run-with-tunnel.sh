#!/bin/bash
# Telegram Game - Run with Cloudflare Tunnel (Linux/Mac)

echo "========================================"
echo "   Friend Fighter - Public Access"
echo "========================================"
echo ""

# Check if cloudflared is installed
if ! command -v cloudflared &> /dev/null; then
    echo "ERROR: Cloudflare Tunnel (cloudflared) is not installed!"
    echo ""
    echo "Please install it from:"
    echo "https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/"
    echo ""
    exit 1
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[1/4] Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
    echo "Dependencies installed successfully!"
    echo ""
else
    echo "[1/4] Dependencies already installed"
    echo ""
fi

echo "[2/4] Starting Cloudflare Tunnel..."
echo "This will create a public URL for your game"
echo ""

# Start cloudflared in background
cloudflared tunnel --url http://localhost:3000 > cloudflare.log 2>&1 &
TUNNEL_PID=$!

echo "Waiting for tunnel to establish..."
sleep 8

echo ""
echo "[3/4] Cloudflare Tunnel started!"
echo "Check cloudflare.log for your public URL"
grep "trycloudflare.com" cloudflare.log | head -1
echo ""

echo "[4/4] Starting game server..."
echo ""
echo "========================================"
echo "  IMPORTANT: Copy the Cloudflare URL"
echo "  Update it in BotFather for Telegram"
echo "========================================"
echo ""
echo "Local: http://localhost:3000/game"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Trap to cleanup on exit
trap "kill $TUNNEL_PID 2>/dev/null" EXIT

# Start the server
npm start

