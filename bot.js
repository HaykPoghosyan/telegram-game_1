// Main Telegram bot for multiplayer Tic Tac Toe HTML5 Game

const { Telegraf, Markup } = require('telegraf');
const config = require('./config');
const GameServer = require('./gameServer');

// Initialize game server
const gameServer = new GameServer(config.GAME_PORT || 3000);
gameServer.start();

// Initialize bot
const bot = new Telegraf(config.BOT_TOKEN);

// Start command handler
bot.start((ctx) => 
{
    ctx.replyWithGame('asd').catch((err) => 
    {
        console.error('Error sending game:', err.message);
        ctx.reply(
            '🎮 *Welcome to Tic Tac Toe!*\n\n' +
            'To play, use the /play command!',
            { parse_mode: 'Markdown' }
        );
    });
});

// Help command
bot.command('help', (ctx) => 
{
    ctx.reply(
        '🎮 *How to Play*\n\n' +
        '1. Click "Play Tic Tac Toe" button\n' +
        '2. The game will open in your browser\n' +
        '3. Share the game with a friend to play multiplayer\n' +
        '4. Take turns placing X and O\n' +
        '5. Get 3 in a row to win!\n\n' +
        'Commands:\n' +
        '/start - Start the bot\n' +
        '/play - Play Tic Tac Toe\n' +
        '/help - Show this help',
        { parse_mode: 'Markdown' }
    );
});

// Play command
bot.command('play', (ctx) => 
{
    ctx.replyWithGame('asd').catch((err) => 
    {
        console.error('Error sending game with /play:', err.message);
        ctx.reply('❌ Failed to start the game. Make sure the game "asd" is created in @BotFather.');
    });
});

// Handle game callback query
bot.on('callback_query', async (ctx) => 
{
    const callbackQuery = ctx.callbackQuery;
    
    if (callbackQuery.game_short_name) 
    {
        // Generate unique game ID
        const gameId = 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        
        // Construct game URL
        const gameUrl = `${config.GAME_URL}/game?game_id=${gameId}`;
        
        try 
        {
            // Answer callback query with game URL - pass URL directly as string
            await ctx.answerGameQuery(gameUrl);
            console.log(`Game started: ${gameId} by user ${ctx.from.id}`);
        }
        catch (err) 
        {
            console.error('Error answering game query:', err.message);
        }
    }
    else 
    {
        ctx.answerCbQuery();
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
bot.launch()
    .then(() => 
    {
        console.log('🤖 Telegram bot is running!');
        console.log(`Bot username: @${config.BOT_USERNAME}`);
        console.log(`Game server: ${config.GAME_URL}`);
    })
    .catch((err) => 
    {
        console.error('Failed to start bot:', err);
        process.exit(1);
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
