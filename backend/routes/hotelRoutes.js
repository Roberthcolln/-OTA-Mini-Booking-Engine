const express = require("express");
const router = express.Router();
const hotelController = require("../controllers/hotelController");

router.get("/search", hotelController.searchHotel);
router.get("/:id", hotelController.getHotelDetail);

module.exports = router;