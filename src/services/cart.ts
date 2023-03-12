import * as db from "./mongoDb.js";

const MAX_PRODUCT_QUANTITY = process.env.MAX_PRODUCT_QUANTITY || 100;

export const add = async ({ uid, pid, quantity }) => {
  // NOTE : uid must be taken from request.user.uid; in order to prevent unautherized cart acton
  try {
    const productData = await db.products.findOne({ pid });
  } catch (error) {}
};
