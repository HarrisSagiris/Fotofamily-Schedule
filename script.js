document.addEventListener('DOMContentLoaded', async () => {
    // Load photographers and populate dropdown
    await loadPhotographers();

    // Load events for both admin and photographer dashboards
    loadEvents();

    // Event form submission handler
    const form = document.getElementById('createEventForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            try {
                const formData = new FormData(form);
                const eventData = Object.fromEntries(formData);

                const response = await fetch('/events/create', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(eventData)
                });

                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || 'Failed to create event');
                }

                // Clear form
                form.reset();

                // Reload events table
                await loadEvents();

                // Show success message
                alert('Event created successfully!');

            } catch (error) {
                console.error('Error creating event:', error);
                alert(error.message || 'Failed to create event. Please try again.');
            }
        });
    }

    // Add event listener for photographer update forms
    document.querySelectorAll('form[action="/photographer/update-event"]').forEach(form => {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            try {
                const response = await fetch('/photographer/update-event', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(Object.fromEntries(formData))
                });

                if (!response.ok) {
                    throw new Error('Failed to update event');
                }

                await loadEvents();
            } catch (error) {
                console.error('Error updating event:', error);
                alert('Failed to update event');
            }
        });
    });

    // Add event listeners for cell changes and enter key
    document.addEventListener('keydown', handleTableKeydown);

    // Add input event listener for cell changes
    document.addEventListener('input', handleCellInput, true);
});

async function loadPhotographers() {
    try {
        const photographerSelect = document.getElementById('photographer');
        const response = await fetch('/auth/photographers');
        if (!response.ok) throw new Error('Failed to fetch photographers');
        const photographers = await response.json();

        if (photographerSelect) {
            photographerSelect.innerHTML = '<option value="">Select Photographer</option>';
            photographers.forEach((photographer) => {
                const option = document.createElement('option');
                option.value = photographer._id;
                option.textContent = photographer.username;
                photographerSelect.appendChild(option);
            });
        }

        // Also update any photographer select dropdowns in the table
        document.querySelectorAll('select[name="photographerId"]').forEach(select => {
            select.innerHTML = '<option value="">Select Photographer</option>';
            photographers.forEach(photographer => {
                const option = document.createElement('option');
                option.value = photographer._id;
                option.textContent = photographer.username;
                select.appendChild(option);
            });
        });

        return photographers;
    } catch (error) {
        console.error('Error loading photographers:', error);
        alert('Failed to load photographers');
        return [];
    }
}

// Handle cell input events (saving changes)
let debounceTimeout;
async function handleCellInput(e) {
    if (e.target.hasAttribute('data-field') && e.target.hasAttribute('data-cell')) {
        const cell = e.target;
        const eventId = cell.closest('tr').dataset.eventId;
        const field = cell.dataset.field;
        const value = cell.textContent;

        // Clear any existing timeout
        if (debounceTimeout) {
            clearTimeout(debounceTimeout);
        }

        // Set a new timeout to update after 500ms of no typing
        debounceTimeout = setTimeout(async () => {
            try {
                await updateCell(eventId, field, value);
            } catch (error) {
                console.error('Error updating cell:', error);
            }
        }, 500);
    }
}

// Handle table keydown events
async function handleTableKeydown(e) {
    if (e.target.hasAttribute('data-field') && e.target.hasAttribute('data-cell')) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const cell = e.target;
            const row = cell.closest('tr');
            const isLastCell = cell === row.lastElementChild.previousElementSibling;

            if (isLastCell) {
                try {
                    const response = await fetch('/events/create', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({})
                    });

                    if (!response.ok) {
                        throw new Error('Failed to create new row');
                    }

                    await loadEvents();

                    const table = document.getElementById('eventsTable');
                    const newRow = table.lastElementChild;
                    const firstEditableCell = newRow.querySelector('[contenteditable="true"]');
                    if (firstEditableCell) {
                        firstEditableCell.focus();
                    }
                } catch (error) {
                    console.error('Error creating new row:', error);
                    alert('Failed to create new row');
                }
            }
        }
    }
}

async function loadEvents() {
    try {
        const response = await fetch('/events/all');
        if (!response.ok) throw new Error('Failed to fetch events');
        const events = await response.json();
        const eventList = document.getElementById('eventsTable');
        if (!eventList) return;
        
        // Clear existing rows but keep header
        const headerRow = eventList.querySelector('tr:first-child');
        eventList.innerHTML = '';
        if (headerRow) eventList.appendChild(headerRow);

        const photographers = await loadPhotographers();

        events.forEach((event, rowIndex) => {
            const row = document.createElement('tr');
            row.setAttribute('data-event-id', event._id);
            
            // Add row number cell
            const rowNumCell = document.createElement('td');
            row.appendChild(rowNumCell);
            
            const fields = [
                {field: 'date', value: event.date || ''},
                {field: 'day', value: event.day || ''},
                {field: 'location', value: event.location || ''},
                {field: 'time', value: event.time || ''},
                {field: 'client', value: event.client || ''},
                {field: 'childName', value: event.childName || ''},
                {field: 'age', value: event.age || ''},
                {field: 'children', value: event.children || ''},
                {field: 'floor', value: event.floor || ''},
                {field: 'childrenCount', value: event.childrenCount || ''},
                {field: 'photo', value: event.photo || ''},
                {field: 'info', value: event.info || ''},
                {field: 'background', value: event.background || ''},
                {field: 'comments', value: event.comments || ''},
                {field: 'extras', value: event.extras || ''},
                {field: 'frame', value: event.frame || ''},
                {field: 'glitter', value: event.glitter || ''},
                {field: 'key', value: event.key || ''},
                {field: 'mgn', value: event.mgn || ''},
                {field: 'pr', value: event.pr || ''},
                {field: 'ret', value: event.ret || ''},
                {field: 'in', value: event.in || ''},
                {field: 'minusPhi', value: event.minusPhi || ''},
                {field: 'minusX', value: event.minusX || ''},
                {field: 'net', value: event.net || ''},
                {field: 'bank', value: event.bank || ''},
                {field: 'name', value: event.name || ''},
                {field: 'performance', value: event.performance || ''},
                {field: 'photographer', value: event.photographer ? event.photographer.username : 'Unassigned'}
            ];

            // Add editable cells
            fields.forEach(({field, value}, index) => {
                const td = document.createElement('td');
                td.contentEditable = true;
                td.setAttribute('data-field', field);
                td.setAttribute('data-cell', String.fromCharCode(65 + index) + (rowIndex + 1));
                if(event.formulas && event.formulas[field]) {
                    td.setAttribute('data-formula', JSON.stringify(event.formulas[field]));
                }
                td.textContent = value;
                row.appendChild(td);
            });

            // Add photographer select dropdown
            const photographerCell = document.createElement('td');
            photographerCell.innerHTML = `
                <form action="/admin/assign-photographer" method="POST">
                    <input type="hidden" name="eventId" value="${event._id}">
                    <select name="photographerId" onchange="assignPhotographer('${event._id}', this.value)">
                        <option value="">Select Photographer</option>
                        ${photographers.map(p => `
                            <option value="${p._id}" ${event.photographer && event.photographer._id === p._id ? 'selected' : ''}>
                                ${p.username}
                            </option>
                        `).join('')}
                    </select>
                </form>
            `;
            row.appendChild(photographerCell);

            // Add delete button
            const actionCell = document.createElement('td');
            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-row-btn';
            deleteButton.textContent = 'Delete';
            deleteButton.onclick = () => deleteEvent(event._id);
            actionCell.appendChild(deleteButton);
            row.appendChild(actionCell);

            eventList.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading events:', error);
        alert('Failed to load events');
    }
}

async function updateCell(eventId, field, value) {
    try {
        const response = await fetch('/admin/update-event', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eventId: eventId,
                field: field,
                value: value
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to save ${field}`);
        }

        // Show save indicator
        const saveStatus = document.getElementById('saveStatus');
        if (saveStatus) {
            saveStatus.textContent = 'Changes saved!';
            setTimeout(() => {
                saveStatus.textContent = '';
            }, 2000);
        }
    } catch (error) {
        console.error(`Error saving ${field}:`, error);
        alert(`Failed to save ${field}`);
        throw error;
    }
}

async function assignPhotographer(eventId, photographerId) {
    try {
        const response = await fetch('/admin/assign-photographer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eventId,
                photographerId
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to assign photographer');
        }
        
        await loadEvents();
    } catch (error) {
        console.error('Error assigning photographer:', error);
        alert(error.message || 'Failed to assign photographer');
    }
}

async function deleteEvent(eventId) {
    if (!confirm('Are you sure you want to delete this event?')) {
        return;
    }

    try {
        const response = await fetch(`/events/${eventId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to delete event');
        }

        // Reload events table after successful deletion
        await loadEvents();
        alert('Event deleted successfully!');

    } catch (error) {
        console.error('Error deleting event:', error);
        alert(error.message || 'Failed to delete event. Please try again.');
    }
}