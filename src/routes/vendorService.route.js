const express = require("express");
const router = express.Router();
const { verifyAuthToken } = require("../middleware/verifyToken");
const vendorServiceController = require("../controller/vendorService.controller");


router.post("/create", verifyAuthToken, vendorServiceController.create);
router.post("/edit", verifyAuthToken, vendorServiceController.edit);
router.post("/view", verifyAuthToken, vendorServiceController.view);
router.post("/get-by-service", vendorServiceController.getByService);
router.post("/remove-certificate", verifyAuthToken, vendorServiceController.removeCertificate);

module.exports = router;