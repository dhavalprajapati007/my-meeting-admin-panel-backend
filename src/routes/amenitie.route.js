const express = require("express");
const router = express.Router();
const amenitesController = require("../controller/amenitie.controller");

router.post("/add", amenitesController.add);
router.get("/get", amenitesController.get);
router.get("/getall", amenitesController.getAll);
router.put("/update", amenitesController.update);
router.delete("/delete", amenitesController.delete);


module.exports = router;