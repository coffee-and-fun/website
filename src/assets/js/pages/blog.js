document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('blogSearchInput');
    const filterTabs = document.querySelectorAll('.filter-tab');
    const noResults = document.getElementById('noResults');
    const blogCards = document.querySelectorAll('.blog-card-item');

    let activeFilter = 'all';

    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        let visibleCount = 0;

        blogCards.forEach(card => {
            const title = card.dataset.title || '';
            const description = card.dataset.description || '';
            const platforms = card.dataset.platforms || '';
            const content = title + ' ' + description + ' ' + platforms;

            const matchesSearch = searchTerm === '' || content.includes(searchTerm);
            const matchesFilter = activeFilter === 'all' || platforms.includes(activeFilter.toLowerCase());

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
