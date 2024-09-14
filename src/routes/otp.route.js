const express = require("express");
const router = express.Router();
const otpController = require("../controller/otp.controller");

router.post("/send", otpController.send);
router.post("/verify", otpController.verify);
router.post("/resend", otpController.resend);

module.exports = router;