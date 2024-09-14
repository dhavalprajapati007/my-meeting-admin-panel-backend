const express = require("express");
const router = express.Router();
const { verifyAuthToken } = require("../middleware/verifyToken");
const vendorTimeslotController = require("../controller/vendorTimeslot.controller");


router.post("/create", verifyAuthToken, vendorTimeslotController.add);
router.put("/edit", vendorTimeslotController.update);
router.post("/view", verifyAuthToken, vendorTimeslotController.get);
router.delete("/delete", vendorTimeslotController.delete);
router.post("/create-available-slots", verifyAuthToken, vendorTimeslotController.createAvailableSlot);

module.exports = router;