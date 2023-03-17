import jwt from "jsonwebtoken";
import validator from "validator";
import dotenv from "dotenv";
import { createError } from "../util.js";
import * as db from "./mongoDb.js";
import { RequestDefention } from "../defeniton.js";
import { NextFunction, Response } from "express";
import { verifyIdToken } from "./firebase.js";

dotenv.config();

// verify access token
export const getAccessTokenData = (accessToken: string) => {
  return new Promise((resolve, reject) => {
    jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET, (err, data) => {
      if (err) reject(err.message);
      else resolve(data);
    });
  });
};

// verify refresh token
export const getRefreshTokenData = (refreshToken: string) => {
  return new Promise((resolve, reject) => {
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, data) => {
      if (err) reject(err.message);
      else resolve(data);
    });
  });
};

// creates tokens
export const newRefreshToken = (payload: object) => jwt.sign({ ...payload }, process.env.REFRESH_TOKEN_SECRET);
export const newAccessToken = (payload: { uid: string }) =>
  jwt.sign({ uid: payload.uid }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: "20m",
  });

//   create access token from refresh token
export const getNewAccessTokenFromRefreshToken = async (refreshToken: string) => {
  try {
    try {
      const tokenSavedInDB = await db.refreshTokens.findOne({ value: refreshToken });
      if (!tokenSavedInDB) throw "Invalid refresh token";
    } catch (error) {
      throw typeof error == "string" ? createError(400, error) : "Faild to create token";
    }
    const payload: any = await getRefreshTokenData(refreshToken);
    // checks for user accessess
    await userAccessChecks(payload?.uid);
    try {
      const accessToken = newAccessToken(payload);
      try {
        await db.users.updateOne(
          { uid: payload?.uid },
          {
            $set: {
              lastRefresh: new Date(),
            },
          }
        );
      } catch (error) {
        // Error occured while updating last refresh time
        console.log(error);
      }
      return accessToken;
    } catch (error) {
      throw createError(500, "Faild to create token");
    }
  } catch (error) {
    throw error;
  }
};

// check user access
export const userAccessChecks = async (uid: string) => {
  let userData: any;
  try {
    try {
      userData = await db.users.findOne({ uid: uid });
    } catch (error) {
      throw createError(500, "Oops something went wrong, Try after some time");
    }
    if (!userData) throw createError(400, "Can't find user account with given data");
    if (userData.disabled) throw createError(401, "Disabled User");
  } catch (error) {
    throw error;
  }
  return userData;
};

// function that runs on every request
export const authInit = async (req: RequestDefention, res: Response, next: NextFunction) => {
  try {
    const payload: any = await getAccessTokenData(req.headers["authorization"]?.split(" ")[1]);
    // gets curresponding user data from server if user exist's
    req.user = await db.users.findOne({ uid: payload?.uid }, { password: 0, _id: 0 });
    // check for blocked user
    if (req.user.disabled) throw "This user is blocked user";
    // check if this is an admin account
    if (req.user?.admin) req.admin = req.user;
  } catch (error) {
    req.user = null;
  }
  next();
};

// check and make sure admin is logged in
export const mustLoginAsAdmin = async (req: RequestDefention, res: Response, next: NextFunction) => {
  if (req.admin) next();
  else {
    res.status(401);
    res.send({ status: "error", message: "Unauthorized action" });
  }
};

// check and maker sure user is logged in
export const mustLoginAsUser = async (req: RequestDefention, res: Response, next: NextFunction) => {
  if (req.user) next();
  else {
    res.status(401);
    res.send({ status: "error", message: "Unauthorized action" });
  }
};

// login user if exist or create new user
export const signInUser = async ({ idToken }: { idToken: string }) => {
  try {
    if (!validator.default.isJWT(idToken + "")) throw createError(400, "Invalid idToken");

    // verfy idToken and retrive userData from firebase
    const user = await verifyIdToken({ idToken });

    // check for existing data
    let existingData: object;
    try {
      existingData = await db.users.findOne({ uid: user.uid });
    } catch (error) {
      throw createError(500, "Faild to fetch user data");
    }
    if (!existingData) {
      // creates and saves new user
      const newUserData = {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        provider: user.providerData[0].providerId,
        createdAt: user.metadata.creationTime,
        lastLogin: user.metadata.lastSignInTime,
        lastRefresh: user.metadata.lastRefreshTime,
        photoURL: user.photoURL,
        phone: user.phoneNumber,
        disabled: user.disabled,
      };
      const newUser = new db.users(newUserData);
      try {
        await newUser.save();
      } catch (error) {
        throw createError(500, "Error creating user");
      }
    }
    // ----- TOKENS -----
    const tokensForUser: { accessToken: string; refreshToken: string } = { accessToken: null, refreshToken: null };
    // creates token's for new user
    try {
      tokensForUser.accessToken = newAccessToken({ uid: user.uid });
      tokensForUser.refreshToken = newRefreshToken({ uid: user.uid });
    } catch (error) {
      throw createError(500, `${existingData ? "" : "User created but "}Faild to login. Try to login after some time`);
    }
    // saves refresh token to db
    try {
      await new db.refreshTokens({ value: tokensForUser.refreshToken, uid: user.uid }).save();
      try {
        await db.users.updateOne({ uid: user.uid }, { $set: { lastLogin: new Date() } });
      } catch (error) {
        // error while updating login time
      }
    } catch (error) {
      throw createError(500, `${existingData ? "" : "User created but "}Faild to login. Try to login after some time`);
    }
    // user data and tokes successfully created
    return { ...tokensForUser, email: user.email, photoURL: user.photoURL, name: user.displayName };
  } catch (error) {
    throw error;
  }
};

export const getUserData = async ({ refreshToken }) => {
  try {
    if (!validator.default.isJWT(refreshToken)) throw createError(400, "Invalid token");
    const tokenPayload: any = await getRefreshTokenData(refreshToken);
    // check user access or status
    let userData: any = await userAccessChecks(tokenPayload?.uid);
    // get new access token
    const accessToken = newAccessToken({ uid: tokenPayload?.uid });
    //...
    return {
      email: userData?.email,
      name: userData?.name,
      photoURL: userData?.photoURL,
      phone: userData?.phone,
      accessToken,
    };
  } catch (error) {
    throw error;
  }
};
