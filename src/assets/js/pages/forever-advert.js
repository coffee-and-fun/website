const { createApp } = Vue;

createApp({
    data() {
        return {
            scrollInterval: null,
            isScrolling: true,
            userScrolling: false,
            scrollSpeed: 30, // Pixels per second
            lastScrollTime: Date.now()
        };
    },
    
    mounted() {
        this.startScroll();
        this.addKeyboardShortcuts();
    },
    
    methods: {
        startScroll() {
            const container = this.$refs.scrollContainer;
            if (!container || this.scrollInterval) return;
            
            this.isScrolling = true;
            this.scrollInterval = setInterval(() => {
                if (!this.userScrolling && this.isScrolling) {
                    const maxScroll = container.scrollHeight - container.clientHeight;
                    
                    if (container.scrollTop >= maxScroll) {
                        // Loop back to top
                        container.scrollTop = 0;
                    } else {
                        // Smooth scroll down
                        container.scrollTop += 1;
                    }
                }
            }, 1000 / this.scrollSpeed);
        },
        
        pauseScroll() {
            this.userScrolling = true;
        },
        
        resumeScroll() {
            this.userScrolling = false;
        },
        
        stopScroll() {
            if (this.scrollInterval) {
                clearInterval(this.scrollInterval);
                this.scrollInterval = null;
            }
            this.isScrolling = false;
        },
        
        toggleAutoScroll() {
            if (this.isScrolling) {
                this.stopScroll();
            } else {
                this.startScroll();
            }
        },
        
        handleUserScroll() {
            // Detect manual scrolling
            const now = Date.now();
            if (now - this.lastScrollTime < 100) {
                this.userScrolling = true;
                setTimeout(() => {
                    this.userScrolling = false;
                }, 3000); // Resume after 3 seconds of inactivity
            }
            this.lastScrollTime = now;
        },
        
        scrollToTop() {
            const container = this.$refs.scrollContainer;
            if (container) {
                container.scrollTo({ top: 0, behavior: 'smooth' });
            }
        },
        
        addKeyboardShortcuts() {
            document.addEventListener('keydown', (e) => {
                if (e.key === ' ' && e.target === document.body) {
                    e.preventDefault();
                    this.toggleAutoScroll();
                } else if (e.key === 'Home') {
                    this.scrollToTop();
                }
            });
        }
    },
    
    beforeUnmount() {
        if (this.scrollInterval) {
            clearInterval(this.scrollInterval);
        }
    }
}).mount('#app');
