import React, { useEffect, useState } from "react";
import api from "../api/api";

// FORMAT RUPIAH & TANGGAL
const formatRupiah = (number) => {
    if (!number) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
    }).format(number);
};

const formatDate = (date) => {
    if (!date) return "—";
    return new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(new Date(date));
};

function AdminDashboard() {
    const [activeTab, setActiveTab] = useState("bookings");
    const [showGuideModal, setShowGuideModal] = useState(false);

    const [hotels, setHotels] = useState([]);
    const [rooms, setRooms] = useState([]);
    const [bookings, setBookings] = useState([]);

    const [hotelForm, setHotelForm] = useState({
        name: "",
        city: "",
        address: "",
        description: "",
    });

    const [roomForm, setRoomForm] = useState({
        hotel_id: "",
        room_type: "",
        price: "",
        total_rooms: "",
    });

    useEffect(() => {
        // ── Dihapus: setShowGuideModal(true); ──
        // Modal sekarang hanya muncul saat tombol diklik

        fetchHotels();
        fetchRooms();
        fetchBookings();
    }, []);

    const fetchHotels = async () => {
        try {
            const res = await api.get("/admin/hotels");
            setHotels(res.data);
        } catch (err) {
            console.error("Gagal memuat hotels", err);
        }
    };

    const fetchRooms = async () => {
        try {
            const res = await api.get("/admin/rooms");
            setRooms(res.data);
        } catch (err) {
            console.error("Gagal memuat rooms", err);
        }
    };

    const fetchBookings = async () => {
        try {
            const res = await api.get("/admin/bookings");
            setBookings(res.data);
        } catch (err) {
            console.error("Gagal memuat bookings", err);
        }
    };

    // ── HOTEL ────────────────────────────────────────
    const createHotel = async () => {
        if (!hotelForm.name || !hotelForm.city) {
            return alert("Nama hotel dan kota wajib diisi!");
        }
        try {
            await api.post("/admin/hotels", hotelForm);
            setHotelForm({ name: "", city: "", address: "", description: "" });
            fetchHotels();
            alert("Hotel berhasil ditambahkan!");
        } catch (err) {
            console.error("Gagal menambah hotel", err);
            alert("Gagal menambah hotel. Silakan cek koneksi atau data.");
        }
    };

    const deleteHotel = async (id) => {
        if (!window.confirm("Yakin ingin menghapus hotel ini?\nSemua kamar terkait juga akan terhapus.")) return;
        try {
            await api.delete(`/admin/hotels/${id}`);
            fetchHotels();
            alert("Hotel berhasil dihapus.");
        } catch (err) {
            console.error("Gagal menghapus hotel", err);
            alert("Gagal menghapus hotel.");
        }
    };

    // ── ROOM ─────────────────────────────────────────
    const handlePriceChange = (e) => {
        const value = e.target.value.replace(/\D/g, "");
        setRoomForm({ ...roomForm, price: value });
    };

    const createRoom = async () => {
        if (!roomForm.hotel_id || !roomForm.room_type || !roomForm.price) {
            return alert("Hotel, tipe kamar, dan harga wajib diisi!");
        }
        try {
            await api.post("/admin/rooms", {
                ...roomForm,
                price: Number(roomForm.price),
                total_rooms: Number(roomForm.total_rooms) || 0,
            });
            setRoomForm({ hotel_id: "", room_type: "", price: "", total_rooms: "" });
            fetchRooms();
            alert("Tipe kamar berhasil ditambahkan!");
        } catch (err) {
            console.error("Gagal menambah kamar", err);
            alert("Gagal menambah tipe kamar.");
        }
    };

    const deleteRoom = async (id) => {
        if (!window.confirm("Yakin ingin menghapus tipe kamar ini?")) return;
        try {
            await api.delete(`/admin/rooms/${id}`);
            fetchRooms();
            alert("Tipe kamar berhasil dihapus.");
        } catch (err) {
            console.error("Gagal menghapus kamar", err);
            alert("Gagal menghapus tipe kamar.");
        }
    };

    // ── BOOKING ──────────────────────────────────────
    const deleteBooking = async (id) => {
        if (!window.confirm("Yakin ingin membatalkan booking ini secara permanen?")) return;
        try {
            await api.delete(`/admin/bookings/${id}`);
            fetchBookings();
            alert("Booking berhasil dibatalkan.");
        } catch (err) {
            console.error("Gagal membatalkan booking", err);
            alert("Gagal membatalkan booking.");
        }
    };

    // ── FUNGSI MODAL ─────────────────────────────────
    const openGuideModal = () => {
        setShowGuideModal(true);
    };

    const closeGuideModal = () => {
        setShowGuideModal(false);
    };

    return (
        <div style={styles.page}>
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <h1 style={styles.title}>Admin Dashboard</h1>
                    <button
                        style={styles.guideButton}
                        onClick={openGuideModal}
                    >
                        Petunjuk Penggunaan
                    </button>
                </div>
            </header>

            {/* Tab Navigation */}
            <div style={styles.tabContainer}>
                <button
                    style={{
                        ...styles.tabButton,
                        ...(activeTab === "bookings" ? styles.tabActive : {}),
                    }}
                    onClick={() => setActiveTab("bookings")}
                >
                    Booking ({bookings.length})
                </button>
                <button
                    style={{
                        ...styles.tabButton,
                        ...(activeTab === "hotels" ? styles.tabActive : {}),
                    }}
                    onClick={() => setActiveTab("hotels")}
                >
                    Hotel ({hotels.length})
                </button>
                <button
                    style={{
                        ...styles.tabButton,
                        ...(activeTab === "rooms" ? styles.tabActive : {}),
                    }}
                    onClick={() => setActiveTab("rooms")}
                >
                    Kamar ({rooms.length})
                </button>
            </div>

            <main style={styles.main}>
                {/* TAB BOOKINGS */}
                {activeTab === "bookings" && (
                    <section style={styles.section}>
                        <h2 style={styles.sectionTitle}>Daftar Booking Terbaru</h2>

                        {bookings.length === 0 ? (
                            <p style={styles.emptyText}>Belum ada booking saat ini</p>
                        ) : (
                            <div style={styles.tableContainer}>
                                <div style={styles.tableHeader}>
                                    <div>Kode Ref</div>
                                    <div>Hotel</div>
                                    <div>Kamar</div>
                                    <div>Tamu</div>
                                    <div>Email</div>
                                    <div>Check-in</div>
                                    <div>Check-out</div>
                                    <div>Aksi</div>
                                </div>

                                {bookings.map((b, i) => (
                                    <div
                                        key={b.id}
                                        style={{
                                            ...styles.tableRow,
                                            background: i % 2 === 0 ? "#f8fafc" : "white",
                                        }}
                                    >
                                        <div style={styles.refCell}>{b.booking_reference}</div>
                                        <div>{b.hotel_name || "—"}</div>
                                        <div>{b.room_type || "—"}</div>
                                        <div>{b.guest_name}</div>
                                        <div style={styles.emailCell}>{b.email}</div>
                                        <div>{formatDate(b.check_in)}</div>
                                        <div>{formatDate(b.check_out)}</div>
                                        <div>
                                            <button
                                                style={styles.btnDangerSmall}
                                                onClick={() => deleteBooking(b.id)}
                                            >
                                                Batal
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                )}

                {/* TAB HOTELS */}
                {activeTab === "hotels" && (
                    <>
                        <section style={styles.section}>
                            <h2 style={styles.sectionTitle}>Tambah Hotel Baru</h2>
                            <div style={styles.formGrid}>
                                <input
                                    style={styles.input}
                                    placeholder="Nama Hotel *"
                                    value={hotelForm.name}
                                    onChange={(e) => setHotelForm({ ...hotelForm, name: e.target.value })}
                                />
                                <input
                                    style={styles.input}
                                    placeholder="Kota *"
                                    value={hotelForm.city}
                                    onChange={(e) => setHotelForm({ ...hotelForm, city: e.target.value })}
                                />
                                <input
                                    style={{ ...styles.input, gridColumn: "1 / -1" }}
                                    placeholder="Alamat Lengkap"
                                    value={hotelForm.address}
                                    onChange={(e) => setHotelForm({ ...hotelForm, address: e.target.value })}
                                />
                                <textarea
                                    style={{ ...styles.input, gridColumn: "1 / -1", height: 70 }}
                                    placeholder="Deskripsi singkat..."
                                    value={hotelForm.description}
                                    onChange={(e) => setHotelForm({ ...hotelForm, description: e.target.value })}
                                />
                            </div>
                            <button style={styles.btnPrimary} onClick={createHotel}>
                                + Tambah Hotel
                            </button>
                        </section>

                        <section style={styles.section}>
                            <h2 style={styles.sectionTitle}>Daftar Hotel</h2>
                            <div style={styles.listContainer}>
                                {hotels.length === 0 ? (
                                    <p style={styles.emptyText}>Belum ada hotel</p>
                                ) : (
                                    hotels.map((hotel) => (
                                        <div key={hotel.id} style={styles.listItem}>
                                            <div style={styles.listItemContent}>
                                                <div style={styles.hotelName}>{hotel.name}</div>
                                                <div style={styles.hotelMeta}>
                                                    {hotel.city} • {hotel.address || "—"}
                                                </div>
                                            </div>
                                            <button
                                                style={styles.btnDangerSmall}
                                                onClick={() => deleteHotel(hotel.id)}
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </>
                )}

                {/* TAB ROOMS */}
                {activeTab === "rooms" && (
                    <>
                        <section style={styles.section}>
                            <h2 style={styles.sectionTitle}>Tambah Tipe Room</h2>
                            <div style={styles.formGrid}>
                                <select
                                    style={styles.input}
                                    value={roomForm.hotel_id}
                                    onChange={(e) => setRoomForm({ ...roomForm, hotel_id: e.target.value })}
                                >
                                    <option value="">Pilih Hotel *</option>
                                    {hotels.map((h) => (
                                        <option key={h.id} value={h.id}>
                                            {h.name}
                                        </option>
                                    ))}
                                </select>
                                <input
                                    style={styles.input}
                                    placeholder="Tipe Room *"
                                    value={roomForm.room_type}
                                    onChange={(e) => setRoomForm({ ...roomForm, room_type: e.target.value })}
                                />
                                <input
                                    style={styles.input}
                                    placeholder="Harga per malam *"
                                    value={roomForm.price ? formatRupiah(roomForm.price) : ""}
                                    onChange={handlePriceChange}
                                />
                                <input
                                    style={styles.input}
                                    type="number"
                                    min="0"
                                    placeholder="Jumlah Kamar"
                                    value={roomForm.total_rooms}
                                    onChange={(e) =>
                                        setRoomForm({
                                            ...roomForm,
                                            total_rooms: e.target.value.replace(/\D/g, ""),
                                        })
                                    }
                                />
                            </div>
                            <button style={styles.btnPrimary} onClick={createRoom}>
                                + Tambah Kamar
                            </button>
                        </section>

                        <section style={styles.section}>
                            <h2 style={styles.sectionTitle}>Daftar Tipe Kamar</h2>
                            <div style={styles.listContainer}>
                                {rooms.length === 0 ? (
                                    <p style={styles.emptyText}>Belum ada tipe kamar</p>
                                ) : (
                                    rooms.map((room) => (
                                        <div key={room.id} style={styles.roomCard}>
                                            <div>
                                                <div style={styles.hotelNameSmall}>{room.hotel_name}</div>
                                                <div style={styles.roomType}>{room.room_type}</div>
                                                <div style={styles.roomMeta}>
                                                    {formatRupiah(room.price)} • {room.total_rooms || "?"} unit
                                                </div>
                                            </div>
                                            <button
                                                style={styles.btnDangerSmall}
                                                onClick={() => deleteRoom(room.id)}
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </>
                )}
            </main>

            {/* ── MODAL PETUNJUK PENGGUNAAN ── */}
            {showGuideModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <h2 style={styles.modalTitle}>Petunjuk Penggunaan Admin Dashboard</h2>
                        <div style={styles.modalBody}>
                            <p style={{ marginBottom: "1.2rem", fontWeight: 500 }}>
                                Halaman ini dibuat untuk keperluan testing project booking hotel.
                                Berikut panduan lengkap cara menggunakannya:
                            </p>

                            <ol style={styles.modalList}>
                                <li>
                                    <strong>Navigasi Tab</strong><br />
                                    Terdapat 3 tab utama di bagian atas:
                                    <ul>
                                        <li><strong>Booking</strong> → menampilkan semua reservasi (tab ini muncul pertama kali)</li>
                                        <li><strong>Hotel</strong> → mengelola data hotel (tambah & hapus)</li>
                                        <li><strong>Kamar</strong> → mengelola tipe kamar per hotel</li>
                                    </ul>
                                </li>

                                <li>
                                    <strong>Menambah Hotel Baru</strong><br />
                                    1. Masuk ke tab <strong>Hotel</strong><br />
                                    2. Isi form: Nama Hotel & Kota wajib diisi<br />
                                    3. Alamat & Deskripsi bersifat opsional<br />
                                    4. Klik tombol <strong>+ Tambah Hotel</strong><br />
                                    → Data akan langsung tersimpan dan muncul di daftar di bawahnya.
                                </li>

                                <li>
                                    <strong>Menambah Tipe Kamar</strong><br />
                                    1. Masuk ke tab <strong>Kamar</strong><br />
                                    2. Pilih hotel dari dropdown (wajib)<br />
                                    3. Isi Tipe Kamar & Harga per malam (wajib)<br />
                                    4. Jumlah kamar boleh kosong (default 0)<br />
                                    5. Harga otomatis diformat menjadi Rupiah saat diketik<br />
                                    6. Klik <strong>+ Tambah Kamar</strong>
                                </li>

                                <li>
                                    <strong>Menghapus Data</strong><br />
                                    Pada setiap item (hotel, kamar, booking) terdapat tombol <strong>Hapus</strong> atau <strong>Batal</strong>.<br />
                                    Klik tombol tersebut → akan muncul konfirmasi.<br />
                                    Jika disetujui, data akan dihapus permanen dari database.
                                </li>

                                <li>
                                    <strong>Format Mata Uang</strong><br />
                                    Harga otomatis diformat menjadi Rupiah (Rp) saat diketik
                                </li>

                                <li>
                                    <strong>Catatan Penting untuk Tester / Penilai</strong><br />
                                    • Semua operasi (tambah, hapus) langsung terhubung ke backend/database<br />
                                    • Tidak ada sistem login/autentikasi (untuk menyederhanakan testing)<br />
                                    • Data booking akan muncul setelah user melakukan pemesanan dari halaman depan<br />
                                    • Semua field harga & jumlah otomatis divalidasi hanya angka
                                </li>

                                <li>
                                    <strong>Tips Penggunaan</strong><br />
                                    • Gunakan tab Booking untuk memantau reservasi terbaru<br />
                                    • Tambah beberapa hotel dulu sebelum menambah kamar<br />
                                    • Gunakan tombol Batal pada booking jika ingin membatalkan reservasi customer<br />
                                    • Klik tombol "Petunjuk Penggunaan" di header jika ingin membaca panduan ini lagi
                                </li>
                            </ol>

                            <div style={{ marginTop: "1.8rem", textAlign: "center" }}>
                                <button style={styles.btnPrimary} onClick={closeGuideModal}>
                                    Saya Mengerti — Mulai Kelola Sekarang
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ────────────────────────────────────────────────
// Styles (ditambah style untuk tombol petunjuk)
// ────────────────────────────────────────────────
const styles = {
    page: {
        minHeight: "100vh",
        background: "linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#1e293b",
    },
    header: {
        padding: "1.5rem 2rem",
        background: "white",
        borderBottom: "1px solid #e2e8f0",
        position: "sticky",
        top: 0,
        zIndex: 10,
        boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
    },
    headerContent: {
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "1rem",
    },
    title: {
        fontSize: "1.8rem",
        fontWeight: 700,
        margin: 0,
        color: "#0f172a",
    },
    guideButton: {
        padding: "0.6rem 1.4rem",
        background: "#3b82f6",
        color: "white",
        border: "none",
        borderRadius: "8px",
        fontWeight: 600,
        fontSize: "0.95rem",
        cursor: "pointer",
        transition: "background 0.2s, transform 0.1s",
    },
    tabContainer: {
        display: "flex",
        gap: "0.5rem",
        padding: "1rem 2rem",
        background: "white",
        borderBottom: "1px solid #e2e8f0",
        position: "sticky",
        top: "70px",
        zIndex: 9,
    },
    tabButton: {
        padding: "0.75rem 1.5rem",
        background: "#f1f5f9",
        border: "none",
        borderRadius: "0.75rem 0.75rem 0 0",
        fontWeight: 600,
        cursor: "pointer",
        transition: "all 0.2s",
        color: "#475569",
    },
    tabActive: {
        background: "white",
        color: "#3b82f6",
        borderBottom: "3px solid #3b82f6",
    },
    main: {
        padding: "1.5rem 2rem",
        maxWidth: "1400px",
        margin: "0 auto",
    },
    section: {
        background: "white",
        borderRadius: "12px",
        padding: "1.5rem",
        marginBottom: "1.5rem",
        boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
        border: "1px solid #e5e7eb",
    },
    sectionTitle: {
        fontSize: "1.35rem",
        fontWeight: 600,
        margin: "0 0 1.25rem 0",
        color: "#111827",
    },
    formGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
        gap: "1rem",
        marginBottom: "1.25rem",
    },
    input: {
        padding: "0.75rem 1rem",
        border: "1px solid #d1d5db",
        borderRadius: "8px",
        fontSize: "0.95rem",
        background: "#f9fafb",
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
    btnDangerSmall: {
        padding: "0.5rem 1rem",
        background: "#ef4444",
        color: "white",
        border: "none",
        borderRadius: "6px",
        fontSize: "0.85rem",
        cursor: "pointer",
        transition: "background 0.2s",
    },
    listContainer: {
        display: "grid",
        gap: "0.75rem",
    },
    listItem: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem",
        background: "#f9fafb",
        borderRadius: "10px",
        border: "1px solid #e5e7eb",
    },
    listItemContent: {
        flex: 1,
    },
    hotelName: {
        fontSize: "1.1rem",
        fontWeight: 600,
    },
    hotelNameSmall: {
        fontSize: "1.05rem",
        fontWeight: 600,
    },
    hotelMeta: {
        fontSize: "0.9rem",
        color: "#6b7280",
        marginTop: "0.25rem",
    },
    roomCard: {
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem",
        background: "#f9fafb",
        borderRadius: "10px",
        border: "1px solid #e5e7eb",
    },
    roomType: {
        fontSize: "1rem",
        fontWeight: 500,
    },
    roomMeta: {
        fontSize: "0.9rem",
        color: "#6b7280",
        marginTop: "0.3rem",
    },
    tableContainer: {
        border: "1px solid #e5e7eb",
        borderRadius: "10px",
        overflow: "hidden",
    },
    tableHeader: {
        display: "grid",
        gridTemplateColumns: "1.3fr 1fr 1.1fr 1.5fr 1.2fr 1fr 1fr 90px",
        background: "#f3f4f6",
        padding: "0.9rem 1rem",
        fontWeight: 600,
        fontSize: "0.85rem",
        color: "#4b5563",
        gap: "0.5rem",
    },
    tableRow: {
        display: "grid",
        gridTemplateColumns: "1.3fr 1fr 1.1fr 1.5fr 1.2fr 1fr 1fr 90px",
        padding: "0.9rem 1rem",
        gap: "0.5rem",
        alignItems: "center",
        fontSize: "0.9rem",
        borderTop: "1px solid #f3f4f6",
    },
    emailCell: {
        color: "#2563eb",
        wordBreak: "break-all",
    },
    refCell: {
        fontFamily: "monospace",
        background: "#f3f4f6",
        padding: "0.3rem 0.6rem",
        borderRadius: "6px",
        fontSize: "0.85rem",
    },
    emptyText: {
        color: "#9ca3af",
        fontStyle: "italic",
        textAlign: "center",
        padding: "2.5rem 1rem",
    },

    // ── MODAL STYLES ── (tetap sama)
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
        maxWidth: "640px",
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
};

export default AdminDashboard;