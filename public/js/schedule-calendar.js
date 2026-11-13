
document.addEventListener('DOMContentLoaded', () => {
    const dataElement = document.getElementById('schedule-calendar-data');
    const calendarGrid = document.getElementById('calendar-grid');
    const monthLabel = document.getElementById('calendar-month-label');
    const previousButton = document.getElementById('calendar-prev');
    const nextButton = document.getElementById('calendar-next');
    const selectionArea = document.getElementById('calendar-selection');

    // Stop if this page does not contain the calendar.
    if (
        !dataElement ||
        !calendarGrid ||
        !monthLabel ||
        !previousButton ||
        !nextButton ||
        !selectionArea
    ) {
        return;
    }

    const { schedules, operatingMonths } = JSON.parse(dataElement.textContent);

    const dayNames = [
        'sunday',
        'monday',
        'tuesday',
        'wednesday',
        'thursday',
        'friday',
        'saturday'
    ];

    const monthNames = [
        'January', 'February', 'March', 'April',
        'May', 'June', 'July', 'August',
        'September', 'October', 'November', 'December'
    ];

    const availableMonths = operatingMonths.map(Number);

    const today = new Date();
    let displayedMonth = today.getMonth();
    let displayedYear = today.getFullYear();

    function getSchedulesForDate(date) {
        const dayName = dayNames[date.getDay()];

        return schedules.filter(schedule =>
            schedule.daysOfWeek.some(
                day => day.toLowerCase() === dayName
            )
        );
    }

    function showSelectedDate(date, dateSchedules) {
        selectionArea.replaceChildren();

        const heading = document.createElement('h3');
        heading.textContent = date.toLocaleDateString('en-US', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });

        selectionArea.appendChild(heading);

        if (dateSchedules.length === 0) {
            const message = document.createElement('p');
            message.textContent = 'No departures are available for this date.';
            selectionArea.appendChild(message);
            return;
        }

        dateSchedules.forEach(schedule => {
            const card = document.createElement('div');
            card.className = 'calendar-schedule-card';

            const times = document.createElement('p');
            times.textContent =
                `Departs: ${schedule.departureTime} | Arrives: ${schedule.arrivalTime}`;

            const bookingLink = document.createElement('a');
            bookingLink.href = `/trips/booking/${encodeURIComponent(schedule.id)}`;
            bookingLink.className = 'book-btn';
            bookingLink.textContent = 'Book Now';

            card.appendChild(times);
            card.appendChild(bookingLink);
            selectionArea.appendChild(card);
        });
    }

    function renderCalendar() {
        calendarGrid.replaceChildren();

        monthLabel.textContent =
            `${monthNames[displayedMonth]} ${displayedYear}`;

        const monthNumber = displayedMonth + 1;
        const isOperatingMonth = availableMonths.includes(monthNumber);

        const firstDay = new Date(displayedYear, displayedMonth, 1).getDay();
        const daysInMonth = new Date(
            displayedYear,
            displayedMonth + 1,
            0
        ).getDate();

        // Add empty spaces before the first day of the month.
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'calendar-day empty';
            calendarGrid.appendChild(emptyCell);
        }

        // Create each day of the month.
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(displayedYear, displayedMonth, day);
            const dateSchedules = getSchedulesForDate(date);

            const dayButton = document.createElement('button');
            dayButton.type = 'button';
            dayButton.className = 'calendar-day';
            dayButton.textContent = day;

            if (!isOperatingMonth || dateSchedules.length === 0) {
                dayButton.disabled = true;
                dayButton.classList.add('no-service');
            } else {
                dayButton.classList.add('has-service');

                dayButton.addEventListener('click', () => {
                    document.querySelectorAll('.calendar-day.selected')
                        .forEach(button => button.classList.remove('selected'));

                    dayButton.classList.add('selected');
                    showSelectedDate(date, dateSchedules);
                });
            }

            calendarGrid.appendChild(dayButton);
        }

        if (!isOperatingMonth) {
            selectionArea.textContent =
                `This trip does not operate in ${monthNames[displayedMonth]}.`;
        } else {
            selectionArea.textContent =
                'Select a highlighted date to view available departures.';
        }
    }

    previousButton.addEventListener('click', () => {
        displayedMonth--;

        if (displayedMonth < 0) {
            displayedMonth = 11;
            displayedYear--;
        }

        renderCalendar();
    });

    nextButton.addEventListener('click', () => {
        displayedMonth++;

        if (displayedMonth > 11) {
            displayedMonth = 0;
            displayedYear++;
        }

        renderCalendar();
    });

    renderCalendar();
});
