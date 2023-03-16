import { createError } from "../util.js";
import * as db from "./mongoDb.js";

const MAX_PRODUCT_QUANTITY = process.env.MAX_PRODUCT_QUANTITY || 100;

export const add = async ({ uid, pid, quantity }) => {
  // NOTE : uid must be taken from request.user.uid; in order to prevent unautherized cart acton
  try {
    // fetching product data
    let productData: any;
    try {
      productData = await db.products.findOne({ pid });
    } catch (error) {
      throw createError(500, "Faild to fetch product data");
    }
    if (!productData) throw createError(400, "Product not found");
    if (productData.stock === 0) throw createError(400, "Product is out of stock");

    // limit for quantity : For initail case only
    if (Number(quantity) > MAX_PRODUCT_QUANTITY) throw createError(400, "Cart limit for each product exeeded");

    // fetching cart data
    let cartData: any;
    try {
      cartData = await db.cart.findOne({ uid });
    } catch (error) {
      throw createError(500, "Faild to fetch cart data");
    }

    // output data holders
    let operation = "";
    const responseData = {
      productCount: 0,
      totalPrice: 0,
      totalQuantity: 0,
    };

    if (cartData) {
      // There is a cart document
      const productIndexInCart = cartData?.products.map((e: any) => e.pid == pid).indexOf(true);

      if (productIndexInCart == -1) {
        // add new item
        await db.cart.updateOne(
          { uid },
          {
            $push: {
              products: { ...productData, quantity: quantity && Number(quantity) > 0 ? quantity : 1 },
            },
          }
        );
        operation = "B-Product added";
      } else {
        // updateExisting
        // 3 stages as quantity: -1 = substract one , no input = increase one, definite quantiy = update definite value

        if (!quantity || quantity == -1) {
          // add one
          const product = cartData?.products[productIndexInCart];

          if (quantity) {
            if (product?.quantity - 1 <= 0) throw createError(400, "Quantity can't go below 1");
          } else {
            if (product?.quantity + 1 > productData.stock) throw createError(400, "Product out of stock");
            if (product?.quantity + 1 > MAX_PRODUCT_QUANTITY) throw createError(400, "Cart limit for each product exeeded");
          }

          await db.cart.updateOne(
            { uid },
            {
              $inc: {
                [`products.${productIndexInCart}.quantity`]: quantity ? -1 : 1,
              },
            }
          );
          operation = `${quantity ? "C" : "D"}-Quantity updated`;
        } else {
          if (isNaN(Number(quantity))) throw createError(400, "Enter a valid quantiy");
          if (quantity <= 0) throw createError(400, `Quantity must between 0 and ${Number(MAX_PRODUCT_QUANTITY) + 1}`);
          if (quantity > productData.stock) throw createError(400, `Sorry product only have ${productData.stock} pcs`);

          await db.cart.updateOne(
            { uid },
            {
              $set: {
                [`products.${productIndexInCart}.quantity`]: Number(quantity),
              },
            }
          );
          operation = "E-Quantity updated";
        }
      }
      const cartTotal = await getCartTotal({ uid: uid });
      responseData.productCount = cartTotal.length;
      responseData.totalPrice = cartTotal[0].subTotal;
      responseData.totalQuantity = cartTotal[0].totalCount;
    } else {
      // create new cart document
      try {
        const newProductData = {
          uid: uid,
          products: [{ ...productData, quantity: quantity && Number(quantity) > 0 ? quantity : 1 }],
        };
        const newCart = new db.cart(newProductData);
        await newCart.save();
        operation = "A-Created and added product to cart";
        responseData.productCount = 1;
        responseData.totalQuantity = Number(quantity && Number(quantity) > 0 ? quantity : 1);
        responseData.totalPrice =
          (Number(productData?.price) - Number(productData?.offer)) *
          Number(quantity && Number(quantity) > 0 ? quantity : 1);
      } catch (error) {
        throw createError(500, "Error while adding to cart");
      }
    }
    //...
    return { status: operation.split("-")[0], message: operation.split("-")[1], data: responseData };
  } catch (error) {
    throw error;
  }
};

const getCartTotal = async ({ uid, includeProductData = false }: { uid: string; includeProductData?: boolean }) => {
  try {
    const products = await db.cart.aggregate([
      { $match: { uid: uid } },
      { $unwind: "$products" },
      { $sort: { "products.updated": -1 } },
      {
        $lookup: {
          from: "products",
          localField: "products.pid",
          foreignField: "pid",
          as: "cartProducts",
        },
      },
      {
        $addFields: {
          "cartProducts.quantity": "$$ROOT.products.quantity",
          "cartProducts.updated": "$$ROOT.products.updated",
          "cartProducts.total": {
            $multiply: [
              "$$ROOT.products.quantity",
              {
                $subtract: [
                  { $arrayElemAt: ["$$ROOT.cartProducts.price", 0] },
                  { $arrayElemAt: ["$$ROOT.cartProducts.offer", 0] },
                ],
              },
            ],
          },
        },
      },
      {
        $group: {
          _id: "$products.pid",
          product: { $push: { $arrayElemAt: ["$cartProducts", 0] } },
        },
      },
      {
        $match: {
          "product.pid": {
            $exists: true,
            $ne: null,
          },
        },
      },
      {
        $group: {
          _id: { $arrayElemAt: ["$product.pid", 0] },
          product: { $push: { $arrayElemAt: ["$product", 0] } },
        },
      },
      { $project: { product: { $arrayElemAt: ["$product", 0] } } },
      { $replaceRoot: { newRoot: "$product" } },
      {
        $group: {
          _id: "subTotal",
          subTotal: { $sum: "$total" },
          products: { $addToSet: "$$ROOT" },
          quantity: { $sum: "$quantity" },
        },
      },
      {
        $addFields: {
          "products.subTotal": "$subTotal",
          "products.totalCount": "$quantity",
        },
      },
      { $unwind: "$products" },
      { $replaceRoot: { newRoot: "$products" } },
      {
        $project: {
          _id: 0,
          views: 0,
          reachedCheckout: 0,
          interactions: 0,
          impressions: 0,
          addedToCart: 0,
          purchased: 0,
          productsListingViews: 0,
          cancelled: 0,
          purchaseCompleted: 0,
        },
      },
    ]);
    return products;
  } catch (error) {
    throw createError(500, "Faild to fetch cart data");
  }
};
