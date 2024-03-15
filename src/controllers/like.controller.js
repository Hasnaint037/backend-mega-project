import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const toggleLike = asyncHandler(async (req, res) => {
  // get id
  // find video
  // like video
  // inc likes of video
  // send response
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }
  const likedExists = await Like.findOne({ video: video._id });
  if (likedExists) {
    await Like.deleteOne({ video: video._id });
    res.status(200).json(new ApiResponse(200, {}, "like deleted successfully"));
  } else {
    await Like.create({
      like: true,
      video: video._id,
      likedBy: req.user._id,
    });
    res.status(201).json(new ApiResponse(201, {}, "like added successfully"));
  }
});

export const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.aggregate([
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "likedVideos",
        pipeline: [
          {
            $project: {
              video_url: 1,
              video_id: 1,
              thumbnail_url: 1,
              thumbnail_id: 1,
              views: 1,
              description: 1,
              title: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        video: {
          $first: "$likedVideos",
        },
      },
    },
    {
      $project: {
        video: 1,
      },
    },
  ]);
  if (!likedVideos) {
    throw new ApiError(404, "there are no liked videos yet");
  }
  res.status(200).json(new ApiResponse(200, likedVideos, "videos fetched"));
});
