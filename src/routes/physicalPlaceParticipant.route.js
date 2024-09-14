const express = require("express");
const router = express.Router();
const { verifyAuthToken } = require("../middleware/verifyToken");
const physicalPlaceParticipantController = require("../controller/physicalPlaceParticipant.controller");

router.post("/create", physicalPlaceParticipantController.add);
router.post("/createMultiple", physicalPlaceParticipantController.addMultiple);
router.put("/update", physicalPlaceParticipantController.update);
router.delete("/delete", physicalPlaceParticipantController.delete);

module.exports = router;