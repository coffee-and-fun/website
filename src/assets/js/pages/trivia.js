(function () {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register("/service-worker.js")
    .then((reg) => {
      console.log("✅ Service worker registered", reg.scope);
      reg.update().catch(() => {});
    })
    .catch((err) => console.log("Service worker error:", err));
})();


var app = Vue.createApp({
  data() {
    return {
      optionColors: ["primary", "secondary", "success", "info"],
      isLoading: true,
      allQuestions: [],
      dailyQuestions: [],
      cards: [],
      currentCardIndex: 0,
      answers: [],
      startTime: null,
      endTime: null,
      quizFinished: false,
      bonusConfig: {
        fast: { time: 60, bonus: 5 },
        medium: { time: 120, bonus: 2 },
      },
    };
  },

  computed: {
    currentQuestion() {
      return this.cards[this.currentCardIndex] || null;
    },

    correctCount() {
      return this.answers.filter((sel, i) => {
        const card = this.cards[i];
        if (!card || sel == null) return false;
        return card.options?.[sel] === card.answer;
      }).length;
    },

    totalTime() {
      if (!this.endTime || !this.startTime) return 0;
      return Math.round((this.endTime - this.startTime) / 1000);
    },

    bonus() {
      if (!this.quizFinished) return 0;
      if (this.totalTime <= this.bonusConfig.fast.time) return this.bonusConfig.fast.bonus;
      if (this.totalTime <= this.bonusConfig.medium.time) return this.bonusConfig.medium.bonus;
      return 0;
    },

    score() {
      const basePoints = this.correctCount * 10;
      const timePenalty = Math.round(this.totalTime);
      return Math.max(0, basePoints - timePenalty + this.bonus);
    },

    accuracy() {
      if (!this.cards.length) return ", ";
      return `${Math.round((this.correctCount / this.cards.length) * 100)}%`;
    },

    rank() {
      if (this.score >= 80) return "🏆 Legend";
      if (this.score >= 50) return "🔥 Hotshot";
      if (this.score >= 20) return "👍 Good";
      return "😂 Awful";
    },

    results() {
      return this.answers.map((sel, i) => {
        const card = this.cards[i];
        const correct = !!card && card.options?.[sel] === card.answer;
        return { correct, index: i + 1 };
      });
    },

    today() {
      return new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    },

    shareText() {
      return [
        `✏️ 10 Daily Trivia - ${this.today}`,
        `Accuracy: ${this.accuracy}`,
        `Correct: ${this.correctCount}/${this.cards.length}`,
        `Score: ${this.score}`,
        this.rank,
      ].join("\n");
    },
  },

  mounted() {
    this.initQuiz();
  },

  methods: {
    optionClass(idx) {
      const answered = this.answers[this.currentCardIndex] !== undefined;
      if (!answered) return `btn-${this.optionColors[idx] || "primary"}`;

      const correctIdx = this.currentQuestion
        ? this.currentQuestion.options.indexOf(this.currentQuestion.answer)
        : -1;

      if (idx === correctIdx) return "btn-success";
      if (idx === this.answers[this.currentCardIndex]) return "btn-error";
      return "opacity-50 cursor-not-allowed";
    },

    copyShareText() {
      const text = this.shareText;

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
          .then(() => alert("Copied to clipboard!"))
          .catch(() => this.fallbackCopy(text));
      } else {
        this.fallbackCopy(text);
      }
    },

    fallbackCopy(text) {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "absolute";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        alert("Copied to clipboard!");
      } catch (e) {
        alert("Could not copy automatically, please copy manually.");
      } finally {
        document.body.removeChild(ta);
      }
    },

    safeJsonParse(value, fallback) {
      try { return JSON.parse(value); } catch { return fallback; }
    },

    initQuiz() {
      fetch("/assets/js/trivia_options.json")
        .then((r) => {
          if (!r.ok) throw new Error(`Failed to load trivia JSON (${r.status})`);
          return r.json();
        })
        .then((data) => {
          this.allQuestions = Array.isArray(data?.questions) ? data.questions : [];
          console.log(`Loaded ${this.allQuestions.length} questions`);
          this.setupDaily();
          this.loadState();
        })
        .catch((err) => {
          console.error(err);
          this.isLoading = false;
        });
    },

    setupDaily() {
      const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD
      const prev = localStorage.getItem("dailyDate");

      if (prev !== today) {
        ["dailyDate", "dailyQuestions", "quizState"].forEach((k) => localStorage.removeItem(k));
        localStorage.setItem("dailyDate", today);
      }

      let dq = this.safeJsonParse(localStorage.getItem("dailyQuestions"), null);
      if (!Array.isArray(dq) || dq.length === 0) {
        dq = this.pickDailyQuestions(10);
        localStorage.setItem("dailyQuestions", JSON.stringify(dq));
      }
      this.dailyQuestions = dq;
    },

    pickDailyQuestions(count) {
      const dateNum = parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ""), 10);

      return this.allQuestions
        .map((q, i) => {
          const seed = i + dateNum;
          const rnd = Math.sin(seed) * 10000;
          return { q, key: rnd - Math.floor(rnd) };
        })
        .sort((a, b) => a.key - b.key)
        .slice(0, count)
        .map((obj) => ({
          ...obj.q,
          options: this.shuffle(obj.q.options),
        }));
    },

    shuffle(arr) {
      const a = Array.isArray(arr) ? arr.slice() : [];
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },

    loadState() {
      const today = localStorage.getItem("dailyDate");
      const st = this.safeJsonParse(localStorage.getItem("quizState"), null);

      this.cards = this.dailyQuestions;

      if (st && st.date === today) {
        this.currentCardIndex = Number.isFinite(st.currentCardIndex) ? st.currentCardIndex : 0;
        this.answers = Array.isArray(st.answers) ? st.answers : [];
        this.startTime = typeof st.startTime === "number" ? st.startTime : Date.now();

        if (st.finished) {
          this.endTime = typeof st.endTime === "number" ? st.endTime : Date.now();
          this.quizFinished = true;
        } else {
          this.quizFinished = false;
          this.endTime = null;
        }
      } else {
        this.currentCardIndex = 0;
        this.answers = [];
        this.startTime = Date.now();
        this.endTime = null;
        this.quizFinished = false;
        this.saveState();
      }

      this.isLoading = false;
    },

    saveState() {
      const st = {
        date: localStorage.getItem("dailyDate"),
        currentCardIndex: this.currentCardIndex,
        answers: this.answers,
        startTime: this.startTime,
        endTime: this.endTime,
        finished: this.quizFinished,
      };
      localStorage.setItem("quizState", JSON.stringify(st));
    },

    selectOption(idx) {
      if (this.quizFinished) return;
      if (this.answers[this.currentCardIndex] != null) return;

      this.answers[this.currentCardIndex] = idx;
      this.saveState();

      setTimeout(() => this.nextQuestion(), 600);
    },

    nextQuestion() {
      if (this.currentCardIndex < this.cards.length - 1) {
        this.currentCardIndex++;
      } else {
        this.finishQuiz();
      }
      this.saveState();
    },

    prevQuestion() {
      if (this.currentCardIndex > 0) {
        this.currentCardIndex--;
        this.saveState();
      }
    },

    finishQuiz() {
      this.endTime = Date.now();
      this.quizFinished = true;
      this.saveState();
    },
  },
}).mount("#main-content");
