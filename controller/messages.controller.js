const conversationsDB = require("../models/conversationModel");
const userDB = require("../models/userModel");
const messagesDB = require("../models/messageModel");
const { getReceiverSocketId, io } = require("../socket/socketIo");
const { default: mongoose } = require("mongoose");

// Controller function to retrieve messages for a conversation
const getMessages = async (req, res) => {
  try {
    // Extract receiverId from request parameters and senderId from request user
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    // Find conversation between sender and receiver, and populate messages
    const conversation = await conversationsDB
      .findOne({
        participants: { $all: [senderId, receiverId] },
      })
      .populate("messages"); // Populate messages field with actual message documents

    // If conversation doesn't exist, respond with an empty array of messages
    if (!conversation)
      return res.status(200).json({ msg: "No conversation", messages: [] });

    // Extract messages from the conversation
    const messages = conversation.messages;

    // Respond with the retrieved messages
    res.status(200).json(messages);
  } catch (error) {
    // Handle errors
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    console.log(message);
    console.log(receiverId);
    console.log(senderId);

    // Check if a conversation already exists between sender and receiver
    let conversation = await conversationsDB.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      // If conversation doesn't exist, create a new one
      conversation = await conversationsDB.create({
        participants: [senderId, receiverId],
      });
    }

    // Create a new message
    const newMessage = new messagesDB({
      senderId,
      receiverId,
      message,
    });

    // Add the message to the conversation
    conversation.messages.push(newMessage._id);

    // Save the conversation and the new message
    await Promise.all([conversation.save(), newMessage.save()]);

    // Update the conversation reference in the user model for both sender and receiver
    await Promise.all([
      userDB.findByIdAndUpdate(senderId, {
        $addToSet: { conversations: conversation._id },
      }),
      userDB.findByIdAndUpdate(receiverId, {
        $addToSet: { conversations: conversation._id },
      }),
    ]);

    const receiverSocketId = getReceiverSocketId(receiverId);

    if (receiverSocketId) {
      // Emit the new message event to the receiver
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Controller function to retrieve users the current user has chatted with
// const getMyChatsUsers = async (req, res) => {
//   try {
//     const loggedInUserId = req.user._id;
//     const conversations = await conversationsDB
//       .find({
//         participants: loggedInUserId,
//       })
//       .populate("participants", "_id username email profilePic");

//     // Extract unique participants from all conversations
//     const users = conversations.reduce((acc, conversation) => {
//       conversation.participants.forEach((participant) => {
//         if (participant._id.toString() !== loggedInUserId.toString()) {
//           acc.push(participant); // Push user objects into the array
//         }
//       });
//       return acc;
//     }, []);

//     res.status(200).json(users); // Return the array of users
//   } catch (error) {
//     console.log("Error in getMyChatsUsers controller:", error.message);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

const getMyChatsUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;

    const conversations = await conversationsDB
      .find({
        participants: loggedInUserId,
      })
      .populate({
        path: "messages",
        options: { sort: { createdAt: -1 }, limit: 1 }, // Sort messages by createdAt descending and limit to 1
      })
      .populate({
        path: "participants",
        select: "_id username email profilePic",
      });

    const formattedConversations = conversations.map((conversation) => {
      const lastMessage =
        conversation.messages.length > 0
          ? conversation.messages[0].message
          : null;
      const lastMessageTime =
        conversation.messages.length > 0
          ? conversation.messages[0].createdAt
          : null;

      return {
        user: conversation.participants.filter(
          (participant) =>
            participant._id.toString() !== loggedInUserId.toString()
        )[0],
        lastMessage,
        lastMessageTime,
      };
    });

    res.status(200).json(formattedConversations);
  } catch (error) {
    console.log("Error in getMyChatsUsers controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { sendMessage, getMessages, getMyChatsUsers };

// const getMyChats = async (req, res) => {
//   try {
//     const userId = req.user._id;
//     // Find the user by ID and populate the 'conversations' field to get the details of conversations
//     const user = await userDB.findById(userId).populate({
//       path: "conversations",
//       populate: { path: "participants", select: "username email profilePic" },
//     });
//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }
//     // Extract the participants from the conversations
//     const chats = user.conversations.map(
//       (conversation) => conversation.participants
//     );
//     // console.log("userId: ", userId);
//     // console.log("chats: ", chats);
//     // Filter out the current user's details from the list of participants
//     const myChats = chats.map((chat) =>
//       chat.filter(
//         (participant) => participant._id.toString() !== userId.toString()
//       )
//     );
//     // console.log("mychats: ", myChats);
//     res.status(200).json({ myChats });
//   } catch (error) {
//     console.log("Error in getMyChats controller:", error.message);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };
