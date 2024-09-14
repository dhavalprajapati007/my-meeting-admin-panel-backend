const express = require("express");
const router = express.Router();
const languageController = require("../controller/language.controller");

router.post("/add", languageController.add);
router.get("/getall", languageController.getAll);
router.put("/update", languageController.update);
router.delete("/delete", languageController.delete);


module.exports = router;