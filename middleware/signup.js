const zod = require("zod");
const userDB = require("../models/userModel");

const userZodSignup = zod
  .object({
    username: zod.string(),
    email: zod.string(),
    password: zod
      .string()
      .min(6, "The password must be at least 6 characters long")
      .max(32, "The password must be a maximum of 32 characters"),
    confirmPassword: zod.string(),
  })
  .refine((fields) => fields.password === fields.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords don't match",
  });

function signUpMiddleware(req, res, next) {
  try {
    console.log(req.body);
    const response = userZodSignup.safeParse(req.body);
    if (!response.success) {
      return res.status(411).json({
        msg: response.error.issues[0].message,
      });
    }

    const { email, password, confirmPassword } = req.body;

    userDB.findOne({ email: email }).then((value) => {
      if (value) {
        return res.status(411).json({
          msg: "Email Already Taken",
        });
      } else {
        next();
      }
    });
  } catch (error) {
    console.log("Error at SIGNUP Middleware: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  signUpMiddleware,
};
