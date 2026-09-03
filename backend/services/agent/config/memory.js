import redis from "../../../shared/redis/redis.js";
import { getMessages } from "../utils/getMessages.js";

const MEMORY_TTL = 24 * 60 * 60;
const MAX_MESSAGES = 20;

const getMemoryKey = (conversationId, userId) => {
  return `messages-${userId}-${conversationId}`;
};

export const getMemory = async (
  conversationId,
  userId
) => {
  if (!conversationId) {
    throw new Error("Conversation ID is required");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  const key = getMemoryKey(conversationId, userId);
  const cached = await redis.get(key);

  if (cached) {
    try {
      const parsedMessages = JSON.parse(cached);

      if (Array.isArray(parsedMessages)) {
        return parsedMessages;
      }
    } catch (error) {
      console.warn(
        "Invalid Redis memory data:",
        error.message
      );

      await redis.del(key);
    }
  }

  const messages = await getMessages(
    conversationId,
    userId
  );

  const normalizedMessages = Array.isArray(messages)
    ? messages.slice(-MAX_MESSAGES)
    : [];

  await redis.set(
    key,
    JSON.stringify(normalizedMessages),
    "EX",
    MEMORY_TTL
  );

  return normalizedMessages;
};

export const addMessage = async (
  conversationId,
  userId,
  role,
  content
) => {
  if (!conversationId) {
    throw new Error("Conversation ID is required");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  if (!["user", "assistant"].includes(role)) {
    throw new Error("Invalid message role");
  }

  if (
    typeof content !== "string" ||
    !content.trim()
  ) {
    throw new Error("Message content is required");
  }

  const normalizedContent = content.trim();
  const key = getMemoryKey(conversationId, userId);
  const rawMessages = await redis.get(key);

  let messages = [];

  if (rawMessages) {
    try {
      const parsedMessages = JSON.parse(rawMessages);

      if (Array.isArray(parsedMessages)) {
        messages = parsedMessages;
      }
    } catch (error) {
      console.warn(
        "Invalid Redis memory data:",
        error.message
      );
    }
  }

  const lastMessage = messages.at(-1);

  const isDuplicate =
    lastMessage?.role === role &&
    typeof lastMessage?.content === "string" &&
    lastMessage.content.trim() === normalizedContent;

  if (!isDuplicate) {
    messages.push({
      role,
      content: normalizedContent,
    });
  }

  messages = messages.slice(-MAX_MESSAGES);

  await redis.set(
    key,
    JSON.stringify(messages),
    "EX",
    MEMORY_TTL
  );

  return messages;
};