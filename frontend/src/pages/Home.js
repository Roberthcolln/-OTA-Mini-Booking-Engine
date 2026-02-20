import React, { useState } from "react";
import { Link } from "react-router-dom"; // pastikan sudah install react-router-dom
import api from "../api/api";

function Home() {
    const [city, setCity] = useState("");
    const [hotels, setHotels] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const searchHotel = async () => {
        if (!city.trim()) {
            setError("Masukkan nama kota terlebih dahulu");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const res = await api.get(`/hotels/search?city=${encodeURIComponent(city)}`);
            setHotels(res.data);
        } catch (err) {
            setError("Gagal memuat hotel. Coba lagi nanti.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                {/* Hero Section */}
                <section style={styles.hero}>
                    <h1 style={styles.heroTitle}>Temukan Hotel Impianmu</h1>
                    <p style={styles.heroSubtitle}>
                        Pesan hotel terbaik dengan harga spesial di Bali
                    </p>

                    {/* Tombol utama ke halaman booking */}
                    <Link to="/booking" style={styles.ctaButton}>
                        Mulai Booking Sekarang
                    </Link>
                </section>

                {/* Search Section */}
                {/* <section style={styles.searchSection}>
                    <h2 style={styles.sectionTitle}>Cari Hotel di Kota Favoritmu</h2>

                    <div style={styles.searchBox}>
                        <input
                            type="text"
                            placeholder="Masukkan nama kota (contoh: Bali, Jakarta, Yogyakarta)"
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && searchHotel()}
                            style={styles.input}
                        />
                        <button
                            onClick={searchHotel}
                            disabled={loading}
                            style={styles.searchButton}
                        >
                            {loading ? "Mencari..." : "Cari Hotel"}
                        </button>
                    </div>

                    {error && <p style={styles.errorMessage}>{error}</p>}
                </section> */}

                {/* Hasil Pencarian */}
                {hotels.length > 0 && (
                    <section style={styles.resultsSection}>
                        <h2 style={styles.sectionTitle}>
                            Hotel di {city.charAt(0).toUpperCase() + city.slice(1)}
                        </h2>

                        <div style={styles.hotelGrid}>
                            {hotels.map((hotel) => (
                                <div key={hotel.id} style={styles.hotelCard}>
                                    <h3 style={styles.hotelName}>{hotel.name}</h3>
                                    <p style={styles.hotelCity}>📍 {hotel.city}</p>
                                    {hotel.address && (
                                        <p style={styles.hotelAddress}>{hotel.address}</p>
                                    )}
                                    {hotel.description && (
                                        <p style={styles.hotelDesc}>
                                            {hotel.description.substring(0, 120)}...
                                        </p>
                                    )}

                                    {/* Link ke halaman booking dengan hotel tertentu (opsional) */}
                                    <Link
                                        to={`/booking?hotel=${hotel.id}`}
                                        style={styles.selectHotelBtn}
                                    >
                                        Lihat Kamar & Pesan
                                    </Link>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {hotels.length === 0 && !loading && city && (
                    <p style={{ textAlign: "center", color: "#64748b", marginTop: "2rem" }}>
                        Tidak ditemukan hotel di "{city}". Coba kota lain!
                    </p>
                )}
            </div>
        </div>
    );
}

// Styles modern & clean
const styles = {
    page: {
        background: "linear-gradient(to bottom, #f8fafc, #e2e8f0)",
        minHeight: "100vh",
        fontFamily: "system-ui, -apple-system, sans-serif",
        color: "#1e293b",
    },
    container: {
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "2rem 1rem",
    },
    hero: {
        textAlign: "center",
        padding: "4rem 1rem 5rem",
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)",
        color: "white",
        borderRadius: "1.5rem",
        marginBottom: "3rem",
        boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
    },
    heroTitle: {
        fontSize: "3rem",
        fontWeight: 800,
        marginBottom: "1rem",
        lineHeight: 1.1,
    },
    heroSubtitle: {
        fontSize: "1.25rem",
        marginBottom: "2rem",
        opacity: 0.9,
    },
    ctaButton: {
        display: "inline-block",
        padding: "1rem 2.5rem",
        backgroundColor: "white",
        color: "#4f46e5",
        fontSize: "1.25rem",
        fontWeight: 700,
        borderRadius: "9999px",
        textDecoration: "none",
        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.2)",
        transition: "all 0.3s ease",
    },
    searchSection: {
        background: "white",
        borderRadius: "1rem",
        padding: "2rem",
        boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
        marginBottom: "3rem",
    },
    sectionTitle: {
        fontSize: "1.75rem",
        fontWeight: 700,
        marginBottom: "1.5rem",
        color: "#1e293b",
    },
    searchBox: {
        display: "flex",
        gap: "1rem",
        flexWrap: "wrap",
    },
    input: {
        flex: 1,
        minWidth: "250px",
        padding: "1rem",
        fontSize: "1.1rem",
        border: "2px solid #e2e8f0",
        borderRadius: "0.75rem",
        outline: "none",
        transition: "border-color 0.2s",
    },
    searchButton: {
        padding: "1rem 2rem",
        background: "#6366f1",
        color: "white",
        border: "none",
        borderRadius: "0.75rem",
        fontSize: "1.1rem",
        fontWeight: 600,
        cursor: "pointer",
        transition: "background 0.2s",
    },
    errorMessage: {
        color: "#ef4444",
        marginTop: "1rem",
        fontWeight: 500,
    },
    resultsSection: {
        marginTop: "2rem",
    },
    hotelGrid: {
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "1.5rem",
    },
    hotelCard: {
        background: "white",
        borderRadius: "1rem",
        padding: "1.5rem",
        boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)",
        transition: "transform 0.2s, box-shadow 0.2s",
    },
    hotelName: {
        fontSize: "1.4rem",
        fontWeight: 700,
        marginBottom: "0.5rem",
    },
    hotelCity: {
        color: "#64748b",
        marginBottom: "0.75rem",
        fontSize: "1.1rem",
    },
    hotelAddress: {
        color: "#475569",
        fontSize: "0.95rem",
        marginBottom: "0.75rem",
    },
    hotelDesc: {
        color: "#64748b",
        fontSize: "0.95rem",
        marginBottom: "1.25rem",
    },
    selectHotelBtn: {
        display: "inline-block",
        padding: "0.75rem 1.5rem",
        background: "#10b981",
        color: "white",
        borderRadius: "0.75rem",
        textDecoration: "none",
        fontWeight: 600,
        transition: "background 0.2s",
    },
};

export default Home;