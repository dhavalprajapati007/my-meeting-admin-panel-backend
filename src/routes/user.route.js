const express = require("express");
const router = express.Router();
const { verifyAuthToken, verifySuperAdminToken } = require("../middleware/verifyToken");
const userController = require("../controller/user.controller");


router.post("/signup", userController.signup);
router.post("/login", userController.login);
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password", userController.resetPassword);
router.post("/edit", verifyAuthToken, userController.edit)
router.post("/view", verifyAuthToken, userController.view)
router.post("/list-users", verifyAuthToken, userController.listUsers)
router.post("/location-update-request", verifyAuthToken, userController.fcmLocationUpdateUsers)
router.get("/get-totals", verifyAuthToken, userController.getTotals);

router.post("/list-vendors", verifyAuthToken, userController.listAllVendors);
router.post("/edit-user-admin", verifyAuthToken, userController.editByAdmin);
router.get("/dashboard", verifyAuthToken, userController.vendorDashboard);
router.get("/user-dashboard", verifyAuthToken, userController.userDashboard);
router.post("/enableVendor", verifyAuthToken, userController.enableVendor);
router.post("/create-payment-method", verifyAuthToken, userController.createPaymentMethod);
router.put("/edit-payment-method", verifyAuthToken, userController.editPaymentMethod);
router.delete("/delete-payment-method", verifyAuthToken, userController.deletePaymentMethod);
router.get("/get-all-payment-methods", verifyAuthToken, userController.getAllPaymentMethods);
router.post("/create-withdrawal-request", verifyAuthToken, userController.createWithdrawalRequest);

// Admin
router.get("/get-all-withdrawal-requests",verifyAuthToken, userController.getAllWithdrawalRequest);
router.put("/update-withdrawal-request", verifyAuthToken, userController.updateWithdrawalRequest);
router.get("/get-all-verified-vendors", verifyAuthToken, userController.getAllVerifiedVendors)
router.get("/verify-vendor",verifyAuthToken, userController.verifyVendor);
router.post("/send-notification",verifyAuthToken, userController.sendNotificationToSpecifiedVendor);
router.post("/send-mail",verifyAuthToken, userController.sendMail);

// Admin and Vendor Both
router.get("/get-withdrawal-request-history-by-vendor", verifyAuthToken, userController.getWithdrawalRequestHistoryByVendor);
router.get("/get-booking-payment-history", verifyAuthToken, userController.getBookingPaymentHistory);

// Super-Admin
router.delete("/delete-vendor",verifySuperAdminToken, userController.deleteVendor);

router.get("/versions", userController.versionsDetails);







module.exports = router;