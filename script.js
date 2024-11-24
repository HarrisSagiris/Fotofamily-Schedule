document.addEventListener('DOMContentLoaded', async () => {
    // Load photographers and populate dropdown
    await loadPhotographers();

    // Load events for both admin and photographer dashboards
    loadEvents();

    // Event form submission handler
    const form = document.getElementById('createEventForm');
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        await createEvent();
        loadEvents();
    });
});

async function loadPhotographers() {
    const photographerSelect = document.getElementById('photographer');
    const response = await fetch('/auth/photographers');
    const photographers = await response.json();

    photographers.forEach((photographer) => {
        const option = document.createElement('option');
        option.value = photographer._id;
        option.textContent = photographer.username;
        photographerSelect.appendChild(option);
    });
}

async function loadEvents() {
    const response = await fetch('/events/all');
    const events = await response.json();
    const eventList = document.getElementById('eventList');
    eventList.innerHTML = '';

    events.forEach((event) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${event.title}</td>
            <td>${new Date(event.date).toLocaleDateString()}</td>
            <td>${event.time}</td>
            <td>${event.location}</td>
            <td>
                <select onchange="assignPhotographer('${event._id}', this.value)">
                    <option value="">Select Photographer</option>
                    ${event.photographer ? 
                        `<option value="${event.photographer._id}" selected>${event.photographer.username}</option>` 
                        : ''}
                </select>
            </td>
            <td><button onclick="deleteEvent('${event._id}')">Delete</button></td>
        `;
        eventList.appendChild(row);

        // Populate photographer options
        if (!event.photographer) {
            loadPhotographerOptions(row.querySelector('select'));
        }
    });
}

async function loadPhotographerOptions(select) {
    const response = await fetch('/auth/photographers');
    const photographers = await response.json();
    photographers.forEach(photographer => {
        const option = document.createElement('option');
        option.value = photographer._id;
        option.textContent = photographer.username;
        select.appendChild(option);
    });
}

async function assignPhotographer(eventId, photographerId) {
    try {
        const response = await fetch('/admin/assign-photographer', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eventId,
                photographerId
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to assign photographer');
        }
        
        loadEvents(); // Reload events to show updated assignment
    } catch (error) {
        console.error('Error assigning photographer:', error);
        alert('Failed to assign photographer');
    }
}

async function createEvent() {
    const title = document.getElementById('title').value;
    const date = document.getElementById('date').value;
    const time = document.getElementById('time').value;
    const location = document.getElementById('location').value;
    const photographer = document.getElementById('photographer').value;

    await fetch('/events/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, date, time, location, photographer_id: photographer })
    });
}

async function deleteEvent(eventId) {
    await fetch(`/events/delete/${eventId}`, { method: 'DELETE' });
    loadEvents();
}
