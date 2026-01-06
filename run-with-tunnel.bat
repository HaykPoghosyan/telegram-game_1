@echo off
REM Telegram Game - Run with Cloudflare Tunnel (Windows)
echo ========================================
echo    Friend Fighter - Public Access
echo ========================================
echo.

REM Check if cloudflared is installed
where cloudflared >nul 2>nul
if errorlevel 1 (
    echo ERROR: Cloudflare Tunnel (cloudflared) is not installed!
    echo.
    echo Please install it from:
    echo https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
    echo.
    pause
    exit /b 1
)

REM Check if node_modules exists
if not exist "node_modules" (
    echo [1/4] Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
    echo Dependencies installed successfully!
    echo.
) else (
    echo [1/4] Dependencies already installed
    echo.
)

echo [2/4] Starting Cloudflare Tunnel...
echo This will create a public URL for your game
echo.

REM Start cloudflared in a new window
start "Cloudflare Tunnel" cmd /c "cloudflared tunnel --url http://localhost:3000 && pause"

echo Waiting for tunnel to establish...
timeout /t 8 /nobreak >nul

echo.
echo [3/4] Cloudflare Tunnel started!
echo Check the Cloudflare Tunnel window for your public URL
echo.
echo [4/4] Starting game server...
echo.
echo ========================================
echo   IMPORTANT: Copy the Cloudflare URL
echo   Update it in BotFather for Telegram
echo ========================================
echo.
echo Local: http://localhost:3000/game
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the server with environment variable
npm start

pause

