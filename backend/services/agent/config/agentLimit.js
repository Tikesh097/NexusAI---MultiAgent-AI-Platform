import redis from "../../../shared/redis/redis.js";

const Limits = {
  chat: 20,
  coding: 5,
  pdf: 5,
  ppt: 5,
  image: 5,
  search: 5,
};

export const checkAgentLimit = async (userId, agent) => {
  try {
    // --------------------------------------------------
    // Validate agent key
    // --------------------------------------------------
    if (!Limits[agent]) {
      const error = new Error(
        `Unknown agent rate-limit key: ${agent}`
      );

      error.status = 400;
      error.data = {
        success: false,
        message: `Unsupported rate-limit agent: ${agent}`,
      };

      throw error;
    }

    // --------------------------------------------------
    // Validate user
    // --------------------------------------------------
    if (!userId) {
      const error = new Error(
        "User ID is required for rate limiting."
      );

      error.status = 400;

      throw error;
    }

    const max = Limits[agent];

    // --------------------------------------------------
    // Redis key
    // One key per user + agent
    // --------------------------------------------------
    const key = `rate:${userId}:${agent}`;

    // --------------------------------------------------
    // Increment request count
    // --------------------------------------------------
    const count = await redis.incr(key);

    // --------------------------------------------------
    // Start 60-second window only on first request
    // --------------------------------------------------
    if (count === 1) {
      await redis.expire(key, 60);
    }

    // --------------------------------------------------
    // Get remaining TTL
    // --------------------------------------------------
    const ttl = await redis.ttl(key);

    // --------------------------------------------------
    // Rate limit exceeded
    // --------------------------------------------------
    if (count > max) {
      const safeTtl = ttl > 0 ? ttl : 60;

      const minutes = Math.floor(
        safeTtl / 60
      );

      const seconds =
        safeTtl % 60;

      const time =
        minutes > 0
          ? `${minutes}m ${seconds}s`
          : `${seconds}s`;

      const error = new Error(
        `Rate limit exceeded for ${agent}.`
      );

      error.status = 429;

      error.data = {
        success: false,
        agent,
        limit: max,
        remaining: 0,
        remainingTime: safeTtl,
        retryAfter: time,
        message: `You have reached the ${agent} limit (${max} requests/minute). Try again in ${time}.`,
      };

      throw error;
    }

    // --------------------------------------------------
    // Successful request
    // --------------------------------------------------
    return {
      success: true,
      agent,
      limit: max,
      remaining: Math.max(
        0,
        max - count
      ),
      remainingTime:
        ttl > 0 ? ttl : 60,
    };
  } catch (error) {
    console.error(
      `❌ Rate Limit Error for ${agent}:`,
      error.message
    );

    // --------------------------------------------------
    // Preserve intentional rate-limit errors
    // --------------------------------------------------
    if (error?.status === 429) {
      throw error;
    }

    // --------------------------------------------------
    // Preserve validation errors
    // --------------------------------------------------
    if (error?.status === 400) {
      throw error;
    }

    // --------------------------------------------------
    // Redis / server error
    // --------------------------------------------------
    const serverError = new Error(
      "Unable to verify request limit. Please try again later."
    );

    serverError.status = 500;

    serverError.data = {
      success: false,
      message: "Rate limiter service error.",
      error: error?.message,
    };

    throw serverError;
  }
};