import crypto from "crypto";
import { getAuth } from "firebase-admin/auth";

import { app } from "../config/firebase.js";
import User from "../models/user.model.js";
import redis from "../../../shared/redis/redis.js";

const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;

// ===============================
// LOGIN
// ===============================

export const login = async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Firebase token is required",
      });
    }

    const decoded = await getAuth(app).verifyIdToken(token);

    let user = await User.findOne({
      firebaseUid: decoded.uid,
    });

    if (!user) {
      user = await User.create({
        firebaseUid: decoded.uid,
        username: decoded.name || "User",
        email: decoded.email,
        avatar: decoded.picture,
      });
    }

    const sessionId = crypto.randomUUID();

    /*
     * Store only immutable identity in the session.
     * Credits, plans and profile data remain in MongoDB.
     */
    await redis.set(
      `session:${sessionId}`,
      JSON.stringify({
        userId: user._id.toString(),
      }),
      "EX",
      SESSION_DURATION_SECONDS,
    );

    res.cookie("session", sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
      maxAge: SESSION_DURATION_SECONDS * 1000,
    });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      user,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      success: false,
      message: "Login failed",
      error: error.message,
    });
  }
};

// ===============================
// LOGOUT
// ===============================

export const logout = async (req, res) => {
  try {
    const sessionId = req.cookies?.session;

    if (sessionId) {
      await redis.del(`session:${sessionId}`);
    }

    res.clearCookie("session", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.error("Logout error:", error);

    return res.status(500).json({
      success: false,
      message: "Logout failed",
      error: error.message,
    });
  }
};

// ===============================
// GET CURRENT USER FOR GATEWAY
// ===============================

export const getInternalUser = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const user = await User.findById(userId).select(
      "-firebaseUid -__v",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Raw user maintains your existing frontend format.
    return res.status(200).json(user);
  } catch (error) {
    console.error("Get internal user error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to retrieve user",
    });
  }
};

// ===============================
// UPDATE PLAN AND ADD CREDITS
// ===============================

export const updateUserPayment = async (req, res) => {
  try {
    const {
      plan,
      credits,
      userId,
      paymentId,
    } = req.body;

    const creditAmount = Number(credits);

    if (
      !userId ||
      !plan ||
      !paymentId ||
      !Number.isFinite(creditAmount) ||
      creditAmount <= 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Valid userId, plan, paymentId and credits are required",
      });
    }

    const planExpiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000,
    );

    /*
     * Atomic and idempotent:
     * the same paymentId cannot add credits twice.
     */
    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        processedPaymentIds: {
          $ne: paymentId,
        },
      },
      {
        $set: {
          plan,
          planExpiresAt,
        },
        $inc: {
          credits: creditAmount,
          totalCredits: creditAmount,
        },
        $addToSet: {
          processedPaymentIds: paymentId,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!user) {
      const userExists = await User.exists({
        _id: userId,
      });

      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(409).json({
        success: false,
        message: "Payment already applied",
      });
    }

    /*
     * No Redis user or session update is needed.
     * /api/me retrieves current data from MongoDB.
     */
    return res.status(200).json({
      success: true,
      message: "Plan and credits updated successfully",
      user: {
        userId: user._id,
        plan: user.plan,
        credits: user.credits,
        totalCredits: user.totalCredits,
        planExpiresAt: user.planExpiresAt,
      },
    });
  } catch (error) {
    console.error("Update user payment error:", error);

    return res.status(500).json({
      success: false,
      message: "Update user payment error",
      error: error.message,
    });
  }
};

// ===============================
// DEDUCT CREDITS
// ===============================

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

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required",
      });
    }

    if (!Object.hasOwn(COST, agent)) {
      return res.status(400).json({
        success: false,
        message: "Invalid agent type",
      });
    }

    const requiredCredits = COST[agent];

    /*
     * Atomic deduction prevents two simultaneous requests
     * from spending the same credits.
     */
    const user = await User.findOneAndUpdate(
      {
        _id: userId,
        credits: {
          $gte: requiredCredits,
        },
      },
      {
        $inc: {
          credits: -requiredCredits,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!user) {
      const userExists = await User.exists({
        _id: userId,
      });

      if (!userExists) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(400).json({
        success: false,
        message: "Not enough credits",
      });
    }

    /*
     * Do not create user:<userId> or modify session keys.
     * MongoDB is the authoritative source.
     */
    return res.status(200).json({
      success: true,
      credits: user.credits,
    });
  } catch (error) {
    console.error("Deduct credits error:", error);

    return res.status(500).json({
      success: false,
      message: "Deduct credits error",
      error: error.message,
    });
  }
};