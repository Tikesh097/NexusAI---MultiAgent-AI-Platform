import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";

import conneectdb from "./config/db.js";
import router from "./routes/auth.route.js";

dotenv.config();

const port = process.env.PORT || 8001;
const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/", router);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Hello, Auth Service is Running!",
  });
});

app.listen(port, () => {
  console.log(`Auth Service is Running on port ${port}`);
  conneectdb();
});