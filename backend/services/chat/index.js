import express from "express";
import dotenv from "dotenv";
import conneectdb from "./config/db.js";
import router from "./routes/chat.routes.js";

dotenv.config();

const port = process.env.PORT;

const app = express();

app.use(express.json());

app.use("/",router)

app.get("/", (req, res) => {
  res.json({ message: "Hello, Chat Service is Running!" });
});

app.listen(port, () => {
  console.log(`Chat Service is Running on port ${port}`);
  conneectdb();
});
