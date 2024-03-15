import ApiError from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { User } from "../models/user.model.js";
dotenv.config();

export const verifyJWT = asyncHandler(async (req, res, next) => {
  const { AccessToken } = req.cookies;
  if (!AccessToken) {
    throw new ApiError(401, "Unauthorized user");
  }
  const decodedToken = jwt.verify(
    AccessToken,
    process.env.ACCESS_TOKEN_SECRET_KEY
  );
  if (!decodedToken) {
    throw new ApiError(401, "Invalid Access Token");
  }
  const user = await User.findOne({ _id: decodedToken._id }).select(
    "-password -refreshToken"
  );
  if (!user) {
    throw new ApiError(401, "Invalid Access Token");
  }
  req.user = user;
  return next();
});
