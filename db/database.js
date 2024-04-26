const mongoose = require("mongoose");

const connectToDataBase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_DB_URI);
    console.log("Database connected successfully!!");
  } catch (error) {
    console.error("Database connection error:", error);
  }
};

module.exports = connectToDataBase;
