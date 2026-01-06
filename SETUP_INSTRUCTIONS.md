# Friend Fighter - Setup Instructions

## ✅ Fixed: Localhost URL Issue

The bot now works with localhost! When using localhost, the game link will be sent as text instead of a button (since Telegram doesn't allow localhost URLs in inline keyboard buttons).

## 🚀 Quick Start

1. **Start the bot and server:**
   ```bash
   npm start
   ```

2. **Test in Telegram:**
   - Open Telegram
   - Search for `@space_arcade_bot`
   - Send `/play`
   - Copy the game link and paste it in your browser

## 🌐 For Production (Public URL)

To use inline buttons and share links properly, you need a public URL:

### Option 1: Using ngrok (Recommended for testing)

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Start ngrok in a separate terminal:**
   ```bash
   ngrok http 3000
   ```
   Or use the npm script:
   ```bash
   npm run ngrok
   ```

3. **Copy the ngrok URL** (e.g., `https://abc123.ngrok.io`)

4. **Set the GAME_URL environment variable:**
   
   **Windows (PowerShell):**
   ```powershell
   $env:GAME_URL="https://abc123.ngrok.io"
   npm start
   ```
   
   **Windows (CMD):**
   ```cmd
   set GAME_URL=https://abc123.ngrok.io
   npm start
   ```
   
   **Linux/Mac:**
   ```bash
   GAME_URL=https://abc123.ngrok.io npm start
   ```

### Option 2: Deploy to a hosting service

Deploy to services like:
- **Railway** (automatically detects the URL)
- **Heroku**
- **Vercel**
- **DigitalOcean**

The bot will automatically use the public URL when deployed.

## 📋 Bot Commands

- `/start` - Welcome message with game info
- `/play` - Start a new game
- `/help` - Show game instructions

## 🎮 How It Works

1. User sends `/play` to the bot
2. Bot generates a unique game URL with player info
3. **With localhost:** Link is sent as text to copy
4. **With public URL:** Clickable buttons appear
5. User opens the game and chooses a fighter
6. User shares the link with a friend
7. Friend joins and they battle in real-time!

## 🔧 Configuration

Edit `config.js` to change:
- `BOT_TOKEN` - Your bot token from @BotFather
- `BOT_USERNAME` - Your bot username
- `GAME_PORT` - Server port (default: 3000)
- `GAME_URL` - Game URL (auto-detects Railway or uses localhost)

## 🐛 Troubleshooting

**Bot shows "Failed to start game":**
- This was caused by localhost URLs in inline buttons
- Now fixed! The bot sends text links when using localhost

**Game doesn't connect:**
- Make sure port 3000 is not blocked
- Check if the server is running: `http://localhost:3000/health`

**Want to use buttons instead of text links:**
- Use ngrok or deploy to a public server
- Set the GAME_URL environment variable

## 📦 Dependencies

```json
{
  "express": "^5.2.1",
  "socket.io": "^4.8.3",
  "telegraf": "^4.16.3"
}
```

Install with: `npm install`

## 🎯 Features

- ⚔️ Real-time multiplayer combat
- 🥷 4 unique fighters to choose from
- 🔥 Special moves and combos
- 🛡️ Block system (reduces damage by 70%)
- 🏆 Best of 3 rounds
- ⏱️ 60-second rounds
- 🎮 VS Friend or VS Computer modes

Enjoy the game! 🔥

