import express from "express";
import router from "./routes/index.js";

const app = express();
app.use(express.urlencoded({ extended: true }))
app.use(express.json());

app.use("/api/v1", router);

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "Merchant Underwriting API" });
});

export default app;
