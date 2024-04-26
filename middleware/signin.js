const zod = require("zod");

const userZodSignin = zod.object({
  email: zod.string().email(),
  password: zod.string().min(6),
});

function signInMiddleware(req, res, next) {
  try {
    const response = userZodSignin.safeParse(req.body);
    if (!response.success) {
      return res.status(411).json({
        message: "Incorrect inputs",
        // message: "no-success",
      });
    } else {
      next();
    }
  } catch (error) {
    console.log("Error at SIGNUP Middleware: ", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  signInMiddleware,
};
