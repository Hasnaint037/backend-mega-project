import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getLikedVideos, toggleLike } from "../controllers/like.controller.js";
const router = express.Router();

router.route("/add/:videoId").post(verifyJWT, toggleLike);

router.route("/likedVideos").get(verifyJWT, getLikedVideos);

export default router;
