if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  });
}

// Performance monitoring
window.addEventListener("load", () => {
  if ("performance" in window) {
    const navigation = performance.getEntriesByType("navigation")[0];
    console.log(
      "📊 Page Load Time:",
      navigation.loadEventEnd - navigation.fetchStart,
      "ms",
    );

    if ("web-vital" in window) {
      console.log("📈 Core Web Vitals tracking enabled");
    }
  }
});


window.addEventListener("error", (event) => {
  console.error("Global error:", event.error);
  showErrorBoundary();
});

window.addEventListener("unhandledrejection", (event) => {
  console.error("Unhandled promise rejection:", event.reason);
  showErrorBoundary();
});

function showErrorBoundary() {
  document.getElementById("error-boundary").style.display = "flex";
  document.getElementById("app").style.display = "none";
}

   
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const throttle = (func, limit) => {
  let inThrottle;
  return function () {
    const args = arguments;
    const context = this;
    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};


document.addEventListener("DOMContentLoaded", () => {
  if (typeof Vue === "undefined") {
    setTimeout(() => {
      if (typeof Vue === "undefined") {
        showErrorBoundary();
        return;
      }
      initializeApp();
    }, 1000);
  } else {
    initializeApp();
  }
});

function initializeApp() {
  const { createApp } = Vue;

  const app = createApp({
    data() {
      return {
  
        gameMode: "offline",
        isAIMode: false,
        aiDifficulty: "random",
        aiPlayer: "O",
        aiThinking: false,
        aiPersonality: null,
        aiMoveTimeout: null,

        aiSkills: {
          strategicThinking: 0.5,
          powerUpTiming: 0.5,
          defensivePlay: 0.5,
          riskTaking: 0.5,
          adaptability: 0.5,
        },

        // AI thinking delay ranges
        aiDelayRanges: {
          easy: [800, 1500],
          medium: [1200, 2500],
          hard: [1500, 3000],
          random: [800, 3000],
        },
        cells: Array(16).fill(null),
        gridRows: 4,
        isExpanding: false,
        moveHistory: [],
        isShaking: false,
        currentPlayer: "X",
        winner: null,
        isDraw: false,
        winningCombo: [],
        score: { X: 0, O: 0 },
        emojiThemes: [
          { X: "❌", O: "⭕" },
          { X: "🐶", O: "🐱" },
          { X: "🍕", O: "🍔" },
          { X: "🦄", O: "🐉" },
          { X: "🌟", O: "🌙" },
          { X: "🔥", O: "❄️" },
        ],
        themeIndex: 0,
        peer: null,
        conn: null,
        peerId: "",
        peerIdToConnect: "",
        isHost: false,

        swapSelection: [],
        showRemoveMode: false,
        squareEffects: Array(24).fill(false),

        shieldedSquares: Array(24).fill(false),
        slideSelection: [],
        teleportSelection: [],
        slideMode: "select",

        // Additional state for improved UX
        isLoading: false,
        gameAnnouncement: "",
        focusedCellIndex: 0,

        powerUpCategories: {
          gameChanging: ["teleport", "remove", "expand"],
          tactical: ["slide", "swap", "themeSwitch"], // ADD themeSwitch here
          defensive: ["shield", "undo"],
        },

        // Each player gets 3 power-ups (1 from each category)
        playerPowerUps: {
          X: [],
          O: [],
        },

        // Track which power-ups have been used
        usedRandomPowerUps: {
          X: [],
          O: [],
        },
        _processingPlayerChange: false,
      };
    },

    computed: {
      opponentPowerUps() {
        const opponent = this.currentPlayer === "X" ? "O" : "X";
        return this.playerPowerUps[opponent] || [];
      },

      opponentUsedPowerUps() {
        const opponent = this.currentPlayer === "X" ? "O" : "X";
        return this.usedRandomPowerUps[opponent] || [];
      },
      aiShouldMove() {
        return (
          this.gameMode === "ai" &&
          this.currentPlayer === this.aiPlayer &&
          !this.gameOver
        );
      },

      isPlayerTurn() {
        return (
          this.gameMode !== "ai" || this.currentPlayer !== this.aiPlayer
        );
      },

      isMultiplayer() {
        return this.gameMode === "multiplayer" && this.conn !== null;
      },

      gameStatusText() {
        switch (this.gameMode) {
          case "offline":
            return "Local Play";
          case "ai":
            return `vs AI (${this.getAIDifficultyName()})`;
          case "multiplayer":
            return this.conn ? "Online Multiplayer" : "Connecting...";
          default:
            return "Game";
        }
      },
      emojiSet() {
        return this.emojiThemes[this.themeIndex];
      },
      // FIXED: Update the isMyTurn computed property
      isMyTurn() {
        console.log("Checking isMyTurn:", {
          gameMode: this.gameMode,
          currentPlayer: this.currentPlayer,
          isHost: this.isHost,
          connOpen: this.conn?.open,
          aiThinking: this.aiThinking,
        });

        if (this.gameMode === "ai") {
          return this.currentPlayer === "X" && !this.aiThinking;
        }

        if (this.gameMode === "multiplayer") {
          // Must have active connection
          if (!this.conn || !this.conn.open) {
            console.log("No active connection");
            return false;
          }

          // Host (X) can play when it's X's turn
          // Guest (O) can play when it's O's turn
          const canPlay =
            (this.isHost && this.currentPlayer === "X") ||
            (!this.isHost && this.currentPlayer === "O");

          console.log("Multiplayer turn check:", {
            canPlay,
            isHost: this.isHost,
            currentPlayer: this.currentPlayer,
          });
          return canPlay;
        }

        // Offline mode - always allow moves
        return true;
      },

      gameOver() {
        return this.winner || this.isDraw;
      },
      getSlideDestinations() {
        if (this.slideSelection.length !== 1) return [];

        const selectedIndex = this.slideSelection[0];
        if (this.cells[selectedIndex] !== this.currentPlayer) return [];

        const row = Math.floor(selectedIndex / 4);
        const col = selectedIndex % 4;
        const destinations = [];

        const directions = [
          [-1, -1],
          [-1, 0],
          [-1, 1],
          [0, -1],
          [0, 1],
          [1, -1],
          [1, 0],
          [1, 1],
        ];

        directions.forEach(([deltaRow, deltaCol]) => {
          const newRow = row + deltaRow;
          const newCol = col + deltaCol;
          const newIndex = newRow * 4 + newCol;

          if (
            newRow >= 0 &&
            newRow < this.gridRows &&
            newCol >= 0 &&
            newCol < 4 &&
            newIndex >= 0 &&
            newIndex < this.cells.length &&
            this.cells[newIndex] === null
          ) {
            destinations.push(newIndex);
          }
        });

        return destinations;
      },
    },

    watch: {
      currentPlayer: {
        handler(newPlayer, oldPlayer) {
          console.log(
            "Current player changed from",
            oldPlayer,
            "to",
            newPlayer,
          );

          if (newPlayer === oldPlayer || this.gameOver) return;

          this.$nextTick(() => {
            if (
              this.gameMode === "ai" &&
              newPlayer === this.aiPlayer &&
              !this.aiThinking
            ) {
              console.log("Watcher triggering AI move...");
              this.makeAIMove();
            }
          });
        },
        immediate: false,
      },

      isMyTurn(newVal) {
        if (
          newVal &&
          !this.winner &&
          !this.isDraw &&
          this.isMultiplayer
        ) {
          this.toaster("🎯 Your turn!", "info", 2000);
        }
      },
      score: {
        handler(val) {
          localStorage.setItem("tictactoe-score", JSON.stringify(val));
        },
        deep: true,
      },
    },

    methods: {
      debugCellsState() {
        console.log("=== CELLS STATE DEBUG ===");
        console.log("Cells array:", JSON.stringify(this.cells));
        console.log("Current player:", this.currentPlayer);
        console.log("AI player:", this.aiPlayer);
        console.log("AI thinking:", this.aiThinking);
        console.log("========================");

        // Force update to ensure reactivity
        this.$forceUpdate();
      },
      debugAIState() {
        console.log("=== AI DEBUG STATE ===");
        console.log("Game Mode:", this.gameMode);
        console.log("Current Player:", this.currentPlayer);
        console.log("AI Player:", this.aiPlayer);
        console.log("AI Thinking:", this.aiThinking);
        console.log("AI Should Move:", this.aiShouldMove);
        console.log("Game Over:", this.gameOver);
        console.log("Can AI Make Move:", this.canAIMakeMove());
        console.log("===================");
      },
      debugMultiplayerState() {
        console.log("=== MULTIPLAYER DEBUG ===");
        console.log("Game Mode:", this.gameMode);
        console.log("Is Host:", this.isHost);
        console.log("Current Player:", this.currentPlayer);
        console.log("Connection exists:", !!this.conn);
        console.log("Connection open:", this.conn?.open);
        console.log("Is My Turn:", this.isMyTurn);
        console.log("Can Make Move at 0:", this.canMakeMoveAtIndex(0));
        console.log("========================");
      },
      generateBalancedPowerUps() {
        // Shuffle each category
        const shuffledGameChanging = [
          ...this.powerUpCategories.gameChanging,
        ].sort(() => Math.random() - 0.5);
        const shuffledTactical = [
          ...this.powerUpCategories.tactical,
        ].sort(() => Math.random() - 0.5);
        const shuffledDefensive = [
          ...this.powerUpCategories.defensive,
        ].sort(() => Math.random() - 0.5);

        // Each player gets 3 power-ups (1 from each category)
        this.playerPowerUps.X = [
          shuffledGameChanging[0],
          shuffledTactical[0],
          shuffledDefensive[0],
        ];

        this.playerPowerUps.O = [
          shuffledGameChanging[1] || shuffledGameChanging[0],
          shuffledTactical[1] || shuffledTactical[0],
          shuffledDefensive[1] || shuffledDefensive[0],
        ];

        // Initialize used arrays
        this.usedRandomPowerUps.X = this.usedRandomPowerUps.X || [];
        this.usedRandomPowerUps.O = this.usedRandomPowerUps.O || [];

        console.log("Power-ups assigned:");
        console.log("Player X:", this.playerPowerUps.X);
        console.log("Player O:", this.playerPowerUps.O);

        // Only show preview in offline mode
        if (this.gameMode === "offline") {
          this.showPowerUpPreview();
        }
      },

      // Add these methods to your methods object:
      // Show theme switch modal
      showThemeSwitchModal() {
        try {
          document.getElementById("theme-switch-modal").showModal();
        } catch (error) {
          this.handleError("Show theme switch modal", error);
        }
      },

      // Show what power-ups each player has
      showPowerUpPreview() {
        const xPowerUps = this.playerPowerUps.X.map(
          (p) => this.getPowerUpInfo(p).name,
        ).join(", ");
        const oPowerUps = this.playerPowerUps.O.map(
          (p) => this.getPowerUpInfo(p).name,
        ).join(", ");

        this.toaster(`Player X power-ups: ${xPowerUps}`, "info", 5000);
        setTimeout(() => {
          this.toaster(`Player O power-ups: ${oPowerUps}`, "info", 5000);
        }, 1500);
      },
      switchToTheme(themeIndex) {
        try {
          // Check if theme switch was assigned to this player
          if (
            !this.playerPowerUps[this.currentPlayer].includes(
              "themeSwitch",
            )
          ) {
            this.toaster(
              "Theme switch power-up not available!",
              "warning",
            );
            return;
          }

          if (
            this.usedRandomPowerUps[this.currentPlayer].includes(
              "themeSwitch",
            )
          ) {
            this.toaster(
              "You've already switched themes this game!",
              "warning",
            );
            return;
          }

          if (themeIndex === this.themeIndex) {
            this.toaster("This theme is already active!", "info");
            return;
          }

          const oldTheme = this.emojiThemes[this.themeIndex];
          this.themeIndex = themeIndex;
          const newTheme = this.emojiThemes[this.themeIndex];

          this.usedRandomPowerUps[this.currentPlayer].push("themeSwitch");
          document.getElementById("theme-switch-modal").close();

          this.toaster(
            `${this.getEmoji(this.currentPlayer)} switched theme to ${newTheme.X} vs ${newTheme.O}!`,
            "info",
            3000,
          );

          if (!this.winner && !this.isDraw) {
            //  this.switchTurn();
          }

          if (this.conn && this.conn.open) {
            this.conn.send({
              type: "themeSwitch",
              themeIndex: this.themeIndex,
              currentPlayer: this.currentPlayer,
              usedRandomPowerUps: { ...this.usedRandomPowerUps },
            });
          }
        } catch (error) {
          this.handleError("Switch theme", error);
        }
      },
      showRemovePowerModal() {
        if (
          this.usedRandomPowerUps[this.currentPlayer].includes("remove")
        ) {
          return this.toaster("You've already used Remove!", "warning");
        }
        document.getElementById("remove-modal").showModal();
      },
      // Get theme display name
      getThemeName(index) {
        const names = [
          "Classic",
          "Pets",
          "Food",
          "Fantasy",
          "Space",
          "Elements",
        ];
        return names[index] || `Theme ${index + 1}`;
      },

      toggleEmojiTheme() {
        if (
          this.usedRandomPowerUps[this.currentPlayer].includes(
            "themeSwitch",
          )
        ) {
          this.toaster(
            "You've already switched themes this game!",
            "warning",
          );
          return;
        }

        const nextIndex = (this.themeIndex + 1) % this.emojiThemes.length;
        this.switchToTheme(nextIndex);
      },

      // Random power-up modal
      showRandomPowerModal() {
        try {
          document.getElementById("random-power-modal").showModal();
        } catch (error) {
          this.handleError("Show random power modal", error);
        }
      },

      // Use one of the player's assigned power-ups
      useRandomPowerUp(powerUpType) {
        try {
          if (
            !this.playerPowerUps[this.currentPlayer].includes(powerUpType)
          )
            return;
          if (
            this.usedRandomPowerUps[this.currentPlayer].includes(
              powerUpType,
            )
          )
            return;

          // Mark this power-up as used
          this.usedRandomPowerUps[this.currentPlayer].push(powerUpType);

          document.getElementById("random-power-modal").close();

          this.toaster(
            `${this.getEmoji(this.currentPlayer)} activated ${this.getPowerUpInfo(powerUpType).name}!`,
            "warning",
            2000,
          );

          // Execute the power-up
          this.executeRandomPowerUp(powerUpType);

          if (this.conn && this.conn.open) {
            this.conn.send({
              type: "randomPowerUp",
              powerUpType: powerUpType,
              currentPlayer: this.currentPlayer,
              usedRandomPowerUps: { ...this.usedRandomPowerUps },
            });
          }
        } catch (error) {
          this.handleError("Use random power-up", error);
        }
      },

      executeRandomPowerUp(powerUpType) {
        switch (powerUpType) {
          case "undo":
            this.undoMove();
            break;
          case "remove":
            this.showRemovePowerModal();
            break;
          case "swap":
            this.showSwapPowerModal();
            break;
          case "expand":
            this.expandGrid();
            break;
          case "slide":
            this.showSlidePowerModal();
            break;
          case "shield":
            this.showShieldPowerModal();
            break;
          case "teleport":
            this.showTeleportPowerModal();
            break;
          case "themeSwitch":
            if (
              !this.playerPowerUps[this.currentPlayer].includes(
                "themeSwitch",
              )
            ) {
              this.toaster(
                "Theme switch power-up not available!",
                "warning",
              );
              return;
            }
            this.showThemeSwitchModal();
            break;
          default:
            console.warn("Unknown power-up type:", powerUpType);
        }
      },

      getPowerUpInfo(powerUpType) {
        const info = {
          undo: { icon: "↶", name: "Undo", color: "btn-secondary" },
          remove: { icon: "🗑️", name: "Remove", color: "btn-neutral" },
          swap: { icon: "🔄", name: "Swap", color: "btn-info" },
          expand: { icon: "📏", name: "Expand", color: "btn-warning" },
          slide: { icon: "➡️", name: "Slide", color: "btn-accent" },
          shield: { icon: "🛡️", name: "Shield", color: "btn-success" },
          teleport: { icon: "🚀", name: "Teleport", color: "btn-error" },
          themeSwitch: {
            icon: "🎨",
            name: "Theme Switch",
            color: "btn-primary",
          },
        };
        return (
          info[powerUpType] || {
            icon: "❓",
            name: "Unknown",
            color: "btn-ghost",
          }
        );
      },

      // Check if random power-up is available
      isRandomPowerUpDisabled(powerUpType) {
        // Check if this power-up is available to current player
        if (
          !this.playerPowerUps[this.currentPlayer].includes(powerUpType)
        )
          return true;

        // Check if already used
        if (
          this.usedRandomPowerUps[this.currentPlayer].includes(
            powerUpType,
          )
        )
          return true;

        // Use existing logic for specific power-up constraints
        return this.isPowerUpDisabled(powerUpType);
      },

      // Get available random power-ups for current player
      getAvailableRandomPowerUps() {
        return this.playerPowerUps[this.currentPlayer].filter(
          (powerUp) =>
            !this.usedRandomPowerUps[this.currentPlayer].includes(
              powerUp,
            ) && !this.isPowerUpDisabled(powerUp),
        );
      },

      createGame() {
        console.log("Creating new multiplayer game...");

        // Clean up any existing peer connection
        if (this.peer) {
          try {
            this.peer.destroy();
          } catch (error) {
            console.warn("Error destroying existing peer:", error);
          }
          this.peer = null;
        }

        // Reset connection state
        this.isHost = true;
        this.conn = null;
        this.peerId = "";

        // Create new peer with enhanced configuration
        this.peer = new Peer({
          debug: 1, // Reduced debug level
          config: {
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:global.stun.twilio.com:3478" },
              { urls: "stun:stun1.l.google.com:19302" },
            ],
          },
        });

        // Set up peer event handlers
        this.peer.on("open", (id) => {
          this.peerId = id;
          console.log("Game created with ID:", id);

          // Update URL with game ID
          try {
            const url = new URL(window.location);
            url.searchParams.set("gameId", id);
            window.history.pushState({}, document.title, url.toString());
          } catch (error) {
            console.warn("Failed to update URL:", error);
          }

          this.toaster(
            "Game created! Share the invite link below.",
            "success",
            4000,
          );
        });

        // In the peer.on("connection") handler, add this:
        this.peer.on("connection", (incomingConn) => {
          console.log("Incoming connection from:", incomingConn.peer);

          incomingConn.on("open", () => {
            this.conn = incomingConn;
            this.setupConnection();

            // FIXED: Send complete game state immediately
            setTimeout(() => {
              this.sendGameSync();
            }, 500);

            this.toaster(
              "Player joined the game! You are X, they are O.",
              "success",
              4000,
            );

            const modal = document.getElementById("multiplayer-modal");
            if (modal && modal.open) {
              modal.close();
            }
          });
        });

        // Handle peer errors
        this.peer.on("error", (err) => {
          console.error("Peer creation error:", err);
          this.handleConnectionFailure(
            "Failed to create game: " + (err.message || "Unknown error"),
            err,
          );
        });

        // Handle peer disconnection
        this.peer.on("disconnected", () => {
          console.log("Peer disconnected from signaling server");

          if (this.peer && !this.peer.destroyed) {
            console.log("Attempting to reconnect to signaling server...");
            this.peer.reconnect();
          }
        });
      },
  
      isPowerUpDisabled(powerUpType) {
        if (this.gameOver) return true;

        // Check turn permissions - power-ups can only be used on your turn
        switch (this.gameMode) {
          case "offline":
            // In offline mode, current player can always use power-ups
            break;
          case "ai":
            // In AI mode, only human player (X) can use power-ups, and not during AI thinking
            if (this.currentPlayer !== "X") return true;
            break;
          case "multiplayer":
            // In multiplayer, only use power-ups on your turn
            if (!this.isMyTurn) return true;
            break;
          default:
            return true;
        }

        // Check if this power-up was assigned to the current player
        if (
          !this.playerPowerUps[this.currentPlayer] ||
          !this.playerPowerUps[this.currentPlayer].includes(powerUpType)
        ) {
          return true;
        }

        // Check if already used
        if (
          this.usedRandomPowerUps[this.currentPlayer] &&
          this.usedRandomPowerUps[this.currentPlayer].includes(
            powerUpType,
          )
        ) {
          return true;
        }

        // Specific constraints for each power-up
        switch (powerUpType) {
          case "undo":
            return this.moveHistory.length === 0;
          case "swap":
            return this.cells.filter((cell) => cell !== null).length < 2;
          case "remove":
            if (this.isMultiplayer) {
              const opponent = this.currentPlayer === "X" ? "O" : "X";
              return !this.cells.some((cell) => cell === opponent);
            } else {
              return !this.cells.some((cell) => cell !== null);
            }
          case "expand":
            return this.gridRows === 6;
          case "slide":
            return !this.cells.some((cell, index) => {
              if (cell !== this.currentPlayer) return false;
              return this.getValidSlideCount(index) > 0;
            });
          case "shield":
            return !this.cells.some(
              (cell) => cell === this.currentPlayer,
            );
          case "teleport":
            return (
              !this.cells.some((cell) => cell === this.currentPlayer) ||
              this.cells.filter((cell) => cell === null).length === 0
            );
          case "themeSwitch":
            return false; // Will be handled by the assignment check above
          default:
            return false;
        }
      },
      usePowerUp(powerUpType) {
        try {
          if (this.isPowerUpDisabled(powerUpType)) {
            this.toaster("Power-up not available!", "warning");
            return;
          }

          if (this.gameOver) {
            this.toaster(
              "Cannot use power-ups after game ends!",
              "warning",
            );
            return;
          }

          // Only push immediately for power-ups that don’t require a second click
          const delayed = [
            "undo",
            "themeSwitch",
            "shield",
            "expand",
            "remove",
            "swap",
            "slide",
            "teleport",
          ];
          if (!delayed.includes(powerUpType)) {
            this.usedRandomPowerUps[this.currentPlayer].push(powerUpType);
          }

          // Notify opponent instantly
          if (this.conn?.open) {
            this.conn.send({
              type: "powerUpUsed",
              powerUpType: powerUpType,
              by: this.currentPlayer, // optional, but can help if you want “X used…” vs “O used…”
            });
          }

          this.executeRandomPowerUp(powerUpType);
        } catch (error) {
          // If error occurs, rollback the mark
          const idx =
            this.usedRandomPowerUps[this.currentPlayer].indexOf(
              powerUpType,
            );
          if (idx > -1)
            this.usedRandomPowerUps[this.currentPlayer].splice(idx, 1);
          this.handleError("Use power-up", error);
        }
      },
      // FIXED: Update canMakeMoveAtIndex for clarity
      canMakeMoveAtIndex(index) {
        // Can't place on occupied cell or if game is over
        if (this.cells[index] || this.gameOver) return false;

        // Check turn permissions based on game mode
        switch (this.gameMode) {
          case "offline":
            return true; // Both players can play locally
          case "ai":
            // Human can only move on their turn, AI moves programmatically
            if (this.currentPlayer === "X" && !this.aiThinking)
              return true;
            if (this.currentPlayer === "O" && this.aiThinking)
              return false; // Prevent manual moves during AI turn
            return false;
          case "multiplayer":
            return this.isMyTurn; // Only on your turn
          default:
            return false;
        }
      },
      // FIXED: Add a debug method to check power-up states
      debugPowerUpState() {
        console.log("=== Power-Up Debug ===");
        console.log("Current Player:", this.currentPlayer);
        console.log("Game Mode:", this.gameMode);
        console.log("Is My Turn:", this.isMyTurn);
        console.log("Player X Power-Ups:", this.playerPowerUps.X);
        console.log("Player O Power-Ups:", this.playerPowerUps.O);
        console.log("Player X Used:", this.usedRandomPowerUps.X);
        console.log("Player O Used:", this.usedRandomPowerUps.O);
        console.log("===================");
      },

      toggleAI() {
        if (this.gameMode === "ai") {
          this.setGameMode("offline");
        } else {
          this.setGameMode("ai");
        }
      },
      setGameMode(mode) {
        console.log(`Switching from ${this.gameMode} to ${mode}`);

        // Store current state to avoid unnecessary resets
        const wasMultiplayer = this.gameMode === "multiplayer";
        const wasConnected = this.conn && this.conn.open;

        // Clean up previous mode without resetting game
        this.cleanupCurrentMode();

        // Set new mode
        this.gameMode = mode;

        switch (mode) {
          case "offline":
            this.setupOfflineMode();
            break;
          case "ai":
            this.setupAIMode();
            break;
          case "multiplayer":
            this.setupMultiplayerMode();
            break;
        }

        // Always reset the game when switching modes
        this.resetGame(false);
      },
      cleanupCurrentMode() {
        // Store peerIdToConnect if we're trying to join a game
        const preservePeerIdToConnect =
          this.peerIdToConnect && !this.isHost;

        // Clear any pending AI timeouts
        if (this.aiMoveTimeout) {
          clearTimeout(this.aiMoveTimeout);
          this.aiMoveTimeout = null;
        }

        // Stop AI if running
        if (this.gameMode === "ai") {
          this.aiThinking = false;
          this.aiPersonality = null;
        }

        // Disconnect multiplayer if connected
        if (this.gameMode === "multiplayer" && this.conn) {
          this.conn.close();
          this.conn = null;
        }

        if (this.peer) {
          this.peer.destroy();
          this.peer = null;
        }

        // Only clear peer IDs if we're not trying to join
        if (!preservePeerIdToConnect) {
          this.peerId = "";
          this.peerIdToConnect = "";
        }

        this.cleanUrl();
      },

      // Update setupOfflineMode, setupAIMode, setupMultiplayerMode methods
      setupOfflineMode() {
        this.isAIMode = false;
        this.generateBalancedPowerUps(); // Add this line
        this.toaster(
          "👥 Local play mode - pass the device!",
          "info",
          2000,
        );
      },

      setupAIMode() {
        console.log("Setting up AI mode...");
        this.isAIMode = true;
        this.aiPlayer = "O";
        this.aiThinking = false;
        this.generateAIPersonality();
        this.generateBalancedPowerUps();

        console.log("AI mode setup complete:");
        console.log("- AI is player:", this.aiPlayer);
        console.log("- Current player after setup:", this.currentPlayer);
        console.log("- AI should move:", this.aiShouldMove);

        this.toaster(
          `🤖 AI opponent ready! Difficulty: ${this.getAIDifficultyName()}`,
          "success",
          3000,
        );

        // If it's AI's turn immediately, trigger move
        if (this.currentPlayer === this.aiPlayer) {
          console.log("AI needs to move immediately after setup");
          setTimeout(() => {
            console.log("Triggering initial AI move...");
            this.debugAIState();
            this.makeAIMove();
          }, 1000);
        }
      },
      setupMultiplayerMode() {
        this.isAIMode = false;
        if (!this.peerIdToConnect) {
          this.showMultiplayerModal();
        }
      },
      startAIGame() {
        this.setGameMode("ai");

        // Close multiplayer modal if open
        const modal = document.getElementById("multiplayer-modal");
        if (modal && modal.open) {
          modal.close();
        }
      },

      stopAIGame() {
        this.setGameMode("offline");
      },

      setAIDifficulty(difficulty) {
        this.aiDifficulty = difficulty;
        if (this.gameMode === "ai") {
          this.generateAIPersonality();
          this.toaster(
            `🎯 AI difficulty set to ${this.getAIDifficultyName()}`,
            "info",
            2000,
          );
        }
      },

      generateAIPersonality() {
        // Randomize AI skills for this game
        const skillVariation = 0.4; // How much skills can vary

        if (this.aiDifficulty === "random") {
          // Completely random personality
          this.aiSkills = {
            strategicThinking: Math.random(),
            powerUpTiming: Math.random(),
            defensivePlay: Math.random(),
            riskTaking: Math.random(),
            adaptability: Math.random(),
          };
        } else {
          // Base skills on difficulty with some randomization
          const baseSkills = {
            easy: 0.3,
            medium: 0.6,
            hard: 0.8,
          };

          const base = baseSkills[this.aiDifficulty] || 0.5;

          Object.keys(this.aiSkills).forEach((skill) => {
            this.aiSkills[skill] = Math.max(
              0.1,
              Math.min(
                0.9,
                base + (Math.random() - 0.5) * skillVariation,
              ),
            );
          });
        }

        // Generate personality description
        this.aiPersonality = this.generatePersonalityDescription();
        console.log("AI Personality:", this.aiPersonality);
      },
      generatePersonalityDescription() {
        const traits = [];

        if (this.aiSkills.strategicThinking > 0.7)
          traits.push("Strategic");
        else if (this.aiSkills.strategicThinking < 0.3)
          traits.push("Impulsive");

        if (this.aiSkills.defensivePlay > 0.7) traits.push("Defensive");
        else if (this.aiSkills.defensivePlay < 0.3)
          traits.push("Aggressive");

        if (this.aiSkills.riskTaking > 0.7) traits.push("Bold");
        else if (this.aiSkills.riskTaking < 0.3) traits.push("Cautious");

        if (this.aiSkills.powerUpTiming > 0.7) traits.push("Tactical");

        return traits.join(", ") || "Balanced";
      },

      getAIDifficultyName() {
        const names = {
          easy: "Novice",
          medium: "Skilled",
          hard: "Expert",
          random: "Unpredictable",
        };
        return names[this.aiDifficulty] || "Unknown";
      },

      makeAIMove() {
        console.log("=== AI MOVE START ===");
        this.debugAIState();

        if (!this.aiShouldMove || this.aiThinking || this.gameOver) {
          console.log("AI move blocked:", {
            aiShouldMove: this.aiShouldMove,
            aiThinking: this.aiThinking,
            gameOver: this.gameOver,
          });
          return;
        }

        // Check if there are actually empty squares
        const emptySquares = this.cells.filter(
          (cell) => cell === null,
        ).length;
        if (emptySquares === 0) {
          console.log("No empty squares for AI");
          return;
        }

        console.log("AI proceeding with move...");
        this.aiThinking = true;

        const delay = this.getAIThinkingDelay();
        console.log("AI thinking delay:", delay);

        // Clear any existing timeout
        if (this.aiMoveTimeout) {
          clearTimeout(this.aiMoveTimeout);
        }

        this.aiMoveTimeout = setTimeout(() => {
          try {
            console.log("AI timeout executed, making move...");

            // Double-check conditions before making move
            if (!this.aiShouldMove || this.gameOver) {
              console.log(
                "AI move cancelled - game state changed during timeout",
              );
              this.aiThinking = false;
              return;
            }

            // Decide whether to use power-up or make regular move
            if (this.shouldAIUsePowerUp()) {
              console.log("AI using power-up");
              this.executeAIPowerUp();
            } else {
              console.log("AI making regular move");
              this.makeAIRegularMove();
            }
          } catch (error) {
            console.error("AI move error:", error);
            // Fallback to random move
            try {
              this.makeRandomMove();
            } catch (fallbackError) {
              console.error("AI fallback move failed:", fallbackError);
            }
          } finally {
            this.aiThinking = false;
            this.aiMoveTimeout = null;
            console.log("=== AI MOVE END ===");
          }
        }, delay);
      },

      canAIMakeMove() {
        return (
          this.gameMode === "ai" &&
          this.currentPlayer === this.aiPlayer &&
          !this.gameOver &&
          !this.aiThinking &&
          this.cells.some((cell) => cell === null)
        );
      },
      getAIThinkingDelay() {
        const range =
          this.aiDelayRanges[this.aiDifficulty] ||
          this.aiDelayRanges.random;
        return Math.random() * (range[1] - range[0]) + range[0];
      },

      shouldAIUsePowerUp() {
        // Check if AI has any power-ups available
        const availablePowerUps = this.getAvailableAIPowerUps();
        if (availablePowerUps.length === 0) return false;

        // AI decides based on power-up timing skill and game state
        const urgency = this.calculateGameUrgency();
        const timingSkill = this.aiSkills.powerUpTiming;

        // Higher urgency + better timing skill = more likely to use power-up
        const usePowerUpChance =
          (urgency * 0.6 + timingSkill * 0.4) * 0.3;

        return Math.random() < usePowerUpChance;
      },

      calculateGameUrgency() {
        // Calculate how urgent the game situation is (0-1)
        let urgency = 0;

        // Check if player is about to win
        if (this.canPlayerWinNextMove("X")) {
          urgency += 0.8;
        }

        // Check if AI can win
        if (this.canPlayerWinNextMove(this.aiPlayer)) {
          urgency += 0.6;
        }

        // Check board fullness
        const filledSquares = this.cells.filter(
          (cell) => cell !== null,
        ).length;
        const totalSquares = this.gridRows * 4;
        urgency += (filledSquares / totalSquares) * 0.4;

        return Math.min(1, urgency);
      },

      getAvailableAIPowerUps() {
        if (!this.playerPowerUps[this.aiPlayer]) return [];

        return this.playerPowerUps[this.aiPlayer].filter(
          (powerUp) =>
            !this.usedRandomPowerUps[this.aiPlayer].includes(powerUp) &&
            !this.isPowerUpDisabled(powerUp),
        );
      },

      hasValidAISlideMove() {
        return this.cells.some(
          (cell, index) =>
            cell === this.aiPlayer && this.getValidSlideCount(index) > 0,
        );
      },
      // ===== AI POWER-UP EXECUTION =====

      executeAIPowerUp() {
        const availablePowerUps = this.getAvailableAIPowerUps();
        if (availablePowerUps.length === 0) {
          this.makeAIRegularMove();
          return;
        }

        // Choose power-up based on AI personality and game state
        const chosenPowerUp = this.chooseAIPowerUp(availablePowerUps);

        this.toaster(
          `🤖 AI is using ${chosenPowerUp}...`,
          "warning",
          2000,
        );

        switch (chosenPowerUp) {
          case "undo":
            this.executeAIUndo();
            break;
          case "remove":
            this.executeAIRemove();
            break;
          case "swap":
            this.executeAISwap();
            break;
          case "expand":
            this.executeAIExpand();
            break;
          case "slide":
            this.executeAISlide();
            break;
          case "shield":
            this.executeAIShield();
            break;
          case "teleport":
            this.executeAITeleport();
            break;
          default:
            this.makeAIRegularMove();
        }
      },

      executeAIThemeSwitch() {
        const availableThemes = this.emojiThemes
          .map((theme, index) => index)
          .filter((index) => index !== this.themeIndex);

        if (availableThemes.length > 0) {
          const newThemeIndex =
            availableThemes[
              Math.floor(Math.random() * availableThemes.length)
            ];
          this.themeIndex = newThemeIndex;

          this.toaster(
            `🤖 AI switched to ${this.getThemeName(newThemeIndex)} theme!`,
            "info",
            3000,
          );

          // AI theme switch doesn't end turn
          // Continue with regular move
          setTimeout(() => {
            this.makeAIRegularMove();
          }, 1000);
        } else {
          this.makeAIRegularMove();
        }
      },

      chooseAIPowerUp(availablePowerUps) {
        // Weight power-ups based on AI personality and game state
        const weights = {};

        availablePowerUps.forEach((powerUp) => {
          weights[powerUp] = this.calculatePowerUpWeight(powerUp);
        });

        // Choose weighted random power-up
        return this.weightedRandomChoice(weights);
      },
      calculatePowerUpWeight(powerUp) {
        let weight = 1;

        switch (powerUp) {
          case "undo":
            // Defensive AIs use undo more
            weight *= 1 + this.aiSkills.defensivePlay;
            break;

          case "remove":
            // Aggressive AIs use remove more, especially if player is threatening
            weight *= 1 + (1 - this.aiSkills.defensivePlay);
            if (this.canPlayerWinNextMove("X")) weight *= 3;
            break;

          case "swap":
            // Strategic AIs use swap more
            weight *= 1 + this.aiSkills.strategicThinking;
            break;

          case "expand":
            // Risk-taking AIs expand more when behind
            const aiAdvantage = this.calculatePositionAdvantage(
              this.aiPlayer,
            );
            if (aiAdvantage < 0) weight *= 1 + this.aiSkills.riskTaking;
            break;

          case "slide":
            // Tactical AIs use slide for positioning
            weight *= 1 + this.aiSkills.powerUpTiming;
            break;

          case "shield":
            // Defensive AIs shield valuable pieces
            weight *= 1 + this.aiSkills.defensivePlay;
            break;

          case "teleport":
            // Bold AIs teleport for surprise attacks
            weight *= 1 + this.aiSkills.riskTaking;
            if (this.canPlayerWinNextMove(this.aiPlayer)) weight *= 2;
            break;
        }

        return weight;
      },

      weightedRandomChoice(weights) {
        const totalWeight = Object.values(weights).reduce(
          (sum, weight) => sum + weight,
          0,
        );
        let random = Math.random() * totalWeight;

        for (const [choice, weight] of Object.entries(weights)) {
          random -= weight;
          if (random <= 0) return choice;
        }

        return Object.keys(weights)[0]; // Fallback
      },

      executeAIUndo() {
        if (
          this.moveHistory.length > 0 &&
          !this.usedRandomPowerUps[this.aiPlayer].includes("undo")
        ) {
          this.usedRandomPowerUps[this.aiPlayer].push("undo");
          // Store the last move before undoing it
          const lastMove = this.moveHistory[this.moveHistory.length - 1];
          this.flashSquare(lastMove.index);
          this.cells[lastMove.index] = null;
          this.moveHistory.pop();
          this.winner = null;
          this.isDraw = false;
          this.winningCombo = [];

          // Don't change current player after undo - AI still gets to make a regular move

          this.toaster(`🤖 AI undid the last move!`, "warning");

          // Make a regular move after undo

          this.makeAIRegularMove();
        } else {
          this.makeAIRegularMove();
        }
      },

      executeAIRemove() {
        const playerPieces = this.cells
          .map((cell, index) => ({ cell, index }))
          .filter(({ cell }) => cell === "X");

        if (playerPieces.length === 0) {
          this.makeAIRegularMove();
          return;
        }

        // Mark as used first
        this.usedRandomPowerUps[this.aiPlayer].push("remove");

        // Prioritize removing pieces that threaten AI or help player win
        let targetIndex = this.findBestRemoveTarget(playerPieces);

        if (targetIndex === -1) {
          // Random selection as fallback
          targetIndex =
            playerPieces[Math.floor(Math.random() * playerPieces.length)]
              .index;
        }

        this.removeOpponentPiece(targetIndex);
      },

      findBestRemoveTarget(playerPieces) {
        // Look for pieces that are part of winning threats
        for (const { index } of playerPieces) {
          if (this.isPiecePartOfThreat(index, "X")) {
            return index;
          }
        }

        // Look for pieces in strategic positions (center, corners)
        for (const { index } of playerPieces) {
          if (this.isStrategicPosition(index)) {
            return index;
          }
        }

        return -1;
      },

      executeAISwap() {
        const allPieces = this.cells
          .map((cell, index) => ({ cell, index }))
          .filter(({ cell }) => cell !== null);

        if (allPieces.length < 2) {
          this.makeAIRegularMove();
          return;
        }

        // Mark as used first
        this.usedRandomPowerUps[this.aiPlayer].push("swap");

        // Find best swap combination
        const bestSwap = this.findBestSwapMove(allPieces);

        if (bestSwap) {
          this.swapSelection = [bestSwap.index1, bestSwap.index2];
          this.performSwap();
        } else {
          this.makeAIRegularMove();
        }
      },
      findBestSwapMove(pieces) {
        let bestMove = null;
        let bestScore = -Infinity;

        for (let i = 0; i < pieces.length; i++) {
          for (let j = i + 1; j < pieces.length; j++) {
            const score = this.evaluateSwapMove(
              pieces[i].index,
              pieces[j].index,
            );
            if (score > bestScore) {
              bestScore = score;
              bestMove = {
                index1: pieces[i].index,
                index2: pieces[j].index,
              };
            }
          }
        }

        return bestMove;
      },
      evaluateSwapMove(index1, index2) {
        // Simulate the swap and evaluate the resulting position
        const originalCell1 = this.cells[index1];
        const originalCell2 = this.cells[index2];

        // Temporarily perform swap
        this.cells[index1] = originalCell2;
        this.cells[index2] = originalCell1;

        const score = this.evaluatePosition(this.aiPlayer);

        // Restore original position
        this.cells[index1] = originalCell1;
        this.cells[index2] = originalCell2;

        return score;
      },

      executeAIExpand() {
        if (
          !this.usedRandomPowerUps[this.aiPlayer].includes("expand") &&
          this.gridRows < 6
        ) {
          this.expandGrid();
        } else {
          this.makeAIRegularMove();
        }
      },
      executeAISlide() {
        // Mark as used first
        this.usedRandomPowerUps[this.aiPlayer].push("slide");

        const aiPieces = this.cells
          .map((cell, index) => ({ cell, index }))
          .filter(
            ({ cell, index }) =>
              cell === this.aiPlayer &&
              this.getValidSlideCount(index) > 0,
          );

        if (aiPieces.length === 0) {
          this.makeAIRegularMove();
          return;
        }

        const bestSlide = this.findBestSlideMove(aiPieces);

        if (bestSlide) {
          this.slideSelection = [bestSlide.fromIndex];
          this.slideMode = "destination";
          this.performSlide(bestSlide.toIndex);
        } else {
          this.makeAIRegularMove();
        }
      },
      findBestSlideMove(pieces) {
        let bestMove = null;
        let bestScore = -Infinity;

        for (const { index } of pieces) {
          const destinations = this.getSlideDestinationsForIndex(index);

          for (const destIndex of destinations) {
            const score = this.evaluateSlideMove(index, destIndex);
            if (score > bestScore) {
              bestScore = score;
              bestMove = { fromIndex: index, toIndex: destIndex };
            }
          }
        }

        return bestMove;
      },

      getSlideDestinationsForIndex(index) {
        const row = Math.floor(index / 4);
        const col = index % 4;
        const destinations = [];

        const directions = [
          [-1, -1],
          [-1, 0],
          [-1, 1],
          [0, -1],
          [0, 1],
          [1, -1],
          [1, 0],
          [1, 1],
        ];

        directions.forEach(([deltaRow, deltaCol]) => {
          const newRow = row + deltaRow;
          const newCol = col + deltaCol;
          const newIndex = newRow * 4 + newCol;

          if (
            newRow >= 0 &&
            newRow < this.gridRows &&
            newCol >= 0 &&
            newCol < 4 &&
            newIndex >= 0 &&
            newIndex < this.cells.length &&
            this.cells[newIndex] === null
          ) {
            destinations.push(newIndex);
          }
        });

        return destinations;
      },

      evaluateSlideMove(fromIndex, toIndex) {
        // Temporarily perform slide
        const originalPiece = this.cells[fromIndex];
        this.cells[fromIndex] = null;
        this.cells[toIndex] = originalPiece;

        const score = this.evaluatePosition(this.aiPlayer);

        // Restore original position
        this.cells[fromIndex] = originalPiece;
        this.cells[toIndex] = null;

        return score;
      },

      executeAIShield() {
        this.usedRandomPowerUps[this.aiPlayer].push("shield");

        const aiPieces = this.cells
          .map((cell, index) => ({ cell, index }))
          .filter(
            ({ cell, index }) =>
              cell === this.aiPlayer && !this.shieldedSquares[index],
          );

        if (aiPieces.length === 0) {
          this.makeAIRegularMove();
          return;
        }

        // Find most valuable piece to shield
        let bestPiece = null;
        let bestValue = -1;

        for (const { index } of aiPieces) {
          const value = this.calculatePieceValue(index, this.aiPlayer);
          if (value > bestValue) {
            bestValue = value;
            bestPiece = index;
          }
        }

        if (bestPiece !== null) {
          this.shieldPiece(bestPiece);
        } else {
          this.makeAIRegularMove();
        }
      },

      executeAITeleport() {
        this.usedRandomPowerUps[this.aiPlayer].push("teleport");

        const aiPieces = this.cells
          .map((cell, index) => ({ cell, index }))
          .filter(({ cell }) => cell === this.aiPlayer);

        const emptySquares = this.cells
          .map((cell, index) => ({ cell, index }))
          .filter(({ cell }) => cell === null);

        if (aiPieces.length === 0 || emptySquares.length === 0) {
          this.makeAIRegularMove();
          return;
        }

        const bestTeleport = this.findBestTeleportMove(
          aiPieces,
          emptySquares,
        );

        if (bestTeleport) {
          this.teleportSelection = [bestTeleport.fromIndex];
          this.performTeleport(bestTeleport.toIndex);
        } else {
          this.makeAIRegularMove();
        }
      },

      findBestTeleportMove(pieces, emptySquares) {
        let bestMove = null;
        let bestScore = -Infinity;

        for (const { index: fromIndex } of pieces) {
          for (const { index: toIndex } of emptySquares) {
            const score = this.evaluateTeleportMove(fromIndex, toIndex);
            if (score > bestScore) {
              bestScore = score;
              bestMove = { fromIndex, toIndex };
            }
          }
        }

        return bestMove;
      },
      evaluateTeleportMove(fromIndex, toIndex) {
        // Temporarily perform teleport
        const originalPiece = this.cells[fromIndex];
        this.cells[fromIndex] = null;
        this.cells[toIndex] = originalPiece;

        const score = this.evaluatePosition(this.aiPlayer);

        // Restore original position
        this.cells[fromIndex] = originalPiece;
        this.cells[toIndex] = null;

        return score;
      },

      // ===== AI REGULAR MOVE =====

      makeAIRegularMove() {
        console.log("Making AI regular move...");

        const emptySquares = this.cells
          .map((cell, index) => ({ cell, index }))
          .filter(({ cell }) => cell === null);

        if (emptySquares.length === 0) {
          console.log("No empty squares available");
          return;
        }

        let chosenIndex;

        // Check if AI can win immediately
        const winningMove = this.findWinningMove(this.aiPlayer);
        if (winningMove !== -1) {
          chosenIndex = winningMove;
          console.log("AI found winning move at:", chosenIndex);
        }
        // Check if AI needs to block player
        else if (this.aiSkills.defensivePlay > 0.3) {
          const blockingMove = this.findWinningMove("X");
          if (blockingMove !== -1) {
            chosenIndex = blockingMove;
            console.log("AI found blocking move at:", chosenIndex);
          }
        }

        // If no immediate win/block, choose strategically
        if (chosenIndex === undefined) {
          chosenIndex = this.findBestStrategicMove(emptySquares);
          console.log("AI chose strategic move at:", chosenIndex);
        }

        // Fallback to random
        if (
          chosenIndex === undefined ||
          this.cells[chosenIndex] !== null
        ) {
          chosenIndex =
            emptySquares[Math.floor(Math.random() * emptySquares.length)]
              .index;
          console.log("AI chose random move at:", chosenIndex);
        }

        console.log(
          "AI making move at index:",
          chosenIndex,
          "for player:",
          this.aiPlayer,
        );

        // CRITICAL: Ensure we're updating the right cell
        if (this.cells[chosenIndex] !== null) {
          console.error(
            "PROBLEM: Trying to place AI move on occupied cell!",
            chosenIndex,
            this.cells[chosenIndex],
          );
          return;
        }

        // CRITICAL: Directly update the cell AND force reactivity
        //  this.$set ? this.$set(this.cells, chosenIndex, this.aiPlayer) : (this.cells[chosenIndex] = this.aiPlayer);
        this.cells[chosenIndex] = this.aiPlayer;

        // Force Vue to detect the change
        this.$forceUpdate();

        // Add to move history
        this.moveHistory.push({
          index: chosenIndex,
          player: this.aiPlayer,
        });

        // Check game state
        this.checkGameState();

        // Switch turns if game isn't over
        if (!this.winner && !this.isDraw) {
          this.switchTurn();
        }

        console.log("AI move completed. Cells now:", this.cells);
      },

      findWinningMove(player) {
        for (let i = 0; i < this.cells.length; i++) {
          if (this.cells[i] === null) {
            // Temporarily place piece
            this.cells[i] = player;

            // Check if this creates a win
            const isWin = this.wouldCreateWin(i, player);

            // Remove temporary piece
            this.cells[i] = null;

            if (isWin) return i;
          }
        }
        return -1;
      },

      wouldCreateWin(index, player) {
        // Check all possible winning combinations that include this index
        let wins = this.getWinningCombinations();

        for (let combo of wins) {
          if (combo.includes(index)) {
            const [a, b, c] = combo;
            if (
              this.cells[a] === player &&
              this.cells[b] === player &&
              this.cells[c] === player
            ) {
              return true;
            }
          }
        }
        return false;
      },

      findBestStrategicMove(emptySquares) {
        let bestMove = null;
        let bestScore = -Infinity;

        for (const { index } of emptySquares) {
          const score = this.evaluateMovePosition(index);

          // Add some randomness based on AI skill
          const randomFactor =
            (1 - this.aiSkills.strategicThinking) * 0.3;
          const adjustedScore =
            score + (Math.random() - 0.5) * randomFactor;

          if (adjustedScore > bestScore) {
            bestScore = adjustedScore;
            bestMove = index;
          }
        }

        return bestMove;
      },
      evaluateMovePosition(index) {
        // Temporarily place AI piece
        this.cells[index] = this.aiPlayer;

        const score = this.evaluatePosition(this.aiPlayer);

        // Remove temporary piece
        this.cells[index] = null;

        return score;
      },
      // ===== AI EVALUATION FUNCTIONS =====

      evaluatePosition(player) {
        let score = 0;

        // Evaluate winning opportunities
        score += this.countWinningOpportunities(player) * 10;
        score -=
          this.countWinningOpportunities(player === "X" ? "O" : "X") * 10;

        // Evaluate position control
        score += this.evaluatePositionControl(player) * 3;

        // Evaluate piece safety
        score += this.evaluatePieceSafety(player) * 2;

        return score;
      },

      countWinningOpportunities(player) {
        let opportunities = 0;
        const wins = this.getWinningCombinations();

        for (let combo of wins) {
          const [a, b, c] = combo;
          const playerCount = [
            this.cells[a],
            this.cells[b],
            this.cells[c],
          ].filter((cell) => cell === player).length;
          const emptyCount = [
            this.cells[a],
            this.cells[b],
            this.cells[c],
          ].filter((cell) => cell === null).length;
          const opponentCount = 3 - playerCount - emptyCount;

          if (opponentCount === 0) {
            if (playerCount === 2 && emptyCount === 1)
              opportunities += 3; // One move to win
            else if (playerCount === 1 && emptyCount === 2)
              opportunities += 1; // Two moves to win
          }
        }

        return opportunities;
      },

      evaluatePositionControl(player) {
        let control = 0;

        // Center positions are more valuable
        const centerPositions = this.getCenterPositions();
        for (const pos of centerPositions) {
          if (this.cells[pos] === player) control += 2;
        }

        // Corner positions
        const cornerPositions = this.getCornerPositions();
        for (const pos of cornerPositions) {
          if (this.cells[pos] === player) control += 1;
        }

        return control;
      },

      evaluatePieceSafety(player) {
        let safety = 0;

        for (let i = 0; i < this.cells.length; i++) {
          if (this.cells[i] === player) {
            if (this.shieldedSquares[i]) safety += 2;
            safety += this.calculatePieceValue(i, player);
          }
        }

        return safety;
      },

      calculatePieceValue(index, player) {
        // Calculate how valuable this piece is based on its position and threats
        let value = 0;

        // Strategic position value
        if (this.isStrategicPosition(index)) value += 2;

        // Part of potential winning combinations
        value += this.countPotentialWins(index, player);

        return value;
      },

      isStrategicPosition(index) {
        const centerPositions = this.getCenterPositions();
        const cornerPositions = this.getCornerPositions();

        return (
          centerPositions.includes(index) ||
          cornerPositions.includes(index)
        );
      },

      getCenterPositions() {
        // Return center positions based on current grid size
        const centers = [];
        if (this.gridRows >= 4) {
          centers.push(5, 6, 9, 10); // 4x4 centers
        }
        if (this.gridRows >= 5) {
          centers.push(13, 14); // 4x5 additional centers
        }
        if (this.gridRows >= 6) {
          centers.push(17, 18); // 4x6 additional centers
        }
        return centers.filter((pos) => pos < this.cells.length);
      },

      getCornerPositions() {
        const corners = [0, 3]; // Top corners
        corners.push(
          (this.gridRows - 1) * 4,
          (this.gridRows - 1) * 4 + 3,
        ); // Bottom corners
        return corners.filter((pos) => pos < this.cells.length);
      },

      countPotentialWins(index, player) {
        let count = 0;
        const wins = this.getWinningCombinations();

        for (let combo of wins) {
          if (combo.includes(index)) {
            const [a, b, c] = combo;
            const opponentCount = [
              this.cells[a],
              this.cells[b],
              this.cells[c],
            ].filter((cell) => cell !== null && cell !== player).length;

            if (opponentCount === 0) count++;
          }
        }

        return count;
      },

      isPiecePartOfThreat(index, player) {
        const wins = this.getWinningCombinations();

        for (let combo of wins) {
          if (combo.includes(index)) {
            const [a, b, c] = combo;
            const playerCount = [
              this.cells[a],
              this.cells[b],
              this.cells[c],
            ].filter((cell) => cell === player).length;
            const emptyCount = [
              this.cells[a],
              this.cells[b],
              this.cells[c],
            ].filter((cell) => cell === null).length;

            if (playerCount >= 2 && emptyCount >= 1) return true;
          }
        }

        return false;
      },

      canPlayerWinNextMove(player) {
        return this.findWinningMove(player) !== -1;
      },

      calculatePositionAdvantage(player) {
        const playerScore = this.evaluatePosition(player);
        const opponentScore = this.evaluatePosition(
          player === "X" ? "O" : "X",
        );
        return playerScore - opponentScore;
      },

      getWinningCombinations() {
        // Return all possible winning combinations for current grid size
        let wins = [];

        if (this.gridRows === 4) {
          wins = [
            [0, 1, 2],
            [1, 2, 3],
            [4, 5, 6],
            [5, 6, 7],
            [8, 9, 10],
            [9, 10, 11],
            [12, 13, 14],
            [13, 14, 15],
            [0, 4, 8],
            [4, 8, 12],
            [1, 5, 9],
            [5, 9, 13],
            [2, 6, 10],
            [6, 10, 14],
            [3, 7, 11],
            [7, 11, 15],
            [0, 5, 10],
            [1, 6, 11],
            [4, 9, 14],
            [5, 10, 15],
            [2, 5, 8],
            [3, 6, 9],
            [6, 9, 12],
            [7, 10, 13],
          ];
        } else {
          // Dynamic calculation for expanded grids
          wins = [];

          // Horizontal wins
          for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col <= 1; col++) {
              const start = row * 4 + col;
              wins.push([start, start + 1, start + 2]);
            }
          }

          // Vertical wins
          for (let col = 0; col < 4; col++) {
            for (let row = 0; row <= this.gridRows - 3; row++) {
              const start = row * 4 + col;
              wins.push([start, start + 4, start + 8]);
            }
          }

          // Diagonal wins (top-left to bottom-right)
          for (let row = 0; row <= this.gridRows - 3; row++) {
            for (let col = 0; col <= 1; col++) {
              const start = row * 4 + col;
              wins.push([start, start + 5, start + 10]);
            }
          }

          // Diagonal wins (top-right to bottom-left)
          for (let row = 0; row <= this.gridRows - 3; row++) {
            for (let col = 2; col <= 3; col++) {
              const start = row * 4 + col;
              wins.push([start, start + 3, start + 6]);
            }
          }
        }

        return wins;
      },

      // ===== UTILITY FUNCTIONS =====

      makeRandomMove() {
        const emptySquares = this.cells
          .map((cell, index) => ({ cell, index }))
          .filter(({ cell }) => cell === null);

        if (emptySquares.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * emptySquares.length,
          );
          this.makeMove(emptySquares[randomIndex].index);
        }
      },
      // Enhanced accessibility methods
      getCellAriaLabel(index, cell) {
        const row = Math.floor(index / 4) + 1;
        const col = (index % 4) + 1;
        const position = `Row ${row}, Column ${col}`;

        if (cell) {
          const player = cell === "X" ? "Player X" : "Player O";
          const emoji = this.getEmoji(cell);
          return `${position}, occupied by ${player} ${emoji}`;
        } else if (this.isMyTurn && !this.gameOver) {
          return `${position}, empty cell, click to place your piece`;
        } else {
          return `${position}, empty cell`;
        }
      },

      getTabIndex(index) {
        if (this.gameOver || !this.isMyTurn) return -1;
        return index === this.focusedCellIndex ? 0 : -1;
      },

      announceGameState(message) {
        this.gameAnnouncement = message;
        setTimeout(() => {
          this.gameAnnouncement = "";
        }, 3000);
      },

      // Keyboard navigation
      setupKeyboardNavigation() {
        document.addEventListener("keydown", this.handleKeyDown);
      },

      handleKeyDown(event) {
        if (!this.isMyTurn || this.gameOver) return;

        const currentRow = Math.floor(this.focusedCellIndex / 4);
        const currentCol = this.focusedCellIndex % 4;
        let newIndex = this.focusedCellIndex;

        switch (event.key) {
          case "ArrowRight":
            event.preventDefault();
            if (currentCol < 3) newIndex = this.focusedCellIndex + 1;
            break;
          case "ArrowLeft":
            event.preventDefault();
            if (currentCol > 0) newIndex = this.focusedCellIndex - 1;
            break;
          case "ArrowDown":
            event.preventDefault();
            if (currentRow < this.gridRows - 1)
              newIndex = this.focusedCellIndex + 4;
            break;
          case "ArrowUp":
            event.preventDefault();
            if (currentRow > 0) newIndex = this.focusedCellIndex - 4;
            break;
          case "Enter":
          case " ":
            event.preventDefault();
            if (!this.cells[this.focusedCellIndex]) {
              this.makeMove(this.focusedCellIndex);
            }
            break;
          case "Home":
            event.preventDefault();
            newIndex = 0;
            break;
          case "End":
            event.preventDefault();
            newIndex = this.gridRows * 4 - 1;
            break;
        }

        if (newIndex !== this.focusedCellIndex) {
          this.focusedCellIndex = newIndex;
          this.focusCell(newIndex);
        }
      },

      focusCell(index) {
        const gameButtons =
          document.querySelectorAll('[role="gridcell"]');
        if (gameButtons[index]) {
          gameButtons[index].focus();
        }
      },

      // Enhanced performance methods
      debouncedFlashSquare: debounce(function (index) {
        this.flashSquare(index);
      }, 100),

      throttledToaster: throttle(function (message, type, duration) {
        this.toaster(message, type, duration);
      }, 1000),

      // Game logic methods
      getValidSlideCount(index) {
        if (index < 0 || index >= this.cells.length) return 0;
        if (this.cells[index] !== this.currentPlayer) return 0;

        const row = Math.floor(index / 4);
        const col = index % 4;
        let count = 0;

        const directions = [
          [-1, -1],
          [-1, 0],
          [-1, 1],
          [0, -1],
          [0, 1],
          [1, -1],
          [1, 0],
          [1, 1],
        ];

        directions.forEach(([deltaRow, deltaCol]) => {
          const newRow = row + deltaRow;
          const newCol = col + deltaCol;
          const newIndex = newRow * 4 + newCol;

          if (
            newRow >= 0 &&
            newRow < this.gridRows &&
            newCol >= 0 &&
            newCol < 4 &&
            newIndex >= 0 &&
            newIndex < this.cells.length &&
            this.cells[newIndex] === null
          ) {
            count++;
          }
        });

        return count;
      },

      hasValidSlideMove() {
        return this.cells.some(
          (cell, index) =>
            cell === this.currentPlayer &&
            this.getValidSlideCount(index) > 0,
        );
      },

      showSlidePowerModal() {
        try {
          this.slideSelection = [];
          this.slideMode = "select";
          document.getElementById("slide-modal").showModal();
        } catch (error) {
          this.handleError("Show slide modal", error);
        }
      },

      performSlide(destinationIndex) {
        try {
          if (this.slideSelection.length !== 1) return;

          const sourceIndex = this.slideSelection[0];
          const validDestinations = this.getSlideDestinations;

          if (!validDestinations.includes(destinationIndex)) {
            this.toaster("Invalid slide destination!", "error");
            return;
          }

          this.flashSquare(sourceIndex);
          this.flashSquare(destinationIndex);

          // Move the piece from source to destination
          this.cells[destinationIndex] = this.cells[sourceIndex];
          this.cells[sourceIndex] = null;

          if (this.shieldedSquares[sourceIndex]) {
            this.shieldedSquares[sourceIndex] = false;
            this.shieldedSquares[destinationIndex] = true;
          }

          // FIXED: Use array system
          this.usedRandomPowerUps[this.currentPlayer].push("slide");
          document.getElementById("slide-modal").close();
          this.resetSlideSelection();

          this.toaster(
            `${this.getEmoji(this.currentPlayer)} slid a piece!`,
            "info",
          );

          this.checkGameState();

          // FIXED: Add turn switching
          if (!this.winner && !this.isDraw) {
            // this.switchTurn();
          }

          if (this.conn && this.conn.open) {
            this.conn.send({
              type: "slide",
              cells: [...this.cells],
              currentPlayer: this.currentPlayer,
              usedRandomPowerUps: { ...this.usedRandomPowerUps }, // FIXED: Send array system
              shieldedSquares: [...this.shieldedSquares],
              winner: this.winner,
              isDraw: this.isDraw,
              winningCombo: [...this.winningCombo],
            });
          }
        } catch (error) {
          this.handleError("Slide piece", error);
        }
      },

      resetSlideSelection() {
        this.slideSelection = [];
        this.slideMode = "select";
      },

      showShieldPowerModal() {
        try {
          document.getElementById("shield-modal").showModal();
        } catch (error) {
          this.handleError("Show shield modal", error);
        }
      },

      shieldPiece(index) {
        try {
          if (
            this.usedRandomPowerUps[this.currentPlayer].includes("shield")
          ) {
            return;
          }
          if (this.cells[index] !== this.currentPlayer) {
            return;
          }

          this.flashSquare(index);
          this.shieldedSquares[index] = true;
          this.usedRandomPowerUps[this.currentPlayer].push("shield");

          document.getElementById("shield-modal").close();

          this.toaster(
            `${this.getEmoji(this.currentPlayer)} shielded a piece!`,
            "success",
          );

          if (!this.winner && !this.isDraw) {
            //   this.switchTurn();
          }

          if (this.conn && this.conn.open) {
            this.conn.send({
              type: "shield",
              currentPlayer: this.currentPlayer,
              usedRandomPowerUps: { ...this.usedRandomPowerUps },
              shieldedSquares: [...this.shieldedSquares],
            });
          }
        } catch (error) {
          this.handleError("Shield piece", error);
        }
      },

      showTeleportPowerModal() {
        try {
          this.teleportSelection = [];
          document.getElementById("teleport-modal").showModal();
        } catch (error) {
          this.handleError("Show teleport modal", error);
        }
      },

      selectTeleportPiece(index) {
        if (this.teleportSelection.length === 0) {
          if (this.cells[index] === this.currentPlayer) {
            this.teleportSelection = [index];
          }
        } else {
          // now allow landing on ANY square
          this.performTeleport(index);
        }
      },

   
      performTeleport(destinationIndex) {
        try {
          if (this.teleportSelection.length !== 1) return;

          const sourceIndex = this.teleportSelection[0];

    

          this.flashSquare(sourceIndex);
          this.flashSquare(destinationIndex);

          // **Override whatever’s there**
          this.cells[destinationIndex] = this.cells[sourceIndex];
          this.cells[sourceIndex] = null;

          if (this.shieldedSquares[sourceIndex]) {
            this.shieldedSquares[sourceIndex] = false;
            this.shieldedSquares[destinationIndex] = true;
          }

          // FIXED: Use array system
          this.usedRandomPowerUps[this.currentPlayer].push("teleport");
          document.getElementById("teleport-modal").close();
          this.resetTeleportSelection();

          this.toaster(
            `${this.getEmoji(this.currentPlayer)} teleported a piece!`,
            "warning",
          );

          this.checkGameState();

          // FIXED: Add turn switching
          if (!this.winner && !this.isDraw) {
            //  this.switchTurn();
          }

          if (this.conn && this.conn.open) {
            this.conn.send({
              type: "teleport",
              cells: [...this.cells],
              currentPlayer: this.currentPlayer,
              usedRandomPowerUps: { ...this.usedRandomPowerUps }, // FIXED
              shieldedSquares: [...this.shieldedSquares],
              winner: this.winner,
              isDraw: this.isDraw,
              winningCombo: [...this.winningCombo],
            });
          }
        } catch (error) {
          this.handleError("Teleport piece", error);
        }
      },

      resetTeleportSelection() {
        this.teleportSelection = [];
      },

      selectSlidePiece(index) {
        if (this.slideMode === "select") {
          if (this.cells[index] === this.currentPlayer) {
            this.slideSelection = [index];
            this.slideMode = "destination";
          }
        } else {
          // now allow landing on ANY square
          this.performSlide(index);
        }
      },

      handleError(operation, error) {
        console.error(`Error in ${operation}:`, error);
        this.toaster(
          `${operation} failed: ${error.message || "Unknown error"}`,
          "error",
          4000,
        );
      },

      cleanUrl() {
        const url = new URL(window.location);
        url.searchParams.delete("gameId");
        window.history.replaceState({}, document.title, url.pathname);
      },

      handleConnectionFailure(message, error = null) {
        if (error) {
          console.error("Connection error:", error);
        }

        this.toaster(message, "error", 4000);

        if (this.peer) {
          try {
            this.peer.destroy();
          } catch (e) {
            console.warn("Error destroying peer:", e);
          }
          this.peer = null;
        }
        this.conn = null;
        this.peerId = "";
        this.peerIdToConnect = "";

        this.cleanUrl();
        const modal = document.getElementById("multiplayer-modal");
        if (modal && modal.open) {
          modal.close();
        }

        this.toaster("Switched to single player mode", "info", 3000);
      },

      switchTurn() {
        if (!this.winner && !this.isDraw) {
          this.currentPlayer = this.currentPlayer === "X" ? "O" : "X";
          if (!this.isMultiplayer || this.isMyTurn) {
            this.toaster(
              `${this.getEmoji(this.currentPlayer)}'s turn`,
              "info",
              1500,
            );
          }
        }
      },

      expandGrid() {
        try {
          if (
            this.usedRandomPowerUps[this.currentPlayer].includes(
              "expand",
            ) ||
            this.gridRows === 6 ||
            this.gameOver
          ) {
            return;
          }

          this.isExpanding = true;
          this.usedRandomPowerUps[this.currentPlayer].push("expand");

          const newRowCount = this.gridRows + 1;

          // Add exactly 4 new cells for the new row
          this.cells = [...this.cells, ...Array(4).fill(null)];
          this.shieldedSquares = [
            ...this.shieldedSquares,
            ...Array(4).fill(false),
          ];
          this.squareEffects = [
            ...this.squareEffects,
            ...Array(4).fill(false),
          ];

          this.gridRows = newRowCount;

          setTimeout(() => {
            this.isExpanding = false;
          }, 800);

          this.toaster(
            `${this.getEmoji(this.currentPlayer)} added row ${newRowCount}! Now 4×${newRowCount}`,
            "warning",
            3000,
          );

          if (!this.winner && !this.isDraw) {
            //  this.switchTurn();
          }

          if (this.conn && this.conn.open) {
            this.conn.send({
              type: "expand",
              cells: [...this.cells],
              gridRows: this.gridRows,
              currentPlayer: this.currentPlayer,
              usedRandomPowerUps: { ...this.usedRandomPowerUps },
              shieldedSquares: [...this.shieldedSquares],
            });
          }
        } catch (error) {
          this.handleError("Expand grid", error);
        }
      },
      flashSquare(index) {
        this.squareEffects[index] = true;
        setTimeout(() => {
          this.squareEffects[index] = false;
        }, 600);
      },

      shakeScreen() {
        if (this.isShaking) return;
        this.isShaking = true;
        document.body.classList.add("tilt-n-move-shaking");
        setTimeout(() => {
          document.body.classList.remove("tilt-n-move-shaking");
          this.isShaking = false;
        }, 500);
      },

      showMultiplayerModal() {
        document.getElementById("multiplayer-modal").showModal();
      },

      showAboutModal() {
        document.getElementById("about-modal").showModal();
      },

      showSwapPowerModal() {
        try {
          this.swapSelection = [];
          document.getElementById("swap-modal").showModal();
        } catch (error) {
          this.handleError("Show swap modal", error);
        }
      },

      selectSwapPiece(index) {
        if (this.cells[index] === null) return;

        if (this.swapSelection.includes(index)) {
          this.swapSelection = this.swapSelection.filter(
            (i) => i !== index,
          );
        } else if (this.swapSelection.length < 2) {
          this.swapSelection.push(index);

          if (this.swapSelection.length === 2) {
            this.performSwap();
          }
        }
      },

      performSwap() {
        try {
          if (this.swapSelection.length !== 2) return;

          const [index1, index2] = this.swapSelection;
          this.flashSquare(index1);
          this.flashSquare(index2);

          const temp = this.cells[index1];
          this.cells[index1] = this.cells[index2];
          this.cells[index2] = temp;

          const tempShield = this.shieldedSquares[index1];
          this.shieldedSquares[index1] = this.shieldedSquares[index2];
          this.shieldedSquares[index2] = tempShield;

          // FIXED: Use array system
          this.usedRandomPowerUps[this.currentPlayer].push("swap");

          document.getElementById("swap-modal").close();
          this.resetSwapSelection();

          this.toaster(
            `${this.getEmoji(this.currentPlayer)} swapped two pieces!`,
            "info",
          );

          this.checkGameState();

          // FIXED: Add turn switching
          if (!this.winner && !this.isDraw) {
            //  this.switchTurn();
          }

          if (this.conn && this.conn.open) {
            this.conn.send({
              type: "swap",
              cells: [...this.cells],
              currentPlayer: this.currentPlayer,
              usedRandomPowerUps: { ...this.usedRandomPowerUps }, // FIXED
              shieldedSquares: [...this.shieldedSquares],
              winner: this.winner,
              isDraw: this.isDraw,
              winningCombo: [...this.winningCombo],
            });
          }
        } catch (error) {
          this.handleError("Swap pieces", error);
        }
      },

      resetSwapSelection() {
        this.swapSelection = [];
      },

      removeOpponentPiece(index) {
        try {
          this.flashSquare(index);

          // Only allow one “remove” per player
          if (
            this.usedRandomPowerUps[this.currentPlayer].includes("remove")
          )
            return;

          const opponent = this.currentPlayer === "X" ? "O" : "X";
          if (this.isMultiplayer && this.cells[index] !== opponent)
            return;
          if (!this.isMultiplayer && this.cells[index] === null) return;

          // Shield check
          if (this.shieldedSquares[index]) {
            this.shieldedSquares[index] = false;
            this.toaster("🛡️ Shield blocked the removal!", "info");
          } else {
            // Just null out the cell:
            this.cells[index] = null;
          }

          // Mark it used, close modal, toast, switch turn
          this.usedRandomPowerUps[this.currentPlayer].push("remove");
          document.getElementById("remove-modal").close();
          this.toaster(
            `${this.getEmoji(this.currentPlayer)} used Remove!`,
            "warning",
          );

          if (!this.winner && !this.isDraw) {
            //  this.switchTurn();
          }

          // And notify your opponent
          if (this.conn?.open) {
            this.conn.send({
              type: "remove",
              cells: [...this.cells],
              currentPlayer: this.currentPlayer,
              usedRandomPowerUps: { ...this.usedRandomPowerUps },
              shieldedSquares: [...this.shieldedSquares],
            });
          }
        } catch (err) {
          this.handleError("Remove piece", err);
        }
      },

      undoMove() {
        try {
          if (
            this.moveHistory.length === 0 ||
            this.usedRandomPowerUps[this.currentPlayer].includes("undo")
          ) {
            return;
          }

          const lastMove = this.moveHistory.pop();
          this.usedRandomPowerUps[this.currentPlayer].push("undo");
          this.flashSquare(lastMove.index);
          this.cells[lastMove.index] = null;
          this.winner = null;
          this.isDraw = false;
          this.winningCombo = [];

          this.toaster(
            `${this.getEmoji(this.currentPlayer)} undid the last move!`,
            "warning",
          );

          // Switch back to the player who made the undone move
          this.currentPlayer = lastMove.player;

          if (this.conn && this.conn.open) {
            this.conn.send({
              type: "undo",
              cells: [...this.cells],
              currentPlayer: this.currentPlayer,
              winner: this.winner,
              isDraw: this.isDraw,
              winningCombo: [...this.winningCombo],
              moveHistory: [...this.moveHistory],
              usedRandomPowerUps: { ...this.usedRandomPowerUps },
            });
          }
        } catch (error) {
          this.handleError("Undo move", error);
        }
      },
      toaster(msg, type = "info", duration = 3000) {
        const colors = {
          info: "#3b82f6",
          success: "#10b981",
          warning: "#f59e0b",
          error: "#ef4444",
        };

        if (window.Toastify) {
          window
            .Toastify({
              text: msg,
              duration: duration,
              gravity: "bottom",
              position: "right",
              backgroundColor: colors[type],
              className: "rounded-2xl shadow-lg",
              stopOnFocus: true,
            })
            .showToast();
        } else {
          console.log(`Toast [${type}]: ${msg}`);
        }
      },

      getEmoji(val) {
        return this.emojiSet[val] || " ";
      },

      // Helper method to validate incoming game data
      isValidGameData(data) {
        if (!data || typeof data !== "object") return false;

        // Check required fields based on message type
        switch (data.type) {
          case "move":
            return (
              Array.isArray(data.cells) &&
              typeof data.currentPlayer === "string" &&
              data.cells.length === (data.gridRows || this.gridRows) * 4
            );
          case "reset":
          case "requestSync":
            return true; // These messages don't need additional validation
          case "slide":
          case "teleport":
          case "swap":
            return Array.isArray(data.cells) && data.cells.length > 0;
          case "shield":
          case "undo":
          case "remove":
          case "expand":
            return typeof data.currentPlayer === "string";
          default:
            return data.type && typeof data.type === "string";
        }
      },

      // Centralized message handler
      handleIncomingMessage(data) {
        switch (data.type) {
          case "themeSwitch":
            this.themeIndex = data.themeIndex;
            this.currentPlayer = data.currentPlayer;
            this.usedRandomPowerUps = { ...data.usedRandomPowerUps };
            this.toaster("Opponent switched the theme!", "info");
            break;

          case "powerUpUsed":
            this.usedRandomPowerUps = { ...data.usedRandomPowerUps };
            const powerUpName = this.getPowerUpInfo(
              data.powerUpType,
            ).name;
            this.toaster(`Opponent used ${powerUpName}!`, "info");
            break;

          case "reset":
            this.resetGame(false);
            // FIXED: Sync power-ups from host
            if (data.playerPowerUps) {
              this.playerPowerUps = { ...data.playerPowerUps };
            }
            if (data.usedRandomPowerUps) {
              this.usedRandomPowerUps = { ...data.usedRandomPowerUps };
            }
            this.toaster("Opponent started a new game!", "info");
            break;

          case "move":
            this.handleMoveData(data);
            break;
          case "slide":
            this.handleSlideData(data);
            break;
          case "shield":
            this.handleShieldData(data);
            break;
          case "teleport":
            this.handleTeleportData(data);
            break;
          case "reset":
            this.resetGame(false);
            this.toaster("Opponent started a new game!", "info");
            break;
          case "undo":
            this.handleUndoData(data);
            break;
          case "remove":
            this.handleRemoveData(data);
            break;
          case "swap":
            this.handleSwapData(data);
            break;
          case "expand":
            this.handleExpandData(data);
            break;
          case "requestSync":
            // Send current game state
            this.sendGameSync();
            break;
          case "gameSync":
            // Handle full game state sync
            this.handleGameSync(data);
            break;
          case "disconnect":
            this.toaster(
              `Opponent disconnected: ${data.reason || "Unknown reason"}`,
              "warning",
            );
            this.setGameMode("offline");
            break;
          default:
            console.warn("Unknown message type:", data.type);
        }
      },

      handleGameSync(data) {
        console.log("Receiving full game sync", data);

        try {
          // Update all game state from sync data
          this.cells = [...data.cells];
          this.gridRows = data.gridRows || 4;
          this.currentPlayer = data.currentPlayer;
          this.winner = data.winner;
          this.isDraw = data.isDraw;
          this.winningCombo = [...(data.winningCombo || [])];
          this.score = { ...data.score };
          this.moveHistory = [...(data.moveHistory || [])];

          // CRITICAL: Sync power-ups properly
          this.usedRandomPowerUps = {
            X: [...(data.usedRandomPowerUps?.X || [])],
            O: [...(data.usedRandomPowerUps?.O || [])],
          };
          this.playerPowerUps = {
            X: [...(data.playerPowerUps?.X || [])],
            O: [...(data.playerPowerUps?.O || [])],
          };
          this.shieldedSquares = [
            ...(data.shieldedSquares ||
              Array(this.gridRows * 4).fill(false)),
          ];

          // FIXED: Request sync from guest when they connect
          if (!this.isHost && this.conn && this.conn.open) {
            this.conn.send({ type: "requestSync" });
          }

          console.log("Game sync complete. My turn:", this.isMyTurn);
          this.toaster("Game synchronized with opponent", "info");
        } catch (error) {
          console.error("Error handling game sync:", error);
          this.toaster("Failed to sync game state", "error");
        }
      },
      // ADDED: Helper method to validate opponent power-up data
      isOpponentPowerUpValid(data) {
        // Basic validation for power-up messages
        if (!data.currentPlayer || !data.hasUsedSlide) return false;
        if (
          !Array.isArray(data.cells) ||
          data.cells.length !== this.gridRows * 4
        )
          return false;
        return true;
      },

      sendGameSync() {
        if (!this.conn || !this.conn.open) return;

        this.conn.send({
          type: "gameSync",
          cells: [...this.cells],
          gridRows: this.gridRows,
          currentPlayer: this.currentPlayer,
          winner: this.winner,
          isDraw: this.isDraw,
          winningCombo: [...this.winningCombo],
          score: { ...this.score },
          moveHistory: [...this.moveHistory],
          usedRandomPowerUps: { ...this.usedRandomPowerUps },
          playerPowerUps: { ...this.playerPowerUps },
          shieldedSquares: [...this.shieldedSquares],
        });
      },

      handleExpandData(data) {
        this.isExpanding = true;
        this.cells = [...data.cells];
        this.gridRows = data.gridRows;
        this.currentPlayer = data.currentPlayer;
        this.usedRandomPowerUps = { ...data.usedRandomPowerUps };
        this.squareEffects = Array(this.gridRows * 4).fill(false);
        this.shieldedSquares = [
          ...(data.shieldedSquares ||
            Array(this.gridRows * 4).fill(false)),
        ];

        setTimeout(() => {
          this.isExpanding = false;
        }, 800);

        this.toaster(
          `Opponent added row ${this.gridRows}! Now 4×${this.gridRows}`,
          "warning",
        );
      },

      // Helper methods to handle different data types
      handleMoveData(data) {
        // Validate move data
        if (this.isMyTurn) {
          console.warn("Received move when it's my turn - ignoring");
          return;
        }

        if (
          !Array.isArray(data.cells) ||
          data.cells.length !== (data.gridRows || this.gridRows) * 4
        ) {
          console.error("Invalid cells array in move data");
          return;
        }

        // Apply the move
        this.cells = [...data.cells];
        this.gridRows = data.gridRows || this.gridRows;
        this.currentPlayer = data.currentPlayer;
        this.winner = data.winner;
        this.isDraw = data.isDraw;
        this.winningCombo = [...(data.winningCombo || [])];
        this.score = { ...data.score };
        this.moveHistory = [...(data.moveHistory || [])];

        // Update power-up states
        this.usedRandomPowerUps = { ...data.usedRandomPowerUps };
        this.playerPowerUps = { ...data.playerPowerUps };

        // Visual feedback
        if (this.moveHistory.length > 0) {
          const lastMove = this.moveHistory[this.moveHistory.length - 1];
          this.flashSquare(lastMove.index);
        }

        this.toaster("Opponent moved!", "info", 1500);
      },

      handleSlideData(data) {
        this.cells = [...data.cells];
        this.currentPlayer = data.currentPlayer;
        this.usedRandomPowerUps = { ...data.usedRandomPowerUps };
        this.shieldedSquares = [
          ...(data.shieldedSquares || Array(24).fill(false)),
        ];
        this.winner = data.winner;
        this.isDraw = data.isDraw;
        this.winningCombo = [...(data.winningCombo || [])];
        this.toaster("Opponent used slide!", "info");
      },

      handleShieldData(data) {
        this.currentPlayer = data.currentPlayer;
        this.usedRandomPowerUps = { ...data.usedRandomPowerUps };
        this.shieldedSquares = [...data.shieldedSquares];
        this.toaster("Opponent used shield!", "success");
      },

      handleTeleportData(data) {
        this.cells = [...data.cells];
        this.currentPlayer = data.currentPlayer;
        this.usedRandomPowerUps = { ...data.usedRandomPowerUps };
        this.shieldedSquares = [...data.shieldedSquares];
        this.winner = data.winner;
        this.isDraw = data.isDraw;
        this.winningCombo = [...(data.winningCombo || [])];
        this.toaster("Opponent used teleport!", "warning");
      },

      handleUndoData(data) {
        this.cells = [...data.cells];
        this.currentPlayer = data.currentPlayer; // This should be the player who made the original move
        this.winner = data.winner;
        this.isDraw = data.isDraw;
        this.winningCombo = [...(data.winningCombo || [])];
        this.moveHistory = [...(data.moveHistory || [])];
        this.usedRandomPowerUps = { ...data.usedRandomPowerUps };
        this.toaster("Opponent used undo!", "warning");
      },

      handleRemoveData(data) {
        this.cells = [...data.cells];
        this.currentPlayer = data.currentPlayer;
        this.usedRandomPowerUps = { ...data.usedRandomPowerUps };
        this.shieldedSquares = [
          ...(data.shieldedSquares || Array(24).fill(false)),
        ];
        this.toaster("Opponent removed a piece!", "warning");
      },

      handleSwapData(data) {
        this.cells = [...data.cells];
        this.currentPlayer = data.currentPlayer;
        this.usedRandomPowerUps = { ...data.usedRandomPowerUps };
        this.shieldedSquares = [
          ...(data.shieldedSquares || Array(24).fill(false)),
        ];
        this.winner = data.winner;
        this.isDraw = data.isDraw;
        this.winningCombo = [...(data.winningCombo || [])];
        this.toaster("Opponent used swap!", "info");
      },

   
      setupConnection() {
        if (!this.conn) {
          console.error(
            "setupConnection called but no connection exists",
          );
          return;
        }

        console.log("Setting up connection handlers...");
        console.log("I am host:", this.isHost);
        console.log("Current player:", this.currentPlayer);

        // IMPORTANT: Ensure proper role assignment
        if (!this.isHost) {
          // Guest should wait for host to start, but be ready for O turns
          console.log("I am the guest (O player)");
        } else {
          console.log("I am the host (X player)");
        }

        this.conn.on("data", (data) => {
          try {
            console.log("Received data:", data);

            if (!data || typeof data !== "object") {
              console.error("Invalid data received:", data);
              return;
            }

            // Handle different message types
            switch (data.type) {
              case "powerUpUsed":
                // show a toast immediately
                const who =
                  data.by === this.currentPlayer ? "You" : "Opponent";
                const name = this.getPowerUpInfo(data.powerUpType).name;
                this.toaster(`${who} used ${name}!`, "info", 2000);
                break;

              case "themeSwitch":
                // apply the new emoji theme
                this.themeIndex = data.themeIndex;
                this.usedRandomPowerUps = { ...data.usedRandomPowerUps };
                // sync whose turn it is now
                this.currentPlayer = data.currentPlayer;
                // let them know
                this.toaster("🎨 Opponent switched theme!", "info", 2000);
                break;
              case "requestSync":
                console.log("Guest requesting game sync");
                this.sendGameSync();
                break;
              case "move":
                // Validate move data
                if (this.isMyTurn) {
                  console.warn(
                    "Received move when it's my turn - ignoring",
                  );
                  return;
                }

                if (
                  !Array.isArray(data.cells) ||
                  data.cells.length !==
                    (data.gridRows || this.gridRows) * 4
                ) {
                  console.error("Invalid cells array in move data");
                  return;
                }

                // Apply the move
                this.cells = [...data.cells];
                this.gridRows = data.gridRows || this.gridRows;
                this.currentPlayer = data.currentPlayer;
                this.winner = data.winner;
                this.isDraw = data.isDraw;
                this.winningCombo = [...(data.winningCombo || [])];
                this.score = { ...data.score };
                this.moveHistory = [...(data.moveHistory || [])];

                // Update power-up states

                // FIXED: Ensure all arrays are properly synced
                this.usedRandomPowerUps = data.usedRandomPowerUps
                  ? { ...data.usedRandomPowerUps }
                  : { X: [], O: [] };
                this.playerPowerUps = data.playerPowerUps
                  ? { ...data.playerPowerUps }
                  : { X: [], O: [] };

                // Ensure arrays exist for both players
                if (!this.usedRandomPowerUps.X)
                  this.usedRandomPowerUps.X = [];
                if (!this.usedRandomPowerUps.O)
                  this.usedRandomPowerUps.O = [];
                if (!this.playerPowerUps.X) this.playerPowerUps.X = [];
                if (!this.playerPowerUps.O) this.playerPowerUps.O = [];

                // Visual feedback
                if (this.moveHistory.length > 0) {
                  const lastMove =
                    this.moveHistory[this.moveHistory.length - 1];
                  this.flashSquare(lastMove.index);
                }

                this.toaster("Opponent moved!", "info", 1500);
                break;

              case "slide":
                this.cells = [...data.cells];
                this.currentPlayer = data.currentPlayer;
                this.usedRandomPowerUps = { ...data.usedRandomPowerUps };
                this.shieldedSquares = [
                  ...(data.shieldedSquares || Array(24).fill(false)),
                ];
                this.winner = data.winner;
                this.isDraw = data.isDraw;
                this.winningCombo = [...(data.winningCombo || [])];
                this.toaster("Opponent used slide!", "info");
                break;

              case "shield":
                this.currentPlayer = data.currentPlayer;
                this.usedRandomPowerUps = { ...data.usedRandomPowerUps };
                this.shieldedSquares = [...data.shieldedSquares];
                this.toaster("Opponent used shield!", "success");
                break;

              case "teleport":
                this.cells = [...data.cells];
                this.currentPlayer = data.currentPlayer;
                this.usedRandomPowerUps = { ...data.usedRandomPowerUps };
                this.shieldedSquares = [...data.shieldedSquares];
                this.winner = data.winner;
                this.isDraw = data.isDraw;
                this.winningCombo = [...(data.winningCombo || [])];
                this.toaster("Opponent used teleport!", "warning");
                break;

              case "reset":
                this.resetGame(false);
                this.toaster("Opponent started a new game!", "info");
                break;

              case "undo":
                this.cells = [...data.cells];
                this.currentPlayer = data.currentPlayer;
                this.winner = data.winner;
                this.isDraw = data.isDraw;
                this.winningCombo = [...(data.winningCombo || [])];
                this.moveHistory = [...(data.moveHistory || [])];
                this.usedRandomPowerUps = { ...data.usedRandomPowerUps };

                this.toaster("Opponent used undo!", "warning");
                break;

              case "remove":
                this.cells = [...data.cells];
                this.currentPlayer = data.currentPlayer;
                this.usedRandomPowerUps = { ...data.usedRandomPowerUps };

                this.shieldedSquares = [
                  ...(data.shieldedSquares || Array(24).fill(false)),
                ];
                this.toaster("Opponent removed a piece!", "warning");
                break;

              case "swap":
                this.cells = [...data.cells];
                this.currentPlayer = data.currentPlayer;
                this.usedRandomPowerUps = { ...data.usedRandomPowerUps };
                this.shieldedSquares = [
                  ...(data.shieldedSquares || Array(24).fill(false)),
                ];
                this.winner = data.winner;
                this.isDraw = data.isDraw;
                this.winningCombo = [...(data.winningCombo || [])];
                this.toaster("Opponent used swap!", "info");
                break;

              case "expand":
                this.isExpanding = true;
                this.cells = [...data.cells];
                this.gridRows = data.gridRows;
                this.currentPlayer = data.currentPlayer;
                this.usedRandomPowerUps = { ...data.usedRandomPowerUps };
                this.squareEffects = Array(this.gridRows * 4).fill(false);
                this.shieldedSquares = [
                  ...(data.shieldedSquares ||
                    Array(this.gridRows * 4).fill(false)),
                ];

                setTimeout(() => {
                  this.isExpanding = false;
                }, 800);

                this.toaster(
                  `Opponent added row ${this.gridRows}! Now 4×${this.gridRows}`,
                  "warning",
                );
                break;

              default:
                console.warn("Unknown message type:", data.type);
            }
          } catch (error) {
            console.error("Error processing received data:", error);
            this.toaster("Error syncing with opponent", "error");
          }
        });

        this.conn.on("close", () => {
          console.log("Connection closed");
          this.toaster("Player disconnected", "error");
          this.conn = null;
          this.setGameMode("offline");
        });

        this.conn.on("error", (err) => {
          console.error("Connection error:", err);
          this.toaster(
            `Connection error: ${err.message || "Unknown error"}`,
            "error",
          );
          this.conn = null;

          if (this.peer) {
            this.peer.destroy();
            this.peer = null;
          }
        });
      },
      getUrlParameter(name) {
        const params = new URLSearchParams(window.location.search);
        return params.get(name);
      },

      // FIXED: Enhanced connectToPeer method with better timing and error handling
      connectToPeer() {
        if (!this.peerIdToConnect.trim()) {
          this.toaster("Please enter a game ID", "error");
          return;
        }

        console.log("Attempting to connect to:", this.peerIdToConnect);

        this.setGameMode("multiplayer");
        this.isHost = false;

        // Clean up existing peer
        if (this.peer) {
          try {
            this.peer.destroy();
          } catch (error) {
            console.warn("Error destroying existing peer:", error);
          }
          this.peer = null;
        }

        // Create new peer for connecting
        this.peer = new Peer();

        // Set connection timeout
        const connectionTimeout = setTimeout(() => {
          console.log("Connection timeout");
          this.handleConnectionFailure(
            "Connection timeout - unable to connect to game",
          );
        }, 30000);

        this.peer.on("open", (myId) => {
          console.log("My peer ID:", myId);
          console.log(
            "Attempting to connect to peer:",
            this.peerIdToConnect,
          );
          // FIXED: Wait a bit for peer to be fully ready, then connect
          setTimeout(() => {
            console.log(
              "Attempting to connect to peer:",
              this.peerIdToConnect,
            );

            this.conn = this.peer.connect(this.peerIdToConnect);

            if (!this.conn) {
              console.error("Failed to create connection object");
              clearTimeout(connectionTimeout);
              this.handleConnectionFailure("Failed to create connection");
              return;
            }

            // FIXED: Set up connection handlers immediately after creating connection
            this.conn.on("open", () => {
              clearTimeout(connectionTimeout);
              console.log("Connection established successfully!");

              // Set up data handlers
              this.setupConnection();

              this.toaster(
                "Connected to game! You are O, host is X.",
                "success",
              );

              // Close modal
              const modal = document.getElementById("multiplayer-modal");
              if (modal && modal.open) {
                modal.close();
              }
            });

            this.conn.on("error", (err) => {
              clearTimeout(connectionTimeout);
              console.error("Connection error:", err);
              this.handleConnectionFailure(
                "Failed to connect: " + (err.message || "Unknown error"),
              );
            });

            this.conn.on("close", () => {
              console.log("Connection closed");
              this.toaster("Connection closed by host", "warning");
              this.setGameMode("offline");
            });

            // Additional timeout for connection establishment
            setTimeout(() => {
              if (!this.conn || !this.conn.open) {
                clearTimeout(connectionTimeout);
                this.handleConnectionFailure(
                  "Connection failed to establish - game may not exist",
                );
              }
            }, 20000);
          }, 2000); // Increased wait time for peer stability
        });

        this.peer.on("error", (err) => {
          clearTimeout(connectionTimeout);
          console.error("Peer error:", err);

          let errorMessage = "Connection failed";

          if (err.type === "peer-unavailable") {
            errorMessage = "Game not found - please check the game ID";
          } else if (err.type === "network") {
            errorMessage =
              "Network error - check your internet connection";
          } else if (err.type === "disconnected") {
            errorMessage = "Disconnected from signaling server";
          } else {
            errorMessage =
              "Failed to connect: " + (err.message || "Unknown error");
          }

          this.handleConnectionFailure(errorMessage);
        });
      },

      copyPeerIdToClipboard() {
        const link = `${window.location.origin}${window.location.pathname}?gameId=${this.peerId}`;

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard
            .writeText(link)
            .then(() => {
              this.toaster("Invite link copied to clipboard!", "success");
            })
            .catch((error) => {
              this.handleError("Copy to clipboard", error);
              this.fallbackCopyToClipboard(link);
            });
        } else {
          this.fallbackCopyToClipboard(link);
        }
      },

      fallbackCopyToClipboard(text) {
        try {
          const textArea = document.createElement("textarea");
          textArea.value = text;
          textArea.style.position = "fixed";
          textArea.style.left = "-999999px";
          textArea.style.top = "-999999px";
          document.body.appendChild(textArea);
          textArea.focus();
          textArea.select();
          document.execCommand("copy");
          textArea.remove();
          this.toaster("Invite link copied to clipboard!", "success");
        } catch (error) {
          this.toaster(
            "Please copy this link manually: " + text,
            "info",
            8000,
          );
        }
      },
      makeMove(index) {
        if (!this.canMakeMoveAtIndex(index)) return;

        console.log(
          "Making move at index:",
          index,
          "Current player:",
          this.currentPlayer,
        );

        this.moveHistory.push({ index, player: this.currentPlayer });
        this.cells[index] = this.currentPlayer;
        this.checkGameState();

        this.focusedCellIndex = index;

        // Store the player who just moved BEFORE switching turns
        const playerWhoMoved = this.currentPlayer;

        if (!this.winner && !this.isDraw) {
          this.switchTurn();
        }

        this.announceGameState(
          `${this.getEmoji(playerWhoMoved)} placed in ${this.getCellAriaLabel(index, playerWhoMoved)}`,
        );

        // Only send multiplayer data if in multiplayer mode
        if (this.gameMode === "multiplayer" && this.conn) {
          const moveData = {
            type: "move",
            cells: [...this.cells],
            gridRows: this.gridRows,
            currentPlayer: this.currentPlayer,
            winner: this.winner,
            isDraw: this.isDraw,
            winningCombo: [...this.winningCombo],
            score: { ...this.score },
            moveHistory: [...this.moveHistory],
            usedRandomPowerUps: { ...this.usedRandomPowerUps },
            playerPowerUps: { ...this.playerPowerUps },
            shieldedSquares: [...this.shieldedSquares],
          };
          console.log("Sending move data:", moveData);
          this.conn.send(moveData);
        }
      },

      checkGameState() {
        let wins = [];

        if (this.gridRows === 4) {
          wins = [
            [0, 1, 2],
            [1, 2, 3],
            [4, 5, 6],
            [5, 6, 7],
            [8, 9, 10],
            [9, 10, 11],
            [12, 13, 14],
            [13, 14, 15],
            [0, 4, 8],
            [4, 8, 12],
            [1, 5, 9],
            [5, 9, 13],
            [2, 6, 10],
            [6, 10, 14],
            [3, 7, 11],
            [7, 11, 15],
            [0, 5, 10],
            [1, 6, 11],
            [4, 9, 14],
            [5, 10, 15],
            [2, 5, 8],
            [3, 6, 9],
            [6, 9, 12],
            [7, 10, 13],
          ];
        } else {
          wins = [];

          for (let row = 0; row < this.gridRows; row++) {
            for (let col = 0; col <= 1; col++) {
              const start = row * 4 + col;
              wins.push([start, start + 1, start + 2]);
            }
          }

          for (let col = 0; col < 4; col++) {
            for (let row = 0; row <= this.gridRows - 3; row++) {
              const start = row * 4 + col;
              wins.push([start, start + 4, start + 8]);
            }
          }

          for (let row = 0; row <= this.gridRows - 3; row++) {
            for (let col = 0; col <= 1; col++) {
              const start = row * 4 + col;
              wins.push([start, start + 5, start + 10]);
            }
          }

          for (let row = 0; row <= this.gridRows - 3; row++) {
            for (let col = 2; col <= 3; col++) {
              const start = row * 4 + col;
              wins.push([start, start + 3, start + 6]);
            }
          }
        }

        for (let combo of wins) {
          const [a, b, c] = combo;
          if (
            this.cells[a] &&
            this.cells[a] === this.cells[b] &&
            this.cells[a] === this.cells[c]
          ) {
            this.winner = this.cells[a];
            this.winningCombo = combo;
            this.score[this.winner]++;
            this.toaster(
              `🏆 ${this.getEmoji(this.winner)} wins!`,
              "success",
              5000,
            );
            this.celebrationFireworks();
            this.playSound("clapping");
            this.announceGameState(
              `Game over! ${this.getEmoji(this.winner)} wins!`,
            );
            return;
          }
        }

        if (!this.cells.includes(null)) {
          this.isDraw = true;
          this.toaster("🤝 It's a draw!", "warning", 4000);
          this.announceGameState("Game over! It's a draw!");
        }
      },

      celebrationFireworks() {
        if (typeof confetti === "undefined") return;

        const duration = 3000;
        const animationEnd = Date.now() + duration;
        const defaults = {
          startVelocity: 30,
          spread: 360,
          ticks: 60,
          zIndex: 0,
        };

        function randomInRange(min, max) {
          return Math.random() * (max - min) + min;
        }

        const interval = setInterval(() => {
          const timeLeft = animationEnd - Date.now();

          if (timeLeft <= 0) {
            return clearInterval(interval);
          }

          const particleCount = 50 * (timeLeft / duration);
          confetti({
            ...defaults,
            particleCount,
            origin: {
              x: randomInRange(0.1, 0.3),
              y: Math.random() - 0.2,
            },
          });
          confetti({
            ...defaults,
            particleCount,
            origin: {
              x: randomInRange(0.7, 0.9),
              y: Math.random() - 0.2,
            },
          });
        }, 250);
      },

      resetGame(sync = true) {
        const gameBoard = document.querySelector(".grid");
        if (gameBoard) gameBoard.classList.add("fade-out");

        setTimeout(() => {
          this.cells = Array(16).fill(null);
          this.gridRows = 4;
          this.isExpanding = false;
          this.moveHistory = [];
          this.currentPlayer = "X";
          this.winner = null;
          this.isDraw = false;
          this.winningCombo = [];

          this.swapSelection = [];
          this.slideSelection = [];
          this.teleportSelection = [];

          this.slideMode = "select";
          this.shieldedSquares = Array(24).fill(false);
          this.squareEffects = Array(24).fill(false);
          this.focusedCellIndex = 0;

          // FIXED: Always reset and regenerate power-ups for new game
          this.usedRandomPowerUps = { X: [], O: [] };

          this.playerPowerUps = { X: [], O: [] };
          this.generateBalancedPowerUps();

          if (gameBoard) gameBoard.classList.remove("fade-out");

          this.toaster("New game started!", "info");

          setTimeout(() => {
            this.announceGameState(
              `${this.getEmoji(this.currentPlayer)} goes first!`,
            );
          }, 500);

          if (sync && this.conn && this.conn.open) {
            this.conn.send({
              type: "reset",
              playerPowerUps: { ...this.playerPowerUps },
              usedRandomPowerUps: { ...this.usedRandomPowerUps },
            });
          }
        }, 300);
      },
      playSound(soundName) {
        const audio = new Audio(`/assets/sounds/${soundName}.mp3`);
        audio.volume = 0.3;
        audio.play().catch((e) => console.warn("Sound play failed:", e));
      },
    },

    mounted() {
      try {
        document.getElementById("app-loading").style.display = "none";
        document.getElementById("app").style.display = "block";

        this.setupKeyboardNavigation();
        //  this.playSound("theme");
        this.generateBalancedPowerUps();
        try {
          const saved = localStorage.getItem("tictactoe-score");
          if (saved) {
            this.score = JSON.parse(saved);
          }
        } catch (error) {
          console.warn("Failed to load saved score:", error);
          this.score = { X: 0, O: 0 };
        }

        const gameId = this.getUrlParameter("gameId");
        console.log("Game ID from URL:", gameId);
        if (gameId) {
          this.peerIdToConnect = gameId;
          this.toaster("Connecting to game...", "info", 3000);
          try {
            this.connectToPeer();
          } catch (error) {
            this.handleConnectionFailure(
              "Failed to connect to game",
              error,
            );
          }
        }

        const urlParams = new URLSearchParams(window.location.search);
        const mode = urlParams.get("mode");
        const view = urlParams.get("view");

        if (mode === "multiplayer") {
          this.showMultiplayerModal();
        } else if (view === "rules") {
          this.showAboutModal();
        }

        setTimeout(() => {
          if (!this.winner && !this.isDraw) {
            this.announceGameState(
              `${this.getEmoji(this.currentPlayer)} goes first!`,
            );
          }
        }, 1000);
      } catch (error) {
        console.error("Error during app initialization:", error);
        showErrorBoundary();
      }
    },

    beforeUnmount() {
      // MISSING: Clear AI timeouts
      if (this.aiMoveTimeout) {
        clearTimeout(this.aiMoveTimeout);
      }

      document.removeEventListener("keydown", this.handleKeyDown);

      if (this.peer) {
        this.peer.destroy();
      }

      // MISSING: Close any open connections
      if (this.conn) {
        this.conn.close();
      }

      // MISSING: Clear any pending animation frames
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
      }
    },
  });

  app.mount("#app");
}
