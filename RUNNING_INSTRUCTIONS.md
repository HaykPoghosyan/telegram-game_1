# How to Run Friend Fighter on Your Local PC

## 🚀 Quick Start (Local Only)

### Windows:
```bash
run.bat
```

### Linux/Mac:
```bash
chmod +x run.sh
./run.sh
```

This will:
1. Install dependencies (if needed)
2. Start the game server on port 3000
3. Game accessible at: http://localhost:3000/game

---

## 🌐 Run with Public Access (Cloudflare Tunnel)

For Telegram integration, you need a public URL:

### Windows:
```bash
run-with-tunnel.bat
```

### Linux/Mac:
```bash
chmod +x run-with-tunnel.sh
./run-with-tunnel.sh
```

This will:
1. Install dependencies (if needed)
2. Start Cloudflare Tunnel (creates public URL)
3. Start the game server
4. Display the public URL

**Important**: Copy the Cloudflare URL and update it in BotFather!

---

## 📋 Prerequisites

### Required:
- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)

### Optional (for Telegram):
- **Cloudflare Tunnel** (cloudflared)
  - Windows: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
  - Linux: `curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared && chmod +x cloudflared && sudo mv cloudflared /usr/local/bin/`
  - Mac: `brew install cloudflare/cloudflare/cloudflared`

---

## 🎮 Configuration

### Bot Token:
Edit `config.js` and set your bot token:
```javascript
BOT_TOKEN: 'YOUR_BOT_TOKEN_HERE'
```

### Game Settings:
- **Health**: 300 HP (configurable in `public/game.js`)
- **Port**: 3000 (configurable in `config.js`)
- **Characters**: 4 fighters (ANDO, GORO, GSPO, HRO)

---

## 🔧 Manual Setup (Alternative)

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Start Server (Local Only)
```bash
npm start
```

### Step 3: Start with Public URL
```bash
# Terminal 1: Start Cloudflare Tunnel
cloudflared tunnel --url http://localhost:3000

# Terminal 2: Start Game Server (copy URL from Terminal 1)
set GAME_URL=https://your-url.trycloudflare.com
npm start
```

---

## 📱 Update BotFather (for Telegram)

After starting with Cloudflare Tunnel:

1. Open Telegram, find **@BotFather**
2. Send: `/editgame`
3. Select your bot: `@space_arcade_bot`
4. Select game: `asd` (your game name)
5. Choose: **Set URL**
6. Send: `https://your-cloudflare-url.trycloudflare.com/game`

---

## 🎯 Test Your Game

### Local Testing:
1. Open: http://localhost:3000/game
2. Choose "VS Computer"
3. Fight!

### Telegram Testing:
1. Open your bot in Telegram
2. Send: `/play`
3. Game opens embedded in Telegram
4. Share with friends to battle!

---

## 🛑 Stop the Server

- Press `Ctrl+C` in the terminal
- Close all terminal windows

---

## 🐛 Troubleshooting

### Port 3000 already in use:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID_NUMBER> /F

# Linux/Mac
lsof -ti:3000 | xargs kill
```

### Dependencies not installing:
```bash
# Clear npm cache
npm cache clean --force
npm install
```

### Cloudflare Tunnel not working:
- Make sure cloudflared is installed
- Check firewall settings
- Try restarting the tunnel

### Bot not connecting:
- Check your bot token in `config.js`
- Make sure the bot is active in BotFather
- Update the game URL in BotFather

---

## 📊 Features

✅ Health: 300 HP (extended fights)
✅ Smart CPU AI with blocking
✅ 1.5 second attack intervals
✅ Responsive mobile controls
✅ 4 unique characters
✅ Multiplayer support
✅ Telegram integration
✅ Real-time WebSocket battles

---

## 🎮 Game Controls

- **👊 HAND**: Quick punch (10-22 damage)
- **🦶 FOOT**: Strong kick (15-22 damage)
- **🛡️ BLOCK**: Reduce damage by 80%
- **🔥 SUPER**: Ultimate move (35-50 damage, unlocks after 30s)

---

## 📝 Development

### Start in Development Mode:
```bash
npm start
```

### File Structure:
```
telegram game/
├── bot.js              # Telegram bot
├── gameServer.js       # Game server + WebSocket
├── config.js           # Configuration
├── public/
│   ├── game.html       # Game UI
│   ├── game.js         # Game logic
│   └── game.css        # Styles
├── package.json        # Dependencies
├── run.bat             # Windows run script
├── run.sh              # Linux/Mac run script
└── run-with-tunnel.*   # Public access scripts
```

---

**Enjoy playing Friend Fighter! 🔥🥊**

