import express from "express";
import { getProudctById } from "../services/products.js";

const app = express.Router();

app.get("/:pid", async (req, res) => {
  try {
    const data = await getProudctById(req?.params?.pid); 
    res.send({ ...data["_doc"], rating: Math.floor(Math.random() * 6) });
  } catch (error) {
    res.send({ error: true, message: "Faild to get data from server" });
  }
});

export default app;
