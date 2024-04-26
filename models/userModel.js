const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
    minLength: 3,
    maxLength: 30,
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
  },
  profilePic: {
    type: String,
    default: "",
  },
  taskTypes: [{ type: mongoose.Schema.Types.ObjectId, ref: "TaskType" }],
  todoList: [{ type: mongoose.Schema.Types.ObjectId, ref: "todos" }],
  conversations: [
    { type: mongoose.Schema.Types.ObjectId, ref: "conversations" },
  ],
});

const userDB = mongoose.model("users", userSchema);
module.exports = userDB;
