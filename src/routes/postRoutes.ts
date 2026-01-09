import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createPost,
  deletePost,
  getPostDetails,
  makeComment,
  toggleLike,
} from "../controllers/postController.js";

const router = Router();

// create a post
router.post("/create", authMiddleware, createPost);

// delete a post
router.delete("/:postId/delete", authMiddleware, deletePost);

// get post details of postId (comments)
router.get("/:postId", authMiddleware, getPostDetails);

// toggle like
router.post("/:postId/like", authMiddleware, toggleLike);

// make a comment
router.post("/:postId/comment", authMiddleware, makeComment);

export default router;
