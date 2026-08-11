import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config/s3.js";

export const uploadToS3 = async (
  filename,
  buffer,
  contentType
) => {
  try {
    if (!filename) {
      throw new Error("S3 filename is required.");
    }

    if (!buffer) {
      throw new Error("S3 file buffer is required.");
    }

    if (!process.env.AWS_BUCKET_NAME) {
      throw new Error(
        "AWS_BUCKET_NAME is not configured."
      );
    }

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: filename,
      Body: buffer,
      ContentType:
        contentType ||
        "application/octet-stream",
    });

    await s3.send(command);

    console.log(
      `✅ Uploaded to S3: ${filename}`
    );

    return filename;
  } catch (error) {
    console.error(
      "❌ S3 Upload Error:",
      error
    );

    throw error;
  }
};

export default uploadToS3;