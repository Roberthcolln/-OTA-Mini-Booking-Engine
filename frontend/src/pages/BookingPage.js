import { useState, useEffect } from "react";
import axios from "axios";

function BookingPage() {
    const [city, setCity] = useState("");
    const [hotels, setHotels] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("info"); // "info", "success", "error"
    const [bookingRef, setBookingRef] = useState("");
    const [loadingHotels, setLoadingHotels] = useState(false);
    const [loadingRooms, setLoadingRooms] = useState(false);
    const [showGuideModal, setShowGuideModal] = useState(false); // ← untuk modal guide

    const [checkInOutSelected, setCheckInOutSelected] = useState(false);

    const [form, setForm] = useState({
        hotel_id: "",
        room_id: "",
        guest_name: "",
        email: "",
        check_in: "",
        check_out: "",
    });

    // Modal muncul SETIAP KALI halaman dibuka (untuk demo)
    useEffect(() => {
        setShowGuideModal(true);

        if (!form.hotel_id || !form.check_in || !form.check_out) return;

        const cin = new Date(form.check_in);
        const cout = new Date(form.check_out);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (cin >= cout) {
            setMessage("Tanggal check-out harus setelah check-in");
            setMessageType("error");
            setCheckInOutSelected(false);
            return;
        }

        if (cin < today) {
            setMessage("Check-in tidak boleh di masa lalu");
            setMessageType("error");
            setCheckInOutSelected(false);
            return;
        }

        setMessage("");
        getHotelRooms(form.hotel_id, form.check_in, form.check_out);
        setCheckInOutSelected(true);
    }, [form.hotel_id, form.check_in, form.check_out]);

    // ────────────────────────────────────────────────
    // Fungsi-fungsi utama
    // ────────────────────────────────────────────────

    const searchHotel = async () => {
        if (!city.trim()) return;
        setLoadingHotels(true);
        try {
            const res = await axios.get(
                `http://localhost:5000/api/hotels/search?city=${encodeURIComponent(city)}`
            );
            setHotels(res.data || []);
        } catch (err) {
            setMessage("Gagal mencari hotel. Silakan coba lagi.");
            setMessageType("error");
        } finally {
            setLoadingHotels(false);
        }
    };

    const getHotelRooms = async (hotelId, checkIn = null, checkOut = null) => {
        if (!hotelId) return;
        setLoadingRooms(true);
        try {
            let url = `http://localhost:5000/api/hotels/${hotelId}`;
            if (checkIn && checkOut) {
                url += `?check_in=${checkIn}&check_out=${checkOut}`;
            }
            const res = await axios.get(url);
            setRooms(res.data || []);
        } catch (err) {
            setMessage("Gagal memuat daftar kamar. Silakan coba lagi.");
            setMessageType("error");
            setRooms([]);
        } finally {
            setLoadingRooms(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm((prev) => ({ ...prev, [name]: value }));

        if (name === "hotel_id") {
            setForm((prev) => ({ ...prev, room_id: "" }));
            getHotelRooms(value);
            setCheckInOutSelected(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!form.room_id) {
            setMessage("Pilih tipe kamar terlebih dahulu");
            setMessageType("error");
            return;
        }

        const selectedRoom = rooms.find((r) => String(r.id) === String(form.room_id));

        if (!selectedRoom) {
            setMessage("Data kamar tidak ditemukan – silakan refresh pilihan hotel/tanggal");
            setMessageType("error");
            return;
        }

        if (selectedRoom.is_available !== 1 && selectedRoom.is_available !== true) {
            setMessage(`Kamar tidak tersedia (${selectedRoom.available_rooms || 0} tersisa)`);
            setMessageType("error");
            return;
        }

        try {
            const res = await axios.post("http://localhost:5000/api/bookings", form);
            setMessage("Booking berhasil! Terima kasih atas pemesanannya.");
            setMessageType("success");
            setBookingRef(res.data.booking_reference);

            // Reset form
            setForm({
                hotel_id: "",
                room_id: "",
                guest_name: "",
                email: "",
                check_in: "",
                check_out: "",
            });
            setRooms([]);
            setCheckInOutSelected(false);
        } catch (err) {
            setMessage(err.response?.data?.message || "Gagal melakukan booking. Silakan coba lagi.");
            setMessageType("error");
        }
    };

    // ── TUTUP MODAL ──
    const closeGuideModal = () => {
        setShowGuideModal(false);
    };

    // ────────────────────────────────────────────────
    // Styles (ditambah style modal)
    // ────────────────────────────────────────────────
    const styles = {
        page: {
            background: "linear-gradient(to bottom, #f8fafc, #e2e8f0)",
            minHeight: "100vh",
            padding: "2rem 1rem",
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            color: "#1e293b",
        },
        container: {
            maxWidth: "1200px",
            margin: "0 auto",
        },
        header: {
            textAlign: "center",
            marginBottom: "2.5rem",
        },
        title: {
            fontSize: "2.5rem",
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: "0.75rem",
            letterSpacing: "-0.025em",
        },
        adminButtonContainer: {
            textAlign: "center",
            marginBottom: "2.5rem",
        },
        adminButton: {
            display: "inline-block",
            padding: "0.9rem 2.2rem",
            background: "#b91c1c",
            color: "white",
            fontSize: "1.1rem",
            fontWeight: 600,
            borderRadius: "0.75rem",
            textDecoration: "none",
            boxShadow: "0 4px 6px -1px rgba(185,28,28,0.2)",
            transition: "all 0.2s ease",
            border: "none",
            cursor: "pointer",
        },
        adminButtonHover: {
            background: "#991b1b",
            transform: "translateY(-2px)",
            boxShadow: "0 10px 15px -3px rgba(185,28,28,0.3)",
        },
        alert: {
            padding: "1.25rem",
            borderRadius: "0.75rem",
            marginBottom: "1.75rem",
            textAlign: "center",
            fontWeight: 500,
        },
        alertSuccess: { background: "#ecfdf5", color: "#065f46", border: "1px solid #6ee7b7" },
        alertError: { background: "#fef2f2", color: "#991b1b", border: "1px solid #fca5a5" },
        topSection: {
            display: "flex",
            flexDirection: "row",
            gap: "2rem",
            marginBottom: "2.5rem",
            flexWrap: "wrap",
        },
        searchCard: {
            flex: "1",
            minWidth: "320px",
            background: "white",
            borderRadius: "1rem",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)",
            padding: "1.75rem",
        },
        resultsCard: {
            flex: "2",
            minWidth: "400px",
            background: "white",
            borderRadius: "1rem",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)",
            padding: "1.75rem",
        },
        sectionTitle: {
            fontSize: "1.5rem",
            fontWeight: 600,
            color: "#1e293b",
            marginBottom: "1.25rem",
        },
        searchBox: {
            display: "flex",
            gap: "0.75rem",
            flexWrap: "wrap",
        },
        input: {
            flex: "1",
            minWidth: "220px",
            padding: "0.75rem 1rem",
            borderRadius: "0.75rem",
            border: "1px solid #cbd5e1",
            fontSize: "1rem",
            background: "#f8fafc",
        },
        searchBtn: {
            padding: "0.75rem 1.75rem",
            background: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "0.75rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
        },
        hotelList: {
            display: "grid",
            gap: "1rem",
        },
        hotelCard: {
            border: "1px solid #e2e8f0",
            borderRadius: "0.875rem",
            padding: "1.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            transition: "all 0.2s ease",
        },
        formCard: {
            background: "white",
            borderRadius: "1rem",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.08)",
            padding: "2rem",
        },
        formGrid: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "1.5rem",
        },
        label: {
            display: "block",
            fontSize: "0.95rem",
            fontWeight: 500,
            color: "#475569",
            marginBottom: "0.5rem",
        },
        bookBtn: {
            width: "100%",
            padding: "1.125rem",
            background: "linear-gradient(to right, #10b981, #059669)",
            color: "white",
            border: "none",
            borderRadius: "0.75rem",
            fontSize: "1.125rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s ease",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
        },

        // ── MODAL STYLES ──
        modalOverlay: {
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem",
        },
        modalContent: {
            background: "white",
            borderRadius: "16px",
            maxWidth: "620px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
            padding: "2.2rem",
        },
        modalTitle: {
            fontSize: "1.8rem",
            fontWeight: 700,
            margin: "0 0 1.5rem 0",
            color: "#111827",
            textAlign: "center",
        },
        modalBody: {
            fontSize: "1rem",
            lineHeight: 1.65,
            color: "#374151",
        },
        modalList: {
            paddingLeft: "1.6rem",
            margin: "1.2rem 0",
        },
        modalStep: {
            marginBottom: "1rem",
            fontWeight: 500,
        },
        btnPrimary: {
            padding: "0.8rem 1.6rem",
            background: "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontWeight: 600,
            cursor: "pointer",
            transition: "background 0.2s",
        },
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Cari & Pesan Hotel</h1>
                </div>

                {/* Tombol Admin Dashboard */}
                <div style={styles.adminButtonContainer}>
                    <a
                        href="http://localhost:3000/admin"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.adminButton}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = styles.adminButtonHover.background;
                            e.currentTarget.style.transform = "translateY(-2px)";
                            e.currentTarget.style.boxShadow = styles.adminButtonHover.boxShadow;
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#55b91c";
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 4px 6px -1px rgba(99, 185, 28, 0.2)";
                        }}
                    >
                        Dashboard Admin
                    </a>
                </div>

                {message && (
                    <div
                        style={{
                            ...styles.alert,
                            ...(messageType === "success" ? styles.alertSuccess : styles.alertError),
                        }}
                    >
                        <strong>{message}</strong>
                        {bookingRef && (
                            <p style={{ marginTop: "0.5rem", fontWeight: 600 }}>
                                No. Referensi: <span style={{ color: "#065f46" }}>{bookingRef}</span>
                            </p>
                        )}
                    </div>
                )}

                {/* SEARCH + HOTEL LIST – Side by Side */}
                <div style={styles.topSection}>
                    {/* Search Card */}
                    <div style={styles.searchCard}>
                        <h2 style={styles.sectionTitle}>Lokasi Tujuan</h2>
                        <div style={styles.searchBox}>
                            <input
                                style={styles.input}
                                type="text"
                                placeholder="Kota atau daerah (contoh: Badung, Denpasar, Gianyar)"
                                value={city}
                                onChange={(e) => setCity(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && searchHotel()}
                            />
                            <button
                                style={styles.searchBtn}
                                onClick={searchHotel}
                                disabled={loadingHotels}
                            >
                                {loadingHotels ? "Mencari..." : "Cari Hotel"}
                            </button>
                        </div>
                    </div>

                    {/* Hotel Results Card */}
                    <div style={styles.resultsCard}>
                        {hotels.length > 0 ? (
                            <>
                                <h2 style={styles.sectionTitle}>
                                    Hotel Tersedia {city ? `di ${city}` : ""}
                                </h2>
                                <div style={styles.hotelList}>
                                    {hotels.map((hotel) => (
                                        <div key={hotel.id} style={styles.hotelCard}>
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 600 }}>
                                                    {hotel.name}
                                                </h3>
                                                <p style={{ color: "#64748b", marginTop: "0.25rem" }}>
                                                    📍 {hotel.city}
                                                </p>
                                            </div>
                                            <button
                                                style={{
                                                    background: "#6366f1",
                                                    color: "white",
                                                    border: "none",
                                                    padding: "0.625rem 1.25rem",
                                                    borderRadius: "0.625rem",
                                                    cursor: "pointer",
                                                    fontWeight: 500,
                                                    transition: "all 0.2s ease",
                                                }}
                                                onClick={() =>
                                                    handleChange({ target: { name: "hotel_id", value: hotel.id } })
                                                }
                                            >
                                                Pilih
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </>
                        ) : (
                            <div style={{ color: "#64748b", textAlign: "center", padding: "3rem 1rem" }}>
                                {loadingHotels
                                    ? "Sedang mencari hotel..."
                                    : "Belum ada hasil. Masukkan kota tujuan Anda di sebelah kiri."}
                            </div>
                        )}
                    </div>
                </div>

                {/* Form Pemesanan */}
                <div style={styles.formCard}>
                    <h2 style={styles.sectionTitle}>Detail Pemesanan</h2>

                    <form onSubmit={handleSubmit} style={styles.formGrid}>
                        <div>
                            <label style={styles.label}>Hotel yang Dipilih</label>
                            <select
                                name="hotel_id"
                                value={form.hotel_id}
                                onChange={handleChange}
                                required
                                style={styles.input}
                            >
                                <option value="">Pilih hotel terlebih dahulu</option>
                                {hotels.map((h) => (
                                    <option key={h.id} value={h.id}>
                                        {h.name} — {h.city}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label style={styles.label}>Tanggal Check-in</label>
                            <input
                                type="date"
                                name="check_in"
                                value={form.check_in}
                                onChange={handleChange}
                                required
                                style={styles.input}
                            />
                        </div>

                        <div>
                            <label style={styles.label}>Tanggal Check-out</label>
                            <input
                                type="date"
                                name="check_out"
                                value={form.check_out}
                                onChange={handleChange}
                                required
                                style={styles.input}
                            />
                        </div>

                        <div>
                            <label style={styles.label}>Nama Lengkap</label>
                            <input
                                type="text"
                                name="guest_name"
                                value={form.guest_name}
                                onChange={handleChange}
                                required
                                style={styles.input}
                            />
                        </div>

                        <div>
                            <label style={styles.label}>Email</label>
                            <input
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                required
                                style={styles.input}
                            />
                        </div>

                        <div>
                            <label style={styles.label}>
                                Tipe Kamar {loadingRooms && <span style={{ color: "#64748b" }}>(memuat...)</span>}
                            </label>
                            <select
                                name="room_id"
                                value={form.room_id}
                                onChange={handleChange}
                                required
                                disabled={loadingRooms || !checkInOutSelected || rooms.length === 0}
                                style={styles.input}
                            >
                                <option value="">Pilih tipe kamar yang tersedia</option>
                                {rooms.map((room) => (
                                    <option
                                        key={room.id}
                                        value={room.id}
                                        disabled={!room.is_available}
                                    >
                                        {room.room_type} • Rp {Number(room.price).toLocaleString("id-ID")}
                                        {room.is_available
                                            ? `  (${room.available_rooms} tersisa)`
                                            : "  • Penuh"}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div style={{ gridColumn: "1 / -1", marginTop: "1.5rem" }}>
                            <button
                                type="submit"
                                style={styles.bookBtn}
                                disabled={loadingRooms || !form.room_id}
                            >
                                {loadingRooms ? "Memproses..." : "Konfirmasi & Pesan Sekarang"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* ── MODAL PETUNJUK CARA BOOKING ── */}
            {showGuideModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2 style={styles.modalTitle}>Cara Melakukan Booking Hotel</h2>
                        <div style={styles.modalBody}>
                            <p style={{ marginBottom: "1.2rem", fontWeight: 500 }}>
                                <strong>Persiapan Awal (Admin)</strong><br />
                                Sebelum melakukan booking, pastikan data <strong>Hotel</strong> dan <strong>Room / Tipe Kamar</strong> sudah ditambahkan melalui <strong>Admin Dashboard</strong>.<br />
                                Klik tombol <strong>"Dashboard Admin"</strong> untuk masuk ke dashboard admin lalu tambahkan hotel dan kamar terlebih dahulu.<br />
                                → Setelah data tersedia, barulah proses booking dapat dilakukan oleh user.
                            </p>

                            <ol style={styles.modalList}>
                                <li style={styles.modalStep}>
                                    <strong>1. Cari Hotel di Kota Tujuan</strong><br />
                                    Ketik nama kota (contoh: Bali, Jakarta, Yogyakarta, Surabaya) di kolom <strong>Lokasi Tujuan</strong> → klik tombol <strong>Cari Hotel</strong> atau tekan Enter.<br />
                                    → Daftar hotel akan muncul di sebelah kanan secara otomatis.
                                </li>

                                <li style={styles.modalStep}>
                                    <strong>2. Pilih Hotel yang Diinginkan</strong><br />
                                    Pada daftar hotel di sebelah kanan, klik tombol <strong>Pilih</strong> pada hotel yang Anda sukai.<br />
                                    → Nama hotel akan otomatis terpilih di form pemesanan di bawah.
                                </li>

                                <li style={styles.modalStep}>
                                    <strong>3. Tentukan Tanggal Menginap</strong><br />
                                    Isi tanggal <strong>Check-in</strong> (tanggal mulai menginap) dan <strong>Check-out</strong> (tanggal keluar).<br />
                                    → Sistem akan langsung memeriksa ketersediaan kamar untuk rentang tanggal tersebut.<br />
                                    → Pastikan: Check-out lebih lambat dari Check-in dan Check-in tidak boleh di masa lalu.
                                </li>

                                <li style={styles.modalStep}>
                                    <strong>4. Pilih Tipe Kamar yang Tersedia</strong><br />
                                    Setelah tanggal diisi, dropdown <strong>Tipe Kamar</strong> akan menampilkan kamar yang masih tersedia.<br />
                                    • Pilih tipe kamar yang ditandai dengan jumlah "tersisa" (misal: "2 tersisa").<br />
                                    • Jika bertuliskan "Penuh" → kamar sudah habis untuk tanggal tersebut.<br />
                                    → Pilih salah satu yang masih available.
                                </li>

                                <li style={styles.modalStep}>
                                    <strong>5. Isi Data Pribadi</strong><br />
                                    Masukkan <strong>Nama Lengkap</strong> dan <strong>Email</strong> dengan benar.<br />
                                    → Email ini akan digunakan untuk konfirmasi booking dan informasi lebih lanjut.
                                </li>

                                <li style={styles.modalStep}>
                                    <strong>6. Konfirmasi Pemesanan</strong><br />
                                    Periksa kembali semua data yang sudah diisi.<br />
                                    Klik tombol <strong>Konfirmasi & Pesan Sekarang</strong>.<br />
                                    → Jika berhasil, akan muncul pesan hijau "Booking berhasil!" beserta nomor referensi booking.
                                </li>

                                <li style={styles.modalStep}>
                                    <strong>Catatan Penting</strong><br />
                                    • Booking hanya bisa dilakukan jika ada kamar tersedia (sistem otomatis memeriksa).<br />
                                    • Jika muncul pesan merah → baca dengan teliti (contoh: tanggal salah, kamar penuh, field kosong).<br />
                                    • Admin dapat melihat semua booking di <strong>Admin Dashboard</strong> .<br />
                                    • Proses ini tidak memerlukan login (untuk kemudahan testing/demo).<br />
                                    • Refresh halaman jika ingin mulai dari awal.
                                </li>
                            </ol>

                            <div style={{ marginTop: "1.8rem", textAlign: "center" }}>
                                <button style={styles.btnPrimary} onClick={closeGuideModal}>
                                    Mengerti — Mulai Booking Sekarang →
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default BookingPage;