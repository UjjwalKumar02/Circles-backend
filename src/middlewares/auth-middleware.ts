import type { Request, Response, NextFunction  } from "express";
import jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";


interface JwtPayload {
  id: string;
  email: string;
}


// declare global {
//   namespace Express {
//     interface Request {
//       user?: { id: string; email: string; name?: string; avatar?: string };
//     }
//   }
// }


export const authenticate = async (
  req: any,
  res: any,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.token;

    if (!token) {
      return res.status(401).json({ error: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = user;
    next();

  } catch (err) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};
