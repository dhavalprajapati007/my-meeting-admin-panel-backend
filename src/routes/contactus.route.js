const express = require("express");
const router = express.Router();
const { verifyAuthToken } = require("../middleware/verifyToken");
const contactusController = require("../controller/contactus.controller");

router.post("/add", verifyAuthToken, contactusController.add);
router.get("/getall", contactusController.getAll);
router.post("/get", verifyAuthToken, contactusController.get);
router.put("/update", contactusController.update);
router.delete("/delete", contactusController.delete);

module.exports = router;