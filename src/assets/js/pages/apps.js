document.addEventListener('DOMContentLoaded', () => {
	const searchInput = document.getElementById('appSearchInput');
	const filterTabs = [...document.querySelectorAll('.filter-tab')];
	const clearButton = document.getElementById('clearCatalogue');
	const noResults = document.getElementById('noResults');
	const status = document.getElementById('catalogueStatus');
	const appGrid = document.getElementById('appGrid');
	const archive = document.querySelector('.ca-archive-notebook');
	const sections = ['appGrid', 'toolsGrid', 'opensourceGrid', 'graveyardGrid'].map((id) => {
		const grid = document.getElementById(id);
		return { id, section: grid.closest('section'), cards: [...grid.querySelectorAll('.app-card')] };
	});
	let activeFilter = 'all';
	let wasFiltering = false;
	let archiveWasOpen = archive.open;
	const initialStatus = status.textContent;

	function applyFilters() {
		const searchTerm = searchInput.value.toLowerCase().trim();
		const filtering = Boolean(searchTerm || activeFilter !== 'all');
		if (filtering && !wasFiltering) archiveWasOpen = archive.open;
		let total = 0;
		sections.forEach(({ id, section, cards }) => {
			const allowed = id !== 'graveyardGrid' || activeFilter === 'all';
			let count = 0;
			cards.forEach((card) => {
				const platforms = card.dataset.platforms || '';
				const content = `${card.dataset.title} ${card.dataset.description} ${platforms}`;
				const matches =
					allowed &&
					content.includes(searchTerm) &&
					(activeFilter === 'all' || platforms.includes(activeFilter.toLowerCase()));
				card.classList.toggle('hidden-card', !matches);
				if (matches) count++;
			});
			section.classList.toggle('section-hidden', count === 0);
			if (id === 'toolsGrid') {
				[section.previousElementSibling, section.nextElementSibling].forEach((wave) => {
					if (wave?.classList.contains('cf-section-wave')) {
						wave.classList.toggle('section-hidden', count === 0);
					}
				});
			}
			if (id === 'graveyardGrid' && searchTerm) archive.open = count > 0;
			total += count;
		});
		if (!filtering && wasFiltering) archive.open = archiveWasOpen;
		appGrid.classList.toggle('is-filtered', filtering);
		document.getElementById('graveyardGrid').classList.toggle('is-filtered', filtering);
		clearButton.hidden = !filtering;
		status.classList.toggle('ca-sr-only', !filtering);
		noResults.classList.toggle('hidden', total > 0);
		status.textContent = filtering
			? `${total} matching ${total === 1 ? 'project' : 'projects'}`
			: initialStatus;
		wasFiltering = filtering;
	}

	function chooseFilter(value) {
		activeFilter = value;
		filterTabs.forEach((tab) => {
			const selected = tab.dataset.filter === value;
			tab.classList.toggle('active', selected);
			tab.setAttribute('aria-pressed', String(selected));
		});
	}
	function resetFilters() {
		searchInput.value = '';
		chooseFilter('all');
		applyFilters();
	}
	filterTabs.forEach((tab) =>
		tab.addEventListener('click', () => {
			chooseFilter(tab.dataset.filter);
			applyFilters();
		})
	);
	searchInput.addEventListener('input', applyFilters);
	searchInput.addEventListener('keydown', (event) => {
		if (event.key === 'Escape') {
			searchInput.value = '';
			applyFilters();
		}
	});
	clearButton.addEventListener('click', () => {
		resetFilters();
		searchInput.focus();
	});
	if (location.hash === '#archive') archive.open = true;
});
