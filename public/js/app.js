document.addEventListener('DOMContentLoaded', () => {
    const bookingForm = document.getElementById('bookingForm');
    const bookingsList = document.getElementById('bookingsList');

    // Load bookings when page loads
    loadBookings();

    // Handle form submission
    bookingForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            eventName: document.getElementById('eventName').value,
            date: document.getElementById('date').value,
            startTime: document.getElementById('startTime').value,
            endTime: document.getElementById('endTime').value,
            organizer: document.getElementById('organizer').value,
            purpose: document.getElementById('purpose').value
        };

        try {
            const response = await fetch('/api/bookings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                alert('Booking created successfully!');
                bookingForm.reset();
                loadBookings();
            } else {
                const error = await response.json();
                alert(`Error: ${error.message}`);
            }
        } catch (error) {
            alert('Error creating booking. Please try again.');
            console.error('Error:', error);
        }
    });

    // Function to load bookings
    async function loadBookings() {
        try {
            const response = await fetch('/api/bookings');
            const bookings = await response.json();
            
            bookingsList.innerHTML = bookings.map(booking => `
                <div class="booking-card">
                    <h3>${booking.event_name}</h3>
                    <p><strong>Date:</strong> ${formatDate(booking.date)}</p>
                    <p><strong>Time:</strong> ${booking.start_time} - ${booking.end_time}</p>
                    <p><strong>Organizer:</strong> ${booking.organizer}</p>
                    <p><strong>Purpose:</strong> ${booking.purpose}</p>
                    <button onclick="deleteBooking(${booking.id})" class="btn-delete">Delete</button>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading bookings:', error);
            bookingsList.innerHTML = '<p>Error loading bookings. Please try again later.</p>';
        }
    }

    // Function to format date
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    // Function to delete booking
    window.deleteBooking = async (id) => {
        if (confirm('Are you sure you want to delete this booking?')) {
            try {
                const response = await fetch(`/api/bookings/${id}`, {
                    method: 'DELETE'
                });

                if (response.ok) {
                    alert('Booking deleted successfully!');
                    loadBookings();
                } else {
                    const error = await response.json();
                    alert(`Error: ${error.message}`);
                }
            } catch (error) {
                alert('Error deleting booking. Please try again.');
                console.error('Error:', error);
            }
        }
    };
}); 