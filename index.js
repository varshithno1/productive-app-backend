const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectToDataBase = require("./db/database");
require("dotenv").config();

connectToDataBase();

const mainRouter = require("./routes/main.routes");
// const app = express();
const { app, server } = require("./socket/socketIo.js");

// const app = require("./socket/socketIo");
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(cookieParser());
// app.use(
//   cors({
//     origin: [`http://localhost:${port}`],
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//   })
// );

app.use(cors());
app.get("/", (req, res) => {
  res.status(200).send("Server is running");
});
app.use("/api/v1", mainRouter);

server.listen(port, () => {
  // console.log("Connecting to database....");
  console.log(`Connected to http://localhost:${port}`);
});
