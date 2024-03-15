import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary, { deleteFile } from "../utils/cloudinary.js";
import ApiResponse from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

export const registerUser = asyncHandler(async (req, res) => {
  // get user details from frontend
  // validation - not empty
  // check if user already exists: username, email
  // check for images, check for avatar
  // upload them to cloudinary, avatar
  // create user object - create entry in db
  // remove password and refresh token field from response
  // check for user creation
  // return res

  const { fullName, email, userName, password } = req.body;
  //console.log("email: ", email);

  if (
    [fullName, email, userName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser) {
    throw new ApiError(409, "User with email or username already exists");
  }
  const avatarLocalPath = req.files.avatar[0].path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required");
  }

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    avatar_id: avatar.public_id,
    coverImage: coverImage ? coverImage.url : "",
    cover_id: coverImage ? coverImage.public_id : "",
    email,
    password,
    userName: userName.toLowerCase(),
  });
  user.generateRefreshToken();
  await user.save({ validateBeforeSave: false });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering the user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

export const loginUser = asyncHandler(async (req, res) => {
  // get data
  // validate data
  // check if username or email exists
  // if exists check password
  // if correct create access token and refresh token
  // update refresh token in database
  // send cookie and response
  const { userName, email, password } = req.body;
  if (!userName && !email) {
    throw new ApiError(400, "username or email is required");
  }
  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (!user) {
    throw new ApiError(404, "user not found with this email or username");
  }
  const isPasswordCorrect = await user.isCorrectPassword(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "password is incorrect");
  }
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  await user.save({ validateBeforeSave: false });
  // validateBeforeSave --> because every time when document is saved,some information or data is mandatory that we define in model. So it avoids this
  const options = {
    httpOnly: true,
    secure: true,
    // these options makes cookie secure and it can only be modified by server not by anyone else
  };
  res
    .status(200)
    .cookie("AccessToken", accessToken, options)
    .cookie("RefreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user, accessToken, refreshToken },
        "user logged in"
      )
    );
});

export const logoutUser = asyncHandler(async (req, res) => {
  // check if user is logged in via middleware
  // remove cookies
  // remove refresh token from database
  const user = req.user;
  const isLogoutUser = await User.updateOne(
    { _id: user._id },
    {
      $unset: {
        refreshToken: 1, // This removes the field from database
      },
    },
    { upsert: true }
  );
  const options = [
    {
      httpOnly: true,
      secure: true,
    },
  ];
  res
    .status(200)
    .clearCookie("AccessToken", options)
    .clearCookie("RefreshToken", options)
    .json(new ApiResponse(200, {}, "user logged out"));
});

export const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies.RefreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized User");
  }
  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET_KEY
  );
  const user = await User.findById(decodedToken._id);
  if (!user) {
    throw new ApiError(401, "Invalid Refresh Token");
  }
  if (user.refreshToken !== incomingRefreshToken) {
    throw new ApiError(401, "Token expired or used");
  }

  const options = [
    {
      httpOnly: true,
      secure: true,
    },
  ];
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();
  await user.save({ validateBeforeSave: false });
  res
    .status(200)
    .cookie("AccessToken", accessToken, options)
    .cookie("RefreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { accessToken, refreshToken },
        "Access Token Refreshed"
      )
    );
});

export const changeCurrentPassword = asyncHandler(async (req, res) => {
  // get data
  // find user
  // match old password
  // if matched , change password
  // send response
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const { _id } = req.user;
  const user = await User.findById(_id);
  const isPasswordMatched = await user.isCorrectPassword(oldPassword);
  if (!isPasswordMatched) {
    throw new ApiError(400, "Invalid Old Password");
  }
  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "Password does not match");
  }
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });
  res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

export const getCurrentUser = asyncHandler(async (req, res) => {
  res
    .status(200)
    .json(new ApiResponse(200, req.user, "User fetched successfully"));
});

export const updateAccountDetails = asyncHandler(async (req, res) => {
  // get Details
  // throw error if not any data
  // changed profile
  // send response
  const { email, fullName } = req.body;
  if (!email && !fullName) {
    throw new ApiError(400, "email or fullName is required");
  }
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { upsert: true }
  );
  res
    .status(200)
    .json(new ApiResponse(200, user, "Profile changed successfully"));
});

export const updateUserAvatar = asyncHandler(async (req, res) => {
  // get avatar
  // remove from cloudinary
  // upload new to cloudinary
  // remove old one
  // update url in database
  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar required");
  }
  const response = await uploadOnCloudinary(avatarLocalPath);
  const deleteResponse = await deleteFile(req.user.avatar_id, {
    resource_type: "image",
  });
  console.log(deleteResponse);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        avatar: response.url,
        avatar_id: response.public_id,
      },
    },
    { upsert: true }
  );
  res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"));
});

export const updateCoverImage = asyncHandler(async (req, res) => {
  // get avatar
  // remove from cloudinary
  // upload new to cloudinary
  // remove old one
  // update url in database
  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "cover image required");
  }
  const response = await uploadOnCloudinary(coverImageLocalPath);
  const deleteResponse = await deleteFile(req.user.cover_id, {
    resource_type: "image",
  });
  console.log(deleteResponse);
  const user = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        coverImage: response.url,
        cover_id: response.public_id,
      },
    },
    { upsert: true }
  );
  res
    .status(200)
    .json(new ApiResponse(200, user, "cover updated successfully"));
});

export const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  if (!username) {
    throw new ApiError(400, "username is missing");
  }

  const channel = await User.aggregate([
    {
      $match: {
        userName: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "channel",
        // with which field of subscriptions _id matched
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers",
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo",
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        avatar: 1,
        coverImage: 1,
        email: 1,
      },
    },
  ]);

  if (!channel?.length) {
    throw new ApiError(404, "channel does not exists");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, channel[0], "User channel fetched successfully")
    );
});

export const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id),
        // because in pipelining we have to give whole object id
        // in mongoose, it is converted automatically by
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    avatar: 1,
                    userName: 1,
                    fullName: 1,
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
        ],
      },
    },
  ]);
  res
    .status(200)
    .json(
      new ApiResponse(200, user[0].watchHistory, "history fetched successfully")
    );
});
