import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      unique: true,
    },
    username: {
      type: String,
    },
    email: {
      type: String,
    },
    avatar: {
      type: String,
    },
  },
  {
    timestamps: true,
  },
);


const User = mongoose.model("User", userSchema);
export default User;
