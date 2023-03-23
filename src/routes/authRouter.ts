import express from "express";
import { getNewAccessToken, getUserData, signinUser, updateUserData } from "../controller/auth.js";
import { mustLoginAsUser } from "../services/auth.js";

const auth = express.Router();

auth.post("/signin", signinUser);

auth.get("/user_data", getUserData);

auth.get("/refresh", getNewAccessToken);

auth.post("/update_user_data", mustLoginAsUser, updateUserData);

export default auth;
