// Check if user is logged in and is admin
function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }

    // Verify admin role
    fetch('http://localhost:3005/api/auth/me', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(user => {
        if (user.userType !== 'admin') {
            window.location.href = 'user-dashboard.html';
        }
        // Update user name in header
        document.querySelector('.user-name').textContent = user.full_name;
    })
    .catch(error => {
        console.error('Auth error:', error);
        window.location.href = 'login.html';
    });
}

// Load halls
function loadHalls() {
    const token = localStorage.getItem('token');
    fetch('http://localhost:3005/api/halls', {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(halls => {
        const hallsList = document.querySelector('.halls-list');
        hallsList.innerHTML = halls.map(hall => `
            <div class="hall-card">
                <div class="hall-header">
                    <h3>${hall.hall_name}</h3>
                    <div class="hall-actions">
                        <button class="btn-secondary" onclick="editHall(${hall.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-danger" onclick="deleteHall(${hall.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="capacity"><i class="fas fa-users"></i> Capacity: ${hall.capacity} people</p>
                <div class="facilities">
                    ${hall.facilities ? JSON.parse(hall.facilities).map(facility => 
                        `<span><i class="fas ${facility.icon}"></i> ${facility.name}</span>`
                    ).join('') : ''}
                </div>
                <p class="status">${hall.status === 'active' ? 
                    '<span class="status-available">Available</span>' : 
                    '<span class="status-unavailable">Unavailable</span>'}
                </p>
            </div>
        `).join('');
    })
    .catch(error => {
        console.error('Error loading halls:', error);
        alert('Failed to load halls. Please try again.');
    });
}

// Show add hall form
function showAddHallForm() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Add New Hall</h2>
            <form id="addHallForm">
                <div class="form-group">
                    <label for="hallName">Hall Name</label>
                    <input type="text" id="hallName" required>
                </div>
                <div class="form-group">
                    <label for="hallCapacity">Capacity</label>
                    <input type="number" id="hallCapacity" required>
                </div>
                <div class="form-group">
                    <label>Facilities</label>
                    <div class="checkbox-group">
                        <label>
                            <input type="checkbox" name="facilities" value="projector" data-icon="fa-video"> Projector
                        </label>
                        <label>
                            <input type="checkbox" name="facilities" value="audio" data-icon="fa-volume-up"> Audio System
                        </label>
                        <label>
                            <input type="checkbox" name="facilities" value="video" data-icon="fa-video"> Video Conferencing
                        </label>
                        <label>
                            <input type="checkbox" name="facilities" value="ac" data-icon="fa-snowflake"> Air Conditioning
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label for="hallStatus">Status</label>
                    <select id="hallStatus" required>
                        <option value="active">Active</option>
                        <option value="maintenance">Maintenance</option>
                        <option value="inactive">Inactive</option>
                    </select>
                </div>
                <button type="submit" class="btn-primary">Add Hall</button>
            </form>
        </div>
    `;

    // Add event listeners
    modal.querySelector('.close').onclick = () => modal.remove();
    modal.querySelector('#addHallForm').onsubmit = (e) => {
        e.preventDefault();
        const facilities = Array.from(modal.querySelectorAll('input[name="facilities"]:checked'))
            .map(checkbox => ({
                name: checkbox.value.charAt(0).toUpperCase() + checkbox.value.slice(1),
                icon: checkbox.dataset.icon
            }));

        const hallData = {
            hall_name: modal.querySelector('#hallName').value,
            capacity: parseInt(modal.querySelector('#hallCapacity').value),
            facilities: facilities,
            status: modal.querySelector('#hallStatus').value
        };

        addHall(hallData);
        modal.remove();
    };

    document.body.appendChild(modal);
}

// Add new hall
function addHall(hallData) {
    const token = localStorage.getItem('token');
    fetch('http://localhost:3005/api/halls', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(hallData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert('Hall added successfully!');
            loadHalls();
        } else {
            throw new Error(data.message || 'Failed to add hall');
        }
    })
    .catch(error => {
        console.error('Error adding hall:', error);
        alert('Failed to add hall. Please try again.');
    });
}

// Edit hall
function editHall(hallId) {
    const token = localStorage.getItem('token');
    fetch(`http://localhost:3005/api/halls/${hallId}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(hall => {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Edit Hall</h2>
                <form id="editHallForm">
                    <div class="form-group">
                        <label for="editHallName">Hall Name</label>
                        <input type="text" id="editHallName" value="${hall.hall_name}" required>
                    </div>
                    <div class="form-group">
                        <label for="editHallCapacity">Capacity</label>
                        <input type="number" id="editHallCapacity" value="${hall.capacity}" required>
                    </div>
                    <div class="form-group">
                        <label>Facilities</label>
                        <div class="checkbox-group">
                            <label>
                                <input type="checkbox" name="facilities" value="projector" data-icon="fa-video" 
                                    ${JSON.parse(hall.facilities).some(f => f.name === 'Projector') ? 'checked' : ''}> Projector
                            </label>
                            <label>
                                <input type="checkbox" name="facilities" value="audio" data-icon="fa-volume-up"
                                    ${JSON.parse(hall.facilities).some(f => f.name === 'Audio System') ? 'checked' : ''}> Audio System
                            </label>
                            <label>
                                <input type="checkbox" name="facilities" value="video" data-icon="fa-video"
                                    ${JSON.parse(hall.facilities).some(f => f.name === 'Video Conferencing') ? 'checked' : ''}> Video Conferencing
                            </label>
                            <label>
                                <input type="checkbox" name="facilities" value="ac" data-icon="fa-snowflake"
                                    ${JSON.parse(hall.facilities).some(f => f.name === 'Air Conditioning') ? 'checked' : ''}> Air Conditioning
                            </label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="editHallStatus">Status</label>
                        <select id="editHallStatus" required>
                            <option value="active" ${hall.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="maintenance" ${hall.status === 'maintenance' ? 'selected' : ''}>Maintenance</option>
                            <option value="inactive" ${hall.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        </select>
                    </div>
                    <button type="submit" class="btn-primary">Update Hall</button>
                </form>
            </div>
        `;

        // Add event listeners
        modal.querySelector('.close').onclick = () => modal.remove();
        modal.querySelector('#editHallForm').onsubmit = (e) => {
            e.preventDefault();
            const facilities = Array.from(modal.querySelectorAll('input[name="facilities"]:checked'))
                .map(checkbox => ({
                    name: checkbox.value.charAt(0).toUpperCase() + checkbox.value.slice(1),
                    icon: checkbox.dataset.icon
                }));

            const hallData = {
                hall_name: modal.querySelector('#editHallName').value,
                capacity: parseInt(modal.querySelector('#editHallCapacity').value),
                facilities: facilities,
                status: modal.querySelector('#editHallStatus').value
            };

            updateHall(hallId, hallData);
            modal.remove();
        };

        document.body.appendChild(modal);
    })
    .catch(error => {
        console.error('Error loading hall details:', error);
        alert('Failed to load hall details. Please try again.');
    });
}

// Update hall
function updateHall(hallId, hallData) {
    const token = localStorage.getItem('token');
    fetch(`http://localhost:3005/api/halls/${hallId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(hallData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert('Hall updated successfully!');
            loadHalls();
        } else {
            throw new Error(data.message || 'Failed to update hall');
        }
    })
    .catch(error => {
        console.error('Error updating hall:', error);
        alert('Failed to update hall. Please try again.');
    });
}

// Delete hall
function deleteHall(hallId) {
    if (!confirm('Are you sure you want to delete this hall?')) {
        return;
    }

    const token = localStorage.getItem('token');
    fetch(`http://localhost:3005/api/halls/${hallId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.message) {
            alert('Hall deleted successfully!');
            loadHalls();
        } else {
            throw new Error(data.message || 'Failed to delete hall');
        }
    })
    .catch(error => {
        console.error('Error deleting hall:', error);
        alert('Failed to delete hall. Please try again.');
    });
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadHalls();
}); 