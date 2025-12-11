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
      },
    });

    res.status(200).json({ message: "Post created successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error while creating post" });
  }
};

// delete post
export const deletePost = async (req: Request, res: Response) => {
  const userId = req.userId;
  const postId = Number(req.params.postId);

  if (!userId || !postId) {
    return res.status(400).json({ error: "empty userId or postId" });
  }

  try {
    await prisma.post.delete({
      where: { id: postId, authorId: userId },
    });

    res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error while deleting post" });
  }
};

// get post details of postId
export const getPostDetails = async (req: Request, res: Response) => {
  const postId = Number(req.params.postId);
  if (!postId) {
    return res.status(400).json({ error: "empty postId" });
  }
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        content: true,
        createdAt: true,
        author: { select: { username: true, avatar: true } },
        likes: { select: { id: true } },
        comments: {
          select: {
            content: true,
            author: { select: { username: true, avatar: true } },
          },
        },
      },
    });

    if (!post) {
      return res.status(400).json({ error: "Cannot find post" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error while getting post details" });
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

    if (existing) {
      await prisma.like.delete({
        where: {
          postId_likedById: {
            postId,
            likedById: userId,
          },
        },
      });

      return res.status(200).json({ liked: false });
    }

    await prisma.like.create({
      data: {
        postId,
        likedById: userId,
      },
    });

    return res.status(200).json({ liked: true });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error while toggling like" });
  }
};

// comment
export const makeComment = async (req: Request, res: Response) => {
  const postId = Number(req.params.postId);
  const userId = req.userId;
  const content = req.body;

  if (!userId || !postId || content) {
    return res.status(400).json({ error: "empty postId or userId or content" });
  }

  try {
    await prisma.comment.create({
      data: {
        content,
        authorId: userId,
        postId,
      },
    });

    res.status(200).json({ message: "comment added" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error while adding comment" });
  }
};
