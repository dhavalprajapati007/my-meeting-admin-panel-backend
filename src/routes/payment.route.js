const express = require("express");
const router = express.Router();
const { verifyAuthToken } = require("../middleware/verifyToken");
const paymentController = require("../controller/payment.controller");

router.post("/payment", verifyAuthToken, paymentController.payment);
router.post("/list-payments", verifyAuthToken, paymentController.listPayment);

// admin
router.post("/list-all-transaction", verifyAuthToken, paymentController.listTransactions);

module.exports = router;