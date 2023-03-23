import { Response } from "express";
import { RequestDefention } from "../defeniton.js";
import * as auth from "../services/auth.js";
import { createError } from "../util.js";

export const signinUser = async (req: RequestDefention, res: Response) => {
  try {
    const { accessToken, refreshToken, email, photoURL, name } = await auth.signInUser(req.body);
    res.cookie("refreshToken", refreshToken, { httpOnly: true, sameSite: "none", secure: true });
    res.send({ accessToken, email, photoURL, name });
  } catch (error) {
    res.status(error.code);
    res.send(error);
  }
};

export const getUserData = async (req: RequestDefention, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) throw createError(401, "Unauthenticated");
    const data = await auth.getUserData({ refreshToken });
    res.send(data);
  } catch (error) {
    res.status(error?.status ? error.status : 401);
    res.send(error);
  }
};

export const getNewAccessToken = async (req: RequestDefention, res: Response) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) throw createError(401, "Unauthenticated");
    const data = await auth.getNewAccessTokenFromRefreshToken(refreshToken);
    res.send(data);
  } catch (error) {
    res.status(error?.status ? error.status : 401);
    res.send(error);
  }
};

export const updateUserData = async (req: RequestDefention, res: Response) => {
  try {
    const uid = req.user?.uid;
    if (!uid) throw createError(400, "Uid is required");
    const data = req.body;
    const response = await auth.updateUserData(uid, data);
    res.send(response);
  } catch (error) {
    res.status(error?.code ? error.code : 401);
    res.send(error);
  }
};
