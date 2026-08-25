import "dotenv/config";
import express from "express";
import conneectdb from "./config/db.js";
import router from "./routes/agent.route.js";


const port = process.env.PORT;

const app = express();

app.use(express.json());
app.use("/", router);


app.get("/", (req, res) => {
  res.json({ message: "Hello, Agent Service is Running!" });
});

app.listen(port, () => {
  console.log(`Agent Service is Running on port ${port}`);
  conneectdb();
});
