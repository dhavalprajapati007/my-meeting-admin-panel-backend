const express = require("express");
const router = express.Router();
const { verifyAuthToken } = require("../middleware/verifyToken");
const chatController = require("../controller/chat.controller");

router.get("/list", verifyAuthToken, chatController.chatList);
router.post("/start", verifyAuthToken, chatController.startChat);
router.get("/history", verifyAuthToken, chatController.chatHistory);
router.post("/send", verifyAuthToken, chatController.send);

module.exports = router;

// module.exports = function(io) {
//     // define routes
//     // io is available in this scope
//     router.get("/list", verifyAuthToken, chatController.chatList);
//     router.post("/start", verifyAuthToken, chatController.startChat);
//     router.get("/history", verifyAuthToken, chatController.chatHistory);
//     router.post("/send", verifyAuthToken, chatController.send);

//     return router;
// }