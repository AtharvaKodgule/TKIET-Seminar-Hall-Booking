# Seminar Hall Booking System

A full-stack web application for managing seminar hall bookings, built with Node.js, Express, and MySQL.

## Features

- Create, view, and delete seminar hall bookings
- Modern and responsive user interface
- Real-time booking management
- Form validation and error handling

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8.0 or higher)
- npm (Node Package Manager)

## Setup Instructions

1. Clone the repository:
```bash
git clone <repository-url>
cd seminar-hall-booking
```

2. Install dependencies:
```bash
npm install
```

3. Create a MySQL database:
```sql
CREATE DATABASE seminar_hall_booking;
```

4. Create the bookings table:
```sql
USE seminar_hall_booking;

CREATE TABLE bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    organizer VARCHAR(255) NOT NULL,
    purpose TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

5. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the database credentials in `.env`

6. Start the application:
```bash
npm run dev
```

The application will be available at `http://localhost:3005`

## Project Structure

```
├── src/
│   ├── config/
│   │   └── database.js
│   │   └── Booking.js
│   ├── controllers/
│   │   └── bookingController.js
│   ├── models/
│   ├── routes/
│   │   └── bookings.js
│   └── server.js
├── public/
│   ├── css/
│   │   └── style.css
│   ├── js/
│   │   └── app.js
│   └── index.html
├── .env
├── package.json
└── README.md
```

## API Endpoints

- `POST /api/bookings` - Create a new booking
- `GET /api/bookings` - Get all bookings
- `GET /api/bookings/:id` - Get a specific booking
- `PUT /api/bookings/:id` - Update a booking
- `DELETE /api/bookings/:id` - Delete a booking




## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request


-GitHub: AtharvaKodgule

-LinkedIn:www.linkedin.com/in/
atharva-kodgule

-Email: atharvakodgule17@gmail.com
