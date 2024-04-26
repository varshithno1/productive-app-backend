const express = require("express");
const router = express.Router();
const todoDB = require("../models/todoModel");
const TaskType = require("../models/taskTypeModel");
const { default: mongoose } = require("mongoose");

// /api/v1/
// const getTodo = async (req, res) => {
//   try {
//     // Fetch all todos
//     const todos = await todoDB.find({});

//     if (todos.length === 0) {
//       return res.status(404).json({ message: "No todos available" });
//     }

//     // Extract unique taskType IDs from todos
//     const taskTypeIds = [...new Set(todos.map((todo) => todo.taskType))];

//     // Fetch task types based on their IDs
//     const taskTypes = await TaskType.find({ _id: { $in: taskTypeIds } });

//     // Map task type IDs to their names
//     const taskTypeMap = {};
//     taskTypes.forEach((taskType) => {
//       taskTypeMap[taskType._id] = taskType.name;
//     });

//     // Replace taskType IDs with their names in todos
//     const todosWithTaskTypeNames = todos.map((todo) => ({
//       ...todo.toObject(),
//       taskTypeName: taskTypeMap[todo.taskType],
//     }));

//     res.json({ todos: todosWithTaskTypeNames });
//   } catch (error) {
//     console.log("Error fetching todos: ", error.message);
//     res.status(500).json({ error: "Internal Server Error" });
//   }
// };

const getTodo = async (req, res) => {
  try {
    // Pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Fetch todos with pagination
    const todos = await todoDB
      .find({ createdBy: req.user._id })
      .skip(skip)
      .limit(limit)
      .populate("taskType", "name") // Populate taskType field with only the name field
      .lean();

    if (todos.length === 0) {
      return res.status(404).json({ message: "No todos available" });
    }

    // Process todos to remove nested objects for taskTypeName and taskTypeId
    const processedTodos = todos.map((todo) => ({
      _id: todo._id,
      title: todo.title,
      completed: todo.completed,
      status: todo.status,
      createdBy: todo.createdBy,
      dueDate: todo.dueDate,
      taskTypeName: todo.taskType?.name, // Access populated field directly
      taskTypeId: todo.taskType?._id, // Access populated field directly
      __v: todo.__v,
    }));

    console.log("server", processedTodos);
    res.json({ todos: processedTodos });
  } catch (error) {
    console.log("Error fetching todos: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const addTodo = async (req, res) => {
  try {
    // Inside addTodo function
    const { title, taskTypeId } = req.body;

    // Validate title presence and type
    if (!title || typeof title !== "string") {
      return res
        .status(400)
        .json({ error: "Title is required and must be a string" });
    }

    // Validate taskTypeId presence and type
    if (!taskTypeId || !mongoose.Types.ObjectId.isValid(taskTypeId)) {
      return res.status(400).json({ error: "Valid taskTypeId is required" });
    }

    const user = req.user;
    const defaultStatus = req.body.status || "pending";

    const newTodo = new todoDB({
      title,
      status: defaultStatus,
      taskType: taskTypeId,
      createdBy: user,
    });

    await newTodo.save();
    console.log(newTodo);

    // Create a response object with only the necessary fields
    const todoResponse = {
      title: newTodo.title,
      completed: newTodo.completed,
      status: newTodo.status,
      taskType: newTodo.taskType,
      dueDate: newTodo.dueDate,
      _id: newTodo._id,
    };

    res
      .status(201)
      .json({ message: "Todo added successfully", todo: todoResponse });

    user.todoList.push(newTodo._id);
    await user.save();
  } catch (error) {
    console.error("Error adding todo:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const updateTodo = async (req, res) => {
  try {
    const todoId = req.params.id;
    const { title, completed, dueDate, status, taskType } = req.body;
    const user = req.user;

    // Check if the todo exists and belongs to the authenticated user
    const existingTodo = await todoDB.findById(todoId);
    if (!existingTodo || String(existingTodo.createdBy) !== String(user._id)) {
      return res.status(404).json({ error: "Invalid Todo ID" });
    }

    // Update the todo fields if provided in the request body
    existingTodo.title = title || existingTodo.title;
    existingTodo.completed = completed || existingTodo.completed;
    existingTodo.dueDate = dueDate || existingTodo.dueDate;
    existingTodo.status = status || existingTodo.status;
    existingTodo.taskType = req.body.taskTypeId || existingTodo.taskType;

    // Save the updated todo
    await existingTodo.save();

    // Send a success response
    res.json({ message: "Todo updated successfully", todo: existingTodo });
  } catch (error) {
    // Handle errors
    console.error("Error updating todo:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const deleteTodo = async (req, res) => {
  try {
    // Extract the todo ID from the URL parameters
    const { id } = req.params;

    // Check if the todo ID is provided
    if (!id) {
      return res.status(400).json({ error: "Todo ID is required" });
    }

    // Check if the todo exists and belongs to the authenticated user
    const todo = await todoDB.findById(id);
    const user = req.user;

    if (!todo || String(todo.createdBy) !== String(user._id)) {
      return res.status(404).json({ error: "Invalid Todo ID" });
    }

    // Delete the todo item from the database
    await todoDB.findByIdAndDelete(id);

    // Remove the todo ID from the user's todoList array
    const index = user.todoList.indexOf(id);
    if (index > -1) {
      user.todoList.splice(index, 1);
      await user.save();
    }

    // Send a success response
    res.status(200).json({ message: "Todo item deleted successfully" });
  } catch (error) {
    // Handle errors
    console.error("Error deleting todo item:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getSingleTodo = async (req, res) => {
  try {
    const todoId = req.params.id;
    const todo = await todoDB.findById(todoId);
    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }
    res.json({ todo });
  } catch (error) {
    console.error("Error fetching todo:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const completeTodo = async (req, res) => {
  try {
    const todoId = req.params.id;
    const user = req.user;

    // Check if the todo exists and belongs to the authenticated user
    const todo = await todoDB.findOneAndUpdate(
      { _id: todoId, createdBy: user._id },
      { completed: true },
      { new: true }
    );

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.json({ message: "Todo marked as complete", todo });
  } catch (error) {
    console.error("Error completing todo:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const incompleteTodo = async (req, res) => {
  try {
    const todoId = req.params.id;
    const user = req.user;

    // Check if the todo exists and belongs to the authenticated user
    const todo = await todoDB.findOneAndUpdate(
      { _id: todoId, createdBy: user._id },
      { completed: false },
      { new: true }
    );

    if (!todo) {
      return res.status(404).json({ message: "Todo not found" });
    }

    res.json({ message: "Todo marked as incomplete", todo });
  } catch (error) {
    console.error("Error marking todo as incomplete:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const getTodosByStatus = async (req, res) => {
  try {
    const status = req.params.status;
    const todos = await todoDB.find({ status });
    if (!todos || todos.length === 0) {
      return res
        .status(404)
        .json({ message: "No todos found with the specified status" });
    }
    res.json({ todos });
  } catch (error) {
    console.error("Error fetching todos by status:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// module.exports = router;
module.exports = {
  getTodo,
  addTodo,
  updateTodo,
  deleteTodo,
  getSingleTodo,
  completeTodo,
  incompleteTodo,
  getTodosByStatus,
};
