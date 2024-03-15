import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import uploadFile, { deleteFile } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import mongoose from "mongoose";

export const publishVideo = asyncHandler(async (req, res) => {
  // get data
  // validate data
  // upload video and thumbnail
  // save data
  const { title, description } = req.body;
  if (!title || !description) {
    throw new ApiError(400, "title or description required");
  }
  const videoLocalPath = req.files.video[0].path;
  const thumbnailLocalPath = req.files.thumbnail[0].path;
  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "video or thumbnail required");
  }
  const video = await uploadFile(videoLocalPath);
  const thumbnail = await uploadFile(thumbnailLocalPath);
  if (!video || !thumbnail) {
    throw new ApiError(
      401,
      "error occurred while uploading video or thumbnail"
    );
  }
  const response = await Video.create({
    description,
    title,
    video_url: video.url,
    video_id: video.public_id,
    thumbnail_url: thumbnail.url,
    thumbnail_id: thumbnail.public_id,
    duration: video.duration,
    owner: req.user._id,
  });
  res
    .status(201)
    .json(new ApiResponse(201, response, "video published successfully"));
});

export const deleteVideo = asyncHandler(async (req, res) => {
  // get video id
  // delete from cloudinary
  // remove from data base
  // send response
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }
  if (!req.user._id.equals(video.owner)) {
    throw new ApiError(400, "You have no permission");
  }
  const h = await deleteFile(video.video_id, { resource_type: "video" });
  console.log(video.video_id);
  const g = await deleteFile(video.thumbnail_id, { resource_type: "image" });
  console.log(h);
  console.log(g);
  const deletedVideo = await Video.deleteOne({ _id: video._id });
  res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "video deleted successfully"));
});

export const updateVideo = asyncHandler(async (req, res) => {
  // get id
  // find video
  // if not found through error
  // check owner
  // update that video
  // send response
  const { videoId } = req.params;
  const { title, description } = req.body;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }
  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(400, "you have no permission");
  }
  video.title = title;
  video.description = description;
  await video.save({ validateBeforeSave: false });
  res.status(200).json(new ApiResponse(200, {}, "video updated successfully"));
});

export const updateThumbnail = asyncHandler(async (req, res) => {
  // get id
  // get thumbnail to update
  // find video
  // match user to check owner
  // update thumbnail
  // update database
  // send response
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }
  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(400, "you have no permission");
  }
  const thumbnailLocalPath = req.file?.path;
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "thumbnail file is required");
  }
  const updatedThumbnail = await uploadFile(thumbnailLocalPath);
  const deletedThumbnail = await deleteFile(video.thumbnail_id, {
    resource_type: "image",
  });
  console.log(deletedThumbnail);
  video.thumbnail_url = updatedThumbnail.url;
  video.thumbnail_id = updatedThumbnail.public_id;
  await video.save({ validateBeforeSave: false });
  res.status(200).json(new ApiResponse(200, {}, "thumbnail is updated"));
});

export const togglePublishStatus = asyncHandler(async (req, res) => {
  // get id
  // find video
  // check user to verify owner
  // toggle status
  // update database
  // send response
  const { videoId } = req.params;
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "video not found");
  }
  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(400, "you have no permission");
  }
  video.isPublished = !video.isPublished;
  await video.save({ validateBeforeSave: false });
  res.status(200).json(new ApiResponse(200, {}, "status updated"));
});

export const getVideoById = asyncHandler(async (req, res) => {
  // get id
  // find video
  // get all likes
  // get all comments
  // get all tweets
  // update user watch history
  // update views of video
  const { videoId } = req.params;
  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $project: {
              userName: 1,
              fullName: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "video",
        as: "comments",
      },
    },
    {
      $addFields: {
        likes: {
          $size: "$likes",
        },
        comments: {
          $size: "$comments",
        },
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $project: {
        video_url: 1,
        thumbnail_url: 1,
        likes: 1,
        comments: 1,
        views: 1,
        owner: 1,
      },
    },
  ]);
  const updateViews = await Video.findById(videoId);
  updateViews.views += 1;
  const user = await User.findById(req.user._id);
  let watchHistory = user.watchHistory;
  const isFind = watchHistory.find(
    (id) => id.toString() == updateViews._id.toString()
  );
  if (isFind) {
    let g = watchHistory.filter(
      (id) => id.toString() !== updateViews._id.toString()
    );
    g.unshift(updateViews._id);
    user.watchHistory = g;
    await user.save({ validateBeforeSave: false });
  } else {
    user.watchHistory.unshift(updateViews._id);
    await user.save({ validateBeforeSave: false });
  }
  await updateViews.save({ validateBeforeSave: false });
  res.status(200).json(new ApiResponse(200, video[0], "video fetched"));
});

export const getAllVideos = asyncHandler(async (req, res) => {
  // get query,pagination
  // get all video based on that query
  const { page, title, description } = req.query;
  const queryObject = {};
  if (title) {
    queryObject.title = { $regex: title, $options: "i" };
  }
  if (description) {
    queryObject.description = { $regex: description, $options: "i" };
  }
  const videos = await Video.find(queryObject)
    .limit(12)
    .skip(12 * (page - 1))
    .populate("owner")
    .select("-avatar -watchHistory");
  res
    .status(200)
    .json(new ApiResponse(200, videos, "All videos fetched successfully"));
});
