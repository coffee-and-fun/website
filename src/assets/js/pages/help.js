document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('helpSearchInput');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const noResults = document.getElementById('noResults');
    const helpCards = document.querySelectorAll('.help-card-item');

    let activeFilter = 'all';

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        let visibleCount = 0;

        helpCards.forEach(card => {
            const title = card.dataset.title || '';
            const description = card.dataset.description || '';
            const category = card.dataset.category || '';
            const platforms = card.dataset.platforms || '';
            const app = card.dataset.app || '';
            const content = title + ' ' + description + ' ' + category + ' ' + platforms + ' ' + app;

            const matchesSearch = searchTerm === '' || content.includes(searchTerm);
            const matchesFilter = activeFilter === 'all'
                || category.includes(activeFilter.toLowerCase())
                || app.includes(activeFilter.toLowerCase());

            if (matchesSearch && matchesFilter) {
                card.classList.remove('hidden-card');
                visibleCount++;
            } else {
                card.classList.add('hidden-card');
            }
        });

        if (visibleCount === 0) {
            noResults.classList.remove('hidden');
        } else {
            noResults.classList.add('hidden');
        }
    }

    filterTabs.forEach(tab => {
        tab.addEventListener('click', function() {
            filterTabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            activeFilter = this.dataset.filter;
            applyFilters();
        });
    });

    searchInput.addEventListener('input', applyFilters);
    searchInput.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            searchInput.value = '';
            applyFilters();
        }
    });
});
