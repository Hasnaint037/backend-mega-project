import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  publishVideo,
  togglePublishStatus,
  updateThumbnail,
  updateVideo,
} from "../controllers/video.controller.js";
const router = Router();

router.route("/upload").post(
  upload.fields([
    { name: "video", maxCount: 1 },
    { name: "thumbnail", maxCount: 1 },
  ]),
  verifyJWT,
  publishVideo
);

router.route("/delete/:videoId").delete(verifyJWT, deleteVideo);

router.route("/update/:videoId").put(verifyJWT, updateVideo);

router
  .route("/update-thumbnail/:videoId")
  .put(upload.single("thumbnail"), verifyJWT, updateThumbnail);

router.route("/update-status/:videoId").put(verifyJWT, togglePublishStatus);

router.route("/getVideo/:videoId").get(verifyJWT, getVideoById);

router.route("/getAll").get(verifyJWT, getAllVideos);

export default router;
