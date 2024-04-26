// Message Routes - /api/v1/chat

const router = require("express").Router();
const {
  sendMessage,
  getMessages,
  getMyChatsUsers,
} = require("../controller/messages.controller");

// Input User id as the params
router.get("/message/:id", getMessages);
router.post("/message/send/:id", sendMessage);
router.get("/mychats", getMyChatsUsers);


module.exports = router;
