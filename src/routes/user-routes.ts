import type { Request, Response } from "express";
import { Router } from "express";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middlewares/auth-middleware.js";


const router = Router();

router.post("/", async (req: Request, res: Response) => {
  try {
    const { email, name } = req.body;

    const user = await prisma.user.create({
      data: {
        email,
        name,
        googleId: "test-google-id",
      },
    });

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "something went wrong" });
  }
});

router.get("/", async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

router.get("/me",authenticate, (req, res) => {
  res.json({ user: (req as any).user });
});


export default router;