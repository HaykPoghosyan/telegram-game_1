// Tic Tac Toe game logic

class GameLogic 
{
    constructor() 
    {
        this.EMPTY = null;
        this.PLAYER_X = 'X';
        this.PLAYER_O = 'O';
    }

    // Create a new empty 3x3 board
    createBoard() 
    {
        return [
            [this.EMPTY, this.EMPTY, this.EMPTY],
            [this.EMPTY, this.EMPTY, this.EMPTY],
            [this.EMPTY, this.EMPTY, this.EMPTY]
        ];
    }

    // Check if a move is valid
    isValidMove(board, row, col) 
    {
        if (row < 0 || row > 2 || col < 0 || col > 2) 
        {
            return false;
        }
        return board[row][col] === this.EMPTY;
    }

    // Make a move on the board
    makeMove(board, row, col, symbol) 
    {
        if (!this.isValidMove(board, row, col)) 
        {
            return false;
        }
        board[row][col] = symbol;
        return true;
    }

    // Check if there's a winner
    checkWinner(board) 
    {
        // Check rows
        for (let row = 0; row < 3; row++) 
        {
            if (board[row][0] !== this.EMPTY &&
                board[row][0] === board[row][1] &&
                board[row][1] === board[row][2]) 
            {
                return board[row][0];
            }
        }

        // Check columns
        for (let col = 0; col < 3; col++) 
        {
            if (board[0][col] !== this.EMPTY &&
                board[0][col] === board[1][col] &&
                board[1][col] === board[2][col]) 
            {
                return board[0][col];
            }
        }

        // Check diagonals
        if (board[0][0] !== this.EMPTY &&
            board[0][0] === board[1][1] &&
            board[1][1] === board[2][2]) 
        {
            return board[0][0];
        }

        if (board[0][2] !== this.EMPTY &&
            board[0][2] === board[1][1] &&
            board[1][1] === board[2][0]) 
        {
            return board[0][2];
        }

        return null;
    }

    // Check if the board is full (draw condition)
    isBoardFull(board) 
    {
        for (let row = 0; row < 3; row++) 
        {
            for (let col = 0; col < 3; col++) 
            {
                if (board[row][col] === this.EMPTY) 
                {
                    return false;
                }
            }
        }
        return true;
    }

    // Check if the game is over (win or draw)
    isGameOver(board) 
    {
        const winner = this.checkWinner(board);
        if (winner) 
        {
            return { over: true, winner };
        }
        if (this.isBoardFull(board)) 
        {
            return { over: true, winner: null, draw: true };
        }
        return { over: false };
    }

    // Get the next player
    getNextPlayer(currentPlayer) 
    {
        return currentPlayer === this.PLAYER_X ? this.PLAYER_O : this.PLAYER_X;
    }

    // Convert board position to string for display
    getCellDisplay(cell) 
    {
        if (cell === this.PLAYER_X) return '❌';
        if (cell === this.PLAYER_O) return '⭕';
        return '⬜';
    }
}

module.exports = new GameLogic();

