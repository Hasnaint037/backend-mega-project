import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

//content video owner
export const getCommentOnVideo = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const comments = await Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(id),
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
              avatar: 1,
              _id: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);
  if (!comments) {
    throw new ApiError(404, "no comments yet");
  }
  res.status(200).json(new ApiResponse(200, comments, "comment fetched"));
});

export const postComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const video = await Video.findById(id);
  if (!video) {
    throw new ApiError(404, "video not found");
  }
  const comment = await Comment.create({
    content,
    video: id,
    owner: req.user._id,
  });
  res.status(200).json(new ApiResponse(200, comment, "comment posted"));
});

export const deleteComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const comment = await Comment.findById(id);
  if (!comment) {
    throw new ApiError(404, "comment not found");
  }
  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(400, "you have no permission");
  }
  const deletedComment = await Comment.deleteOne({ _id: id });
  res.status(200).json(new ApiResponse(200, {}, "comment deleted"));
});

export const updateComment = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "content required");
  }
  const comment = await Comment.findById(id);
  if (!comment) {
    throw new ApiError(404, "comment not found");
  }
  if (comment.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(400, "you have no permission");
  }
  comment.content = content;
  await comment.save({ validateBeforeSave: false });
  res.status(200).json(new ApiResponse(200, "comment updated successfully"));
});
