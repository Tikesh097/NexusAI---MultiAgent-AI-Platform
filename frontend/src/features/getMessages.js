import api from "../utils/axios";

export async function getMessages(id) {
  try {

    const { data } = await api.get(
      `/api/chat/get-message/${id}`
    );

    return data;
  } catch (error) {
    console.error(
      "❌ Failed to fetch messages:",
      error.response?.status,
      error.response?.data || error.message
    );

    return [];
  }
}