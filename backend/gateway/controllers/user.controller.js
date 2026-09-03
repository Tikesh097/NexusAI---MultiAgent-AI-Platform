import axios from "axios";

export const getCurrentUser = async (req, res) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const { data } = await axios.get(
      `${process.env.AUTH_SERVICE}/internal/user`,
      {
        headers: {
          "x-user-id": userId,
        },
        timeout: 10000,
      },
    );

    return res.status(200).json(data);
  } catch (error) {
    console.error(
      "Get current user error:",
      error.response?.data || error.message,
    );

    return res
      .status(error.response?.status || 500)
      .json({
        message:
          error.response?.data?.message ||
          "Get current user error",
      });
  }
};