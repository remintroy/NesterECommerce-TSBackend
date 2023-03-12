import express from "express";
import { mustLoginAsUser } from "../services/auth.js";
import { add } from "../controller/cart.js";

const app = express.Router();

app.post("/add", mustLoginAsUser, add);

export default app;
