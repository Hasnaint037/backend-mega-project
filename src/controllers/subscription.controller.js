import mongoose from "mongoose";
import { Subscription } from "../models/subscription.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const toggleSubscription = asyncHandler(async (req, res) => {
  // get id
  // find in subscription with this id
  // if id found ,delete it
  // if not found, create subscription
  // send response
  const { id } = req.params;
  const subscriber = await Subscription.findOne({ channel: id });
  if (subscriber) {
    await Subscription.deleteOne({ channel: id });
    res.status(200).json(new ApiResponse(200, {}, "subscription removed"));
    return;
  }
  const subscription = await Subscription.create({
    channel: id,
    subscriber: req.user._id,
  });
  res
    .status(200)
    .json(new ApiResponse(200, subscription, "subscription added"));
});

export const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const channel = await User.findById(id);
  if (!channel) {
    throw new ApiError(404, "channel not found");
  }
  const subscribedChannels = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "subscribers",
        pipeline: [
          {
            $project: {
              userName: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        channel: {
          $first: "$subscribers",
        },
      },
    },
    {
      $project: {
        channel: 1,
      },
    },
  ]);
  res
    .status(200)
    .json(new ApiResponse(200, subscribedChannels, "channel fetched"));
});

export const getChannelsSubscribed = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const channel = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(id),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribed",
        pipeline: [
          {
            $project: {
              userName: 1,
              fullName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        subscribed: {
          $first: "$subscribed",
        },
      },
    },
    {
      $project: {
        subscribed: 1,
      },
    },
  ]);
  res
    .status(200)
    .json(new ApiResponse(200, channel, "subscribed channel fetched"));
});
