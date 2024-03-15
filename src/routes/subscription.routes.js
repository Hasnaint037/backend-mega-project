import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getChannelsSubscribed,
  getUserChannelSubscribers,
  toggleSubscription,
} from "../controllers/subscription.controller.js";
const router = express.Router();

router.route("/add/:id").post(verifyJWT, toggleSubscription);

router.route("/subscribers/:id").get(verifyJWT, getUserChannelSubscribers);

router.route("/subscribed/:id").get(verifyJWT, getChannelsSubscribed);

export default router;
