// Main Telegram bot for multiplayer Tic Tac Toe HTML5 Game

const { Telegraf, Markup } = require('telegraf');
const config = require('./config');
const GameServer = require('./gameServer');

// Initialize game server
const gameServer = new GameServer(config.GAME_PORT || 3000);

// Start server with error handling
try {
    gameServer.start();
} catch (err) {
    console.log('Note: Game server may already be running');
}

// Initialize bot
const bot = new Telegraf(config.BOT_TOKEN);

// Start command handler
bot.start(async (ctx) => 
{
    try 
    {
        const userName = ctx.from.first_name || ctx.from.username || 'Fighter';
        
        await ctx.reply(
            `🔥 *Welcome to Friend Fighter!* 🔥\n\n` +
            `Hey ${userName}! Ready to battle your friends?\n\n` +
            '⚔️ *Features:*\n' +
            '• Real-time multiplayer combat\n' +
            '• 4 unique fighters to choose from\n' +
            '• Special moves and combos\n' +
            '• Best of 3 rounds\n\n' +
            '👉 Use /play to start a game!\n' +
            '❓ Use /help for instructions',
            { 
                parse_mode: 'Markdown',
                reply_markup: {
                    inline_keyboard: [[
                        { text: '🎮 Start Playing', callback_data: 'play_game' }
                    ]]
                }
            }
        );
    }
    catch (err) 
    {
        console.error('Error in /start:', err.message);
        await ctx.reply('Welcome! Use /play to start a game.');
    }
});

// Help command
bot.command('help', async (ctx) => 
{
    await ctx.reply(
        '🔥 *Friend Fighter - How to Play* 🔥\n\n' +
        '⚔️ *Game Modes:*\n' +
        '• VS Friend - Battle in real-time\n' +
        '• VS Computer - Practice mode\n\n' +
        '🎮 *Controls:*\n' +
        '• 👊 HAND - Quick punch attack\n' +
        '• 🦶 FOOT - Powerful kick\n' +
        '• 🛡️ BLOCK - Reduce damage by 70%\n' +
        '• 🔥 SUPER - Unlocks after 30 seconds\n\n' +
        '🏆 *Winning:*\n' +
        '• Win 2 out of 3 rounds\n' +
        '• Each round is 60 seconds\n' +
        '• Reduce opponent health to 0\n\n' +
        '💡 *Pro Tips:*\n' +
        '• Build combos for bonus damage\n' +
        '• Block when opponent attacks\n' +
        '• Save your super for big moments\n\n' +
        '*Commands:*\n' +
        '/start - Welcome message\n' +
        '/play - Start a new game\n' +
        '/help - Show this help',
        { parse_mode: 'Markdown' }
    );
});

// Play command - Launch HTML5 game embedded in Telegram
bot.command('play', async (ctx) => 
{
    try 
    {
        // Send the game directly - it will be embedded in Telegram
        await ctx.replyWithGame('asd');
        console.log(`🎮 Game launched by ${ctx.from.first_name || ctx.from.username} (${ctx.from.id})`);
    }
    catch (err) 
    {
        console.error('❌ Error in /play command:', err.message);
        console.error('Full error:', err);
        await ctx.reply(
            '❌ Failed to start game.\n\n' +
            '⚠️ Make sure you have set up the game with BotFather:\n' +
            '1. Send /newgame to @BotFather\n' +
            '2. Select your bot: @' + config.BOT_USERNAME + '\n' +
            '3. Set game name: asd\n' +
            '4. Set title: Friend Fighter\n' +
            '5. Set description: Real-time multiplayer fighting game\n' +
            '6. Upload a game image (512x512 or 800x600)\n' +
            '7. Upload an animation (optional)\n' +
            `8. Set game URL: ${config.GAME_URL}/game`
        );
    }
});

// Handle game callback query
bot.on('callback_query', async (ctx) => 
{
    const callbackQuery = ctx.callbackQuery;
    
    // Handle manual play button from /start command
    if (callbackQuery.data === 'play_game') 
    {
        await ctx.answerCbQuery();
        
        try 
        {
            // Send the game directly - it will be embedded in Telegram
            await ctx.replyWithGame('asd');
            console.log(`🎮 Game launched by ${ctx.from.first_name || ctx.from.username} (${ctx.from.id})`);
        }
        catch (err) 
        {
            console.error('❌ Error launching game:', err.message);
            await ctx.reply('❌ Failed to start game. Use /play command or check BotFather setup.');
        }
        return;
    }
    
    // Handle game launch (when user clicks on the game)
    if (callbackQuery.game_short_name) 
    {
        // Generate unique game ID with user info
        const userId = ctx.from.id;
        const userName = ctx.from.first_name || ctx.from.username || 'Fighter';
        const gameId = 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Construct game URL with player info - this will load in Telegram's embedded browser
        const gameUrl = `${config.GAME_URL}/game?game_id=${gameId}&player_id=${userId}&player_name=${encodeURIComponent(userName)}`;
        
        try 
        {
            // Answer callback query with game URL - Telegram will open this in embedded view
            await ctx.answerGameQuery(gameUrl);
            console.log(`🎮 Game opened in Telegram: ${gameId} by ${userName} (${userId})`);
        }
        catch (err) 
        {
            console.error('Error answering game query:', err.message);
            console.error('Full error:', err);
            await ctx.answerCbQuery('❌ Failed to start game. Please try /play command.');
        }
    }
    else 
    {
        await ctx.answerCbQuery();
    }
});

// Inline query handler for sharing games
bot.on('inline_query', (ctx) => 
{
    const results = [
        {
            type: 'game',
            id: '0',
            game_short_name: 'asd'
        }
    ];
    
    ctx.answerInlineQuery(results);
});

// Error handler
bot.catch((err, ctx) => 
{
    console.error('Bot error:', err);
    if (ctx) 
    {
        ctx.reply('❌ An error occurred. Please try again.');
    }
});

// Start the bot
console.log('🔄 Launching Telegram bot...');
console.log(`Bot token: ${config.BOT_TOKEN.substring(0, 10)}...`);

// Check if using localhost and warn
if (config.GAME_URL.includes('localhost') || config.GAME_URL.includes('127.0.0.1')) 
{
    console.log('⚠️  WARNING: Using localhost URL');
    console.log('⚠️  Telegram inline buttons will not work with localhost');
    console.log('💡 To fix this, use ngrok or another tunneling service:');
    console.log('   1. Install ngrok: npm install -g ngrok');
    console.log('   2. Run: ngrok http 3000');
    console.log('   3. Set GAME_URL environment variable to the ngrok URL');
    console.log('   Or run: npm run ngrok (in a separate terminal)');
}

// Add timeout for bot launch
const launchTimeout = setTimeout(() => {
    console.log('⚠️ Bot launch is taking longer than expected...');
    console.log('⚠️ This might be due to network issues or invalid bot token');
    console.log('✅ Game server is still running at http://localhost:3000/game');
}, 10000);

bot.launch()
    .then(() => 
    {
        clearTimeout(launchTimeout);
        console.log('🤖 Telegram bot is running!');
        console.log(`Bot username: @${config.BOT_USERNAME}`);
        console.log(`Game server: ${config.GAME_URL}`);
    })
    .catch((err) => 
    {
        clearTimeout(launchTimeout);
        console.error('❌ Failed to start bot:', err);
        console.error('Error details:', err.message);
        console.log('✅ Game server is still running at http://localhost:3000/game');
        // Don't exit, keep server running
    });

// Enable graceful stop
process.once('SIGINT', () => 
{
    bot.stop('SIGINT');
    process.exit(0);
});

process.once('SIGTERM', () => 
{
    bot.stop('SIGTERM');
    process.exit(0);
});

module.exports = bot;
