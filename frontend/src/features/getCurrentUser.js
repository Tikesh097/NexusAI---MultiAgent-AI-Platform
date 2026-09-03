// src/features/getCurrentUser.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const getCurrentUser = async () => {
  try {
    const response = await axios.get(`${API_URL}/api/me`, {
      withCredentials: true,
    });

    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      return null;
    }

    console.error("Get current user error:", error);
    throw error;
  }
};

export { getCurrentUser };
export default getCurrentUser;