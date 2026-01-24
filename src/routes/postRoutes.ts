import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import { createPost, toggleLike } from "../controllers/postController.js";

const router = Router();

// create a post
router.post("/create", authMiddleware, createPost);

// toggle like
router.post("/:postId/like", authMiddleware, toggleLike);

export default router;
