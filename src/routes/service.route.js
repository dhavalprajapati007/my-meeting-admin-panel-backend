const express = require("express");
const router = express.Router();
const serviceController = require("../controller/service.controller");
const { verifySuperAdminToken } = require("../middleware/verifyToken");

router.post("/add", serviceController.add);
router.get("/get", serviceController.get);
router.put("/update", serviceController.update);
router.delete("/delete",verifySuperAdminToken ,serviceController.delete);
router.get("/getall", serviceController.getAll);

module.exports = router;