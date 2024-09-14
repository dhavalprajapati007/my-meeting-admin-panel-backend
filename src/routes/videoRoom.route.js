const express = require("express");
const router = express.Router();
const { verifyAuthToken } = require("../middleware/verifyToken");
const videoRoomController = require("../controller/videoRoom.controller");


router.post("/create", videoRoomController.create);
router.post("/token", videoRoomController.createToken);
router.post("/complete-room", verifyAuthToken, videoRoomController.completeVideoRoom);
router.post("/create-room-composition", verifyAuthToken, videoRoomController.createRecordingComposition);
router.get("/get-download-link", verifyAuthToken, videoRoomController.getDownloadLink);

router.get("/get-all-compositions", verifyAuthToken, videoRoomController.getAllCompletedCompositions)
router.delete("/recording", verifyAuthToken, videoRoomController.deleteRecordings);
router.delete("/composition", verifyAuthToken, videoRoomController.deleteCompositions);

router.post("/callback-composition", videoRoomController.callbackComposition);

module.exports = router;