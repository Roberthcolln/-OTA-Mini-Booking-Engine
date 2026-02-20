import { useState, useEffect, useRef } from "react";
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
    const [showGuideModal, setShowGuideModal] = useState(false);

    const [checkInOutSelected, setCheckInOutSelected] = useState(false);

    const [form, setForm] = useState({
        hotel_id: "",
        room_id: "",
        guest_name: "",
        email: "",
        check_in: "",
        check_out: "",
    });

    // State tambahan untuk perhitungan biaya
    const [nights, setNights] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);
    const [pricePerNight, setPricePerNight] = useState(0);

    // Ref untuk auto-scroll ke alert setelah booking berhasil
    const alertRef = useRef(null);

    // Hitung jumlah malam dan total harga setiap kali tanggal atau kamar berubah
    useEffect(() => {
        if (!form.check_in || !form.check_out || !form.room_id) {
            setNights(0);
            setTotalPrice(0);
            setPricePerNight(0);
            return;
        }

        const cin = new Date(form.check_in);
        const cout = new Date(form.check_out);

        if (isNaN(cin.getTime()) || isNaN(cout.getTime()) || cin >= cout) {
            setNights(0);
            setTotalPrice(0);
            setPricePerNight(0);
            return;
        }

        const diffTime = cout - cin;
        const calculatedNights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        setNights(calculatedNights);

        const selectedRoom = rooms.find((r) => String(r.id) === String(form.room_id));
        if (selectedRoom && selectedRoom.price) {
            const price = Number(selectedRoom.price);
            setPricePerNight(price);
            setTotalPrice(price * calculatedNights);
        } else {
            setPricePerNight(0);
            setTotalPrice(0);
        }
    }, [form.check_in, form.check_out, form.room_id, rooms]);

    useEffect(() => {
        if (!form.hotel_id || !form.check_in || !form.check_out) {
            if (form.hotel_id) {
                setMessage("Silakan pilih tanggal check-in dan check-out untuk melihat kamar yang tersedia");
                setMessageType("info");
            }
            setCheckInOutSelected(false);
            setRooms([]);
            return;
        }

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

    const searchHotel = async () => {
        if (!city.trim()) return;
        setLoadingHotels(true);
        try {
            const res = await axios.get(
                `http://localhost:5000/api/hotels/search?city=${encodeURIComponent(city)}`
            );
            setHotels(res.data || []);
            setMessage("");
        } catch (err) {
            console.error("Error search hotel:", err);
            setMessage("Gagal mencari hotel. Silakan coba lagi.");
            setMessageType("error");
        } finally {
            setLoadingHotels(false);
        }
    };

    const getHotelRooms = async (hotelId, checkIn = null, checkOut = null) => {
        if (!hotelId) return;

        setLoadingRooms(true);
        setMessage("");

        try {
            let url = `http://localhost:5000/api/hotels/${hotelId}`;
            if (checkIn && checkOut) {
                url += `?check_in=${checkIn}&check_out=${checkOut}`;
            }

            const res = await axios.get(url);
            setRooms(res.data || []);

            if (res.data.length === 0) {
                setMessage("Tidak ada tipe kamar yang tersedia untuk hotel ini pada tanggal tersebut");
                setMessageType("info");
            }
        } catch (err) {
            console.error("Error get hotel rooms:", err.response?.data || err.message);
            setMessage("Gagal memuat daftar kamar. Pastikan tanggal valid dan server berjalan.");
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
            setRooms([]);
            setCheckInOutSelected(false);

            if (form.check_in && form.check_out) {
                getHotelRooms(value, form.check_in, form.check_out);
            } else {
                setMessage("Pilih tanggal check-in dan check-out terlebih dahulu untuk melihat ketersediaan kamar");
                setMessageType("info");
            }
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

        if (nights < 1 || totalPrice <= 0) {
            setMessage("Periksa kembali tanggal menginap (minimal 1 malam)");
            setMessageType("error");
            return;
        }

        try {
            const payload = {
                ...form,
                // Kirim total_price agar backend bisa memverifikasi (opsional tapi direkomendasikan)
                total_price: totalPrice,
                // Bisa juga kirim nights jika ingin verifikasi ganda
                nights: nights,
            };

            const res = await axios.post("http://localhost:5000/api/bookings", payload, {
                headers: {
                    "Content-Type": "application/json",
                },
            });

            // Cek apakah backend benar-benar mengembalikan total_price yang sesuai
            const returnedTotal = res.data.total_price;
            if (returnedTotal && Math.abs(returnedTotal - totalPrice) > 1) {
                console.warn("Total price dari backend berbeda dengan perhitungan frontend", {
                    frontend: totalPrice,
                    backend: returnedTotal,
                });
            }

            setMessage("Booking berhasil! Terima kasih atas pemesanannya.");
            setMessageType("success");
            setBookingRef(res.data.booking_reference);

            // Reset form setelah berhasil
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
            setNights(0);
            setTotalPrice(0);
            setPricePerNight(0);

            // Auto scroll ke alert success dengan sedikit delay
            setTimeout(() => {
                if (alertRef.current) {
                    alertRef.current.scrollIntoView({
                        behavior: "smooth",
                        block: "center",
                    });
                }
            }, 150);
        } catch (err) {
            console.error("Error booking:", err.response?.data || err.message);
            const errorMsg = err.response?.data?.message || "Gagal melakukan booking. Silakan coba lagi.";
            setMessage(errorMsg);
            setMessageType("error");
        }
    };

    const openGuideModal = () => setShowGuideModal(true);
    const closeGuideModal = () => setShowGuideModal(false);

    // Styles (modern, responsive, dengan hover effects) — tetap sama
    const styles = {
        page: {
            background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
            minHeight: "100vh",
            padding: "2.5rem 1rem 5rem",
            fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            color: "#0f172a",
        },
        container: {
            maxWidth: "1280px",
            margin: "0 auto",
            width: "100%",
        },
        header: {
            textAlign: "center",
            marginBottom: "3.5rem",
        },
        title: {
            fontSize: "clamp(2.5rem, 6vw, 4rem)",
            fontWeight: 800,
            letterSpacing: "-0.04em",
            marginBottom: "1rem",
            background: "linear-gradient(to right, #1e40af, #3b82f6)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
        },
        subtitle: {
            fontSize: "1.25rem",
            color: "#475569",
            maxWidth: "640px",
            margin: "0 auto 1.5rem",
        },
        guideButton: {
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "1rem 2rem",
            background: "linear-gradient(135deg, #3b82f6, #2563eb)",
            color: "white",
            border: "none",
            borderRadius: "9999px",
            fontSize: "1.1rem",
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 10px 25px -5px rgba(59,130,246,0.4)",
            transition: "all 0.3s ease",
        },
        adminButtonContainer: {
            textAlign: "center",
            marginBottom: "3.5rem",
        },
        adminButton: {
            display: "inline-flex",
            alignItems: "center",
            gap: "10px",
            padding: "1rem 2.2rem",
            background: "#dc2626",
            color: "white",
            fontSize: "1.1rem",
            fontWeight: 600,
            borderRadius: "9999px",
            textDecoration: "none",
            boxShadow: "0 10px 25px -5px rgba(220,38,38,0.35)",
            transition: "all 0.3s ease",
            border: "none",
            cursor: "pointer",
        },
        alert: {
            padding: "1.5rem 2rem",
            borderRadius: "1rem",
            margin: "0 auto 3rem",
            maxWidth: "900px",
            textAlign: "center",
            fontWeight: 500,
            fontSize: "1.15rem",
            boxShadow: "0 8px 16px -4px rgba(0,0,0,0.12)",
            transition: "all 0.4s ease",
        },
        alertSuccess: {
            background: "#ecfdf5",
            color: "#065f46",
            border: "2px solid #6ee7b7",
        },
        alertError: {
            background: "#fef2f2",
            color: "#991b1b",
            border: "2px solid #fca5a5",
        },
        alertInfo: {
            background: "#e0f2fe",
            color: "#1e40af",
            border: "2px solid #93c5fd",
        },
        topSection: {
            display: "grid",
            gridTemplateColumns: "minmax(360px, 1fr) minmax(480px, 2fr)",
            gap: "2.5rem",
            marginBottom: "4rem",
            "@media (max-width: 1024px)": {
                gridTemplateColumns: "1fr",
            },
        },
        card: {
            background: "white",
            borderRadius: "1.5rem",
            boxShadow: "0 15px 40px -10px rgba(0,0,0,0.1)",
            overflow: "hidden",
            transition: "transform 0.3s ease, box-shadow 0.3s ease",
        },
        cardHover: {
            transform: "translateY(-8px)",
            boxShadow: "0 30px 60px -15px rgba(0,0,0,0.15)",
        },
        cardHeader: {
            padding: "1.75rem 2rem",
            background: "linear-gradient(to right, #f8fafc, #f1f5f9)",
            borderBottom: "1px solid #e2e8f0",
        },
        cardTitle: {
            margin: 0,
            fontSize: "1.5rem",
            fontWeight: 700,
            color: "#1e293b",
        },
        cardBody: {
            padding: "2rem",
        },
        inputGroup: {
            display: "flex",
            gap: "1rem",
            flexWrap: "wrap",
        },
        input: {
            flex: 1,
            padding: "1rem 1.5rem",
            borderRadius: "1rem",
            border: "1px solid #cbd5e1",
            fontSize: "1.05rem",
            background: "#ffffff",
            transition: "all 0.2s ease",
            outline: "none",
        },
        inputFocus: {
            borderColor: "#3b82f6",
            boxShadow: "0 0 0 4px rgba(59,130,246,0.15)",
        },
        btnPrimary: {
            padding: "1rem 2rem",
            background: "linear-gradient(to right, #6366f1, #4f46e5)",
            color: "white",
            border: "none",
            borderRadius: "1rem",
            fontSize: "1.1rem",
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.3s ease",
            boxShadow: "0 6px 12px -2px rgba(99,102,241,0.25)",
        },
        btnPrimaryHover: {
            transform: "translateY(-3px)",
            boxShadow: "0 12px 24px -6px rgba(99,102,241,0.4)",
            background: "linear-gradient(to right, #4f46e5, #4338ca)",
        },
        hotelCard: {
            padding: "1.5rem 1.75rem",
            border: "1px solid #e2e8f0",
            borderRadius: "1.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "1.5rem",
            transition: "all 0.3s ease",
            background: "#ffffff",
        },
        hotelCardHover: {
            borderColor: "#cbd5e1",
            boxShadow: "0 12px 30px -8px rgba(0,0,0,0.1)",
            transform: "translateY(-6px)",
        },
        formGrid: {
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "2rem",
        },
        label: {
            display: "block",
            fontSize: "1rem",
            fontWeight: 600,
            color: "#334155",
            marginBottom: "0.75rem",
        },
        bookBtn: {
            gridColumn: "1 / -1",
            padding: "1.4rem",
            background: "linear-gradient(to right, #10b981, #059669)",
            color: "white",
            border: "none",
            borderRadius: "1.25rem",
            fontSize: "1.25rem",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.35s ease",
            boxShadow: "0 12px 30px -6px rgba(16,185,129,0.4)",
            marginTop: "1.5rem",
        },
        bookBtnHover: {
            transform: "translateY(-4px)",
            boxShadow: "0 20px 40px -10px rgba(16,185,129,0.5)",
            background: "linear-gradient(to right, #059669, #047857)",
        },
        modalOverlay: {
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1.5rem",
        },
        modalContent: {
            background: "white",
            borderRadius: "1.75rem",
            maxWidth: "720px",
            width: "100%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 30px 70px rgba(0,0,0,0.35)",
            padding: "2.8rem",
            position: "relative",
        },
        modalClose: {
            position: "absolute",
            top: "1.5rem",
            right: "1.8rem",
            background: "none",
            border: "none",
            fontSize: "2.2rem",
            color: "#9ca3af",
            cursor: "pointer",
            transition: "color 0.2s",
        },
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <div style={styles.header}>
                    <h1 style={styles.title}>Pesan Hotel Impianmu</h1>
                    <p style={styles.subtitle}>
                        Temukan penginapan terbaik di berbagai kota dengan harga transparan dan proses cepat
                    </p>

                    <button
                        type="button"
                        onClick={openGuideModal}
                        style={styles.guideButton}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-4px)";
                            e.currentTarget.style.boxShadow = "0 15px 35px -8px rgba(59,130,246,0.5)";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(59,130,246,0.4)";
                        }}
                    >
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16h.01M12 12h.01M12 8h.01" />
                        </svg>
                        Petunjuk Cara Booking
                    </button>
                </div>

                <div style={styles.adminButtonContainer}>
                    <a
                        href="http://localhost:3000/admin"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={styles.adminButton}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-4px)";
                            e.currentTarget.style.boxShadow = "0 15px 35px -8px rgba(220,38,38,0.5)";
                            e.currentTarget.style.background = "#ef4444";
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 10px 25px -5px rgba(220,38,38,0.35)";
                            e.currentTarget.style.background = "#dc2626";
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 4v16m8-8H4" />
                        </svg>
                        Masuk ke Dashboard Admin
                    </a>
                </div>

                {message && (
                    <div
                        ref={alertRef}
                        style={{
                            ...styles.alert,
                            ...(messageType === "success"
                                ? styles.alertSuccess
                                : messageType === "error"
                                    ? styles.alertError
                                    : styles.alertInfo),
                        }}
                    >
                        <strong>{message}</strong>
                        {bookingRef && (
                            <p
                                style={{
                                    marginTop: "1rem",
                                    fontSize: "1.25rem",
                                    fontWeight: 700,
                                }}
                            >
                                No. Referensi Booking:{" "}
                                <span
                                    style={{
                                        background: "rgba(255,255,255,0.7)",
                                        padding: "4px 12px",
                                        borderRadius: "8px",
                                        color: messageType === "success" ? "#065f46" : "#1e40af",
                                    }}
                                >
                                    {bookingRef}
                                </span>
                            </p>
                        )}
                    </div>
                )}

                <div style={styles.topSection}>
                    {/* Kolom kiri - Pencarian */}
                    <div
                        style={{
                            ...styles.card,
                            ...(loadingHotels ? {} : { ":hover": styles.cardHover }),
                        }}
                    >
                        <div style={styles.cardHeader}>
                            <h2 style={styles.cardTitle}>Cari Hotel di Kota Tujuan</h2>
                        </div>
                        <div style={styles.cardBody}>
                            <div style={styles.inputGroup}>
                                <input
                                    style={{
                                        ...styles.input,
                                        ":focus": styles.inputFocus,
                                    }}
                                    type="text"
                                    placeholder="Contoh: Denpasar, Jakarta, Bandung, Yogyakarta..."
                                    value={city}
                                    onChange={(e) => setCity(e.target.value)}
                                    onKeyDown={(e) => e.key === "Enter" && searchHotel()}
                                />
                                <button
                                    style={{
                                        ...styles.btnPrimary,
                                        minWidth: "160px",
                                        ...(loadingHotels ? { opacity: 0.7, cursor: "not-allowed" } : {}),
                                    }}
                                    onClick={searchHotel}
                                    disabled={loadingHotels}
                                    onMouseEnter={(e) =>
                                        !loadingHotels && Object.assign(e.currentTarget.style, styles.btnPrimaryHover)
                                    }
                                    onMouseLeave={(e) =>
                                        !loadingHotels &&
                                        Object.assign(e.currentTarget.style, {
                                            transform: "translateY(0)",
                                            boxShadow: "0 6px 12px -2px rgba(99,102,241,0.25)",
                                        })
                                    }
                                >
                                    {loadingHotels ? "Mencari..." : "Cari Hotel"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Kolom kanan - Daftar Hotel */}
                    <div style={styles.card}>
                        <div style={styles.cardHeader}>
                            <h2 style={styles.cardTitle}>
                                {hotels.length > 0
                                    ? `Hotel Tersedia ${city ? `di ${city}` : ""}`
                                    : "Hasil Pencarian Hotel"}
                            </h2>
                        </div>
                        <div style={styles.cardBody}>
                            {hotels.length > 0 ? (
                                <div style={{ display: "grid", gap: "1.5rem" }}>
                                    {hotels.map((hotel) => (
                                        <div
                                            key={hotel.id}
                                            style={{
                                                ...styles.hotelCard,
                                                ":hover": styles.hotelCardHover,
                                            }}
                                        >
                                            <div>
                                                <h3
                                                    style={{
                                                        margin: 0,
                                                        fontSize: "1.35rem",
                                                        fontWeight: 700,
                                                        color: "#1e293b",
                                                    }}
                                                >
                                                    {hotel.name}
                                                </h3>
                                                <p
                                                    style={{
                                                        margin: "0.5rem 0 0",
                                                        color: "#64748b",
                                                        fontSize: "1rem",
                                                    }}
                                                >
                                                    📍 {hotel.city}
                                                </p>
                                            </div>
                                            <button
                                                style={{
                                                    ...styles.btnPrimary,
                                                    padding: "0.85rem 1.6rem",
                                                    fontSize: "1.05rem",
                                                }}
                                                onClick={() =>
                                                    handleChange({ target: { name: "hotel_id", value: hotel.id } })
                                                }
                                            >
                                                Pilih Hotel
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div
                                    style={{
                                        textAlign: "center",
                                        padding: "5rem 1.5rem",
                                        color: "#64748b",
                                        fontSize: "1.15rem",
                                        lineHeight: 1.7,
                                    }}
                                >
                                    {loadingHotels
                                        ? "Sedang mencari hotel terbaik untuk Anda..."
                                        : "Masukkan nama kota di kolom sebelah kiri untuk melihat daftar hotel yang tersedia"}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Form Pemesanan */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <h2 style={styles.cardTitle}>Detail Pemesanan</h2>
                    </div>
                    <div style={{ ...styles.cardBody, paddingBottom: "3rem" }}>
                        <form onSubmit={handleSubmit} style={styles.formGrid}>
                            <div>
                                <label style={styles.label}>Hotel yang Dipilih</label>
                                <select
                                    name="hotel_id"
                                    value={form.hotel_id}
                                    onChange={handleChange}
                                    required
                                    style={{
                                        ...styles.input,
                                        ":focus": styles.inputFocus,
                                    }}
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
                                    style={{
                                        ...styles.input,
                                        ":focus": styles.inputFocus,
                                    }}
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
                                    style={{
                                        ...styles.input,
                                        ":focus": styles.inputFocus,
                                    }}
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
                                    style={{
                                        ...styles.input,
                                        ":focus": styles.inputFocus,
                                    }}
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
                                    style={{
                                        ...styles.input,
                                        ":focus": styles.inputFocus,
                                    }}
                                />
                            </div>

                            <div>
                                <label style={styles.label}>
                                    Tipe Kamar{" "}
                                    {loadingRooms && (
                                        <span style={{ color: "#3b82f6", fontStyle: "italic" }}>
                                            (memuat…)
                                        </span>
                                    )}
                                </label>
                                <select
                                    name="room_id"
                                    value={form.room_id}
                                    onChange={handleChange}
                                    required
                                    disabled={loadingRooms || !checkInOutSelected || rooms.length === 0}
                                    style={{
                                        ...styles.input,
                                        ":focus": styles.inputFocus,
                                    }}
                                >
                                    <option value="">Pilih tipe kamar yang tersedia</option>
                                    {rooms.map((room) => (
                                        <option
                                            key={room.id}
                                            value={room.id}
                                            disabled={!room.is_available}
                                        >
                                            {room.room_type} -
                                            {room.is_available
                                                ? `  (Tersedia ${room.available_rooms || 0} Kamar)`
                                                : "  (Penuh / Habis)"}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* RINGKASAN BIAYA */}
                            <div
                                style={{
                                    gridColumn: "1 / -1",
                                    background: totalPrice > 0 ? "#f0fdfa" : "#f8fafc",
                                    borderRadius: "1rem",
                                    padding: "1.5rem",
                                    margin: "1rem 0 2rem 0",
                                    border: totalPrice > 0 ? "2px solid #6ee7b7" : "1px dashed #cbd5e1",
                                    boxShadow: totalPrice > 0 ? "0 4px 14px rgba(16,185,129,0.12)" : "none",
                                }}
                            >
                                {nights > 0 && totalPrice > 0 ? (
                                    <>
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                marginBottom: "1rem",
                                                fontSize: "1.1rem",
                                                color: "#334155",
                                            }}
                                        >
                                            <span>Harga per malam</span>
                                            <strong>Rp {pricePerNight.toLocaleString("id-ID")}</strong>
                                        </div>

                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                marginBottom: "1rem",
                                                fontSize: "1.1rem",
                                                color: "#334155",
                                            }}
                                        >
                                            <span>Jumlah malam menginap</span>
                                            <strong>{nights} malam</strong>
                                        </div>

                                        <hr style={{ borderColor: "#e2e8f0", margin: "1rem 0" }} />

                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                fontSize: "1.5rem",
                                                fontWeight: 700,
                                                color: "#065f46",
                                            }}
                                        >
                                            <span>Total Pembayaran</span>
                                            <span>Rp {totalPrice.toLocaleString("id-ID")}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div
                                        style={{
                                            textAlign: "center",
                                            color: "#64748b",
                                            fontSize: "1.1rem",
                                            padding: "1rem 0",
                                        }}
                                    >
                                        Pilih tanggal check-in, check-out, dan tipe kamar untuk melihat rincian biaya
                                    </div>
                                )}
                            </div>

                            <div style={{ gridColumn: "1 / -1" }}>
                                <button
                                    type="submit"
                                    style={{
                                        ...styles.bookBtn,
                                        ...(loadingRooms || !form.room_id || nights < 1 || totalPrice <= 0
                                            ? { opacity: 0.65, cursor: "not-allowed" }
                                            : {}),
                                    }}
                                    disabled={loadingRooms || !form.room_id || nights < 1 || totalPrice <= 0}
                                    onMouseEnter={(e) =>
                                        !loadingRooms &&
                                        form.room_id &&
                                        nights >= 1 &&
                                        totalPrice > 0 &&
                                        Object.assign(e.currentTarget.style, styles.bookBtnHover)
                                    }
                                    onMouseLeave={(e) =>
                                        !loadingRooms &&
                                        form.room_id &&
                                        nights >= 1 &&
                                        totalPrice > 0 &&
                                        Object.assign(e.currentTarget.style, {
                                            transform: "translateY(0)",
                                            boxShadow: "0 12px 30px -6px rgba(16,185,129,0.4)",
                                        })
                                    }
                                >
                                    {loadingRooms ? "Memproses Pesanan..." : "Konfirmasi & Pesan Sekarang"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* Modal Petunjuk */}
            {showGuideModal && (
                <div style={styles.modalOverlay}>
                    <div style={styles.modalContent}>
                        <button style={styles.modalClose} onClick={closeGuideModal}>
                            ×
                        </button>

                        <h2
                            style={{
                                fontSize: "2rem",
                                fontWeight: 700,
                                color: "#1e293b",
                                textAlign: "center",
                                margin: "0 0 2rem",
                            }}
                        >
                            Panduan Lengkap Cara Booking Hotel
                        </h2>

                        <div style={{ fontSize: "1.1rem", lineHeight: 1.8, color: "#374151" }}>
                            <p style={{ fontWeight: 600, marginBottom: "1.5rem", color: "#1e293b" }}>
                                Pastikan admin sudah menambahkan data hotel dan tipe kamar melalui Dashboard Admin terlebih dahulu.
                            </p>

                            <ol style={{ paddingLeft: "2rem", margin: "2rem 0" }}>
                                <li style={{ marginBottom: "1.4rem" }}>
                                    <strong>Cari hotel</strong><br />
                                    Ketik nama kota tujuan → klik "Cari Hotel" atau tekan Enter.
                                </li>
                                <li style={{ marginBottom: "1.4rem" }}>
                                    <strong>Pilih hotel</strong><br />
                                    Klik tombol "Pilih Hotel" pada hotel yang Anda inginkan.
                                </li>
                                <li style={{ marginBottom: "1.4rem" }}>
                                    <strong>Tentukan tanggal</strong><br />
                                    Isi tanggal Check-in dan Check-out (pastikan valid).
                                </li>
                                <li style={{ marginBottom: "1.4rem" }}>
                                    <strong>Pilih tipe kamar</strong><br />
                                    Pilih kamar yang masih tersedia (lihat jumlah "tersisa").
                                </li>
                                <li style={{ marginBottom: "1.4rem" }}>
                                    <strong>Isi data diri</strong><br />
                                    Masukkan nama lengkap dan email dengan benar.
                                </li>
                                <li style={{ marginBottom: "1.4rem" }}>
                                    <strong>Konfirmasi booking</strong><br />
                                    Periksa semua data → klik "Konfirmasi & Pesan Sekarang".
                                </li>
                            </ol>

                            <p style={{ fontWeight: 600, color: "#1e40af", marginTop: "2.5rem" }}>
                                Sistem akan otomatis memeriksa ketersediaan kamar berdasarkan tanggal yang dipilih.
                            </p>

                            <div style={{ textAlign: "center", marginTop: "3rem" }}>
                                <button
                                    style={{
                                        ...styles.btnPrimary,
                                        padding: "1.2rem 3rem",
                                        fontSize: "1.2rem",
                                    }}
                                    onClick={closeGuideModal}
                                >
                                    Mengerti — Mulai Booking Sekarang
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