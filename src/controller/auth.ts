import { Request, Response } from "express";

export const signinUser = (req: Request, res: Response) => {
  try {
    console.log(req.body)
    res.send({});
  } catch (error) {
    res.send({ error });
  }
};
