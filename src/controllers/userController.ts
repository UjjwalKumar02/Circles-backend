import type { Request, Response } from "express";
import Jwt from "jsonwebtoken";
import prisma from "../lib/prisma.js";

// google login function
export const handleGoogleLogin = (req: Request, res: Response) => {
  try {
    const user = req.user as { id: number };
    if (!user) {
      return res.status(400).json({ error: "Authentication failed" });
    }
    const userId = user.id;

    const token = Jwt.sign({ id: userId }, process.env.JWT_SECRET!, {
      expiresIn: "15d",
    });

    const isProduction = process.env.NODE_ENV === "production";

    res.cookie("auth_token", token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      maxAge: 15 * 24 * 60 * 60 * 1000, // 15 days
      path: "/",
    });

    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

// logout function
export const handleLogout = (req: Request, res: Response) => {
  try {
    res.cookie("auth_token", "", { maxAge: 1 });
    res.status(200).json({ message: "user logout successfully" });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};

// get profile details
export const getProfileDetails = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(400).json({ error: "UserId missing in request" });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        username: true,
        email: true,
        avatar: true,
        description: true,
      },
    });

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error });
  }
};

// update profile details
export const updateProfileDetails = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(400).json({ error: "UserId missing in request" });
  }

  const { username, description } = req.body;
  if (!username || !description) {
    res.status(400).json({ error: "Empty request body" });
  }
  try {
    await prisma.user.update({
      where: { id: userId },
      data: {
        username,
        description,
      },
    });

    res.status(200).json({ message: "user profile updated successfully" });
  } catch (error) {
    res.status(400).json({ error: error });
  }
};

// delete user
export const deleteUser = async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(400).json({ error: "UserId missing in request" });
  }
  try {
    await prisma.user.delete({
      where: { id: userId },
    });

    res.cookie("auth_token", "", { maxAge: 1 });
    res.status(200).json({ message: "user deleted" });
  } catch (error) {
    res.status(400).json({ error: error });
  }
};

// get user profile of profileId
export const getUserProfile = async (req: Request, res: Response) => {
  const profileId = parseInt(req.params.ProfileId!);
  if (!profileId) {
    return res.status(400).json({ error: "Empty profileId" });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id: profileId },
      select: {
        username: true,
        avatar: true,
        description: true,
      },
    });

    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error });
  }
};
