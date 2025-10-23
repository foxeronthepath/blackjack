class BlackjackGame {
    constructor() {
        this.deck = [];
        this.dealerCards = [];
        this.playerCards = [];
        this.gameState = 'waiting'; // waiting, playing, dealer-turn, finished
        this.balance = 1000;
        this.wins = 0;
        this.losses = 0;
        this.currentBet = 0;
        this.placedChips = []; // Array to track placed chips
        
        this.initializeElements();
        this.attachEventListeners();
        this.updateDisplay();
    }

    initializeElements() {
        this.dealerCardsEl = document.getElementById('dealer-cards');
        this.playerCardsEl = document.getElementById('player-cards');
        this.dealerScoreEl = document.getElementById('dealer-score');
        this.playerScoreEl = document.getElementById('player-score');
        this.gameMessageEl = document.getElementById('game-message');
        this.balanceEl = document.getElementById('balance');
        this.winsEl = document.getElementById('wins');
        this.lossesEl = document.getElementById('losses');
        this.currentBetEl = document.getElementById('current-bet');
        this.bettingCircleEl = document.getElementById('betting-circle');
        
        this.dealBtn = document.getElementById('deal-btn');
        this.hitBtn = document.getElementById('hit-btn');
        this.standBtn = document.getElementById('stand-btn');
        this.newGameBtn = document.getElementById('new-game-btn');
        this.clearBetBtn = document.getElementById('clear-bet');
        this.allInBtn = document.getElementById('all-in');
        
        // Message area for styling
        this.messageArea = this.gameMessageEl.parentElement;
    }

    attachEventListeners() {
        this.dealBtn.addEventListener('click', () => this.dealCards());
        this.hitBtn.addEventListener('click', () => this.hit());
        this.standBtn.addEventListener('click', () => this.stand());
        this.newGameBtn.addEventListener('click', () => this.newGame());
        this.clearBetBtn.addEventListener('click', () => this.clearBet());
        this.allInBtn.addEventListener('click', () => this.allIn());
        
        // Chip selection listeners
        document.querySelectorAll('.chip').forEach(chip => {
            chip.addEventListener('click', () => {
                const value = parseInt(chip.dataset.value);
                this.addChip(value);
            });
        });
        
        // Betting circle click to remove chips
        this.bettingCircleEl.addEventListener('click', () => {
            if (this.placedChips.length > 0) {
                this.removeLastChip();
            }
        });
    }

    createDeck() {
        const suits = ['♠', '♥', '♦', '♣'];
        const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
        const deck = [];
        
        for (let suit of suits) {
            for (let value of values) {
                deck.push({ suit, value });
            }
        }
        
        return this.shuffleDeck(deck);
    }

    shuffleDeck(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    dealCards() {
        if (this.currentBet <= 0) {
            this.updateMessageArea('lose', 'Please place a bet first!');
            return;
        }
        
        if (this.currentBet > this.balance) {
            this.updateMessageArea('lose', 'Insufficient balance!');
            return;
        }
        
        if (this.currentBet < 10) {
            this.updateMessageArea('lose', 'Minimum bet is $10!');
            return;
        }

        if (this.gameState !== 'waiting') {
            this.updateMessageArea('lose', 'Please start a new game first!');
            return;
        }

        this.balance -= this.currentBet;
        this.deck = this.createDeck();
        this.dealerCards = [];
        this.playerCards = [];
        this.gameState = 'playing';
        
        // Deal initial cards
        this.playerCards.push(this.deck.pop());
        this.dealerCards.push(this.deck.pop());
        this.playerCards.push(this.deck.pop());
        this.dealerCards.push(this.deck.pop());
        
        this.updateDisplay();
        this.updateButtons();
        this.updateStats();
        this.updateMessageArea('playing', 'Game in progress! Hit or Stand?');
        this.checkForBlackjack();
    }

    hit() {
        if (this.gameState !== 'playing') {
            this.updateMessageArea('lose', 'Cannot hit right now!');
            return;
        }
        
        if (this.deck.length === 0) {
            this.updateMessageArea('lose', 'No more cards in deck!');
            return;
        }
        
        this.playerCards.push(this.deck.pop());
        this.updateDisplay();
        
        const playerScore = this.getScore(this.playerCards);
        if (playerScore > 21) {
            this.gameState = 'finished';
            this.updateMessageArea('lose', 'Bust! You lose.');
            this.losses++;
            this.updateButtons();
            this.updateStats();
        } else if (playerScore === 21) {
            this.updateMessageArea('playing', '21! You must stand.');
            // Don't automatically stand, let player decide
        }
    }

    stand() {
        if (this.gameState !== 'playing') {
            this.updateMessageArea('lose', 'Cannot stand right now!');
            return;
        }
        
        this.gameState = 'dealer-turn';
        this.updateButtons();
        this.dealerPlay();
    }

    dealerPlay() {
        this.updateMessageArea('playing', 'Dealer is playing...');
        
        // Show dealer's hidden card
        this.updateDisplay(true);
        
        // Animate dealer's play with delays for better UX
        this.dealerPlayStep();
    }

    dealerPlayStep() {
        const dealerScore = this.getScore(this.dealerCards);
        
        // Dealer must hit on soft 17 (A + 6 = 17, but can hit)
        const shouldHit = dealerScore < 17 || (dealerScore === 17 && this.hasSoft17(this.dealerCards));
        
        if (shouldHit) {
            setTimeout(() => {
                this.dealerCards.push(this.deck.pop());
                this.updateDisplay(true);
                this.dealerPlayStep();
            }, 800);
        } else {
            setTimeout(() => {
                this.gameState = 'finished';
                this.determineWinner();
                this.updateButtons();
            }, 500);
        }
    }

    hasSoft17(cards) {
        let score = 0;
        let aces = 0;
        
        for (let card of cards) {
            if (card.value === 'A') {
                aces++;
                score += 11;
            } else if (['J', 'Q', 'K'].includes(card.value)) {
                score += 10;
            } else {
                score += parseInt(card.value);
            }
        }
        
        // Check if it's a soft 17 (contains an ace counted as 11)
        return score === 17 && aces > 0;
    }

    determineWinner() {
        const playerScore = this.getScore(this.playerCards);
        const dealerScore = this.getScore(this.dealerCards);
        
        if (dealerScore > 21) {
            this.updateMessageArea('win', 'Dealer busts! You win!');
            this.balance += this.currentBet * 2;
            this.wins++;
        } else if (playerScore > dealerScore) {
            this.updateMessageArea('win', 'You win!');
            this.balance += this.currentBet * 2;
            this.wins++;
        } else if (dealerScore > playerScore) {
            this.updateMessageArea('lose', 'Dealer wins!');
            this.losses++;
        } else {
            this.updateMessageArea('tie', 'Push! It\'s a tie.');
            this.balance += this.currentBet;
        }
        
        this.updateStats();
        this.updateDisplay(true); // Show all cards at the end
    }

    checkForBlackjack() {
        const playerScore = this.getScore(this.playerCards);
        const dealerScore = this.getScore(this.dealerCards);
        
        if (playerScore === 21 && dealerScore === 21) {
            this.gameState = 'finished';
            this.updateMessageArea('tie', 'Both have blackjack! Push!');
            this.balance += this.currentBet;
            this.updateButtons();
            this.updateStats();
        } else if (playerScore === 21) {
            this.gameState = 'finished';
            this.updateMessageArea('win', 'Blackjack! You win!');
            this.balance += Math.floor(this.currentBet * 2.5);
            this.wins++;
            this.updateButtons();
            this.updateStats();
        } else if (dealerScore === 21) {
            this.gameState = 'finished';
            this.updateMessageArea('lose', 'Dealer has blackjack! You lose.');
            this.losses++;
            this.updateButtons();
            this.updateStats();
        }
    }

    getScore(cards) {
        let score = 0;
        let aces = 0;
        
        for (let card of cards) {
            if (card.value === 'A') {
                aces++;
                score += 11;
            } else if (['J', 'Q', 'K'].includes(card.value)) {
                score += 10;
            } else {
                score += parseInt(card.value);
            }
        }
        
        // Adjust for aces
        while (score > 21 && aces > 0) {
            score -= 10;
            aces--;
        }
        
        return score;
    }

    updateDisplay(showDealerCard = false) {
        this.displayCards(this.playerCardsEl, this.playerCards, false);
        this.displayCards(this.dealerCardsEl, this.dealerCards, !showDealerCard);
        
        this.playerScoreEl.textContent = this.getScore(this.playerCards);
        
        if (showDealerCard || this.gameState === 'finished') {
            this.dealerScoreEl.textContent = this.getScore(this.dealerCards);
        } else if (this.dealerCards.length > 0) {
            // Show only the visible dealer card score (second card, not the hidden first card)
            const visibleDealerCards = this.dealerCards.slice(1);
            this.dealerScoreEl.textContent = this.getScore(visibleDealerCards);
        } else {
            this.dealerScoreEl.textContent = '0';
        }
    }

    displayCards(container, cards, hideFirst = false) {
        container.innerHTML = '';
        
        cards.forEach((card, index) => {
            const cardEl = document.createElement('div');
            cardEl.className = 'card';
            
            if (hideFirst && index === 0) {
                cardEl.innerHTML = '<div class="card-back">🂠</div>';
            } else {
                const suitColor = ['♥', '♦'].includes(card.suit) ? 'red' : 'black';
                cardEl.innerHTML = `
                    <div class="card-value ${suitColor}">${card.value}</div>
                    <div class="card-suit ${suitColor}">${card.suit}</div>
                `;
            }
            
            container.appendChild(cardEl);
        });
    }

    updateButtons() {
        switch (this.gameState) {
            case 'waiting':
                this.dealBtn.disabled = false;
                this.hitBtn.disabled = true;
                this.standBtn.disabled = true;
                this.newGameBtn.disabled = true;
                break;
            case 'playing':
                this.dealBtn.disabled = true;
                this.hitBtn.disabled = false;
                this.standBtn.disabled = false;
                this.newGameBtn.disabled = false;
                break;
            case 'dealer-turn':
                this.dealBtn.disabled = true;
                this.hitBtn.disabled = true;
                this.standBtn.disabled = true;
                this.newGameBtn.disabled = false;
                break;
            case 'finished':
                this.dealBtn.disabled = true;
                this.hitBtn.disabled = true;
                this.standBtn.disabled = true;
                this.newGameBtn.disabled = false;
                break;
        }
    }

    updateStats() {
        this.balanceEl.textContent = this.balance;
        this.winsEl.textContent = this.wins;
        this.lossesEl.textContent = this.losses;
    }

    newGame() {
        this.gameState = 'waiting';
        this.dealerCards = [];
        this.playerCards = [];
        this.currentBet = 0;
        this.placedChips = [];
        this.updateBetDisplay();
        this.updateMessageArea('waiting', 'Place your bet and click "Deal Cards" to start!');
        this.updateDisplay();
        this.updateButtons();
        
        if (this.balance < 10) {
            this.updateMessageArea('lose', 'Game over! You\'re out of money. Refresh to restart.');
            this.dealBtn.disabled = true;
        }
    }

    updateMessageArea(type, message) {
        // Remove all existing classes
        this.messageArea.classList.remove('win', 'lose', 'tie', 'playing', 'waiting');
        
        // Add the new class
        this.messageArea.classList.add(type);
        
        // Update the message text
        this.gameMessageEl.textContent = message;
    }

    // Chip management methods
    addChip(value) {
        if (this.gameState !== 'waiting') {
            this.updateMessageArea('lose', 'Cannot bet during game!');
            return;
        }
        
        if (this.currentBet + value > this.balance) {
            this.updateMessageArea('lose', 'Insufficient balance for that chip!');
            return;
        }
        
        this.currentBet += value;
        this.placedChips.push(value);
        this.updateBetDisplay();
    }
    
    removeLastChip() {
        if (this.placedChips.length === 0) return;
        
        const removedChip = this.placedChips.pop();
        this.currentBet -= removedChip;
        this.updateBetDisplay();
    }
    
    clearBet() {
        if (this.gameState !== 'waiting') {
            this.updateMessageArea('lose', 'Cannot clear bet during game!');
            return;
        }
        
        this.currentBet = 0;
        this.placedChips = [];
        this.updateBetDisplay();
    }
    
    allIn() {
        if (this.gameState !== 'waiting') {
            this.updateMessageArea('lose', 'Cannot bet during game!');
            return;
        }
        
        this.clearBet();
        this.currentBet = this.balance;
        this.placedChips = [this.balance];
        this.updateBetDisplay();
    }
    
    updateBetDisplay() {
        this.currentBetEl.textContent = `$${this.currentBet}`;
    }
    
    getChipColor(value) {
        const colors = {
            1: 'linear-gradient(135deg, #ef4444, #dc2626)',
            5: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            10: 'linear-gradient(135deg, #10b981, #059669)',
            25: 'linear-gradient(135deg, #f59e0b, #d97706)',
            50: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
            100: 'linear-gradient(135deg, #f97316, #ea580c)'
        };
        return colors[value] || 'linear-gradient(135deg, #6b7280, #4b5563)';
    }
}

// Initialize the game when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new BlackjackGame();
});
