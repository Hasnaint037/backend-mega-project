import mongoose from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const createTweet = asyncHandler(async (req, res) => {
  // get data
  // create tweet and save in database
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "content is required");
  }
  const tweet = await Tweet.create({
    content,
    owner: req.user._id,
  });
  new ApiResponse(201, "kks");
  res
    .status(201)
    .json(new ApiResponse(201, tweet, "tweet created successfully"));
});

export const getUserTweets = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const tweets = await Tweet.find({ _id: id });
  res
    .status(200)
    .json(new ApiResponse(200, tweets, "all tweets fetched successfully"));
});

export const getMultipleUserTweets = asyncHandler(async (req, res) => {
  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "users",
        pipeline: [
          {
            $project: {
              fullName: 1,
              userName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $project: {
        users: 1,
        content: 1,
        owner: 1,
      },
    },
  ]);
  // const tweets = await Tweet.find().populate("owner");
  res
    .status(200)
    .json(new ApiResponse(200, tweets, "tweets fetched successfully"));
});

export const deleteTweet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const deletedTweet = await Tweet.deleteOne({ _id: id });
  res
    .status(200)
    .json(new ApiResponse(200, deletedTweet, "tweet deleted successfully"));
});

export const updateTweet = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;
  const updatedTweet = await Tweet.updateOne(
    { _id: id },
    { $set: { content } }
  );
  res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "tweet updated successfully"));
});
