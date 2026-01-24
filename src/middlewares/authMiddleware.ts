import type { NextFunction, Request, Response } from "express";
import Jwt from "jsonwebtoken";

export default async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const token = req.cookies.auth_token;
  if (!token) {
    return res.status(405).json({ error: "Token not found" });
  }

  const decodedData = (await Jwt.verify(token, process.env.JWT_SECRET!)) as {
    id: string;
  };

  if (!decodedData) {
    return res.status(400).json({ error: "Invalid token" });
  }

  req.userId = decodedData.id;

  next();
}
