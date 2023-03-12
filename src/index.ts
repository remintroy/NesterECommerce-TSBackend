import express from "express";
import apiRouter from "./routes/productRouter.js";
import authRouter from "./routes/authRouter.js";
import cartRouter from "./routes/cartRouter.js";
import dotenv from "dotenv";
import logger from "morgan";
import cors from "cors";
import { authInit } from "./services/auth.js";
import cookieParser from "cookie-parser";
import https from "https";
import fs from "fs";

dotenv.config();

const app = express();

const appConfig = {
  name: "Ecommerce-Client-Backend",
  port: 8083,
  baseUrl: "/",
};

app.use(logger("dev"));
app.use(
  cors({
    origin: ["http://remin.com", "http://192.168.1.15/", "http://192.168.1.15:3000", "http://localhost"],
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json());

app.use(authInit);

app.use("/auth", authRouter);
app.use("/product", apiRouter);
app.use("/cart", cartRouter);

app.use((req, res) => {
  res.send({ name: appConfig.name, message: "Hai" });
});

const cert = fs.readFileSync("/home/reminz/cert/CA/remin.com/remin.com.crt");
const key = fs.readFileSync("/home/reminz/cert/CA/remin.com/remin.com.decrypted.key");

const server = https.createServer({ key, cert }, app);

server.listen(appConfig.port, () => console.log(`[-] ${appConfig.name} started on port ${appConfig.port}`));
