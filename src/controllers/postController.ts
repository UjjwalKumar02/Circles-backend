import type { Request, Response } from "express";
import prisma from "../lib/prisma.js";

// create post
export const createPost = async (req: Request, res: Response) => {
  const userId = req.userId;
  const { content, communityId } = req.body;

  if (!content || !communityId || !userId) {
    return res.status(400).json({ error: "Empty request body or userId" });
  }

  try {
    await prisma.post.create({
      data: {
        content,
        authorId: userId,
        communityId,
        likesCount: 0,
      },
    });

    res.status(200).json({ message: "Post created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error while creating post" });
  }
};

// toggle like
export const toggleLike = async (req: Request, res: Response) => {
  const postId = Number(req.params.postId);
  const userId = req.userId;

  if (!userId || !postId) {
    return res.status(400).json({ error: "empty postId or userId" });
  }

  try {
    const existing = await prisma.like.findUnique({
      where: {
        postId_likedById: {
          postId,
          likedById: userId,
        },
      },
    });

    // If like exists
    if (existing) {
      await prisma.$transaction(async (tx) => {
        await tx.like.delete({
          where: {
            postId_likedById: {
              postId,
              likedById: userId,
            },
          },
        });

        await tx.post.update({
          where: { id: postId },
          data: {
            likesCount: { decrement: 1 },
          },
        });
      });

      return res.status(200).json({ liked: false });
    }

    // If like doesn't not exists
    await prisma.$transaction(async (tx) => {
      await tx.like.create({
        data: {
          postId,
          likedById: userId,
        },
      });
      await tx.post.update({
        where: { id: postId },
        data: {
          likesCount: { increment: 1 },
        },
      });
    });

    return res.status(200).json({ liked: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error while toggling like" });
  }
};
