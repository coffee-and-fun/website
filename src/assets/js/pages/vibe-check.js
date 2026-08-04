const { createApp } = Vue;

        /* Day-of-year puzzle number, this exact formula is the public
           date→puzzle contract. Changing it would hand everyone a different
           puzzle and break saved games, so it stays byte-for-byte the same
           as it has always been. */
        function dayNumber() {
            const now = new Date();
            const start = new Date(now.getFullYear(), 0, 0);
            const diff = now - start;
            const oneDay = 1000 * 60 * 60 * 24;
            return Math.floor(diff / oneDay);
        }

        createApp({
            data() {
                return {
                    gameState: 'playing', // 'playing', 'won', 'lost'
                    attempts: 0,
                    maxAttempts: 4,
                    currentGuess: null,
                    feedback: null,
                    feedbackTimer: null,
                    copied: false,
                    copyFailed: false,
                    copyTimer: null,
                    announcement: '',
                    puzzleNumber: dayNumber(),

                    // Daily puzzles - indexed by day (order and content are part
                    // of the date→puzzle mapping; do not reorder).
                    puzzles: [
                        {
                            clues: ['☕', '😴', '🌅', '📰'],
                            answer: 'Morning Mood',
                            description: 'That cozy, sleepy feeling of waking up to a new day!',
                            options: ['Morning Mood', 'Party Time', 'Study Session', 'Adventure Awaits']
                        },
                        {
                            clues: ['🎉', '🪩', '🎶', '💃'],
                            answer: 'Party Time',
                            description: 'Time to dance, celebrate, and let loose!',
                            options: ['Lazy Sunday', 'Party Time', 'Deep Thoughts', 'Workout Energy']
                        },
                        {
                            clues: ['😌', '🛋️', '📺', '🍿'],
                            answer: 'Cozy Vibes',
                            description: 'Chillin\' at home, totally relaxed and comfy!',
                            options: ['Busy Bee', 'Cozy Vibes', 'Travel Bug', 'Social Butterfly']
                        },
                        {
                            clues: ['💪', '🏃', '🔥', '⚡'],
                            answer: 'Workout Energy',
                            description: 'Pumped up and ready to crush those fitness goals!',
                            options: ['Sleepy Time', 'Workout Energy', 'Foodie Feels', 'Chill Mode']
                        },
                        {
                            clues: ['📚', '🤓', '✍️', '💡'],
                            answer: 'Study Session',
                            description: 'Focused, motivated, and learning something new!',
                            options: ['Gaming Night', 'Study Session', 'Beach Day', 'Movie Marathon']
                        },
                        {
                            clues: ['🌈', '☀️', '🦋', '🌸'],
                            answer: 'Happy Vibes',
                            description: 'Everything is awesome and the sun is shining!',
                            options: ['Rainy Day Blues', 'Happy Vibes', 'Spooky Season', 'Winter Wonderland']
                        },
                        {
                            clues: ['🎮', '🕹️', '🏆', '👾'],
                            answer: 'Gaming Night',
                            description: 'Level up and game on till the break of dawn!',
                            options: ['Cooking Time', 'Gaming Night', 'Meditation Mode', 'Shopping Spree']
                        }
                    ]
                };
            },

            computed: {
                currentPuzzle() {
                    // Cycle through puzzles based on day
                    return this.puzzles[this.puzzleNumber % this.puzzles.length];
                },

                resultEmoji() {
                    if (this.attempts === 1) return '🏆';
                    if (this.attempts === 2) return '🌟';
                    if (this.attempts === 3) return '✨';
                    return '💫';
                },

                shareBlocks() {
                    return '🟪'.repeat(this.attempts) + '⬜'.repeat(this.maxAttempts - this.attempts);
                },

                shareText() {
                    const statusEmoji = this.gameState === 'won' ? '✅' : '❌';

                    return `VIBE CHECK ✨ #${this.puzzleNumber}

${statusEmoji} ${this.attempts}/${this.maxAttempts}

${this.shareBlocks}

Can you guess today's vibe?
coffeeandfun.com/vibe-check`;
                }
            },

            mounted() {
                this.loadGameState();
                this.checkIfNewDay();
            },

            methods: {
                announce(msg) {
                    this.announcement = '';
                    this.$nextTick(() => { this.announcement = msg; });
                },

                isWrong(option) {
                    return this.currentGuess === option && option !== this.currentPuzzle.answer;
                },

                makeGuess(option) {
                    if (this.gameState !== 'playing') return;

                    this.currentGuess = option;
                    this.attempts++;

                    if (option === this.currentPuzzle.answer) {
                        if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
                        this.feedback = null;
                        this.gameState = 'won';
                        this.saveGameState();
                        this.announce('You got it! The vibe was ' + this.currentPuzzle.answer +
                            '. Solved in ' + this.attempts + ' of ' + this.maxAttempts + ' tries.');
                        this.showConfetti();
                    } else {
                        if (this.attempts >= this.maxAttempts) {
                            this.gameState = 'lost';
                            this.feedback = {
                                type: 'wrong',
                                message: 'Out of tries! 😢'
                            };
                            this.saveGameState();
                            this.announce('Out of tries. The answer was ' + this.currentPuzzle.answer + '.');
                        } else {
                            this.feedback = {
                                type: 'wrong',
                                message: 'Not quite! Try again! 🤔'
                            };
                            this.announce('Not quite, ' + option + ' isn’t it. ' +
                                (this.maxAttempts - this.attempts) + ' ' +
                                ((this.maxAttempts - this.attempts) === 1 ? 'try' : 'tries') + ' left.');
                            if (this.feedbackTimer) clearTimeout(this.feedbackTimer);
                            this.feedbackTimer = setTimeout(() => {
                                this.feedback = null;
                            }, 2000);
                        }
                    }
                },

                markCopied() {
                    this.copied = true;
                    this.copyFailed = false;
                    this.announce('Result copied to clipboard.');
                    if (this.copyTimer) clearTimeout(this.copyTimer);
                    this.copyTimer = setTimeout(() => { this.copied = false; }, 2000);
                },

                async shareResults() {
                    const text = this.shareText;
                    try {
                        await Promise.race([
                            navigator.clipboard.writeText(text),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 1500))
                        ]);
                        this.markCopied();
                    } catch {
                        // Fallback: show the share text on the page, pre-selected.
                        this.copyFailed = true;
                        this.announce('Copy didn’t work. Your result is shown below, press Control C or Command C.');
                        this.$nextTick(() => {
                            const pre = this.$refs.sharePre;
                            if (pre && window.getSelection) {
                                const range = document.createRange();
                                range.selectNodeContents(pre);
                                const sel = window.getSelection();
                                sel.removeAllRanges();
                                sel.addRange(range);
                            }
                        });
                    }
                },

                showConfetti() {
                    // Celebration stays, but never for people who asked for less motion.
                    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
                    const bits = ['✨', '🎉', '💫', '🌟', '💜'];
                    for (let i = 0; i < 40; i++) {
                        setTimeout(() => {
                            const bit = document.createElement('span');
                            bit.className = 'confetti-bit';
                            bit.setAttribute('aria-hidden', 'true');
                            bit.textContent = bits[Math.floor(Math.random() * bits.length)];
                            bit.style.left = Math.random() * 100 + 'vw';
                            bit.style.fontSize = (0.8 + Math.random() * 1.2) + 'rem';
                            bit.style.animationDuration = (2.2 + Math.random() * 1.6) + 's';
                            document.body.appendChild(bit);
                            setTimeout(() => bit.remove(), 4200);
                        }, i * 35);
                    }
                },

                saveGameState() {
                    const state = {
                        puzzleNumber: this.puzzleNumber,
                        gameState: this.gameState,
                        attempts: this.attempts,
                        currentGuess: this.currentGuess
                    };
                    localStorage.setItem('vibeCheckGame', JSON.stringify(state));
                },

                loadGameState() {
                    let saved = null;
                    try {
                        saved = localStorage.getItem('vibeCheckGame');
                    } catch { return; }
                    if (saved) {
                        let state;
                        try {
                            state = JSON.parse(saved);
                        } catch { return; }
                        // Only load if it's today's puzzle
                        if (state && state.puzzleNumber === this.puzzleNumber) {
                            this.gameState = state.gameState;
                            this.attempts = state.attempts;
                            this.currentGuess = state.currentGuess;
                        }
                    }
                },

                checkIfNewDay() {
                    // Check every minute if it's a new day
                    setInterval(() => {
                        const today = dayNumber();
                        if (today !== this.puzzleNumber) {
                            // New day! Reset game
                            this.resetGame();
                            this.puzzleNumber = today;
                            this.announce('It’s a new day, a fresh vibe puzzle is ready.');
                        }
                    }, 60000);
                },

                resetGame() {
                    this.gameState = 'playing';
                    this.attempts = 0;
                    this.currentGuess = null;
                    this.feedback = null;
                    this.copied = false;
                    this.copyFailed = false;
                    try { localStorage.removeItem('vibeCheckGame'); } catch { /* ignore */ }
                }
            }
        }).mount('#app');
