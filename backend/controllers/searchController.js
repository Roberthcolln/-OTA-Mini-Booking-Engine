const db = require("../config/db");

exports.searchAvailableHotels = (req, res) => {
    const { city, check_in, check_out, guests } = req.query;

    const sql = `
    SELECT 
        hotels.id as hotel_id,
        hotels.name,
        hotels.city,
        hotels.address,
        rooms.id as room_id,
        rooms.room_type,
        rooms.price,
        rooms.capacity,
        rooms.total_rooms,
        COUNT(bookings.id) as booked_rooms
    FROM hotels
    JOIN rooms ON hotels.id = rooms.hotel_id
    LEFT JOIN bookings 
        ON rooms.id = bookings.room_id
        AND NOT (
            bookings.check_out <= ?
            OR bookings.check_in >= ?
        )
    WHERE hotels.city LIKE ?
    AND rooms.capacity >= ?
    GROUP BY rooms.id
    HAVING booked_rooms < rooms.total_rooms
    `;

    db.query(
        sql,
        [check_in, check_out, `%${city}%`, guests],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json(result);
        }
    );
};