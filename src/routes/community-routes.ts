import { Router } from "express"
import { authenticate } from "../middlewares/auth-middleware.js";
import prisma from "../lib/prisma.js";
import { slugify } from "../utils/slugify.js";
import { error } from "console";


const router = Router();


// Create a new community
router.post("/", authenticate, async (req: any, res) => {
  const { name, description } = req.body;
  const slug = slugify(name);

  if (!name) {
    return res.status(400).json({ error: "Name is required" });
  }

  try {
    const community = await prisma.community.create({
      data: { 
        name,
        slug,
        description
      },
    });

    await prisma.userCommunity.create({
      data: {
        userId: req.user.id,
        communityId: community.id,
        role: "ADMIN",
      },
    });

    return res.json(community);
  } catch (error) {
    return res.status(500).json({ error: "Community creation failed" });
  }
});


// Join a community
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
      return res.status(400).json({ error: "Already a member of this community" });
    }

    const join = await prisma.userCommunity.create({
      data: {
        userId,
        communityId,
      },
    });

    return res.json(join);
  } catch (error) {
    console.error("Join error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});


// Explore all communities
router.get("/explore", authenticate, async (_req, res) => {
  const all = await prisma.community.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(all);
});


// Get user's communities
router.get("/my", authenticate, async (req: any, res) => {
  const userId = req.user.id;

  const communities = await prisma.userCommunity.findMany({
    where: { userId },
    include: { community: true },
  });

  return res.json(
    communities.map(m => ({
      role: m.role,
      community: {
        id: m.community.id,
        name: m.community.name,
        slug: m.community.slug,
        description: m.community.description,
        createdAt: m.community.createdAt,
      },
    }))
  );
});


// Get all posts of the community
router.get('/:slug', authenticate, async (req: any, res) => {
  let { slug } = req.params;
  const userId = req.user.id;

  try {
    const community = await prisma.community.findUnique({
      where: { slug },
      include: {
        posts: {
          orderBy: { createdAt: 'desc' },
          include: {
            author: { select: { name: true, avatar: true } },
            likes: { select: { likedById: true } }
          }
        }
      }
    });

    if (!community) {
      return res.status(404).json({ error: "Community not found"});
    }

    const postsWithLiked = community.posts.map((post) => {
      const likedByUser = post.likes.some(like => like.likedById === userId);
      return {
        ...post,
        likedByUser,
      };
    });

    res.json({
      ...community,
      posts: postsWithLiked
    });
  } catch (error) {
    res.status(500).json({ error: "Internal server error"});
  }
});


// Create a Post
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
    return res.status(500).json({ error: "Internal server error" });
  }
})


// Like updation
router.post("/posts/:postId/like", authenticate, async (req: any, res) => {
  const { postId } = req.params;
  const userId = req.user.id;

  try {
    const existing = await prisma.like.findUnique({
      where: {
        postId_likedById: {
          postId,
          likedById: userId,
        }
      }
    });

    if (existing) {
      await prisma.like.delete({
        where: {
          postId_likedById: {
            postId,
            likedById: userId,
          }
        }
      });
      return res.json({ liked: false });
    } else {
      await prisma.like.create({
        data: {
          postId,
          likedById: userId,
        }
      });
      return res.json({ liked: true });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal server error"});
  }
});


// checking is admin
router.get("/:slug/isadmin", authenticate, async (req: any, res) => {
  const { slug } = req.params;
  const userId = req.user.id;

  if (!userId && !slug) {
    return res.status(404).json({ error: "cant read userid and slug"});
  }

  try {
    const communityId = await prisma.community.findUnique({
    where: { slug },
    select: { id: true }
  })
  console.log(communityId);

  const community = await prisma.userCommunity.findUnique({
    where: {
      userId_communityId: {
        userId, 
        communityId: communityId.id
      }
    }
  });

  console.log(community);

  if (community.role === "ADMIN") {
    return res.json({ isAdmin: true });
  } else {
    return res.json({ isAdmin: false });
  }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "error in checking admin from server side" })
  }
});

export default router;