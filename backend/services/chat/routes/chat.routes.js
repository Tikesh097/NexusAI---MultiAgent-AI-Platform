import express from "express";
import {
  createConversation,
  getConversation,
  getMessages,
  saveMessage,
  updateConversation,
} from "../controllers/chat.controllers.js";

const router = express.Router();

router.get("/create-conversation", createConversation);
router.get("/get-conversations", getConversation);
router.post("/save-message", saveMessage);

router.get("/get-message/:conversationId", getMessages);
router.post("/update-conversation", updateConversation);


export default router