const hotelModel = require("../models/hotelModel");
const db = require("../config/db");

exports.searchHotel = (req, res) => {
    const { city } = req.query;

    hotelModel.searchHotels(city, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
};

exports.getHotelDetail = (req, res) => {
    const id = req.params.id;
    const { check_in, check_out } = req.query;

    let sql = `
        SELECT 
            rooms.id,
            rooms.room_type,
            rooms.price,
            rooms.capacity,
            rooms.total_rooms,
            COUNT(bookings.id) as booked_rooms,
            (rooms.total_rooms - COUNT(bookings.id)) as available_rooms,
            CASE 
                WHEN (rooms.total_rooms - COUNT(bookings.id)) > 0 THEN 1
                ELSE 0
            END as is_available
        FROM rooms
        LEFT JOIN bookings
            ON rooms.id = bookings.room_id
            AND NOT (
                bookings.check_out <= ?
                OR bookings.check_in >= ?
            )
        WHERE rooms.hotel_id = ?
        GROUP BY rooms.id
    `;

    const params = check_in && check_out ? [check_in, check_out, id] : [id];  // Jika tidak ada tanggal, abaikan filter overlap

    if (!check_in || !check_out) {
        // Jika tidak ada tanggal, hilangkan kondisi JOIN overlap
        sql = sql.replace("AND NOT (bookings.check_out <= ? OR bookings.check_in >= ?)", "");
    }

    db.query(sql, params, (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
};