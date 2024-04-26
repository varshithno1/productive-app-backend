const jwt = require("jsonwebtoken");

const generateTokenCookie = (user, res) => {
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "10d",
  });
  // Set the token as a cookie in the response
  res.cookie("jwt", token, {
    maxAge: 15 * 24 * 60 * 60 * 1000, // milliseconds
    httpOnly: true, // prevent XSS attacks
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production" ? true : false,
  });

  // Return the response object
  return token;
};

module.exports = {
  generateTokenCookie,
};
