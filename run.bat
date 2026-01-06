@echo off
REM Telegram Game - Local Run Script for Windows
echo ========================================
echo    Friend Fighter - Telegram Game
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo [1/3] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo Dependencies installed successfully!
    echo.
) else (
    echo [1/3] Dependencies already installed
    echo.
)

REM Start the game server and bot
echo [2/3] Starting game server and Telegram bot...
echo.
echo Game will be available at:
echo   - Local: http://localhost:3000/game
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================
echo.

REM Start the server
npm start

pause

