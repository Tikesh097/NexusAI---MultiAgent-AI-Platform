import { getModel } from "../config/llmModels.js";
import axios from "axios";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { getFromS3 } from "../utils/getFromS3.js";
import { deductCredits } from "../utils/deductCredits.js";
import { checkAgentLimit } from "../config/agentLimit.js";

export const visionAgent = async (state) => {
  try {
    // --------------------------------------------------
    // Check image generation rate limit
    // --------------------------------------------------
    await checkAgentLimit(
      state.userId,
      "image"
    );

    // --------------------------------------------------
    // Get image generation model
    // --------------------------------------------------
    const llm = await getModel("image");

    // --------------------------------------------------
    // Create optimized image prompt
    // --------------------------------------------------
    const res = await llm.invoke(`
You are an elite AI image prompt engineer.

Your task is to transform any user image request into a world-class,
production-ready image generation prompt optimized for the highest possible quality.

Expand the user's request into a rich, detailed, visually compelling prompt
while preserving the original intent.

Always include:

Ultra realistic, photorealistic, hyper detailed, 8K UHD quality,
cinematic lighting, professional photography, HDR, sharp focus,
depth of field, realistic textures, natural skin tones, accurate anatomy,
physically accurate lighting, high dynamic range, premium color grading,
rich contrast, film-quality composition, perfect framing,
balanced composition, realistic shadows, ambient lighting,
global illumination, soft reflections, fine details,
extremely detailed environment, natural perspective,
high-end camera quality, DSLR / Medium Format camera look,
ultra clean image, noise-free, stunning visuals.

Automatically determine:

camera angle, camera distance, lens, subject placement,
background, lighting direction, color harmony, mood and atmosphere.

If a person is mentioned:

preserve identity, facial structure, age, hairstyle,
body proportions, skin tone and expression unless instructed otherwise.

Always return ONLY the final image generation prompt.

User Request:

${state.prompt}
`);

    // --------------------------------------------------
    // Validate generated prompt
    // --------------------------------------------------
    const prompt = String(
      res?.content || ""
    ).trim();

    if (!prompt) {
      throw new Error(
        "Image generation prompt is empty."
      );
    }

    // --------------------------------------------------
    // Generate image
    // --------------------------------------------------
    const imageUrl =
      `https://image.pollinations.ai/prompt/${encodeURIComponent(
        prompt
      )}`;

    console.log(
      "🎨 IMAGE GENERATION STARTED"
    );

    const imageRes = await axios.get(
      imageUrl,
      {
        responseType: "arraybuffer",
        timeout: 120000,
        validateStatus: (status) =>
          status >= 200 && status < 300,
      }
    );

    // --------------------------------------------------
    // Convert image to buffer
    // --------------------------------------------------
    const buffer = Buffer.from(
      imageRes.data
    );

    if (!buffer.length) {
      throw new Error(
        "Generated image is empty."
      );
    }

    // --------------------------------------------------
    // Upload image to S3
    // --------------------------------------------------
    const filename =
      `image-${Date.now()}.png`;

    await uploadToS3(
      filename,
      buffer,
      "image/png"
    );

    console.log(
      "☁️ IMAGE UPLOADED TO S3:",
      filename
    );

    // --------------------------------------------------
    // Generate signed download URL
    // --------------------------------------------------
    const downloadUrl =
      await getFromS3(
        filename,
        24 * 60
      );

    if (!downloadUrl) {
      throw new Error(
        "Failed to generate image download URL."
      );
    }

    console.log(
      "🔗 IMAGE DOWNLOAD URL CREATED"
    );

    // --------------------------------------------------
    // Deduct credits ONLY after successful
    // generation and upload
    // --------------------------------------------------
    const creditResult =
      await deductCredits(
        state.userId,
        "vision"
      );

    if (!creditResult?.success) {
      throw new Error(
        creditResult?.message ||
          "Credit deduction failed"
      );
    }

    console.log(
      "💳 VISION CREDITS REMAINING:",
      creditResult.credits
    );

    // --------------------------------------------------
    // Return response + credits
    // --------------------------------------------------
    return {
      ...state,

      aiResponse: `
### 🖼️ Image Generated Successfully

![Generated Image](${downloadUrl})

[⬇️ Download Image](${downloadUrl})

> 🕒 **Link expires in 24 hours.**
      `.trim(),

      images: [downloadUrl],

      credits:
        creditResult.credits,
    };
  } catch (error) {
    console.error(
      "❌ Vision Agent Error:",
      error
    );

    // --------------------------------------------------
    // Safely extract provider error
    // --------------------------------------------------
    const errorMessage =
      error?.error?.error?.message ||
      error?.error?.message ||
      error?.message ||
      "Something went wrong while generating the image.";

    // --------------------------------------------------
    // Rate limit
    // --------------------------------------------------
    if (error?.status === 429) {
      console.warn(
        "⚠️ VISION RATE LIMIT:",
        errorMessage
      );

      return {
        ...state,

        aiResponse:
          `⚠️ ${errorMessage}`,

        images: [],

        credits:
          state.credits,
      };
    }

    // --------------------------------------------------
    // Other errors
    // --------------------------------------------------
    return {
      ...state,

      aiResponse:
        `❌ Failed to generate image: ${errorMessage}`,

      images: [],

      credits:
        state.credits,
    };
  }
};

export default visionAgent;