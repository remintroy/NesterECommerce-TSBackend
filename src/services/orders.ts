import { createError } from "../util.js";
import * as db from "./mongoDb.js";

export const getOrdersByUid = async (uid: string) => {
  try {
    let orderData: any = null;

    try {
      orderData = await db.orders.findOne({ uid: uid });
    } catch (error) {
      throw createError(500, "Faild to get order data");
    }

    return orderData ? orderData?.orders : [];
  } catch (error) {
    throw error;
  }
};


