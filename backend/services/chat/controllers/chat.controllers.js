import mongoose from "mongoose";

import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

// ===============================
// CREATE CONVERSATION
// ===============================

export const createConversation = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const conversation = await Conversation.create({
      userId,
    });

    return res.status(201).json(conversation);
  } catch (error) {
    console.error("Create conversation error:", error);

    return res.status(500).json({
      message: `Create conversation error: ${error.message}`,
    });
  }
};

// ===============================
// GET USER CONVERSATIONS
// ===============================

export const getConversation = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const conversations = await Conversation.find({
      userId,
    }).sort({
      updatedAt: -1,
    });

    return res.status(200).json(conversations);
  } catch (error) {
    console.error("Get conversations error:", error);

    return res.status(500).json({
      message: `Get conversation error: ${error.message}`,
    });
  }
};

// ===============================
// UPDATE CONVERSATION
// ===============================

export const updateConversation = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { conversationId, title } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (
      !conversationId ||
      !mongoose.Types.ObjectId.isValid(conversationId)
    ) {
      return res.status(400).json({
        message: "A valid conversation ID is required",
      });
    }

    if (
      typeof title !== "string" ||
      !title.trim()
    ) {
      return res.status(400).json({
        message: "A valid title is required",
      });
    }

    const conversation = await Conversation.findOneAndUpdate(
      {
        _id: conversationId,
        userId,
      },
      {
        $set: {
          title: title.trim(),
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    return res.status(200).json(conversation);
  } catch (error) {
    console.error("Update conversation error:", error);

    return res.status(500).json({
      message: `Update conversation error: ${error.message}`,
    });
  }
};

// ===============================
// SAVE MESSAGE
// ===============================

export const saveMessage = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    const {
      conversationId,
      role,
      content,
      images = [],
      artifacts = [],
    } = req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (
      !conversationId ||
      !mongoose.Types.ObjectId.isValid(conversationId)
    ) {
      return res.status(400).json({
        message: "A valid conversation ID is required",
      });
    }

    if (
      typeof content !== "string" ||
      !content.trim()
    ) {
      return res.status(400).json({
        message: "Message content is required",
      });
    }

    if (!["user", "assistant"].includes(role)) {
      return res.status(400).json({
        message: "Message role must be user or assistant",
      });
    }

    /*
     * Ownership check:
     * The message can only be saved when the conversation
     * belongs to the authenticated user.
     */
    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId,
    }).select("_id");

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const message = await Message.create({
      conversationId: conversation._id,
      content: content.trim(),
      role,
      images: Array.isArray(images) ? images : [],
      artifacts: Array.isArray(artifacts) ? artifacts : [],
    });

    // Ensure conversation ordering reflects recent messages
    await Conversation.updateOne(
      {
        _id: conversation._id,
        userId,
      },
      {
        $set: {
          updatedAt: new Date(),
        },
      },
    );

    return res.status(201).json(message);
  } catch (error) {
    console.error("Save message error:", error);

    return res.status(500).json({
      message: `Save message error: ${error.message}`,
    });
  }
};

// ===============================
// GET CONVERSATION MESSAGES
// ===============================

export const getMessages = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { conversationId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (
      !conversationId ||
      !mongoose.Types.ObjectId.isValid(conversationId)
    ) {
      return res.status(400).json({
        message: "A valid conversation ID is required",
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId,
    }).select("_id");

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const messages = await Message.find({
      conversationId: conversation._id,
    }).sort({
      createdAt: 1,
    });

    return res.status(200).json(messages);
  } catch (error) {
    console.error("Get messages error:", error);

    return res.status(500).json({
      message: `Get messages error: ${error.message}`,
    });
  }
};