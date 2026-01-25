import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import generateSlug from "../utils/helpers/generateSlug.js";

// Create community
export const createCommunity = async (req: Request, res: Response) => {
  const { name, description } = req.body;
  const userId = req.userId;

  if (
    !name ||
    name === "" ||
    !description ||
    description === "" ||
    !userId ||
    userId === ""
  ) {
    return res.status(404).json({ error: "Empty parameters!" });
  }

  const slug = generateSlug(name);

  if (!slug || slug === "") {
    return res.status(404).json({ error: "Empty slug!" });
  }

  try {
    const community = await prisma.community.create({
      data: {
        name,
        slug,
        description,
      },
    });

    await prisma.communityMember.create({
      data: {
        userId,
        communityId: community.id,
        role: "ADMIN",
      },
    });

    res.status(200).json({ message: "Community created" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error while creating community" });
  }
};

// join a community
export const joinCommunity = async (req: Request, res: Response) => {
  const userId = req.userId;
  const communityId = req.params.communityId;

  if (!userId || !communityId) {
    return res.status(400).json({ error: "Missing required values" });
  }

  try {
    const membership = await prisma.communityMember.create({
      data: {
        userId,
        communityId,
        role: "MEMBER",
      },
    });

    res.status(200).json({ message: "community joined" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "error in community joining" });
  }
};

// exit a community
export const exitCommunity = async (req: Request, res: Response) => {
  const userId = req.userId;
  const communityId = req.params.communityId;

  if (!userId || !communityId) {
    console.log("userId missing");
    return res.status(400).json({ error: "Missing required values" });
  }

  try {
    await prisma.communityMember.delete({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
    });

    res.status(200).json({ message: "community exit successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "error while community exit" });
  }
};

// get user's community
export const getUserCommunities = async (req: Request, res: Response) => {
  const userId = req.userId;

  if (!userId) {
    return res.status(400).json({ error: "Missing required values" });
  }

  try {
    const communities = await prisma.communityMember.findMany({
      where: { userId },
      select: {
        role: true,
        community: {
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
          },
        },
      },
    });

    res.status(200).json(communities);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "error while community exit" });
  }
};

// get all posts of a community [will add pagination later]
export const getCommunityDetail = async (req: Request, res: Response) => {
  const userId = req.userId;
  const slug = req.params.slug;

  if (!slug || !userId) {
    return res.status(400).json({ error: "Empty params" });
  }

  try {
    const commuintyDetail = await prisma.community.findUnique({
      where: { slug },
      select: {
        id: true,
        name: true,
        description: true,
        members: {
          select: { role: true },
          where: { userId },
        },
        posts: {
          orderBy: { createdAt: "desc" },
          take: 200,
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: { username: true, avatar: true },
            },
            likesCount: true,
            likes: {
              where: { likedById: userId },
            },
          },
        },
      },
    });

    res.status(200).json(commuintyDetail);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error in getting community posts" });
  }
};

// Update community details
export const updateCommunityDetails = async (req: Request, res: Response) => {
  const communityId = req.params.communityId;
  const { name, description } = req.body;
  const userId = req.userId;

  if (
    !communityId ||
    communityId === "" ||
    !name ||
    name === "" ||
    !description ||
    description === "" ||
    !userId ||
    userId === ""
  ) {
    console.log("Empty parameters!");
    return res.status(404).json({ error: "Empty parameters!" });
  }

  try {
    const user = await prisma.communityMember.findUnique({
      where: { userId_communityId: { userId, communityId } },
      select: { role: true },
    });

    const isAdmin = user?.role === "ADMIN";

    if (!isAdmin) {
      return res
        .status(400)
        .json({ error: "Restricted action for non-admins" });
    }

    await prisma.community.update({
      where: { id: communityId },
      data: { name, description },
    });

    res.status(200).json({ message: "Community details updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error while updating community details" });
  }
};

// delete community
export const deleteCommunity = async (req: Request, res: Response) => {
  const userId = req.userId;
  const communityId = req.params.communityId;

  if (!userId || userId === "" || !communityId || communityId === "") {
    return res.status(400).json({ error: "Missing parameters" });
  }

  try {
    const membership = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
      select: { role: true },
    });

    if (membership?.role !== "ADMIN") {
      return res.status(402).json({ error: "Restricted action to non-admins" });
    }

    await prisma.community.delete({
      where: { id: communityId },
    });

    res.status(200).json({ message: "community deleted" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "error in community deletion" });
  }
};
