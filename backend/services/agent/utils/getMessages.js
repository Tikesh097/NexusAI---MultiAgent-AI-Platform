import axios from "axios";

export const getMessages = async (
  conversationId,
  userId,
) => {
  if (!conversationId) {
    throw new Error("Conversation ID is required");
  }

  if (!userId) {
    throw new Error("User ID is required");
  }

  try {
    const { data } = await axios.get(
      `${process.env.CHAT_SERVICE}/get-message/${conversationId}`,
      {
        headers: {
          "x-user-id": userId,
          "x-internal-service-secret":
            process.env.AGENT_SERVICE_SECRET,
        },
        timeout: 10000,
      },
    );

    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error(
      "Get messages error:",
      error.response?.data || error.message,
    );

    throw new Error(
      error.response?.data?.message ||
        "Failed to load conversation messages",
    );
  }
};