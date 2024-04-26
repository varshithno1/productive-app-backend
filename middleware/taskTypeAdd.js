const TaskType = require("../models/taskTypeModel");

async function addTaskTypeMiddleware(req, res, next) {
  try {
    const taskType = req.body.taskType || "other";
    const user = req.user;

    // Check if the user has already created the task type
    const existingTaskType = await TaskType.findOne({
      name: taskType,
      createdBy: user._id,
    });

    if (!existingTaskType) {
      // Create a new task type if it doesn't exist for the user
      const newTaskType = await TaskType.create({
        createdBy: user._id,
        name: taskType,
      });
      req.body.taskTypeId = newTaskType._id;
      user.taskTypes.push(newTaskType._id);
      await user.save();
    } else {
      // Task type already exists for the user
      req.body.taskTypeId = existingTaskType._id;
    }
    
    next();
  } catch (error) {
    console.error("Error in addTaskTypeMiddleware:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = { addTaskTypeMiddleware };
