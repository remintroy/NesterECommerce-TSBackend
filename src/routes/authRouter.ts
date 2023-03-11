import express from "express";
import { signinUser } from "../controller/auth.js";

const auth = express.Router();

auth.post("/signin", signinUser);

export default auth;
