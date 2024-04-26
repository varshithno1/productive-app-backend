function todoAddMiddleware(req, res, next) {
  const { title } = req.body;

  if (!title) {
    return res.status(411).json({
      message: "Incorrect inputs",
    });
  } else {
    next();
  }
}

module.exports = { todoAddMiddleware };
