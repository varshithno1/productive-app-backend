const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const clientURL = process.env.CLIENT_URL;

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    // origin: ["http://localhost:5173"], // Allowing requests from this origin
    origin: [clientURL], // Allowing requests from this origin
    methods: ["GET", "POST"], // Allowing only specified HTTP methods
  },
});
const getReceiverSocketId = (receiverId) => {
  return userSocketMap[receiverId];
};
const userSocketMap = {};
io.on("connection", (socket) => {
  console.log("User Connected: ", socket.id);

  // Extracting userId from socket handshake query
  const userId = socket.handshake.query.userId;

  // Storing the user's socket ID in the userSocketMap
  if (userId != "undefined") userSocketMap[userId] = socket.id;

  // Sending the list of online users to all connected clients
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // Listening for disconnection event
  socket.on("disconnect", () => {
    console.log("User Disconnected: ", socket.id);

    // Removing the user's socket ID from userSocketMap on disconnection
    delete userSocketMap[userId];

    // Sending updated list of online users to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
      console.log("user disconnected", socket.id);
      delete userSocketMap[userId];
      io.emit("getOnlineUsers", Object.keys(userSocketMap));
    });
  });
});

module.exports = { app, io, server, getReceiverSocketId };
