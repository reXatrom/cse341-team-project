const tableBody = document.getElementById('bookings-table-body');
const message = document.getElementById('bookings-message');
const previousButton = document.getElementById('bookings-previous-page');
const nextButton = document.getElementById('bookings-next-page');
const pageInformation = document.getElementById('bookings-page-information');

const filterForm = document.getElementById('bookings-filter-form');
const ticketClassInput = document.getElementById('bookings-ticket-class');
const startDateInput = document.getElementById('bookings-start-date');
const endDateInput = document.getElementById('bookings-end-date');
const resetFiltersButton = document.getElementById('bookings-reset-filters');

const state = {
    page: 1,
    limit: 10,
    totalPages: 0,
    filters: {},
    controller: null
};

// Display a message to the administrator.
function showMessage(text, isError = false) {
    message.textContent = text;
    message.classList.toggle('error', isError);
}

// Format the booking date.
function formatDate(value) {
    if (!value) {
        return 'Not available';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return 'Not available';
    }

    return date.toLocaleString();
}

// Display bookings in the table.
function renderBookings(bookings) {
    tableBody.replaceChildren();

    if (bookings.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');

        cell.colSpan = 5;
        cell.textContent = 'No bookings found.';

        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }

    bookings.forEach((booking) => {
        const row = document.createElement('tr');

        const values = [
            booking.id || 'N/A',
            formatDate(booking.createdAt),
            booking.ticketClass || 'N/A',
            booking.selectedDay || 'N/A',
            booking.passengerCount ?? 0
        ];

        values.forEach((value) => {
            const cell = document.createElement('td');
            cell.textContent = String(value);
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });
}

// Update pagination information and button states.
function updatePagination(pagination) {
    state.totalPages = pagination.totalPages;

    pageInformation.textContent =
        `Page ${pagination.page} of ${pagination.totalPages}`;

    previousButton.disabled = !pagination.hasPreviousPage;
    nextButton.disabled = !pagination.hasNextPage;
}

// Retrieve one page of filtered bookings.
async function loadBookings() {
    if (state.controller) {
        state.controller.abort();
    }

    state.controller = new AbortController();

    showMessage('Loading bookings...');
    previousButton.disabled = true;
    nextButton.disabled = true;

    const params = new URLSearchParams({
        page: state.page,
        limit: state.limit
    });

    Object.entries(state.filters).forEach(([key, value]) => {
        if (value) {
            params.set(key, value);
        }
    });

    try {
        const response = await fetch(`/api/bookings?${params}`, {
            signal: state.controller.signal
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Failed to load bookings.');
        }

        renderBookings(result.data);
        updatePagination(result.pagination);

        showMessage(
            `${result.pagination.totalItems} booking(s) found.`
        );
    } catch (error) {
        if (error.name === 'AbortError') {
            return;
        }

        console.error('Error loading bookings:', error);

        tableBody.replaceChildren();
        showMessage(error.message, true);

        pageInformation.textContent = 'Unable to load pages';
    }
}

// Apply selected filters and return to the first page.
filterForm.addEventListener('submit', (event) => {
    event.preventDefault();

    state.filters = {
        ticketClass: ticketClassInput.value,
        startDate: startDateInput.value,
        endDate: endDateInput.value
    };

    state.page = 1;
    loadBookings();
});

// Clear all filters and return to the first page.
resetFiltersButton.addEventListener('click', () => {
    filterForm.reset();

    state.filters = {};
    state.page = 1;

    loadBookings();
});

// Navigate to the previous page.
previousButton.addEventListener('click', () => {
    if (state.page > 1) {
        state.page -= 1;
        loadBookings();
    }
});

// Navigate to the next page.
nextButton.addEventListener('click', () => {
    if (state.page < state.totalPages) {
        state.page += 1;
        loadBookings();
    }
});

// Load the first page when the page opens.
loadBookings();
