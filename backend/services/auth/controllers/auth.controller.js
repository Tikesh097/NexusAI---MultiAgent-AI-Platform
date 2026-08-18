import crypto from "crypto";
import { getAuth } from "firebase-admin/auth";
import { app } from "../config/firebase.js";
import User from "../models/user.model.js";
import { createConnection } from "mongoose";
import redis from "../../../shared/redis/redis.js";

export const login = async (req, res) => {
  try {
    const { token } = req.body;

    const decoded = await getAuth(app).verifyIdToken(token);

    let user = await User.findOne({
      firebaseUid: decoded.uid,
    });

    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid,
        username: decoded.name,
        email: decoded.email,
        avatar: decoded.picture,
      });
    }

    const sessionId = crypto.randomUUID();
    await redis.set(
      `session:${sessionId}`,
      JSON.stringify({
        userId: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        plan: user.plan,
        credits: user.credits,
        totalCredits: user.totalCredits,
        planExpiresAt: user.planExpiresAt,
      }),
      "EX",
      7 * 24 * 60 * 60,
    ); // Set expiration to 7 days

    res.cookie("session", sessionId, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      message: "Login successful",
      user,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
};

export const logout = async (req, res) => {
  try {
    const sessionId = req.cookies?.session;
    await redis.del(`session:${sessionId}`);
    res.clearCookie("session");
    return res.status(200).json({
      message: "Logout successful",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Logout failed",
      error: error.message,
    });
  }
};

export const updateUserPayment = async (req, res) => {
  try {
    const { plan, credits, userId } = req.body;

    if (!userId || !plan || credits === undefined) {
      return res.status(400).json({
        success: false,
        message: "userId, plan and credits are required",
      });
    }

    // Find user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User Not Found",
      });
    }

    // ---------------------------------------
    // UPDATE MONGODB
    // ---------------------------------------

    user.plan = plan;

    user.credits += Number(credits);

    user.totalCredits += Number(credits);

    user.planExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await user.save();

    // ---------------------------------------
    // FIND USER SESSION IN REDIS
    // ---------------------------------------

    const sessionKeys = await redis.keys("session:*");

    for (const key of sessionKeys) {
      const sessionData = await redis.get(key);

      if (!sessionData) continue;

      const session = JSON.parse(sessionData);

      if (String(session.userId) === String(user._id)) {
        // ---------------------------------------
        // UPDATE REDIS SESSION
        // ---------------------------------------

        await redis.set(
          key,
          JSON.stringify({
            userId: user._id,
            username: user.username,
            email: user.email,
            avatar: user.avatar,
            plan: user.plan,
            credits: user.credits,
            totalCredits: user.totalCredits,
            planExpiresAt: user.planExpiresAt,
          }),
          "EX",
          7 * 24 * 60 * 60,
        );

        break;
      }
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified and user updated successfully",
      user: {
        userId: user._id,
        plan: user.plan,
        credits: user.credits,
        totalCredits: user.totalCredits,
        planExpiresAt: user.planExpiresAt,
      },
    });
  } catch (error) {
    console.error("❌ Update User Payment Error:", error);

    return res.status(500).json({
      success: false,
      message: "Update User Payment Error",
      error: error.message,
    });
  }
};

export const deductCredits = async (req, res) => {
  try {
    const { userId, agent } = req.body;

    const COST = {
      chat: 1,
      search: 5,
      coding: 10,
      pdf: 10,
      ppt: 10,
      vision: 5,
    };

    const user = await User.findById(userId);

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User Not Found",
      });
    }

    const requiredCredits = COST[agent] || 1;

    if (user.credits < requiredCredits) {
      return res.status(400).json({
        success: false,
        message: "Not Enough Credits",
      });
    }

    user.credits -= requiredCredits;
    await user.save();

    // Define Redis key
    const key = `user:${userId}`;

    await redis.set(
      key,
      JSON.stringify({
        userId: user._id,
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        plan: user.plan,
        credits: user.credits,
        totalCredits: user.totalCredits,
        planExpiresAt: user.planExpiresAt,
      }),
      "EX",
      7 * 24 * 60 * 60
    );

    return res.status(200).json({
      success: true,
      credits: user.credits,
    });
  } catch (error) {
    console.error("❌ Deducts Credit Error:", error);

    return res.status(500).json({
      success: false,
      message: "Deducts Credit Error",
      error: error.message,
    });
  }
};
