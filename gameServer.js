// Game server with WebSocket support for Friend Fighter

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

class GameServer 
{
    constructor(port = 3000) 
    {
        this.port = port;
        this.app = express();
        this.server = http.createServer(this.app);
        this.io = new Server(this.server);
        this.fights = new Map(); // gameId -> fight state
        
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
        
        // Serve static files
        this.app.use(express.static('public'));
        
        // API to get avatar list from avatars folder
        this.app.get('/api/avatars', (req, res) => 
        {
            const avatarsDir = path.join(__dirname, 'public', 'avatars');
            
            try 
            {
                if (!fs.existsSync(avatarsDir)) 
                {
                    return res.json([]);
                }
                
                const files = fs.readdirSync(avatarsDir);
                const avatars = files
                    .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
                    .map(file => 
                    {
                        // Extract name from filename (remove extension)
                        const name = path.basename(file, path.extname(file));
                        return {
                            name: name,
                            path: '/avatars/' + file
                        };
                    });
                
                res.json(avatars);
            }
            catch (err) 
            {
                console.error('Error reading avatars:', err);
                res.json([]);
            }
        });
        
        // Game route
        this.app.get('/game', (req, res) => 
        {
            res.sendFile(path.join(__dirname, 'public', 'game.html'));
        });

        // Root redirect
        this.app.get('/', (req, res) => 
        {
            res.redirect('/game');
        });
        
        // Health check
        this.app.get('/health', (req, res) => 
        {
            res.json({ status: 'ok', fights: this.fights.size });
        });
    }

    setupSocketHandlers() 
    {
        this.io.on('connection', (socket) => 
        {
            console.log('Fighter connected:', socket.id);

            // Handle joining a fight
            socket.on('joinFight', (data) => 
            {
                this.handleJoinFight(socket, data);
            });

            // Handle fight actions (attacks, blocks, etc.)
            socket.on('fightAction', (data) => 
            {
                this.handleFightAction(socket, data);
            });

            // Handle disconnect
            socket.on('disconnect', () => 
            {
                this.handleDisconnect(socket);
            });
        });
    }

    handleJoinFight(socket, data) 
    {
        const { gameId, playerId, playerName, character } = data;
        
        if (!gameId || !playerId) 
        {
            socket.emit('error', { message: 'Invalid game or player ID' });
            return;
        }

        let fight = this.fights.get(gameId);

        if (!fight) 
        {
            // Create new fight
            fight = 
            {
                id: gameId,
                player1: 
                {
                    id: playerId,
                    name: playerName || 'Fighter 1',
                    socketId: socket.id,
                    character: character,
                    health: 100,
                    blocking: false
                },
                player2: null,
                status: 'waiting',
                createdAt: Date.now()
            };
            this.fights.set(gameId, fight);
            socket.join(gameId);
            socket.emit('waitingForOpponent');
            console.log(`Fight ${gameId} created by ${playerName}`);
        }
        else if (fight.status === 'waiting' && fight.player1.id !== playerId) 
        {
            // Join existing fight as player 2
            fight.player2 = 
            {
                id: playerId,
                name: playerName || 'Fighter 2',
                socketId: socket.id,
                character: character,
                health: 100,
                blocking: false
            };
            fight.status = 'active';
            socket.join(gameId);

            // Notify both players
            this.io.to(fight.player1.socketId).emit('fightStart', 
            {
                opponentName: fight.player2.name,
                opponentCharacter: fight.player2.character,
                isHost: true
            });

            this.io.to(fight.player2.socketId).emit('fightStart', 
            {
                opponentName: fight.player1.name,
                opponentCharacter: fight.player1.character,
                isHost: false
            });

            console.log(`${playerName} joined fight ${gameId}`);
        }
        else if (fight.player1.id === playerId) 
        {
            // Rejoin as player 1
            fight.player1.socketId = socket.id;
            socket.join(gameId);
            
            if (fight.status === 'waiting') 
            {
                socket.emit('waitingForOpponent');
            }
            else if (fight.player2) 
            {
                socket.emit('fightStart', 
                {
                    opponentName: fight.player2.name,
                    opponentCharacter: fight.player2.character,
                    isHost: true
                });
            }
        }
        else if (fight.player2 && fight.player2.id === playerId) 
        {
            // Rejoin as player 2
            fight.player2.socketId = socket.id;
            socket.join(gameId);
            
            socket.emit('fightStart', 
            {
                opponentName: fight.player1.name,
                opponentCharacter: fight.player1.character,
                isHost: false
            });
        }
        else 
        {
            socket.emit('error', { message: 'Fight is full or already started' });
        }
    }

    handleFightAction(socket, data) 
    {
        const { gameId, playerId, action, type, damage, blocking } = data;
        const fight = this.fights.get(gameId);

        if (!fight || fight.status !== 'active') 
        {
            return;
        }

        // Determine which player sent the action
        const isPlayer1 = fight.player1.id === playerId;
        const attacker = isPlayer1 ? fight.player1 : fight.player2;
        const defender = isPlayer1 ? fight.player2 : fight.player1;

        if (!attacker || !defender) return;

        if (action === 'block') 
        {
            attacker.blocking = blocking;
            return;
        }

        if (action === 'attack' || action === 'special') 
        {
            // Calculate actual damage based on blocking
            const actualDamage = defender.blocking ? Math.floor(damage * 0.3) : damage;
            defender.health = Math.max(0, defender.health - actualDamage);

            // Notify the defender about the attack
            this.io.to(defender.socketId).emit('opponentAction', 
            {
                action,
                type,
                damage: actualDamage
            });

            // Notify the attacker that damage was dealt
            this.io.to(attacker.socketId).emit('damageDealt', 
            {
                damage: actualDamage,
                opponentHealth: defender.health
            });

            // Check for KO
            if (defender.health <= 0) 
            {
                fight.status = 'finished';
                
                this.io.to(attacker.socketId).emit('fightOver', 
                {
                    winner: true,
                    opponentHealth: 0
                });

                this.io.to(defender.socketId).emit('fightOver', 
                {
                    winner: false,
                    opponentHealth: attacker.health
                });

                console.log(`Fight ${gameId} finished - ${attacker.name} wins!`);

                // Clean up after 5 minutes
                setTimeout(() => 
                {
                    this.fights.delete(gameId);
                }, 5 * 60 * 1000);
            }
        }
    }

    handleDisconnect(socket) 
    {
        console.log('Fighter disconnected:', socket.id);
        
        for (const [gameId, fight] of this.fights.entries()) 
        {
            if (fight.player1.socketId === socket.id || 
                (fight.player2 && fight.player2.socketId === socket.id)) 
            {
                // Notify the other player
                this.io.to(gameId).emit('opponentLeft');
                
                // Clean up the fight
                setTimeout(() => 
                {
                    this.fights.delete(gameId);
                }, 10000);
                
                break;
            }
        }
    }

    start() 
    {
        this.server.listen(this.port, () => 
        {
            console.log(`🔥 Friend Fighter server running on http://localhost:${this.port}`);
            console.log(`⚔️ Game URL: http://localhost:${this.port}/game`);
        });
    }

    getServer() 
    {
        return this.server;
    }
}

module.exports = GameServer;
