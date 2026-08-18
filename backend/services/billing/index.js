import express from "express";
import dotenv from "dotenv";
import conneectdb from "./config/db.js";
import router from "./routes/billing.route.js";

dotenv.config();

const port = process.env.PORT;

const app = express();

app.use(express.json());
app.use("/",router)


app.get("/", (req, res) => {
  res.json({ message: "Hello, Billing Service is Running!" });
});

app.listen(port, () => {
  console.log(`Billing Service is Running on port ${port}`);
  conneectdb();
});
