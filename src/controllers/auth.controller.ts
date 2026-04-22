import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { RefreshToken, User } from "../db/models";
import { ApiResponse } from "../types/api";
import {
  generateAccessToken,
  generateRefreshToken,
  hashToken,
} from "../utils/tokens";
import { success } from "zod";

const REFRESH_TOKEN_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

export const handleLoginOrSignup = async (
  req: Request,
  res: Response<ApiResponse>,
) => {
  // Handle signup of a new user
  const { email, password } = req.body;

  const existingUser = await User.findOne({ where: { email } });

  if (existingUser) {
    const valid = await bcrypt.compare(password, existingUser.password_hash);

    if (!valid) {
      return res.status(403).json({
        success: false,
        error: {
          code: "INVALID-CREDENTIALS",
          message: "Invalid credentials provided for existing user.",
        },
      });
    }

    // Login user if password is valid
    const accessToken = generateAccessToken({
      id: existingUser.id,
      role: existingUser.role,
    });

    const refreshToken = generateRefreshToken();

    await RefreshToken.create({
      user_id: existingUser.id,
      token_hash: hashToken(refreshToken),
      expires_at: new Date(Date.now() + REFRESH_TOKEN_EXPIRY),
    });

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: REFRESH_TOKEN_EXPIRY,
    });

    return res.status(200).json({
      success: true,
      data: {
        user: { id: existingUser.id },
        access_token: accessToken,
      },
    });
  }

  // If not an existing user, create one with JWT Token
  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = await User.create({ email, password_hash: hashedPassword });

  // Generate access token and sign with id and role
  const accessToken = generateAccessToken({
    id: newUser.id,
    role: newUser.role,
  });
  // Generate refresh token
  const refreshToken = generateRefreshToken();

  // Create an entry in refresh token table
  await RefreshToken.create({
    user_id: newUser.id,
    token_hash: hashToken(refreshToken),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false, // true in production (HTTPS)
    sameSite: "lax",
    maxAge: REFRESH_TOKEN_EXPIRY,
  });

  return res.status(201).json({
    success: true,
    data: {
      user: { id: newUser.id },
      access_token: accessToken,
    },
  });
};

export const handleRefresh = async (
  req: Request,
  res: Response<ApiResponse>,
) => {
  // Get refresh token from cookies
  const refreshToken = req.cookies?.refreshToken;

  const hashed = hashToken(refreshToken);

  // Find token
  const token = await RefreshToken.findOne({
    where: { token_hash: hashed, is_revoked: false },
    include: [{ model: User, as: "user" }],
  });

  // If not token, then return error
  if (!token) {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID-TOKEN",
        message: "Invalid Refresh Token",
      },
    });
  }

  if (new Date() > token?.expires_at) {
    return res.status(401).json({
      success: false,
      error: {
        code: "EXPIRED_TOKEN",
        message: "Referesh Token Expired",
      },
    });
  }

  const accessToken = generateAccessToken({
    id: token.user_id,
    role: !!token.user ? token.user.role : "",
  });

  return res.status(200).json({
    success: true,
    data: {
      access_token: accessToken,
    },
  });
};

export const handleLogout = async (
  req: Request,
  res: Response<ApiResponse>,
) => {
  try {
    // Get refresh token from cookies
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(200).json({
        success: true,
        data: { message: "Already logged out" },
      });
    }

    // Revoke the token in database
    const hashed = hashToken(refreshToken);
    await RefreshToken.update(
      { is_revoked: true },
      { where: { token_hash: hashed } },
    );
          
    // Clear cookie
    res.clearCookie("refreshToken", {
      httpOnly: true,
      sameSite: "lax",
      secure: false, // true in production
    });

    return res.status(200).json({
      success: true,
      data: { message: "Logged out successfully" },
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Internal server error" },
    });
  }
};
