const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

exports.bookRoom = (req, res) => {

  console.log("BODY MASUK:", req.body);

  const {
    hotel_id,
    room_id,
    guest_name,
    email,
    check_in,
    check_out,
  } = req.body;

  if (!hotel_id || !room_id || !guest_name || !email || !check_in || !check_out) {
    return res.status(400).json({
      message: "Semua field wajib diisi",
    });
  }

  // PERUBAHAN: Validasi tanggal untuk mencegah check-in masa lalu atau check-out <= check-in
  const checkInDate = new Date(check_in);
  const checkOutDate = new Date(check_out);
  const today = new Date();

  if (isNaN(checkInDate) || isNaN(checkOutDate)) {
    return res.status(400).json({ message: "Format tanggal invalid (gunakan YYYY-MM-DD)" });
  }

  if (checkInDate >= checkOutDate) {
    return res.status(400).json({ message: "Check-out harus setelah check-in" });
  }

  if (checkInDate < today.setHours(0, 0, 0, 0)) {
    return res.status(400).json({ message: "Check-in tidak boleh di masa lalu" });
  }

  const bookingRef = uuidv4();

  // PERUBAHAN: Ubah query untuk menghitung booked_rooms dan bandingkan dengan total_rooms
  // Sebelumnya hanya cek COUNT > 0, sekarang cek jika booked >= total_rooms
  const checkSql = `
    SELECT 
      r.total_rooms,
      COUNT(b.id) AS booked
    FROM rooms r
    LEFT JOIN bookings b 
      ON r.id = b.room_id 
      AND NOT (b.check_out <= ? OR b.check_in >= ?)
    WHERE r.id = ?
    GROUP BY r.id
  `;

  db.query(checkSql, [check_in, check_out, room_id], (err, result) => {
    if (err) {
      console.error("Check availability error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Room tidak ditemukan" });
    }

    const { total_rooms, booked } = result[0];

    if (booked >= total_rooms) {
      return res.status(400).json({
        message: "Room tidak tersedia (penuh untuk periode tersebut)",
      });
    }

    // Jika available, lanjut insert
    const insertSql = `
      INSERT INTO bookings
      (hotel_id, room_id, guest_name, email, check_in, check_out, booking_reference)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const values = [
      hotel_id,
      room_id,
      guest_name,
      email,
      check_in,
      check_out,
      bookingRef,
    ];

    console.log("DATA INSERT:", values);

    db.query(insertSql, values, (err) => {
      if (err) return res.status(500).json({ message: "Gagal menyimpan booking" });

      res.json({
        message: "Booking berhasil",
        booking_reference: bookingRef,
      });
    });
  });
};