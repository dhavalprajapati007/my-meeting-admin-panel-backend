const express = require("express");
const router = express.Router();
const { verifyAuthToken } = require("../middleware/verifyToken");
const notificationController = require("../controller/notification.controller");

router.post("/add", notificationController.add);
router.get("/getall", notificationController.getAll);
router.get("/get", verifyAuthToken, notificationController.get);
router.delete("/delete", notificationController.delete);

router.post("/test-notification", notificationController.test);

module.exports = router;