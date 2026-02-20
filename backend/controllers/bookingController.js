const db = require("../config/db");
const { v4: uuidv4 } = require("uuid");

exports.bookRoom = async (req, res) => {
  try {
    const {
      hotel_id,
      room_id,
      guest_name,
      email,
      check_in,
      check_out,
    } = req.body;

    // 1. Validasi input dasar
    if (!hotel_id || !room_id || !guest_name?.trim() || !email?.trim() || !check_in || !check_out) {
      return res.status(400).json({
        success: false,
        message: "Semua field wajib diisi dengan benar",
      });
    }

    // Validasi format email sederhana (opsional, bisa diganti dengan library validator jika perlu)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Format email tidak valid",
      });
    }

    // 2. Validasi tanggal
    const checkInDate = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(checkInDate.getTime()) || Number.isNaN(checkOutDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Format tanggal tidak valid. Gunakan format YYYY-MM-DD",
      });
    }

    if (checkInDate >= checkOutDate) {
      return res.status(400).json({
        success: false,
        message: "Tanggal check-out harus lebih lambat dari check-in",
      });
    }

    if (checkInDate < today) {
      return res.status(400).json({
        success: false,
        message: "Tanggal check-in tidak boleh di masa lalu",
      });
    }

    // 3. Hitung jumlah malam
    const timeDiffMs = checkOutDate - checkInDate;
    const nights = Math.ceil(timeDiffMs / (1000 * 60 * 60 * 24));

    if (nights < 1) {
      return res.status(400).json({
        success: false,
        message: "Minimal menginap adalah 1 malam",
      });
    }

    const bookingRef = uuidv4();

    // 4. Query cek ketersediaan + harga (menggunakan promise untuk async/await)
    const [roomsResult] = await db.promise().query(
      `
      SELECT 
        r.total_rooms,
        r.price,
        COUNT(b.id) AS booked
      FROM rooms r
      LEFT JOIN bookings b 
        ON r.id = b.room_id 
        AND b.check_out > ? 
        AND b.check_in < ?
      WHERE r.id = ?
      GROUP BY r.id, r.price
      `,
      [check_in, check_out, room_id]
    );

    if (roomsResult.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tipe kamar tidak ditemukan",
      });
    }

    const { total_rooms, price, booked } = roomsResult[0];

    if (Number(booked) >= Number(total_rooms)) {
      return res.status(400).json({
        success: false,
        message: "Tipe kamar tidak tersedia untuk periode yang dipilih",
      });
    }

    const pricePerNight = Number(price);
    const totalPrice = pricePerNight * nights;

    // 5. Insert booking
    const [insertResult] = await db.promise().query(
      `
      INSERT INTO bookings 
      (hotel_id, room_id, guest_name, email, check_in, check_out, booking_reference, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [hotel_id, room_id, guest_name.trim(), email.trim(), check_in, check_out, bookingRef, totalPrice]
    );

    // 6. Response sukses
    return res.status(201).json({
      success: true,
      message: "Booking berhasil dibuat",
      data: {
        booking_reference: bookingRef,
        total_price: totalPrice,
        nights,
        price_per_night: pricePerNight,
        check_in,
        check_out,
        // Opsional: bisa tambahkan booking_id jika diperlukan
        booking_id: insertResult.insertId,
      },
    });
  } catch (error) {
    console.error("Error saat membuat booking:", error);

    // Bedakan error tertentu jika memungkinkan
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Terjadi duplikasi data (kemungkinan booking reference bentrok)",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan server. Silakan coba lagi nanti.",
      // error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};