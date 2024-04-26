const { generateTokenCookie } = require("../utils/generateTokenCookie");
const userDB = require("../models/userModel");

const signup = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const profilePic = `https://api.dicebear.com/8.x/lorelei/svg?seed=${req.body.email}`;
    const newUser = await userDB.create({
      username: username,
      email: email,
      password: password,
      profilePic: profilePic,
    });

    if (newUser) {
      req.token = generateTokenCookie(newUser._id, res);
      await newUser.save();

      const userResponse = {
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        profilePic: profilePic,
      };

      // console.log(req.token);
      res.json({
        msg: "Signed up Successfully",
        token: req.token,
        user: userResponse,
      });
    } else {
      res.status(400).json({ error: "Invalid User Data" });
    }
  } catch (error) {
    console.log("Error at SIGNUP: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const signin = async (req, res) => {
  try {
    const user = await userDB.findOne({
      email: req.body.email,
    });

    if (!user) {
      return res.status(411).json({
        // message: "User does not exist",
        message: "User not found",
      });
    }

    if (user.password !== req.body.password) {
      return res.status(411).json({
        message: "Wrong password",
      });
    }

    const jwt = generateTokenCookie(user, res);

    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      profilePic: user.profilePic,
    };

    return res.json({
      msg: "Signed in Successfully",
      jwt: jwt,
      user: userResponse,
    });
  } catch (error) {
    console.log("Error at SIGNIN: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const signout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ msg: "Logged out successfully" });
  } catch (error) {
    console.log("Error at LOGOUT: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// const getUsers = async (req, res) => {
//   try {
//     const loggedInUserId = req.user._id;
//     const allUsers = await userDB
//       .find({ _id: { $ne: loggedInUserId } })
//       .select("_id username email profilePic");
//     res.status(200).json(allUsers);
//   } catch (error) {
//     console.log("Error in getUsers controller:", error.message);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

// Controller function to retrieve users based on search query
const getUsers = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const { search } = req.query;

    // If search query is provided, filter users by username or email
    let query = { _id: { $ne: loggedInUserId } };
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: "i" } },
        // { email: { $regex: search, $options: "i" } },
      ];
    } else {
      // If no search query is provided, return an empty array
      res.status(200).json([]);
      return;
    }
    const users = await userDB
      .find(query)
      .select("_id username email profilePic");
    res.status(200).json(users); // Return the array of users
  } catch (error) {
    console.log("Error in getUsers controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const detailsOfUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await userDB
      .findById(userId)
      .select("_id username email profilePic");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(user);
  } catch (error) {
    console.log("Error in detailsOfUser controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// module.exports = router;
module.exports = { signup, signin, signout, getUsers, detailsOfUser };
