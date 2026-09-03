import express from "express";

import {
  deductCredits,
  getInternalUser,
  login,
  logout,
  updateUserPayment,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/login", login);
router.post("/logout", logout);

router.get("/internal/user", getInternalUser);
router.post("/update-plan", updateUserPayment);
router.post("/deduct-credits", deductCredits);

export default router;