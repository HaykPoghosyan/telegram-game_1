console.log('🎮 Game.js loading...');

// Socket connection - wrapped in try/catch for safety
var socket = null;
try 
{
    if (typeof io !== 'undefined') 
    {
        socket = io();
        console.log('✅ Socket.IO connected');
    }
}
catch (err) 
{
    console.log('⚠️ Socket.IO error:', err);
}

// Create mock socket if not available
if (!socket) 
{
    console.log('⚠️ Using mock socket for CPU mode');
    socket = { 
        emit: function() {}, 
        on: function() {} 
    };
}

// Game state
var gameId = null;
var playerId = null;
var playerName = 'Fighter';
var selectedCharacter = null;
var isHost = false;
var gameMode = 'pvp';
var isBlocking = false;
var comboCount = 0;
var lastAttackTime = 0;

// Round system
var currentRound = 1;
var player1Wins = 0;
var player2Wins = 0;
var roundTimer = 60;
var roundStartTime = 0;
var timerInterval = null;
var superUnlocked = false;
var SUPER_UNLOCK_TIME = 30;
var ROUNDS_TO_WIN = 2;

// Game variables
var myHealth = 100;
var opponentHealth = 100;
var gameActive = false;

// Character definitions
var characters = [
    { id: 'ando', name: 'ANDO', emoji: '🥷', power: 85, speed: 90, defense: 75 },
    { id: 'goro', name: 'GORO', emoji: '⚔️', power: 95, speed: 70, defense: 85 },
    { id: 'gspo', name: 'GSPO', emoji: '🔥', power: 80, speed: 95, defense: 70 },
    { id: 'hro', name: 'HRO', emoji: '💀', power: 90, speed: 80, defense: 80 }
];

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() 
{
    console.log('🎯 DOM ready, initializing game...');
    
    try 
    {
        var urlParams = new URLSearchParams(window.location.search);
        gameId = urlParams.get('game_id') || 'fight_' + Math.random().toString(36).substr(2, 9);

        // Get Telegram user data
        if (window.Telegram && window.Telegram.WebApp) 
        {
            var tg = window.Telegram.WebApp;
            tg.ready();
            tg.expand();
            if (tg.initDataUnsafe && tg.initDataUnsafe.user) 
            {
                var user = tg.initDataUnsafe.user;
                playerId = user.id;
                playerName = user.first_name || user.username || 'Fighter';
            }
        }

        if (!playerId) 
        {
            playerId = 'player_' + Math.random().toString(36).substr(2, 9);
        }
        
        console.log('✅ Game initialized! Player:', playerName);
    }
    catch (err) 
    {
        console.error('❌ Init error:', err);
    }
});

// Render character selection
function renderCharacters() 
{
    try 
    {
        var grid = document.getElementById('charactersGrid');
        if (!grid) return;
        
        grid.innerHTML = '';
        
        for (var i = 0; i < characters.length; i++) 
        {
            var char = characters[i];
            var card = document.createElement('div');
            card.className = 'character-card' + (selectedCharacter === char.id ? ' selected' : '');
            card.setAttribute('data-id', char.id);
            card.onclick = (function(id) { return function() { selectCharacter(id); }; })(char.id);
            
            card.innerHTML = 
                '<div class="character-avatar emoji">' + char.emoji + '</div>' +
                '<div class="character-name">' + char.name + '</div>' +
                '<div class="character-stats">' +
                    '<div>PWR</div>' +
                    '<div class="stat-bar"><div class="stat-fill" style="width: ' + char.power + '%"></div></div>' +
                    '<div>SPD</div>' +
                    '<div class="stat-bar"><div class="stat-fill" style="width: ' + char.speed + '%"></div></div>' +
                    '<div>DEF</div>' +
                    '<div class="stat-bar"><div class="stat-fill" style="width: ' + char.defense + '%"></div></div>' +
                '</div>';
            grid.appendChild(card);
        }
    }
    catch (err) 
    {
        console.error('❌ renderCharacters error:', err);
    }
}

function selectCharacter(charId) 
{
    selectedCharacter = charId;
    renderCharacters();
}

function showCharacterSelect(mode) 
{
    try 
    {
        console.log('📝 showCharacterSelect:', mode);
        gameMode = mode;
        document.getElementById('menuScreen').style.display = 'none';
        document.getElementById('characterSelect').style.display = 'flex';
        selectedCharacter = characters[0].id;
        renderCharacters();
    }
    catch (err) 
    {
        console.error('❌ showCharacterSelect error:', err);
    }
}

function confirmCharacter() 
{
    try 
    {
        console.log('📝 confirmCharacter, selected:', selectedCharacter);
        
        if (!selectedCharacter) 
        {
            showToast('Select a character first!');
            return;
        }

        if (gameMode === 'cpu') 
        {
            startCpuGame();
        }
        else 
        {
            joinMultiplayerGame();
        }
    }
    catch (err) 
    {
        console.error('❌ confirmCharacter error:', err);
    }
}

function joinMultiplayerGame() 
{
    document.getElementById('characterSelect').style.display = 'none';
    document.getElementById('waitingScreen').style.display = 'flex';
    
    socket.emit('joinFight', {
        gameId: gameId,
        playerId: playerId,
        playerName: playerName,
        character: selectedCharacter
    });
}

function startCpuGame() 
{
    try 
    {
        console.log('🎮 Starting CPU game...');
        
        document.getElementById('characterSelect').style.display = 'none';
        document.getElementById('arena').style.display = 'flex';
        
        var myChar = null;
        for (var i = 0; i < characters.length; i++) 
        {
            if (characters[i].id === selectedCharacter) 
            {
                myChar = characters[i];
                break;
            }
        }
        
        var cpuIndex = Math.floor(Math.random() * characters.length);
        var cpuChar = characters[cpuIndex];
        
        window.cpuCharacter = cpuChar;
        
        document.getElementById('player1Name').textContent = playerName;
        document.getElementById('player2Name').textContent = 'CPU - ' + cpuChar.name;
        
        document.getElementById('fighter1Sprite').textContent = myChar ? myChar.emoji : '👤';
        document.getElementById('fighter2Sprite').textContent = cpuChar.emoji;
        
        currentRound = 1;
        player1Wins = 0;
        player2Wins = 0;
        
        console.log('🎮 Starting round...');
        startRound();
        
        console.log('🤖 Starting CPU AI...');
        startCpuAI();
    }
    catch (err) 
    {
        console.error('❌ startCpuGame error:', err);
        alert('Error starting game: ' + err.message);
    }
}

function startRound() 
{
    try 
    {
        myHealth = 100;
        opponentHealth = 100;
        gameActive = true;
        isHost = true;
        superUnlocked = false;
        roundTimer = 60;
        roundStartTime = Date.now();
        
        updateHealthBars();
        updateRoundUI();
        lockSuperAttack();
        
        showRoundText('ROUND ' + currentRound);
        
        setTimeout(function() 
        {
            showRoundText('FIGHT!');
            startRoundTimer();
        }, 1500);
    }
    catch (err) 
    {
        console.error('❌ startRound error:', err);
    }
}

function startRoundTimer() 
{
    if (timerInterval) clearInterval(timerInterval);
    
    timerInterval = setInterval(function() 
    {
        if (!gameActive) 
        {
            clearInterval(timerInterval);
            return;
        }
        
        var elapsed = Math.floor((Date.now() - roundStartTime) / 1000);
        roundTimer = Math.max(0, 60 - elapsed);
        
        var timerEl = document.getElementById('roundTimer');
        if (timerEl) 
        {
            timerEl.textContent = roundTimer;
            timerEl.className = 'round-timer' + (roundTimer <= 10 ? ' warning' : '');
        }
        
        if (elapsed >= SUPER_UNLOCK_TIME && !superUnlocked) 
        {
            unlockSuperAttack();
        }
        
        if (roundTimer <= 0) 
        {
            clearInterval(timerInterval);
            endRoundByTime();
        }
    }, 100);
}

function lockSuperAttack() 
{
    superUnlocked = false;
    var btn = document.getElementById('superBtn');
    var label = document.getElementById('superLabel');
    var status = document.getElementById('specialStatus');
    
    if (btn) 
    {
        btn.disabled = true;
        btn.textContent = '🔒';
        btn.classList.remove('ready');
    }
    if (label) label.textContent = 'SUPER (30s)';
    if (status) 
    {
        status.textContent = '🔒 SUPER LOCKED';
        status.classList.remove('unlocked');
    }
}

function unlockSuperAttack() 
{
    superUnlocked = true;
    var btn = document.getElementById('superBtn');
    var label = document.getElementById('superLabel');
    var status = document.getElementById('specialStatus');
    
    if (btn) 
    {
        btn.disabled = false;
        btn.textContent = '⚡';
        btn.classList.add('ready');
    }
    if (label) label.textContent = 'SUPER!';
    if (status) 
    {
        status.textContent = '⚡ SUPER READY!';
        status.classList.add('unlocked');
    }
    
    showToast('⚡ SUPER ATTACK UNLOCKED!');
}

function updateRoundUI() 
{
    var roundNum = document.getElementById('roundNumber');
    var p1wins = document.getElementById('player1Wins');
    var p2wins = document.getElementById('player2Wins');
    
    if (roundNum) roundNum.textContent = 'ROUND ' + currentRound;
    if (p1wins) p1wins.textContent = getWinDots(player1Wins);
    if (p2wins) p2wins.textContent = getWinDots(player2Wins);
}

function getWinDots(wins) 
{
    var dots = '';
    for (var i = 0; i < ROUNDS_TO_WIN; i++) 
    {
        dots += i < wins ? '🔴 ' : '⚫ ';
    }
    return dots.trim();
}

function endRoundByTime() 
{
    gameActive = false;
    
    if (myHealth > opponentHealth) 
    {
        player1Wins++;
        showRoundText('TIME! YOU WIN!');
    }
    else if (opponentHealth > myHealth) 
    {
        player2Wins++;
        showRoundText('TIME! CPU WINS!');
    }
    else 
    {
        showRoundText('TIME! DRAW!');
    }
    
    setTimeout(function() { checkMatchEnd(); }, 2000);
}

function endRoundByKO(playerWon) 
{
    gameActive = false;
    if (timerInterval) clearInterval(timerInterval);
    
    if (playerWon) 
    {
        player1Wins++;
        showRoundText('K.O.! YOU WIN!');
    }
    else 
    {
        player2Wins++;
        showRoundText('K.O.! CPU WINS!');
    }
    
    updateRoundUI();
    setTimeout(function() { checkMatchEnd(); }, 2000);
}

function checkMatchEnd() 
{
    if (player1Wins >= ROUNDS_TO_WIN) 
    {
        document.getElementById('winnerText').textContent = 'VICTORY!';
        document.getElementById('winnerAvatar').textContent = '🏆';
        document.getElementById('gameOverScreen').style.display = 'flex';
    }
    else if (player2Wins >= ROUNDS_TO_WIN) 
    {
        document.getElementById('winnerText').textContent = 'DEFEAT!';
        document.getElementById('winnerAvatar').textContent = '💀';
        document.getElementById('gameOverScreen').style.display = 'flex';
    }
    else 
    {
        currentRound++;
        setTimeout(function() { startRound(); }, 1000);
    }
}

function startCpuAI() 
{
    var cpuLoop = setInterval(function() 
    {
        if (!gameActive) 
        {
            clearInterval(cpuLoop);
            return;
        }
        
        var action = Math.random();
        if (action < 0.4) 
        {
            cpuAttack('punch');
        }
        else if (action < 0.7) 
        {
            cpuAttack('kick');
        }
        else if (superUnlocked && Math.random() < 0.3) 
        {
            cpuSpecialAttack();
        }
    }, 1000);
}

function cpuAttack(type) 
{
    if (!gameActive) return;
    
    var baseDamage = type === 'punch' ? 8 : 12;
    var maxDamage = type === 'punch' ? 12 : 18;
    var damage = baseDamage + Math.floor(Math.random() * (maxDamage - baseDamage));
    var actualDamage = isBlocking ? Math.floor(damage * 0.2) : damage;
    
    myHealth = Math.max(0, myHealth - actualDamage);
    updateHealthBars();
    
    var fighter2 = document.getElementById('fighter2');
    var fighter1 = document.getElementById('fighter1');
    
    if (fighter2) 
    {
        fighter2.classList.add('attacking');
        setTimeout(function() { fighter2.classList.remove('attacking'); }, 300);
    }
    
    if (!isBlocking) 
    {
        if (fighter1) 
        {
            fighter1.classList.add('hit');
            setTimeout(function() { fighter1.classList.remove('hit'); }, 300);
        }
        showDamage('fighter1', actualDamage);
    }
    else 
    {
        showToast('🛡️ BLOCKED!');
    }
    
    if (myHealth <= 0) 
    {
        endRoundByKO(false);
    }
}

function cpuSpecialAttack() 
{
    if (!gameActive || !superUnlocked) return;
    
    var damage = 30 + Math.floor(Math.random() * 15);
    var actualDamage = isBlocking ? Math.floor(damage * 0.4) : damage;
    
    myHealth = Math.max(0, myHealth - actualDamage);
    updateHealthBars();
    
    showDamage('fighter1', actualDamage);
    showRoundText('⚡ CPU SUPER! ⚡');
    
    if (myHealth <= 0) 
    {
        endRoundByKO(false);
    }
}

function attack(type) 
{
    if (!gameActive || isBlocking) return;
    
    var now = Date.now();
    if (now - lastAttackTime < 300) return;
    lastAttackTime = now;
    
    var baseDamage = type === 'punch' ? 10 : 15;
    var maxDamage = type === 'punch' ? 15 : 22;
    var damage = baseDamage + Math.floor(Math.random() * (maxDamage - baseDamage));
    
    var fighter1 = document.getElementById('fighter1');
    if (fighter1) 
    {
        fighter1.classList.add('attacking');
        setTimeout(function() { fighter1.classList.remove('attacking'); }, 300);
    }
    
    if (gameMode === 'cpu') 
    {
        opponentHealth = Math.max(0, opponentHealth - damage);
        updateHealthBars();
        
        var fighter2 = document.getElementById('fighter2');
        if (fighter2) 
        {
            fighter2.classList.add('hit');
            setTimeout(function() { fighter2.classList.remove('hit'); }, 300);
        }
        showDamage('fighter2', damage);
        
        if (opponentHealth <= 0) 
        {
            endRoundByKO(true);
        }
    }
    else 
    {
        socket.emit('fightAction', {
            gameId: gameId,
            playerId: playerId,
            action: 'attack',
            type: type,
            damage: damage
        });
    }
}

function specialAttack() 
{
    if (!gameActive || !superUnlocked) return;
    
    var damage = 35 + Math.floor(Math.random() * 15);
    
    showRoundText('⚡ SUPER! ⚡');
    lockSuperAttack();
    
    if (gameMode === 'cpu') 
    {
        opponentHealth = Math.max(0, opponentHealth - damage);
        updateHealthBars();
        showDamage('fighter2', damage);
        
        if (opponentHealth <= 0) 
        {
            endRoundByKO(true);
        }
    }
    else 
    {
        socket.emit('fightAction', {
            gameId: gameId,
            playerId: playerId,
            action: 'special',
            damage: damage
        });
    }
}

function block(active) 
{
    isBlocking = active;
    var fighter = document.getElementById('fighter1');
    if (fighter) 
    {
        if (active) 
        {
            fighter.classList.add('blocking');
        }
        else 
        {
            fighter.classList.remove('blocking');
        }
    }
}

function updateHealthBars() 
{
    var h1 = document.getElementById('player1Health');
    var h2 = document.getElementById('player2Health');
    var t1 = document.getElementById('player1HealthText');
    var t2 = document.getElementById('player2HealthText');
    
    if (h1) 
    {
        h1.style.width = myHealth + '%';
        h1.className = 'health-bar' + (myHealth < 20 ? ' critical' : myHealth < 50 ? ' low' : '');
    }
    if (h2) 
    {
        h2.style.width = opponentHealth + '%';
        h2.className = 'health-bar' + (opponentHealth < 20 ? ' critical' : opponentHealth < 50 ? ' low' : '');
    }
    if (t1) t1.textContent = Math.round(myHealth);
    if (t2) t2.textContent = Math.round(opponentHealth);
}

function showDamage(fighterId, damage) 
{
    var fighter = document.getElementById(fighterId);
    if (!fighter) return;
    
    var dmgEl = document.createElement('div');
    dmgEl.className = 'damage-number';
    dmgEl.textContent = '-' + damage;
    dmgEl.style.left = Math.random() * 50 + 'px';
    fighter.appendChild(dmgEl);
    setTimeout(function() { dmgEl.remove(); }, 800);
}

function showRoundText(text) 
{
    var existing = document.querySelector('.round-display');
    if (existing) existing.remove();
    
    var el = document.createElement('div');
    el.className = 'round-display';
    el.textContent = text;
    var arena = document.getElementById('arena');
    if (arena) arena.appendChild(el);
    setTimeout(function() { el.remove(); }, 1500);
}

function backToMenu() 
{
    var els = ['characterSelect', 'waitingScreen', 'arena', 'gameOverScreen'];
    for (var i = 0; i < els.length; i++) 
    {
        var el = document.getElementById(els[i]);
        if (el) el.style.display = 'none';
    }
    var menu = document.getElementById('menuScreen');
    if (menu) menu.style.display = 'flex';
    gameActive = false;
    if (timerInterval) clearInterval(timerInterval);
}

function playAgain() 
{
    location.reload();
}

function showToast(message) 
{
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    var toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(function() { toast.remove(); }, 2000);
}

function inviteFriend() 
{
    var link = window.location.origin + '/game?game_id=' + gameId;
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.openTelegramLink) 
    {
        window.Telegram.WebApp.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent(link));
    }
    else 
    {
        copyGameLink();
    }
}

function copyGameLink() 
{
    var link = window.location.origin + '/game?game_id=' + gameId;
    if (navigator.clipboard) 
    {
        navigator.clipboard.writeText(link).then(function() 
        {
            showToast('📋 Link copied!');
        });
    }
    else 
    {
        showToast('Share: ' + link);
    }
}

// Socket events
socket.on('waitingForOpponent', function() 
{
    isHost = true;
});

socket.on('fightStart', function(data) 
{
    document.getElementById('waitingScreen').style.display = 'none';
    document.getElementById('arena').style.display = 'flex';
    
    var myChar = null;
    var oppChar = null;
    for (var i = 0; i < characters.length; i++) 
    {
        if (characters[i].id === selectedCharacter) myChar = characters[i];
        if (characters[i].id === data.opponentCharacter) oppChar = characters[i];
    }
    
    document.getElementById('player1Name').textContent = playerName;
    document.getElementById('player2Name').textContent = data.opponentName;
    document.getElementById('fighter1Sprite').textContent = myChar ? myChar.emoji : '👤';
    document.getElementById('fighter2Sprite').textContent = oppChar ? oppChar.emoji : '👤';
    
    myHealth = 100;
    opponentHealth = 100;
    gameActive = true;
    
    updateHealthBars();
    showRoundText('FIGHT!');
});

socket.on('opponentAction', function(data) 
{
    if (data.action === 'attack' || data.action === 'special') 
    {
        var actualDamage = isBlocking ? Math.floor(data.damage * 0.3) : data.damage;
        myHealth = Math.max(0, myHealth - actualDamage);
        updateHealthBars();
        
        if (!isBlocking) 
        {
            showDamage('fighter1', actualDamage);
        }
        
        if (myHealth <= 0) 
        {
            gameActive = false;
            document.getElementById('winnerText').textContent = 'DEFEAT!';
            document.getElementById('winnerAvatar').textContent = '💀';
            document.getElementById('gameOverScreen').style.display = 'flex';
        }
    }
});

socket.on('damageDealt', function(data) 
{
    opponentHealth = Math.max(0, opponentHealth - data.damage);
    updateHealthBars();
    showDamage('fighter2', data.damage);
    
    if (opponentHealth <= 0) 
    {
        gameActive = false;
        document.getElementById('winnerText').textContent = 'VICTORY!';
        document.getElementById('winnerAvatar').textContent = '🏆';
        document.getElementById('gameOverScreen').style.display = 'flex';
    }
});

socket.on('opponentLeft', function() 
{
    showToast('Opponent disconnected!');
    setTimeout(function() { backToMenu(); }, 2000);
});

console.log('✅ Game.js fully loaded!');
