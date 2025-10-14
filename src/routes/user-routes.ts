import type { Request, Response } from "express";
import { Router } from "express";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middlewares/auth-middleware.js";


const router = Router();


// Checking Private route in frontend
router.get("/me", authenticate, (req, res) => {
  res.json({ user: (req as any).user });
});


// GET my user details
router.get("/details", authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const userDetails = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        avatar: true,
        description: true
      }
    });

    if (!userDetails) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.json(userDetails);
  } catch (error) {
    return res.status(500).json({ error: "Internal server error" });
  }
});


// Update user details
router.put("/update", authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const { name, description } = req.body;

    if (!name && !description) {
      return res.status(404).json({ error: "Name and Description are required" })
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name && { name }),
        ...(description && { description }),
      },
      select: {
        name: true,
        email: true,
        avatar: true,
        description: true
      }
    });

    return res.json({ user: updatedUser });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


// Delete user
router.delete("/delete", authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.delete({
      where: { id: userId }
    });
    return res.json("User deleted successfully!");
  } catch (error) {
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(500).json({ error: "Error while deleting user" });
  }
})


export default router;