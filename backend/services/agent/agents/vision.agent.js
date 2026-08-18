import { getModel } from "../config/llmModels.js";
import axios from "axios";
import { uploadToS3 } from "../utils/uploadToS3.js";
import { getFromS3 } from "../utils/getFromS3.js";
import { deductCredits } from "../utils/deductCredits.js";

export const visionAgent = async (state) => {
  try {
    const llm = await getModel("image");

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

    const prompt = res.content.trim();

    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
      prompt
    )}`;

    const imageRes = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 120000,
      validateStatus: (status) => status >= 200 && status < 300,
    });

    await deductCredits(state.userId,"vision")

    const buffer = Buffer.from(imageRes.data);
    const filename = `${Date.now()}.png`;

    await uploadToS3(filename, buffer, "image/png");

    const downloadUrl = await getFromS3(filename, 24 * 60);

    return {
      ...state,
      aiResponse: `
### 🖼️ Image Generated Successfully

![Generated Image](${downloadUrl})

[⬇️ Download Image](${downloadUrl})

> 🕒 **Link expires in 24 hours.**
      `.trim(),
    };
  } catch (error) {
    console.error("❌ Vision Agent Error:", error);

    return {
      ...state,
      aiResponse: `❌ Failed to generate image: ${error.message}`,
    };
  }
};