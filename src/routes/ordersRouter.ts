import express from "express";
import { mustLoginAsUser } from "../services/auth.js";
import * as orders from "../controller/orders.js";

const app = express.Router();

app.get("/all", mustLoginAsUser, orders.getAllOrdersOfUser);

export default app;
