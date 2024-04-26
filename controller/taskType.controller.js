const TaskType = require("../models/taskTypeModel");

const getTaskTypes = async (req, res) => {
  try {
    const taskTypes = await TaskType.find({ createdBy: req.user._id });
    res.json({ taskTypes });
  } catch (error) {
    console.error("Error fetching task types:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Adding a task type
// const addTaskType = async (req, res) => {
//   try {
//     const { taskType } = req.body;
//     const user = req.user;

//     // Check if the task type already exists for the user
//     let existingTaskType = await TaskType.findOne({
//       name: taskType,
//       createdBy: user._id,
//     });

//     if (existingTaskType) {
//       // If task type exists, return it
//       return res
//         .status(200)
//         .json({ message: "task type exists ", taskType: existingTaskType });
//     } else {
//       // If task type doesn't exist, create a new one
//       const newTaskType = await TaskType.create({
//         createdBy: user._id,
//         name: taskType,
//       });
//       user.taskTypes.push(newTaskType._id);
//       await user.save();
//       return res
//         .status(201)
//         .json({ message: "task type created ", taskType: newTaskType });
//     }
//   } catch (error) {
//     console.error("Error adding task type:", error.message);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// };

const addTaskType = async (req, res) => {
  try {
    const { taskType } = req.body;
    const user = req.user;

    // Check if the task type already exists for the current user
    let existingTaskType = await TaskType.findOne({
      name: taskType,
      createdBy: user._id,
    });

    if (existingTaskType) {
      // If task type exists for the current user, return it
      return res.status(200).json({
        message: "Task type already exists",
        taskType: existingTaskType,
      });
    } else {
      // If task type doesn't exist, create a new one
      const newTaskType = await TaskType.create({
        createdBy: user._id,
        name: taskType,
      });
      user.taskTypes.push(newTaskType._id);
      await user.save();
      return res
        .status(201)
        .json({ message: "Task type created", taskType: newTaskType });
    }
  } catch (error) {
    console.error("Error adding task type:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

// Deleting a task type
const deleteTaskType = async (req, res) => {
  try {
    const taskId = req.params.id; // Extract the 'id' property from req.params
    const user = req.user;

    // Check if the task type exists and is associated with the user
    const existingTaskType = await TaskType.findOne({
      _id: taskId,
      createdBy: user._id,
    });

    if (!existingTaskType) {
      return res.status(404).json({ error: "Task type not found" });
    }

    // Remove the task type from the user's task types array
    user.taskTypes.pull(existingTaskType._id);
    await user.save();

    // Delete the task type from the TaskType model
    await TaskType.findByIdAndDelete(taskId);

    return res.status(200).json({ message: "Task type deleted successfully" });
  } catch (error) {
    console.error("Error deleting task type:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

module.exports = { getTaskTypes, addTaskType, deleteTaskType };
