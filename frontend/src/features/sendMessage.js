import api from "../utils/axios";

async function sendMessage(payload) {
  try {
    const { data } = await api.post("/api/agent/chat", payload);

    return data;
  } catch (error) {
    const errorData = error.response?.data;

    console.error("❌ Send Message Error:", {
      status: error.response?.status,
      data: errorData,
      message: error.message,
    });

    // Return a predictable error object instead of null
    return {
      success: false,
      error: true,
      message:
        errorData?.message ||
        errorData?.error ||
        error.message ||
        "Failed to send message.",
      answer: "",
      images: [],
      artifacts: [],
    };
  }
}

export default sendMessage;