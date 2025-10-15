import { Router, Request, Response } from "express";
import prisma from "../lib/prisma.js";
import { authenticate } from "../middlewares/auth-middleware.js";


const router = Router();


// Check Private route
router.get("/me", authenticate, (req: any, res) => {
  res.json({ user: req.user });
});


// Get user details
router.get("/details", authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        name: true,
        email: true,
        avatar: true,
        description: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});


// Update user details
router.put("/update", authenticate, async (req: any, res) => {
  const userId = req.user.id;
  const { name, description } = req.body;

  if (!name && !description) {
    return res.status(404).json({ error: "Name and Description are required" })
  }

  try {
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

    res.json({ user: updatedUser });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
});


// Delete user
router.delete("/delete", authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;
    await prisma.user.delete({ where: { id: userId } });

    res.json("User deleted successfully!");
  } catch (error) {
    res.status(500).json({ error: "Error while deleting user" });
  }
})


export default router;