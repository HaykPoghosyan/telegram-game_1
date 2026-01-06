#!/bin/bash
# Telegram Game - Local Run Script for Linux/Mac

echo "========================================"
echo "   Friend Fighter - Telegram Game"
echo "========================================"
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[1/3] Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "ERROR: Failed to install dependencies"
        exit 1
    fi
    echo "Dependencies installed successfully!"
    echo ""
else
    echo "[1/3] Dependencies already installed"
    echo ""
fi

# Start the game server and bot
echo "[2/3] Starting game server and Telegram bot..."
echo ""
echo "Game will be available at:"
echo "  - Local: http://localhost:3000/game"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "========================================"
echo ""

# Start the server
npm start

