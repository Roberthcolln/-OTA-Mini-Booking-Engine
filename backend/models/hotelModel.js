const db = require("../config/db");

exports.searchHotels = (city, callback) => {
    const sql = "SELECT * FROM hotels WHERE city LIKE ?";
    db.query(sql, [`%${city}%`], callback);
};

exports.getHotelDetail = (id, callback) => {
    const sql = "SELECT * FROM hotels WHERE id=?";
    db.query(sql, [id], callback);
};