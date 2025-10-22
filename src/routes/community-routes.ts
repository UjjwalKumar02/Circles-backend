import type { Request, Response } from "express";
import { Router } from "express";
import { authenticate } from "../middlewares/auth-middleware.js";
import prisma from "../lib/prisma.js";
import { slugify } from "../utils/slugify.js";


const router = Router();


// Create community
router.post("/", authenticate, async (req: any, res) => {
  const { name, description } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const community = await prisma.community.create({
      data: { 
        name,
        slug: slugify(name),
        description
      },
    });

    await prisma.userCommunity.create({
      data: {
        userId: req.user!.id,
        communityId: community.id,
        role: "ADMIN",
      },
    });

    res.json(community);
  } catch (error) {
    return res.status(500).json({ error: "Community creation failed" });
  }
});


// Join community
router.post("/:id/join", authenticate, async (req: any, res) => {
  const userId = req.user.id;
  const communityId = req.params.id;

  try {
    const community = await prisma.community.findUnique({
      where: { id: communityId },
    });

    if (!community) {
      return res.status(404).json({ error: "Community not found" });
    }

    const alreadyJoined = await prisma.userCommunity.findFirst({
      where: {
        userId,
        communityId,
      },
    });

    if (alreadyJoined) {
      return res.status(400).json({ error: "Already a member" });
    }

    const join = await prisma.userCommunity.create({
      data: {
        userId,
        communityId,
      },
    });

    res.json(join);
  } catch (error) {
    res.status(500).json({ error: "Join failed" });
  }
});


// Explore
router.get("/explore", authenticate, async (_req, res) => {
  const all = await prisma.community.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(all);
});


// Get user's communities
router.get("/my", authenticate, async (req: any, res) => {
  const userId = req.user.id;

  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  const communities = await prisma.userCommunity.findMany({
    where: { userId },
    include: { community: true },
  });

  res.json(
    {"communities" : communities.map(m => ({
      role: m.role,
      community: {
        id: m.community.id,
        name: m.community.name,
        slug: m.community.slug,
        description: m.community.description,
        createdAt: m.community.createdAt,
      },
    })),
    "hasUsername": user.username != null,
  });
});


// Community posts
router.get('/:slug', authenticate, async (req: any, res) => {
  const { slug } = req.params;
  const userId = req.user.id;

  try {
    const community = await prisma.community.findUnique({
      where: { slug },
      include: {
        posts: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { username: true, name: true, avatar: true } },
            likes: { select: { likedById: true } }
          }
        }
      }
    });

    if (!community) {
      return res.status(404).json({ error: "Community not found"});
    }

    const posts = community.posts.map((p) => ({
      ...p,
      likedByUser: p.likes.some((l) => l.likedById === userId),
    }));

    res.json({ ...community, posts });
  } catch (error) {
    res.status(500).json({ error: "Internal server error"});
  }
});


// Create Post
router.post('/:slug', authenticate, async (req: any, res) => {
  const { slug } = req.params;
  const { content, isAnonymous, isAnnouncement } = req.body;

  if (!content) {
    return res.status(400).json({ error: "Post content is empty!"});
  }

  try {
    const community = await prisma.community.findUnique({
      where: { slug },
    });

    if (!community) {
      return res.status(404).json({ error: "Community not found"});
    }

    const newPost = await prisma.post.create({
      data: {
        content,
        communityId: community.id,
        authorId: req.user.id,
        anonymous: isAnonymous || false,
        isAnnouncement: isAnnouncement || false,
      },
    });

    res.status(202).json(newPost);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error" });
  }
})


// Like toggle
router.post("/posts/:postId/like", authenticate, async (req: any, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    const existing = await prisma.like.findUnique({
      where: { postId_likedById: { postId, likedById: userId } },
    });

    if (existing) {
      await prisma.like.delete({
        where: { postId_likedById: { postId, likedById: userId } },
      });
      return res.json({ liked: false });
    } 

    await prisma.like.create({
      data: { postId, likedById: userId },
    });

    res.json({ liked: true });
  } catch (error) {
    res.status(500).json({ error: "Internal server error"});
  }
});


// Check Admin
router.get("/:slug/isadmin", authenticate, async (req: any, res) => {
  const { slug } = req.params;
  const userId = req.user.id;

  try {
    const community = await prisma.community.findUnique({
    where: { slug },
    select: { id: true }
  })

  if (!community) {
    return res.status(404).json({ error: "Community not found" });
  }

  const membership = await prisma.userCommunity.findUnique({
    where: {
      userId_communityId: { userId, communityId: community.id }
    },
  });

  res.json({ isAdmin: membership?.role === "ADMIN"});
  } catch (error) {
    res.status(500).json({ error: "Error checking admin" })
  }
});


export default router;