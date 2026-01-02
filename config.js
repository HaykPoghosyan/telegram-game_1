// Configuration file for the Telegram bot

module.exports = 
{
    // Bot token from BotFather (use environment variable in production)
    BOT_TOKEN: process.env.BOT_TOKEN || '8217922250:AAH8qGJ5N7LP8VBsjEeMz0LO2SkQO_kSZBQ',
    
    // Bot username
    BOT_USERNAME: 'space_arcade_bot',
    
    // Game server settings
    GAME_PORT: process.env.PORT || 3000,
    
    // Game URL (auto-detect Railway URL or use local)
    GAME_URL: process.env.RAILWAY_PUBLIC_DOMAIN 
        ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
        : (process.env.GAME_URL || 'http://localhost:3000'),
    
    // Game settings
    GAME_TIMEOUT: 30 * 60 * 1000, // 30 minutes in milliseconds
};
