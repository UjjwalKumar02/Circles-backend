import { Router } from "express";
import authMiddleware from "../middlewares/authMiddleware.js";
import {
  createCommunity,
  deleteCommunity,
  exitCommunity,
  getCommunityDetail,
  getUserCommunities,
  joinCommunity,
  updateCommunityDetails,
} from "../controllers/communityController.js";

const router = Router();

// create a community
router.post("/create", authMiddleware, createCommunity);

// join a community
router.post("/join/:communityId", authMiddleware, joinCommunity);

// exit a joined community
router.post("/exit/:communityId", authMiddleware, exitCommunity);

// get user's communities
router.get("/user/bulk", authMiddleware, getUserCommunities);

// get all posts of a community
router.get("/:slug", authMiddleware, getCommunityDetail);

// ---- Admin controls ----

// update community details
router.put("/:communityId/profile", authMiddleware, updateCommunityDetails);

// delete community
router.delete("/:communityId/delete", authMiddleware, deleteCommunity);

export default router;
