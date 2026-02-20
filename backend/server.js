require("dotenv").config();
const express = require("express");
const cors = require("cors");

const hotelRoutes = require("./routes/hotelRoutes");
const bookingRoutes = require("./routes/bookingRoutes");
const adminRoutes = require("./routes/adminRoutes");
const searchRoutes = require("./routes/searchRoutes"); // sebelumnya belum diimport

const app = express();
const PORT = process.env.PORT || 5000;

/* MIDDLEWARE */
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* TEST API */
app.get("/", (req, res) => {
    res.send("API OTA running...");
});

/* ROUTES */
app.use("/api/hotels", hotelRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/search", searchRoutes);

/* ERROR HANDLER */
app.use((req, res) => {
    res.status(404).json({
        message: "Route tidak ditemukan",
        path: req.originalUrl,
    });
});

app.listen(PORT, () => {
    console.log("Server running on port " + PORT);
});