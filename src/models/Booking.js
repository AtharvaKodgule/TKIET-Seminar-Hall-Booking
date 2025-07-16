const db = require('../config/database');

class Booking {
    static async create(bookingData) {
        const { eventName, date, startTime, endTime, organizer, purpose } = bookingData;
        const [result] = await db.execute(
            'INSERT INTO bookings (event_name, date, start_time, end_time, organizer, purpose) VALUES (?, ?, ?, ?, ?, ?)',
            [eventName, date, startTime, endTime, organizer, purpose]
        );
        return result.insertId;
    }

    static async getAll() {
        const [rows] = await db.execute('SELECT * FROM bookings ORDER BY date, start_time');
        return rows;
    }

    static async getById(id) {
        const [rows] = await db.execute('SELECT * FROM bookings WHERE id = ?', [id]);
        return rows[0];
    }

    static async update(id, bookingData) {
        const { eventName, date, startTime, endTime, organizer, purpose } = bookingData;
        const [result] = await db.execute(
            'UPDATE bookings SET event_name = ?, date = ?, start_time = ?, end_time = ?, organizer = ?, purpose = ? WHERE id = ?',
            [eventName, date, startTime, endTime, organizer, purpose, id]
        );
        return result.affectedRows > 0;
    }

    static async delete(id) {
        const [result] = await db.execute('DELETE FROM bookings WHERE id = ?', [id]);
        return result.affectedRows > 0;
    }
}

module.exports = Booking; 