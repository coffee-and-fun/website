const { createApp } = Vue;

createApp({
    data() {
        return {
            rotation: 0,
            result: '',
            glowing: false,
            flipCount: 0,
            headsCount: 0,
            tailsCount: 0,
            isFlipping: false
        };
    },
    
    computed: {
        canShare() {
            return navigator.share !== undefined || navigator.clipboard;
        },
        
        headsPercentage() {
            if (this.flipCount === 0) return 0;
            return Math.round((this.headsCount / this.flipCount) * 100);
        },
        
        tailsPercentage() {
            if (this.flipCount === 0) return 0;
            return Math.round((this.tailsCount / this.flipCount) * 100);
        }
    },
    
    methods: {
        flip() {
            if (this.isFlipping) return;
            
            this.isFlipping = true;
            this.result = '';
            this.glowing = true;
            
            // Add haptic feedback on mobile
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            // Random number of rotations (3-6 half turns)
            const flips = Math.floor(Math.random() * 4) + 3;
            this.rotation += flips * 180;
        },
        
        onTransitionEnd(event) {
            if (event.propertyName === 'transform' && this.isFlipping) {
                const isHeads = (this.rotation / 180) % 2 === 0;
                this.result = isHeads ? 'Heads!' : 'Tails!';
                
                // Update statistics
                this.flipCount++;
                if (isHeads) {
                    this.headsCount++;
                } else {
                    this.tailsCount++;
                }
                
                this.glowing = false;
                this.isFlipping = false;
                
                // Save stats to localStorage
                this.saveStats();
                
                // Optional: trigger confetti if available
                if (typeof launchConfetti === 'function') {
                    launchConfetti();
                }
            }
        },
        
        async shareResult() {
            const text = `I flipped a coin and got ${this.result}\n\n` +
                        `Stats: ${this.headsCount} heads, ${this.tailsCount} tails (${this.flipCount} total)\n\n` +
                        `Try it yourself at /flip/`;
            
            try {
                if (navigator.share) {
                    await navigator.share({
                        title: 'Coin Flip Result',
                        text: text
                    });
                } else if (navigator.clipboard) {
                    await navigator.clipboard.writeText(text);
                    alert('Result copied to clipboard!');
                }
            } catch (err) {
                console.error('Share failed:', err);
            }
        },
        
        resetStats() {
            this.flipCount = 0;
            this.headsCount = 0;
            this.tailsCount = 0;
            this.result = '';
            localStorage.removeItem('coinFlipStats');
        },
        
        saveStats() {
            const stats = {
                flipCount: this.flipCount,
                headsCount: this.headsCount,
                tailsCount: this.tailsCount
            };
            localStorage.setItem('coinFlipStats', JSON.stringify(stats));
        },
        
        loadStats() {
            try {
                const saved = localStorage.getItem('coinFlipStats');
                if (saved) {
                    const stats = JSON.parse(saved);
                    this.flipCount = stats.flipCount || 0;
                    this.headsCount = stats.headsCount || 0;
                    this.tailsCount = stats.tailsCount || 0;
                }
            } catch (err) {
                console.error('Failed to load stats:', err);
            }
        }
    },
    
    mounted() {
        // Load saved statistics
        this.loadStats();
        
        // Focus the coin for keyboard accessibility
        document.querySelector('.coin-inner').focus();
        
        // Add keyboard shortcut for flipping
        document.addEventListener('keydown', (e) => {
            if (e.key === 'f' && !e.ctrlKey && !e.metaKey) {
                this.flip();
            }
        });
    }
}).mount('#app');
