const express = require("express");
const router = express.Router();
const { verifyAuthToken } = require("../middleware/verifyToken");
const reviewController = require("../controller/review.controller");


router.post("/create", verifyAuthToken, reviewController.add);
router.put("/edit", reviewController.update);
router.post("/view", verifyAuthToken, reviewController.get);
router.post("/get-by-booking"), reviewController.getByBooking;
router.delete("/delete", reviewController.delete);

module.exports = router;