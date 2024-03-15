import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  deleteComment,
  getCommentOnVideo,
  postComment,
  updateComment,
} from "../controllers/comment.controller.js";
const router = express.Router();

router.route("/all/:id").get(verifyJWT, getCommentOnVideo);

router.route("/new/:id").post(verifyJWT, postComment);

router.route("/delete/:id").delete(verifyJWT, deleteComment);

router.route("/update/:id").put(verifyJWT, updateComment);

export default router;
