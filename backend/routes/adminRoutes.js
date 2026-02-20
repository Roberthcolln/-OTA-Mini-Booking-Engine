const express = require("express");
const router = express.Router();
const db = require("../config/db");

/* =========================
   HOTEL CRUD
========================= */

// CREATE HOTEL
router.post("/hotels", (req, res) => {
    const { name, city, address, description } = req.body;

    db.query(
        "INSERT INTO hotels (name, city, address, description) VALUES (?, ?, ?, ?)",
        [name, city, address, description],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Hotel created", id: result.insertId });
        }
    );
});

// GET ALL HOTELS
router.get("/hotels", (req, res) => {
    db.query("SELECT * FROM hotels", (err, result) => {
        if (err) return res.status(500).json(err);
        res.json(result);
    });
});

// UPDATE HOTEL
router.put("/hotels/:id", (req, res) => {
    const id = req.params.id;
    const { name, city, address, description } = req.body;

    db.query(
        "UPDATE hotels SET name=?, city=?, address=?, description=? WHERE id=?",
        [name, city, address, description, id],
        (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Hotel updated" });
        }
    );
});

// DELETE HOTEL
router.delete("/hotels/:id", (req, res) => {
    const id = req.params.id;

    db.query("DELETE FROM hotels WHERE id=?", [id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Hotel deleted" });
    });
});

/* =========================
   ROOM CRUD
========================= */

// CREATE ROOM
router.post("/rooms", (req, res) => {
    const { hotel_id, room_type, price, total_rooms } = req.body;

    db.query(
        "INSERT INTO rooms (hotel_id, room_type, price, total_rooms) VALUES (?, ?, ?, ?)",
        [hotel_id, room_type, price, total_rooms],
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Room created", id: result.insertId });
        }
    );
});

// GET ROOMS
router.get("/rooms", (req, res) => {
    db.query(
        `SELECT rooms.*, hotels.name as hotel_name 
     FROM rooms 
     JOIN hotels ON rooms.hotel_id = hotels.id`,
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json(result);
        }
    );
});

// UPDATE ROOM
router.put("/rooms/:id", (req, res) => {
    const id = req.params.id;
    const { room_type, price, total_rooms } = req.body;

    db.query(
        "UPDATE rooms SET room_type=?, price=?, total_rooms=? WHERE id=?",
        [room_type, price, total_rooms, id],
        (err) => {
            if (err) return res.status(500).json(err);
            res.json({ message: "Room updated" });
        }
    );
});

// DELETE ROOM
router.delete("/rooms/:id", (req, res) => {
    const id = req.params.id;

    db.query("DELETE FROM rooms WHERE id=?", [id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Room deleted" });
    });
});

/* =========================
   BOOKING VIEW
========================= */

router.get("/bookings", (req, res) => {
    db.query(
        `SELECT bookings.*, hotels.name as hotel_name, rooms.room_type
     FROM bookings
     JOIN hotels ON bookings.hotel_id = hotels.id
     JOIN rooms ON bookings.room_id = rooms.id`,
        (err, result) => {
            if (err) return res.status(500).json(err);
            res.json(result);
        }
    );
});

// DELETE BOOKING
router.delete("/bookings/:id", (req, res) => {
    const id = req.params.id;

    db.query("DELETE FROM bookings WHERE id=?", [id], (err) => {
        if (err) return res.status(500).json(err);
        res.json({ message: "Booking deleted" });
    });
});

router.get("/hotels", (req, res) => {
    console.log("GET ADMIN HOTELS");
    db.query("SELECT * FROM hotels", (err, result) => {
        if (err) {
            console.log(err);
            return res.status(500).json(err);
        }
        res.json(result);
    });
});

module.exports = router;