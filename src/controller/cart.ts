import { Response } from "express";
import { RequestDefention } from "../defeniton.js";
import * as cartService from "../services/cart.js";

export const add = async (req: RequestDefention, res: Response) => {
  try {
    const uid = req.user?.uid;
    const pid = req.body?.pid;
    const quantity = req.body?.quantity;
    const data = await cartService.add({ uid, pid, quantity });
    //
    res.send(data);
  } catch (error) {
    res.status(error?.code ? error.code : 400);
    res.send(error);
  }
};
