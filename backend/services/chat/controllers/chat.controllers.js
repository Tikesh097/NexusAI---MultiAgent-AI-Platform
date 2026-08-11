import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";

export const createConversation = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    console.log("userId:", userId);

    const conversation = await Conversation.create({
      userId,
    });

    return res.status(201).json(conversation);
  } catch (error) {
    return res.status(500).json({
      message: `Create conversation error: ${error.message}`,
    });
  }
};

export const getConversation = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];

    console.log("userId:", userId);

    const conversations = await Conversation.find({ userId }).sort({
      updatedAt: -1,
    });

    return res.status(200).json(conversations);
  } catch (error) {
    return res.status(500).json({
      message: `Get conversation error: ${error.message}`,
    });
  }
};

export const updateConversation = async (req, res) => {
  try {
    const { conversationId, title } = req.body;

    console.log("Update request:", {
      conversationId,
      title,
    });

    if (!conversationId) {
      return res.status(400).json({
        message: "Conversation ID is required",
      });
    }

    if (!title) {
      return res.status(400).json({
        message: "Title is required",
      });
    }

    const conversation = await Conversation.findByIdAndUpdate(
      conversationId,
      {
        title: title,
      },
      {
        returnDocument: "after",
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

export const saveMessage = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { conversationId, role, content, images, artifacts } = req.body;

    if (!conversationId || !content) {
      return res.status(400).json({
        message: "Conversation ID and message content are required",
      });
    }

    const message = await Message.create({
      conversationId,
      content,
      role,
      images,
      artifacts
    });

    return res.status(201).json(message);
  } catch (error) {
    return res.status(500).json({
      message: `Save message error: ${error.message}`,
    });
  }
};

export const getMessages = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { conversationId } = req.params;

    const conversation = await Conversation.findOne({
      _id: conversationId,
      userId,
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const messages = await Message.find({
      conversationId,
    });

    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({
      message: `Get messages error: ${error.message}`,
    });
  }
};
