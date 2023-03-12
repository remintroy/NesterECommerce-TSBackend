import { Response } from "express";
import { RequestDefention } from "../defeniton.js";
import { createError } from "../util.js";
import * as db from "../services/mongoDb.js";

export const add = async (req: RequestDefention, res: Response) => {
  try {
    const uid = req.user?.uid;
    const pid = req.body?.pid;

    // fetching product data
    let productData: any;
    try {
      productData = await db.products.findOne({ pid });
    } catch (error) {
      createError(500, "Faild to fetch product data");
    }
    if (!productData) throw createError(400, "Product not found");
    if (productData.stock === 0) throw createError(400, "Product is out of stock");

    // fetching cart data
    let cartData: any;
    try {
      cartData = await db.cart.findOne({ uid });
    } catch (error) {
      createError(500, "Faild to fetch cart data");
    }

    return productData;

    if (cartData) {
      // there is a cart document
      console.log(cartData);
    } else {
      // create new cart document
      try {
        const newCart = new db.cart({ products: productData });
      } catch (error) {
        throw createError(500, "Error while adding to cart");
      }
    }
  } catch (error) {}
};
