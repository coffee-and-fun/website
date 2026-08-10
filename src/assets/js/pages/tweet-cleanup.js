/* Twitter/X Cleanup Script Builder
 * Builds a console script from the options you pick. Nothing runs here and
 * nothing is sent anywhere, the page only assembles text for you to copy.
 */
const { createApp } = Vue;

createApp({
	data() {
		return {
			targets: { retweets: true, likes: false, tweets: false },
			maxCycles: 20,
			requestCap: 50,
			pauseMinutes: 15,
			scrollStep: 2000,
			copied: false,
			copyFailed: false,
			announcement: ''
		};
	},

	computed: {
		nothingSelected() {
			return !this.targets.retweets && !this.targets.likes && !this.targets.tweets;
		},

		selectedLabels() {
			const out = [];
			if (this.targets.retweets) out.push('retweets');
			if (this.targets.likes) out.push('likes');
			if (this.targets.tweets) out.push('your own tweets');
			return out;
		},

		humanSelection() {
			const l = this.selectedLabels;
			if (!l.length) return 'nothing yet';
			if (l.length === 1) return l[0];
			return l.slice(0, -1).join(', ') + ' and ' + l[l.length - 1];
		},

		// Rough guide only. Twitter's own limits decide the real number.
		estimate() {
			const perCycle = 8;
			const actions = this.maxCycles * perCycle;
			const pauses = Math.floor(actions / this.requestCap);
			const minutes = Math.round(actions * 0.05 + pauses * this.pauseMinutes);
			return { actions, pauses, minutes };
		},

		script() {
			const t = this.targets;
			return `// Coffee & Fun cleanup script
// Removes: ${this.humanSelection}
// Paste into the console on your own profile page, then press Enter.

(async function cleanUpTwitter() {
	const delay = (ms) => new Promise((res) => setTimeout(res, ms));
	const MAX_REQUESTS_PER_WINDOW = ${this.requestCap};
	const RATE_LIMIT_WINDOW_MS = ${this.pauseMinutes} * 60 * 1000;
	const DO_RETWEETS = ${t.retweets};
	const DO_LIKES = ${t.likes};
	const DO_TWEETS = ${t.tweets};

	let requestCount = 0;
	let removed = 0;
	let cycles = 0;
	const maxCycles = ${this.maxCycles};

	async function waitForElement(selector, timeout = 5000) {
		let elapsed = 0;
		while (elapsed < timeout) {
			const el = document.querySelector(selector);
			if (el) return el;
			await delay(100);
			elapsed += 100;
		}
		return null;
	}

	async function handleRateLimit() {
		if (requestCount >= MAX_REQUESTS_PER_WINDOW) {
			console.log('⏸️ Around ' + MAX_REQUESTS_PER_WINDOW + ' actions done. Pausing ${this.pauseMinutes} minutes so X does not rate limit you.');
			await delay(RATE_LIMIT_WINDOW_MS);
			requestCount = 0;
			console.log('🔄 Resuming.');
		}
	}

	async function undoRetweets() {
		const buttons = document.querySelectorAll('[data-testid="unretweet"]');
		for (const button of buttons) {
			try {
				await handleRateLimit();
				button.click();
				const confirm = await waitForElement('[data-testid="unretweetConfirm"]');
				if (confirm) {
					confirm.click();
					requestCount++;
					removed++;
					await delay(700);
				}
			} catch (err) {
				console.warn('Skipped one retweet', err);
			}
		}
	}

	async function undoLikes() {
		const buttons = document.querySelectorAll('[data-testid="unlike"]');
		for (const button of buttons) {
			try {
				await handleRateLimit();
				button.click();
				requestCount++;
				removed++;
				await delay(700);
			} catch (err) {
				console.warn('Skipped one like', err);
			}
		}
	}

	async function deleteTweets() {
		const menus = document.querySelectorAll('[data-testid="caret"]');
		for (const menu of menus) {
			try {
				await handleRateLimit();
				menu.click();
				const del = await waitForElement('[data-testid="Dropdown"] [role="menuitem"]');
				if (del && /delete/i.test(del.textContent || '')) {
					del.click();
					const confirm = await waitForElement('[data-testid="confirmationSheetConfirm"]');
					if (confirm) {
						confirm.click();
						requestCount++;
						removed++;
						await delay(900);
					}
				} else {
					document.body.click();
				}
			} catch (err) {
				console.warn('Skipped one tweet', err);
			}
		}
	}

	console.log('🚨 Starting cleanup. Removing: ${this.humanSelection}.');
	console.log('Refresh the page at any time to stop.');

	while (cycles < maxCycles) {
		console.log('📦 Cycle ' + (cycles + 1) + ' of ' + maxCycles);
		if (DO_RETWEETS) await undoRetweets();
		if (DO_LIKES) await undoLikes();
		if (DO_TWEETS) await deleteTweets();
		window.scrollBy(0, ${this.scrollStep});
		await delay(1000);
		cycles++;
		console.log('✅ Cycle ' + cycles + ' done. ' + removed + ' removed so far.');
	}

	console.log('🎉 Finished. ' + removed + ' items removed. Run it again if there is more left.');
})();`;
		}
	},

	methods: {
		announce(msg) {
			this.announcement = msg;
		},

		async copyScript() {
			if (this.nothingSelected) return;
			this.copyFailed = false;
			try {
				await navigator.clipboard.writeText(this.script);
				this.copied = true;
				this.announce('Script copied. Paste it into the console on your profile page.');
				setTimeout(() => { this.copied = false; }, 2500);
			} catch (err) {
				this.copyFailed = true;
				this.announce('Copy did not work. Select the script and press Ctrl+C or Cmd+C.');
				const pre = this.$refs.scriptPre;
				if (pre && window.getSelection) {
					const range = document.createRange();
					range.selectNodeContents(pre);
					const sel = window.getSelection();
					sel.removeAllRanges();
					sel.addRange(range);
				}
			}
		},

		reset() {
			this.targets = { retweets: true, likes: false, tweets: false };
			this.maxCycles = 20;
			this.requestCap = 50;
			this.pauseMinutes = 15;
			this.scrollStep = 2000;
			this.announce('Back to the defaults.');
		}
	}
}).mount('#app');
