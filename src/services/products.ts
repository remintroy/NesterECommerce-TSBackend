import * as db from "./mongoDb.js";

export const getProudctById = async (pid: string) => {
  try {
    return await db.products.findOne(
      { PID: pid },
      {
        _id: 0,
        title: 1,
        description: 1,
        price: 1,
        PID: 1,
        offer: 1,
        stock: 1,
        category: 1,
        rating: 1,
        creationTime: 1,
      }
    );
  } catch (error) {
    throw error;
  }
};
