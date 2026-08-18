import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      unique: true,
      required: true,
    },

    username: {
      type: String,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    avatar: {
      type: String,
    },

    plan: {
      type: String,
      default: "free",
    },

    credits: {
      type: Number,
      default: 100,
    },

    totalCredits: {
      type: Number,
      default: 100,
    },

    planExpiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

const User = mongoose.model("User", userSchema);

export default User;
