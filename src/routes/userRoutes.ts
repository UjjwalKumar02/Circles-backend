import { Router } from "express";
import passport from "passport";
import {
  deleteUser,
  getProfileDetails,
  getUserProfile,
  handleGoogleLogin,
  handleLogout,
  updateProfileDetails,
} from "../controllers/userController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = Router();

// google authentication route
router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// google callback route
router.get(
  "/auth/callback/google",
  passport.authenticate("google", {
    failureRedirect: "/signin",
    session: false,
  }),
  handleGoogleLogin
);

// logout route
router.post("/logout", authMiddleware, handleLogout);

// get profile details
router.get("/profile", authMiddleware, getProfileDetails);

// update profile details
router.put("/profile", authMiddleware, updateProfileDetails);

// delete account
router.delete("/profile", authMiddleware, deleteUser);

// get profile details of profileId
router.get("/profile/:profileId", authMiddleware, getUserProfile);

export default router;
