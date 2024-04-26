  const mongoose = require("mongoose");

  const messageSchema = new mongoose.Schema(
    {
      senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
      },
      receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true,
      },
      message: {
        type: String,
        required: true,
      },
    },
    {
      // created at , updated at
      timestamps: true,
    }
  );

  const messagesDB = mongoose.model("messages", messageSchema);
  module.exports = messagesDB;
