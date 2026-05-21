class ConnectGame {
    constructor() {
        this.rows = 4;
        this.cols = 8;
        this.cards = [];
        this.board = [];
        this.firstCard = null;
        this.secondCard = null;
        this.isProcessing = false;
        this.score = 0;
        this.matchedPairs = 0;
        this.totalPairs = 0;
        this.gameRunning = false;
        this.isPaused = false;
        this.timer = 0;
        this.timerInterval = null;
        this.moveHistory = [];
        this.emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔'];

        this.initializeElements();
        this.setupEventListeners();
        this.startNewGame();
    }

    initializeElements() {
        this.gameBoard = document.getElementById('gameBoard');
        this.scoreDisplay = document.getElementById('score');
        this.remainingDisplay = document.getElementById('remaining');
        this.timerDisplay = document.getElementById('timer');
        this.gameOverModal = document.getElementById('gameOverModal');
        this.pauseOverlay = document.getElementById('pauseOverlay');
        this.newGameBtn = document.getElementById('newGameBtn');
        this.hintBtn = document.getElementById('hintBtn');
        this.undoBtn = document.getElementById('undoBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.restartBtn = document.getElementById('restartBtn');
    }

    setupEventListeners() {
        this.newGameBtn.addEventListener('click', () => this.startNewGame());
        this.hintBtn.addEventListener('click', () => this.giveHint());
        this.undoBtn.addEventListener('click', () => this.undo());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.restartBtn.addEventListener('click', () => this.startNewGame());
        this.pauseOverlay.addEventListener('click', () => this.togglePause());
    }

    startNewGame() {
        this.reset();
        this.initializeBoard();
        this.shuffleBoard();
        this.render();
        this.gameRunning = true;
        this.startTimer();
    }

    reset() {
        this.cards = [];
        this.board = [];
        this.firstCard = null;
        this.secondCard = null;
        this.isProcessing = false;
        this.score = 0;
        this.matchedPairs = 0;
        this.timer = 0;
        this.moveHistory = [];
        this.isPaused = false;
        this.gameRunning = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        this.gameOverModal.classList.remove('show');
        this.pauseOverlay.classList.remove('show');
        this.pauseBtn.textContent = '暂停';
    }

    initializeBoard() {
        const pairCount = (this.rows * this.cols) / 2;
        this.totalPairs = pairCount;

        for (let i = 0; i < pairCount; i++) {
            this.cards.push(this.emojis[i % this.emojis.length]);
            this.cards.push(this.emojis[i % this.emojis.length]);
        }

        let index = 0;
        for (let i = 0; i < this.rows; i++) {
            this.board[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.board[i][j] = {
                    id: index++,
                    emoji: this.cards[index - 1],
                    flipped: false,
                    matched: false
                };
            }
        }
    }

    shuffleBoard() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }

        let index = 0;
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                this.board[i][j].emoji = this.cards[index++];
            }
        }
    }

    render() {
        this.gameBoard.innerHTML = '';
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const card = this.board[i][j];
                const cardElement = document.createElement('div');
                cardElement.className = 'card';
                cardElement.id = `card-${card.id}`;

                if (card.matched) {
                    cardElement.classList.add('matched');
                }

                if (card.flipped) {
                    cardElement.classList.add('flipped');
                    cardElement.textContent = card.emoji;
                }

                cardElement.addEventListener('click', () => this.cardClick(i, j, cardElement));
                this.gameBoard.appendChild(cardElement);
            }
        }

        this.updateStats();
    }

    cardClick(row, col, cardElement) {
        if (this.isPaused || this.isProcessing || this.gameRunning === false) {
            return;
        }

        const card = this.board[row][col];

        if (card.flipped || card.matched) {
            return;
        }

        card.flipped = true;
        cardElement.classList.add('flipped');
        cardElement.textContent = card.emoji;

        if (this.firstCard === null) {
            this.firstCard = { row, col, card };
        } else if (this.secondCard === null) {
            this.secondCard = { row, col, card };
            this.isProcessing = true;

            this.moveHistory.push({
                firstCard: { ...this.firstCard },
                secondCard: { ...this.secondCard }
            });

            setTimeout(() => this.checkMatch(), 600);
        }
    }

    checkMatch() {
        const match = this.firstCard.card.emoji === this.secondCard.card.emoji;

        if (match) {
            this.firstCard.card.matched = true;
            this.secondCard.card.matched = true;
            this.matchedPairs++;
            this.score += 100;

            const firstCardEl = document.getElementById(`card-${this.firstCard.card.id}`);
            const secondCardEl = document.getElementById(`card-${this.secondCard.card.id}`);

            if (firstCardEl) firstCardEl.classList.add('matched');
            if (secondCardEl) secondCardEl.classList.add('matched');

            this.firstCard = null;
            this.secondCard = null;
            this.isProcessing = false;

            if (this.matchedPairs === this.totalPairs) {
                this.endGame();
            }
        } else {
            this.score = Math.max(0, this.score - 10);

            const firstCardEl = document.getElementById(`card-${this.firstCard.card.id}`);
            const secondCardEl = document.getElementById(`card-${this.secondCard.card.id}`);

            if (firstCardEl) firstCardEl.classList.add('error');
            if (secondCardEl) secondCardEl.classList.add('error');

            setTimeout(() => {
                this.firstCard.card.flipped = false;
                this.secondCard.card.flipped = false;

                if (firstCardEl) {
                    firstCardEl.classList.remove('flipped', 'error');
                    firstCardEl.textContent = '';
                }
                if (secondCardEl) {
                    secondCardEl.classList.remove('flipped', 'error');
                    secondCardEl.textContent = '';
                }

                this.firstCard = null;
                this.secondCard = null;
                this.isProcessing = false;
            }, 600);
        }

        this.updateStats();
    }

    giveHint() {
        if (!this.gameRunning || this.isPaused) {
            alert('游戏未进行中');
            return;
        }

        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                const card = this.board[i][j];
                if (!card.matched && !card.flipped) {
                    const cardElement = document.getElementById(`card-${card.id}`);
                    cardElement.classList.add('flipped');
                    cardElement.textContent = card.emoji;

                    setTimeout(() => {
                        cardElement.classList.remove('flipped');
                        cardElement.textContent = '';
                    }, 800);

                    return;
                }
            }
        }
    }

    undo() {
        if (this.moveHistory.length === 0) {
            alert('没有可撤销的操作');
            return;
        }

        const lastMove = this.moveHistory.pop();

        if (!lastMove.firstCard.card.matched || !lastMove.secondCard.card.matched) {
            alert('只能撤销已配对的操作');
            return;
        }

        lastMove.firstCard.card.matched = false;
        lastMove.firstCard.card.flipped = false;
        lastMove.secondCard.card.matched = false;
        lastMove.secondCard.card.flipped = false;

        this.matchedPairs--;
        this.score = Math.max(0, this.score - 100);

        this.render();
    }

    togglePause() {
        if (!this.gameRunning) {
            return;
        }

        this.isPaused = !this.isPaused;

        if (this.isPaused) {
            this.pauseBtn.textContent = '继续';
            this.pauseOverlay.classList.add('show');
            clearInterval(this.timerInterval);
        } else {
            this.pauseBtn.textContent = '暂停';
            this.pauseOverlay.classList.remove('show');
            this.startTimer();
        }
    }

    startTimer() {
        this.timerInterval = setInterval(() => {
            if (!this.isPaused) {
                this.timer++;
                this.timerDisplay.textContent = this.formatTime(this.timer);
            }
        }, 1000);
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    updateStats() {
        this.scoreDisplay.textContent = this.score;
        this.remainingDisplay.textContent = this.totalPairs - this.matchedPairs;
    }

    endGame() {
        this.gameRunning = false;
        clearInterval(this.timerInterval);

        setTimeout(() => {
            document.getElementById('finalScore').textContent = this.score;
            this.gameOverModal.classList.add('show');
        }, 300);
    }
}

// 初始化游戏
document.addEventListener('DOMContentLoaded', () => {
    new ConnectGame();
});
