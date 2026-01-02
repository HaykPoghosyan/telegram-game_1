// Configuration file for the Telegram bot

module.exports = 
{
    // Bot token from BotFather
    BOT_TOKEN: '8217922250:AAH8qGJ5N7LP8VBsjEeMz0LO2SkQO_kSZBQ',
    
    // Bot username
    BOT_USERNAME: 'space_arcade_bot',
    
    // Game server settings
    GAME_PORT: process.env.PORT || 3000,
    
    // Game URL (IMPORTANT: Change this to your public URL from ngrok or your hosting)
    // Example: https://abc123.ngrok.io
    GAME_URL: process.env.GAME_URL || 'https://operators-ship-valid-stuff.trycloudflare.com',
    
    // Game settings
    GAME_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
};

