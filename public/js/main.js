
const hookRegionSorter = () => {
    const regionSelect = document.getElementById('region-filter');

    if (regionSelect) {
        const params = new URLSearchParams(window.location.search);
        const selectedRegion = params.get('region');

        if (selectedRegion) {
            regionSelect.value = selectedRegion;
        }

        regionSelect.addEventListener('change', () => {
            const url = new URL(window.location.href);
            const region = regionSelect.value;

            if (region && region !== 'all') {
                url.searchParams.set('region', region);
            } else {
                url.searchParams.delete('region');
            }

            url.searchParams.delete('page');
            window.location.href = url.toString();
        });
    }
};

const hookSeasonSorter = () => {
    const seasonSelect = document.getElementById('season-filter');

    if (seasonSelect) {
        const params = new URLSearchParams(window.location.search);
        const selectedSeason = params.get('season');

        if (selectedSeason) {
            seasonSelect.value = selectedSeason;
        }

        seasonSelect.addEventListener('change', () => {
            const url = new URL(window.location.href);
            const season = seasonSelect.value;

            if (season && season !== 'all') {
                url.searchParams.set('season', season);
            } else {
                url.searchParams.delete('season');
            }

            url.searchParams.delete('page');
            window.location.href = url.toString();
        });
    }
};

const hookTrainsCatalog = () => {
    const listEl = document.getElementById('trains-list');
    const templateEl = document.getElementById('train-card-template');
    const loadingEl = document.getElementById('trains-loading');
    const errorEl = document.getElementById('trains-error');

    const previousButton = document.getElementById('trains-previous');
    const nextButton = document.getElementById('trains-next');
    const pageInfo = document.getElementById('trains-page-info');
    const resultCount = document.getElementById('trains-result-count');

    const filterForm = document.getElementById('trains-filter-form');
    const resetButton = document.getElementById('trains-reset');

    if (!listEl || !templateEl) {
        return;
    }

    const initialParams = new URLSearchParams(window.location.search);
    const initialPage = Number(initialParams.get('page'));

    let currentPage = Number.isSafeInteger(initialPage) && initialPage > 0
        ? initialPage
        : 1;

    const pageLimit = 10;
    let requestController = null;

    const getFilters = () => ({
        search: document.getElementById('trains-search')?.value.trim() || '',
        operator: document.getElementById('trains-operator')?.value || '',
        type: document.getElementById('trains-type')?.value || '',
        powerSource: document.getElementById('trains-power')?.value || ''
    });

    const loadTrains = async (page) => {
        if (requestController) {
            requestController.abort();
        }

        requestController = new AbortController();

        // Preserve existing URL parameters.
        const params = new URLSearchParams(window.location.search);

        // Update pagination parameters.
        params.set('page', String(page));
        params.set('limit', String(pageLimit));

        // Apply Trains-specific search and filters.
        const filters = getFilters();

        Object.entries(filters).forEach(([key, value]) => {
            if (value && value !== 'all') {
                params.set(key, value);
            } else {
                params.delete(key);
            }
        });

        if (loadingEl) {
            loadingEl.hidden = false;
        }

        if (errorEl) {
            errorEl.hidden = true;
        }

        if (previousButton) {
            previousButton.disabled = true;
        }

        if (nextButton) {
            nextButton.disabled = true;
        }

        try {
            const response = await fetch(
                `/api/trains?${params.toString()}`,
                { signal: requestController.signal }
            );

            if (!response.ok) {
                throw new Error('Failed to load trains.');
            }

            const payload = await response.json();
            const trains = payload.trains || [];
            const pagination = payload.pagination;

            if (!Array.isArray(trains) || !pagination) {
                throw new Error('Invalid pagination response.');
            }

            const fragment = document.createDocumentFragment();

            trains.forEach((train) => {
                const card = templateEl.content.cloneNode(true);

                const imageEl = card.querySelector(
                    '[data-field="image"]'
                );

                if (imageEl) {
                    if (train.imageUrl) {
                        imageEl.src = train.imageUrl;
                        imageEl.alt = train.imageAlt ||
                            `${train.name} train`;
                    } else {
                        imageEl.remove();
                    }
                }

                const setField = (field, value) => {
                    const element = card.querySelector(
                        `[data-field="${field}"]`
                    );

                    if (element) {
                        element.textContent = value ?? '';
                    }
                };

                setField('name', train.name);
                setField('operator', train.operator);
                setField('type', train.type);

                setField(
                    'speed',
                    train.maxSpeedKmh == null
                        ? ''
                        : `${train.maxSpeedKmh} km/h`
                );

                setField(
                    'seats',
                    train.capacity == null
                        ? ''
                        : `${train.capacity} seats`
                );

                setField('power', train.powerSource);
                setField('description', train.description);
                setField('best-for', train.bestFor);

                fragment.appendChild(card);
            });

            listEl.replaceChildren(fragment);
            currentPage = pagination.page;

            if (resultCount) {
                resultCount.textContent =
                    `${pagination.totalItems} matching train(s)`;
            }

            if (pageInfo) {
                pageInfo.textContent = pagination.totalItems === 0
                    ? 'No matching trains found'
                    : `Page ${pagination.page} of ${pagination.totalPages}`;
            }

            if (previousButton) {
                previousButton.disabled =
                    !pagination.hasPreviousPage;
            }

            if (nextButton) {
                nextButton.disabled = !pagination.hasNextPage;
            }

            if (loadingEl) {
                loadingEl.hidden = true;
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                return;
            }

            console.error('Train loading error:', error);

            if (loadingEl) {
                loadingEl.hidden = true;
            }

            if (errorEl) {
                errorEl.hidden = false;
                errorEl.textContent =
                    'Unable to load trains. Please try again.';
            }
        }
    };

    if (filterForm) {
        filterForm.addEventListener('submit', (event) => {
            event.preventDefault();
            loadTrains(1);
        });
    }

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            if (filterForm) {
                filterForm.reset();
            }

            loadTrains(1);
        });
    }

    if (previousButton) {
        previousButton.addEventListener('click', () => {
            if (currentPage > 1) {
                loadTrains(currentPage - 1);
            }
        });
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            loadTrains(currentPage + 1);
        });
    }

    loadTrains(currentPage);
};

document.addEventListener('DOMContentLoaded', () => {
    hookRegionSorter();
    hookSeasonSorter();
    hookTrainsCatalog();
});
