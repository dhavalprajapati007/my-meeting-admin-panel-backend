const express = require("express");
const router = express.Router();
const { verifyAuthToken } = require("../middleware/verifyToken");
const serviceBookingController = require("../controller/serviceBooking.controller");

router.post("/createPPB", verifyAuthToken, serviceBookingController.createPPB);
router.post("/createPSB", verifyAuthToken, serviceBookingController.createPSB);
router.post("/createVSB", verifyAuthToken, serviceBookingController.createVSB);
router.post("/getByUser", verifyAuthToken, serviceBookingController.getByUser);
router.post("/getByVendor", verifyAuthToken, serviceBookingController.getByVendor);
router.post("/validateBookingTime", verifyAuthToken, serviceBookingController.verifyDateAndTimeForBooking);

router.post("/create", serviceBookingController.create);
router.post("/edit", serviceBookingController.edit);
router.post("/list", verifyAuthToken, serviceBookingController.list);
router.post("/view", serviceBookingController.view);

router.post("/cancel", verifyAuthToken, serviceBookingController.cancelBooking);
router.post("/verify", verifyAuthToken, serviceBookingController.verify);
router.post("/update-webkey", verifyAuthToken, serviceBookingController.updateWebKey);

router.get("/get-totals", verifyAuthToken, serviceBookingController.getTotals);

router.post("/dashboard-counts", verifyAuthToken, serviceBookingController.dashboardCounts);
router.post("/get-booking-timeslots", verifyAuthToken, serviceBookingController.getBookingTimesByDate);

module.exports = router;