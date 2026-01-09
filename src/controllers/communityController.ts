import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";
import generateSlug from "../utils/helpers/generateSlug.js";

// create community
export const createCommunity = async (req: Request, res: Response) => {
  const userId = req.userId;
  const { name, description } = req.body;

  if (!name || !description || !userId) {
    return res.status(400).json({ error: "Missing required values" });
  }

  const slug = generateSlug(name);

  try {
    await prisma.community.create({
      data: {
        name,
        slug,
        description,
        members: { create: { userId, role: "ADMIN" } },
      },
    });

    res.status(200).json({ message: "community created" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "error in community creation" });
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
        role: "MEMBER",
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
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: { username: true, avatar: true },
            },
            likes: {
              select: { id: true },
            },
            comments: {
              select: { id: true },
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

// get community details
export const getCommunityDetails = async (req: Request, res: Response) => {
  const communityId = req.params.communityId;

  if (!communityId) {
    return res.status(400).json({ error: "Missing id" });
  }

  try {
    const community = await prisma.community.findUnique({
      where: { id: communityId },
      select: {
        name: true,
        description: true,
        createdAt: true,
        members: {
          select: {
            role: true,
            user: { select: { username: true, avatar: true } },
          },
        },
      },
    });

    res.status(200).json(community);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error in getting community details" });
  }
};

// search community by communityName
export const searchCommunity = async (req: Request, res: Response) => {
  const communityName = req.params.communityName;

  if (!communityName) {
    return res.status(400).json({ error: "Missing communityName" });
  }

  try {
    const community = await prisma.community.findUnique({
      where: { name: communityName },
      select: {
        name: true,
        description: true,
      },
    });

    if (!community) {
      return res.status(204).json({ communityFound: false });
    }

    res.status(200).json(community);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error in searching community" });
  }
};

// update community details if admin
export const updateCommunityDetails = async (req: Request, res: Response) => {
  const userId = req.userId;
  const communityId = req.params.communityId;
  const { name, description } = req.body;

  if (!userId || !communityId || !name || !description) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const user = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: { userId, communityId },
      },
      select: {
        role: true,
      },
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
    res.status(500).json({ error: "Error in updating community details" });
  }
};

// kick member if admin
export const kickMember = async (req: Request, res: Response) => {
  const userId = req.userId;
  const communityId = req.params.communityId;
  const memberId = Number(req.params.memberId);

  if (!userId || !communityId || isNaN(memberId)) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const user = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: { userId, communityId },
      },
      select: {
        role: true,
      },
    });

    const isAdmin = user?.role === "ADMIN";

    if (!isAdmin) {
      return res
        .status(400)
        .json({ error: "Restricted action for non-admins" });
    }

    await prisma.communityMember.delete({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
    });

    res.status(200).json({ message: "Member kicked" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error in kicking member" });
  }
};

// delete post if admin
export const deletePost = async (req: Request, res: Response) => {
  const userId = req.userId;
  const communityId = req.params.communityId;
  const postId = Number(req.params.postId);

  if (!userId || !communityId || isNaN(postId)) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const user = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: { userId, communityId },
      },
      select: {
        role: true,
      },
    });

    const isAdmin = user?.role === "ADMIN";

    if (!isAdmin) {
      return res
        .status(400)
        .json({ error: "Restricted action for non-admins" });
    }

    await prisma.post.delete({
      where: {
        id: postId,
        communityId,
      },
    });

    res.status(200).json({ message: "Member kicked" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error in kicking member" });
  }
};

// delete community
export const deleteCommunity = async (req: Request, res: Response) => {
  const userId = req.userId;
  const communityId = req.params.communityId;

  if (!userId || !communityId) {
    return res.status(400).json({ error: "Missing required values" });
  }

  try {
    const isAdmin = await prisma.communityMember.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
        role: "ADMIN",
      },
    });

    if (!isAdmin) {
      return res.status(400).json({ error: "Restricted action to non-admins" });
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
