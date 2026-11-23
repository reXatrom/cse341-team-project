
const tripsContainer = document.querySelector('#trips-admin-container');
const messageContainer = document.querySelector('#trips-message');
const previousButton = document.querySelector('#previous-page');
const nextButton = document.querySelector('#next-page');
const pageInformation = document.querySelector('#page-information');

const regionFilter = document.querySelector('#region-filter');
const seasonFilter = document.querySelector('#season-filter');
const tripSearch = document.querySelector('#trip-search');

const state = {
  page: 1,
  limit: 10,
  totalPages: 0,
  region: '',
  season: '',
  q: ''
};

// Display a message to the administrator.
function showMessage(message, isError = false) {
  messageContainer.textContent = message;
  messageContainer.classList.toggle('error', isError);
}

// Create an HTML element and safely insert text.
function createTextElement(tagName, text, parent) {
  const element = document.createElement(tagName);
  element.textContent = text;
  parent.appendChild(element);
  return element;
}

// Display one trip.
function displayTrip(trip) {
  const article = document.createElement('article');
  article.className = 'trip-admin-card';

  createTextElement('h2', trip.name, article);
  createTextElement('p', trip.description, article);
  createTextElement('p', `Region: ${trip.region}`, article);
  createTextElement('p', `Best season: ${trip.bestSeason}`, article);

  createTextElement(
    'p',
    `Route: ${trip.startStation} to ${trip.endStation}`,
    article
  );

  createTextElement('p', `Duration: ${trip.duration}`, article);
  createTextElement('p', `Distance: ${trip.distance}`, article);

  if (Array.isArray(trip.highlights) && trip.highlights.length > 0) {
    createTextElement('h3', 'Highlights', article);

    const list = document.createElement('ul');

    trip.highlights.forEach((highlight) => {
      createTextElement('li', highlight, list);
    });

    article.appendChild(list);
  }

  tripsContainer.appendChild(article);
}

// Update the pagination controls.
function updatePagination(pagination) {
  state.page = pagination.page;
  state.totalPages = pagination.totalPages;

  pageInformation.textContent =
    pagination.totalPages === 0
      ? 'No pages'
      : `Page ${pagination.page} of ${pagination.totalPages}`;

  previousButton.disabled = !pagination.hasPreviousPage;
  nextButton.disabled = !pagination.hasNextPage;
}

// Retrieve and display trips from the API.
async function loadTrips() {
  tripsContainer.replaceChildren();
  showMessage('Loading trips...');

  previousButton.disabled = true;
  nextButton.disabled = true;

  const params = new URLSearchParams({
    page: state.page,
    limit: state.limit
  });

  if (state.region) {
    params.set('region', state.region);
  }

  if (state.season) {
    params.set('season', state.season);
  }

  if (state.q) {
    params.set('q', state.q);
  }

  try {
    const response = await fetch(`/api/trips?${params.toString()}`);
    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Failed to load trips.');
    }

    if (
      !Array.isArray(result.data) ||
      !result.pagination
    ) {
      throw new Error('The server returned an unexpected response.');
    }

    if (result.data.length === 0) {
      createTextElement('p', 'No trips found.', tripsContainer);
    } else {
      result.data.forEach(displayTrip);
    }

    updatePagination(result.pagination);

    showMessage(
      `Showing ${result.data.length} of ${result.pagination.totalItems} matching trips.`
    );
  } catch (error) {
    console.error('Error loading trips:', error);
    showMessage(error.message, true);

    createTextElement(
      'p',
      'Unable to load trips. Please try again.',
      tripsContainer
    );

    pageInformation.textContent = 'Page unavailable';
  }
}

// Apply filters and return to the first page.
function applyFilters() {
  state.region = regionFilter.value;
  state.season = seasonFilter.value;
  state.q = tripSearch.value.trim();
  state.page = 1;

  loadTrips();
}

// Apply the selected region.
regionFilter.addEventListener('change', applyFilters);

// Apply the selected season.
seasonFilter.addEventListener('change', applyFilters);

// Search trip names and descriptions.
tripSearch.addEventListener('input', applyFilters);

// Load the previous page.
previousButton.addEventListener('click', () => {
  if (state.page > 1) {
    state.page -= 1;
    loadTrips();
  }
});

// Load the next page.
nextButton.addEventListener('click', () => {
  if (state.page < state.totalPages) {
    state.page += 1;
    loadTrips();
  }
});

// Load the first page when the page opens.
loadTrips();
