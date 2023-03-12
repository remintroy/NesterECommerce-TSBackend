import express from "express";
import { getNewAccessToken, getUserData, signinUser } from "../controller/auth.js";

const auth = express.Router();

auth.post("/signin", signinUser);

auth.get("/user_data", getUserData);

auth.get("/refresh", getNewAccessToken);

export default auth;
