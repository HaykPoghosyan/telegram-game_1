// Game server with WebSocket support for real-time multiplayer

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const gameLogic = require('./gameLogic');

class GameServer 
{
    constructor(port = 3000) 
    {
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server);
        this.games = new Map(); // gameId -> game state
        
        this.setupRoutes();
        this.setupSocketHandlers();
    }

    setupRoutes() 
    {
        // Add middleware to bypass ngrok warning
        this.app.use((req, res, next) => 
        {
            res.setHeader('ngrok-skip-browser-warning', 'true');
            next();
        });
        
        // Serve static files (index.html will handle root)
        this.app.use(express.static('public'));
        
        // Game route
        this.app.get('/game', (req, res) => 
        {
            res.sendFile(path.join(__dirname, 'public', 'game.html'));
        });
        
        // Health check
        this.app.get('/health', (req, res) => 
        {
            res.json({ status: 'ok', games: this.games.size });
        });
    }

    setupSocketHandlers() 
    {
        this.io.on('connection', (socket) => 
        {
            console.log('Player connected:', socket.id);

            socket.on('joinGame', (data) => 
            {
                this.handleJoinGame(socket, data);
            });

            socket.on('makeMove', (data) => 
            {
                this.handleMakeMove(socket, data);
            });

            socket.on('disconnect', () => 
            {
                this.handleDisconnect(socket);
            });
        });
    }

    handleJoinGame(socket, data) 
    {
        const { gameId, playerId, playerName } = data;
        
        if (!gameId || !playerId) 
        {
            socket.emit('error', { message: 'Invalid game or player ID' });
            return;
        }

        let game = this.games.get(gameId);

        if (!game) 
        {
            // Create new game
            game = 
            {
                id: gameId,
                board: gameLogic.createBoard(),
                player1: 
                {
                    id: playerId,
                    name: playerName || `Player ${playerId.toString().slice(-4)}`,
                    socketId: socket.id,
                    symbol: gameLogic.PLAYER_X
                },
                player2: null,
                currentPlayer: gameLogic.PLAYER_X,
                status: 'waiting',
                createdAt: Date.now()
            };
            this.games.set(gameId, game);
            socket.join(gameId);
            socket.emit('waiting');
            console.log(`Game ${gameId} created by ${playerId}`);
        }
        else if (game.status === 'waiting' && game.player1.id !== playerId) 
        {
            // Join existing game as player 2
            game.player2 = 
            {
                id: playerId,
                name: playerName || `Player ${playerId.toString().slice(-4)}`,
                socketId: socket.id,
                symbol: gameLogic.PLAYER_O
            };
            game.status = 'active';
            socket.join(gameId);

            // Notify both players with opponent info
            this.io.to(game.player1.socketId).emit('gameStart', 
            {
                symbol: game.player1.symbol,
                gameState: this.getGameState(game),
                currentTurn: game.player1.id,
                opponentId: game.player2.id,
                opponentName: game.player2.name
            });

            this.io.to(game.player2.socketId).emit('gameStart', 
            {
                symbol: game.player2.symbol,
                gameState: this.getGameState(game),
                currentTurn: game.player1.id,
                opponentId: game.player1.id,
                opponentName: game.player1.name
            });

            console.log(`Player ${playerId} joined game ${gameId}`);
        }
        else if (game.player1.id === playerId) 
        {
            // Rejoin as player 1
            game.player1.socketId = socket.id;
            if (playerName) game.player1.name = playerName;
            socket.join(gameId);
            
            if (game.status === 'waiting') 
            {
                socket.emit('waiting');
            }
            else 
            {
                const currentTurn = game.currentPlayer === game.player1.symbol ? 
                                   game.player1.id : game.player2.id;
                socket.emit('gameStart', 
                {
                    symbol: game.player1.symbol,
                    gameState: this.getGameState(game),
                    currentTurn,
                    opponentId: game.player2.id,
                    opponentName: game.player2.name
                });
            }
        }
        else if (game.player2 && game.player2.id === playerId) 
        {
            // Rejoin as player 2
            game.player2.socketId = socket.id;
            if (playerName) game.player2.name = playerName;
            socket.join(gameId);
            
            const currentTurn = game.currentPlayer === game.player1.symbol ? 
                               game.player1.id : game.player2.id;
            socket.emit('gameStart', 
            {
                symbol: game.player2.symbol,
                gameState: this.getGameState(game),
                currentTurn,
                opponentId: game.player1.id,
                opponentName: game.player1.name
            });
        }
        else 
        {
            socket.emit('error', { message: 'Game is full or already started' });
        }
    }

    handleMakeMove(socket, data) 
    {
        const { gameId, playerId, row, col } = data;
        const game = this.games.get(gameId);

        if (!game) 
        {
            socket.emit('error', { message: 'Game not found' });
            return;
        }

        if (game.status !== 'active') 
        {
            socket.emit('error', { message: 'Game is not active' });
            return;
        }

        // Verify it's the player's turn
        const currentPlayerSymbol = game.currentPlayer;
        const playerSymbol = game.player1.id === playerId ? game.player1.symbol : 
                            game.player2.id === playerId ? game.player2.symbol : null;

        if (!playerSymbol) 
        {
            socket.emit('error', { message: 'Player not in this game' });
            return;
        }

        if (playerSymbol !== currentPlayerSymbol) 
        {
            socket.emit('error', { message: 'Not your turn' });
            return;
        }

        // Make the move
        if (!gameLogic.makeMove(game.board, row, col, playerSymbol)) 
        {
            socket.emit('error', { message: 'Invalid move' });
            return;
        }

        // Check if game is over
        const gameOver = gameLogic.isGameOver(game.board);
        
        if (gameOver.over) 
        {
            game.status = 'finished';
            let winnerId = null;
            
            if (!gameOver.draw) 
            {
                winnerId = gameOver.winner === game.player1.symbol ? 
                          game.player1.id : game.player2.id;
            }

            // Notify both players
            this.io.to(gameId).emit('gameOver', 
            {
                gameState: this.getGameState(game),
                winner: winnerId,
                isDraw: gameOver.draw || false
            });

            console.log(`Game ${gameId} finished`);
            
            // Clean up game after 5 minutes
            setTimeout(() => 
            {
                this.games.delete(gameId);
                console.log(`Game ${gameId} cleaned up`);
            }, 5 * 60 * 1000);
        }
        else 
        {
            // Switch turns
            game.currentPlayer = gameLogic.getNextPlayer(game.currentPlayer);
            const nextPlayerId = game.currentPlayer === game.player1.symbol ? 
                                game.player1.id : game.player2.id;

            // Notify both players
            this.io.to(gameId).emit('gameUpdate', 
            {
                gameState: this.getGameState(game),
                currentTurn: nextPlayerId
            });
        }
    }

    handleDisconnect(socket) 
    {
        console.log('Player disconnected:', socket.id);
        
        // Find games where this player is involved
        for (const [gameId, game] of this.games.entries()) 
        {
            if (game.player1.socketId === socket.id || 
                (game.player2 && game.player2.socketId === socket.id)) 
            {
                // Notify the other player
                this.io.to(gameId).emit('opponentLeft');
                
                // Clean up the game
                setTimeout(() => 
                {
                    this.games.delete(gameId);
                }, 10000); // 10 seconds
                
                break;
            }
        }
    }

    getGameState(game) 
    {
        return {
            board: game.board,
            status: game.status,
            currentPlayer: game.currentPlayer
        };
    }

    start() 
    {
        this.server.listen(this.port, () => 
        {
            console.log(`🎮 Game server running on http://localhost:${this.port}`);
            console.log(`📊 Game URL: http://localhost:${this.port}/game`);
        });
    }

    getServer() 
    {
        return this.server;
    }
}

module.exports = GameServer;

