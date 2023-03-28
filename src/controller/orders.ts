import { Response } from "express";
import { RequestDefention } from "../defeniton.js";
import * as orderes from "../services/orders.js";

export const getAllOrdersOfUser = async (req: RequestDefention, res: Response) => {
  try {
    const uid = req.user?.uid;
    const data = await orderes.getOrdersByUid(uid);
    res.send(data);
  } catch (error) {
    res.status(error.code ? error.code : 400);
    res.send(error);
  }
};
