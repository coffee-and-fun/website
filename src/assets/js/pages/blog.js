document.addEventListener('DOMContentLoaded', () => {
	const searchInput = document.getElementById('blogSearchInput');
	const filterTabs = [...document.querySelectorAll('.filter-tab')];
	const clearButton = document.getElementById('clearBlog');
	const status = document.getElementById('blogStatus');
	const noResults = document.getElementById('noResults');
	const grid = document.getElementById('blogGrid');
	const cards = [...grid.querySelectorAll('.blog-card-item')];
	const pagination = document.getElementById('blogPagination');
	const progress = document.getElementById('blogProgress');
	const loadMore = document.getElementById('loadMoreStories');
	const pageSize = 12;
	let visibleLimit = pageSize;
	let activeFilter = 'all';

	function applyFilters() {
		const query = searchInput.value.toLowerCase().trim();
		const filtering = Boolean(query || activeFilter !== 'all');
		let matches = 0;
		cards.forEach((card) => {
			const topics = (card.dataset.platforms || '').split(' ');
			const content = `${card.dataset.title} ${card.dataset.description} ${card.dataset.platforms}`;
			const match =
				content.includes(query) && (activeFilter === 'all' || topics.includes(activeFilter));
			if (match) matches++;
			card.hidden = !match || matches > visibleLimit;
		});
		const shown = Math.min(matches, visibleLimit);
		grid.classList.toggle('is-filtered', filtering);
		clearButton.hidden = !filtering;
		status.classList.toggle('bl-sr-only', !filtering);
		status.textContent = matches
			? `Showing ${shown} of ${matches} ${filtering ? 'matching ' : ''}${matches === 1 ? 'story' : 'stories'}`
			: 'No matching stories';
		noResults.hidden = matches > 0;
		pagination.hidden = matches === 0;
		loadMore.hidden = shown >= matches;
		progress.textContent = `${shown} of ${matches} ${matches === 1 ? 'story' : 'stories'}`;
	}

	function chooseFilter(value) {
		activeFilter = value;
		filterTabs.forEach((tab) => {
			const selected = tab.dataset.filter === value;
			tab.classList.toggle('active', selected);
			tab.setAttribute('aria-pressed', String(selected));
		});
	}
	filterTabs.forEach((tab) =>
		tab.addEventListener('click', () => {
			chooseFilter(tab.dataset.filter);
			visibleLimit = pageSize;
			applyFilters();
		})
	);
	searchInput.addEventListener('input', () => {
		visibleLimit = pageSize;
		applyFilters();
	});
	searchInput.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') {
			searchInput.value = '';
			visibleLimit = pageSize;
			applyFilters();
		}
	});
	clearButton.addEventListener('click', () => {
		searchInput.value = '';
		chooseFilter('all');
		visibleLimit = pageSize;
		applyFilters();
		searchInput.focus();
	});
	loadMore.addEventListener('click', () => {
		const visibleBefore = new Set(cards.filter((card) => !card.hidden));
		visibleLimit += pageSize;
		applyFilters();
		const firstNewCard = cards.find((card) => !card.hidden && !visibleBefore.has(card));
		firstNewCard?.focus({ preventScroll: true });
	});
	// All links are rendered and remain available when JavaScript is unavailable.
	applyFilters();
});
