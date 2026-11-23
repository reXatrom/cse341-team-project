
const searchInput = document.getElementById('trip-search');
const regionFilter = document.getElementById('region-filter');
const seasonFilter = document.getElementById('season-filter');
const tripsContainer = document.getElementById('trips-container');
const tripStatus = document.getElementById('trip-status');
const pagination = document.getElementById('trip-pagination');
const previousButton = document.getElementById('previous-page');
const nextButton = document.getElementById('next-page');
const pageInformation = document.getElementById('page-information');

let currentPage = 1;
const pageLimit = 10;
let searchTimeout;
let activeRequest;

// Escape API-provided text before inserting it into HTML.
function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (character) => {
        const entities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };

        return entities[character];
    });
}

function renderTrip(trip) {
    const highlights = Array.isArray(trip.highlights)
        ? trip.highlights
        : [];

    const region = escapeHtml(trip.region);
    const season = escapeHtml(trip.bestSeason);

    const highlightTags = highlights.map((highlight) => `
        <span class="highlight-tag">
            ${escapeHtml(highlight)}
        </span>
    `).join('');

    return `
        <div class="route-card">
            <div class="route-header">
                <h2 class="route-name">
                    ${escapeHtml(trip.name)}
                </h2>
                <span class="route-region">${region}</span>
            </div>

            <div class="station-info">
                <div class="station">
                    <div class="station-type">From:</div>
                    <div class="station-name">
                        ${escapeHtml(trip.startStation)}
                    </div>
                </div>

                <div class="route-arrow">&#8594;</div>

                <div class="station">
                    <div class="station-type">To:</div>
                    <div class="station-name">
                        ${escapeHtml(trip.endStation)}
                    </div>
                </div>
            </div>

            <div class="route-details">
                <div class="detail-item">
                    <span class="detail-icon">&#128337;</span>
                    <span>
                        <span class="detail-label">Duration:</span>
                        ${escapeHtml(trip.duration)}
                    </span>
                </div>

                <div class="detail-item">
                    <span class="detail-icon">&#128205;</span>
                    <span>
                        <span class="detail-label">Distance:</span>
                        ${escapeHtml(trip.distance)}km
                    </span>
                </div>

                <div class="detail-item">
                    <span class="season-badge">
                        Best in ${season}
                    </span>
                </div>
            </div>

            <div class="route-description">
                ${escapeHtml(trip.description)}
            </div>

            <div class="highlights">
                <div class="highlights-list">
                    ${highlightTags}
                </div>
            </div>

            <div class="route-actions">
                <a
                    href="/trips/${encodeURIComponent(String(trip.id ?? ''))}"
                    class="view-details-btn"
                >
                    View Details &amp; Book &#8594;
                </a>
            </div>
        </div>
    `;
}

async function loadTrips() {
    if (activeRequest) {
        activeRequest.abort();
    }

    const controller = new AbortController();
    activeRequest = controller;

    const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageLimit)
    });

    const region = regionFilter.value;
    const season = seasonFilter.value;
    const keyword = searchInput.value.trim();

    if (region) {
        params.set('region', region);
    }

    if (season) {
        params.set('season', season);
    }

    if (keyword) {
        params.set('q', keyword);
    }

    tripStatus.textContent = 'Loading trips...';
    tripsContainer.innerHTML = '';
    pagination.hidden = true;

    try {
        const response = await fetch(`/api/trips?${params}`, {
            signal: controller.signal
        });

        if (!response.ok) {
            throw new Error('Unable to retrieve trips.');
        }

        const result = await response.json();

        if (!Array.isArray(result.data) || !result.pagination) {
            throw new Error('Unexpected API response format.');
        }

        if (result.data.length === 0) {
            tripStatus.textContent = 'No matching trips found.';
            return;
        }

        tripsContainer.innerHTML = result.data
            .map(renderTrip)
            .join('');

        const page = result.pagination;

        tripStatus.textContent =
            `Showing ${result.data.length} of ${page.totalItems} matching trips.`;

        pageInformation.textContent =
            `Page ${page.page} of ${page.totalPages}`;

        previousButton.disabled = !page.hasPreviousPage;
        nextButton.disabled = !page.hasNextPage;

        pagination.hidden = false;
    } catch (error) {
        if (error.name === 'AbortError') {
            return;
        }

        tripStatus.textContent =
            'Unable to load trips. Please try again.';
        console.error('Trip loading error:', error);
    } finally {
        if (activeRequest === controller) {
            activeRequest = null;
        }
    }
}

function resetAndLoad() {
    currentPage = 1;
    loadTrips();
}

regionFilter.addEventListener('change', resetAndLoad);
seasonFilter.addEventListener('change', resetAndLoad);

searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);

    searchTimeout = setTimeout(() => {
        resetAndLoad();
    }, 350);
});

previousButton.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage -= 1;
        loadTrips();
    }
});

nextButton.addEventListener('click', () => {
    currentPage += 1;
    loadTrips();
});

loadTrips();
