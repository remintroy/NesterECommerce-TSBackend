import express from "express";
import apiRouter from "./routes/apiRouter.js";
import authRouter from "./routes/authRouter.js";
import dotenv from "dotenv";
import logger from "morgan";
import cors from "cors";

dotenv.config();

const app = express();

const appConfig = {
  name: "Ecommerce-Client-Backend",
  port: 8083,
  baseUrl: "/",
};

app.use(logger("dev"));
app.use(cors());
app.use(express.json());

app.use("/auth", authRouter);
app.use("/api", apiRouter);

app.use((req, res) => {
  res.send({ name: appConfig.name, message: "Hai" });
});

app.listen(appConfig.port, () => console.log(`[-] ${appConfig.name} started on port ${appConfig.port}`));
