import api from "../utils/axios";

const getCurrentUser = async () => {
  try {
    const { data } = await api.get("/api/me");

    return data;
  } catch (error) {
    console.error(
      "Get current user error:",
      error.response?.data || error.message
    );

    throw error;
  }
};

export default getCurrentUser;