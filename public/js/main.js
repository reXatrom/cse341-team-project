
const hookRegionSorter = () => {
    const regionSelect = document.getElementById('region-filter');

    if (regionSelect) {
        regionSelect.addEventListener('change', () => {
            const url = new URL(window.location.href);
            const region = regionSelect.value;

            if (region && region !== 'all') {
                url.searchParams.set('region', region);
            } else {
                url.searchParams.delete('region');
            }

            window.location.href = url.toString();
        });
    }
};

const hookSeasonSorter = () => {
    const seasonSelect = document.getElementById('season-filter');

    if (seasonSelect) {
        seasonSelect.addEventListener('change', () => {
            const url = new URL(window.location.href);
            const season = seasonSelect.value;

            if (season && season !== 'all') {
                url.searchParams.set('season', season);
            } else {
                url.searchParams.delete('season');
            }

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

    if (!listEl || !templateEl) {
        return;
    }

    let currentPage = 1;
    const pageLimit = 10;

    const loadTrains = async (page) => {
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
                `/api/trains?page=${page}&limit=${pageLimit}`
            );

            if (!response.ok) {
                throw new Error('Failed to load trains.');
            }

            const payload = await response.json();
            const trains = payload.trains || [];
            const pagination = payload.pagination;

            if (!pagination) {
                throw new Error('Pagination data is missing.');
            }

            const fragment = document.createDocumentFragment();

            trains.forEach((train) => {
                const card = templateEl.content.cloneNode(true);

                const imageEl = card.querySelector(
                    '[data-field="image"]'
                );

                if (train.imageUrl) {
                    imageEl.src = train.imageUrl;
                    imageEl.alt = train.imageAlt ||
                        `${train.name} train`;
                } else {
                    imageEl.remove();
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

            if (pageInfo) {
                pageInfo.textContent = pagination.totalItems === 0
                    ? 'No trains available'
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

    loadTrains(1);
};

document.addEventListener('DOMContentLoaded', () => {
    hookRegionSorter();
    hookSeasonSorter();
    hookTrainsCatalog();
});
