document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('appSearchInput');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const noResults = document.getElementById('noResults');
    const appGrid = document.getElementById('appGrid');
    const toolsGrid = document.getElementById('toolsGrid');
    const appsSection = appGrid.closest('section');
    const toolsSection = toolsGrid.closest('section');
    const opensourceSection = document.getElementById('opensourceGrid').closest('section');
    const graveyardSection = document.getElementById('graveyardGrid').closest('section');

    const mainCards = appGrid.querySelectorAll('.app-card');
    const toolCards = toolsGrid.querySelectorAll('.app-card');
    const osCards = document.getElementById('opensourceGrid').querySelectorAll('.app-card');
    const gyCards = document.getElementById('graveyardGrid').querySelectorAll('.app-card');

    let activeFilter = 'all';

    function filterCards(cards, searchTerm) {
        let count = 0;
        cards.forEach(card => {
            const title = card.dataset.title || '';
            const description = card.dataset.description || '';
            const platforms = card.dataset.platforms || '';
            const content = title + ' ' + description + ' ' + platforms;

            const matchesSearch = searchTerm === '' || content.includes(searchTerm);
            const matchesFilter = activeFilter === 'all' || platforms.includes(activeFilter.toLowerCase());

            if (matchesSearch && matchesFilter) {
                card.classList.remove('hidden-card');
                count++;
            } else {
                card.classList.add('hidden-card');
            }
        });
        return count;
    }

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase().trim();

        const mainCount = filterCards(mainCards, searchTerm);
        const toolsCount = filterCards(toolCards, searchTerm);
        const osCount = filterCards(osCards, searchTerm);
        const gyCount = filterCards(gyCards, searchTerm);

        // Hide entire sections if no visible cards or filter doesn't match
        const showOS = activeFilter === 'all' || activeFilter === 'Open Source';
        const showGY = activeFilter === 'all';

        if (mainCount > 0) {
            appsSection.classList.remove('section-hidden');
        } else {
            appsSection.classList.add('section-hidden');
        }

        if (toolsCount > 0) {
            toolsSection.classList.remove('section-hidden');
        } else {
            toolsSection.classList.add('section-hidden');
        }

        if (showOS && osCount > 0) {
            opensourceSection.classList.remove('section-hidden');
        } else {
            opensourceSection.classList.add('section-hidden');
        }

        if (showGY && gyCount > 0) {
            graveyardSection.classList.remove('section-hidden');
        } else {
            graveyardSection.classList.add('section-hidden');
        }

        // No results
        const totalVisible = mainCount + toolsCount + (showOS ? osCount : 0) + (showGY ? gyCount : 0);
        if (totalVisible === 0) {
            noResults.classList.remove('hidden');
        } else {
            noResults.classList.add('hidden');
        }
    }

    // Tab clicks
    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            activeFilter = this.dataset.filter;
            applyFilters();
        });
    });

    // Search
    searchInput.addEventListener('input', applyFilters);
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            searchInput.value = '';
            applyFilters();
        }
    });
});
