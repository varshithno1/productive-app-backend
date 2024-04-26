//User Router - /api/v1/user

const express = require("express");
const {
  signup,
  signin,
  signout,
  getUsers,
  detailsOfUser,
} = require("../controller/user.controller");
const { signUpMiddleware } = require("../middleware/signup");
const { signInMiddleware } = require("../middleware/signin");
const authMiddleware = require("../middleware/authControl");
const userDB = require("../models/userModel");
const router = express.Router();

router.post("/signup", signUpMiddleware, signup);
router.post("/signin", signInMiddleware, signin);
router.post("/signout", signout);
router.get("/all", authMiddleware, getUsers);
router.get("/me", authMiddleware, detailsOfUser);

//
//
//
//
//
//
//
//
router.get("/test", (req, res) => {
  res.send("User routes test");
});
router.post("/test", (req, res) => {
  res.json({ msg: "User routes test" });
});
router.get("/getusers", async (req, res) => {
  try {
    const users = await userDB.find({});

    res.status(200).json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
