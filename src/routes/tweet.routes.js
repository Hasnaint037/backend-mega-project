import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  createTweet,
  deleteTweet,
  getMultipleUserTweets,
  getUserTweets,
  updateTweet,
} from "../controllers/tweet.controller.js";
const router = express.Router();

router.route("/create").post(verifyJWT, createTweet);

router.route("/getSingleUser/:id").get(verifyJWT, getUserTweets);

router.route("/getMultipleUser").get(verifyJWT, getMultipleUserTweets);

router.route("/delete/:id").delete(verifyJWT, deleteTweet);

router.route("/update/:id").put(verifyJWT, updateTweet);

export default router;
