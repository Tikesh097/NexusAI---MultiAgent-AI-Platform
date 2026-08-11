import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { s3 } from "../config/s3.js";

export const getFromS3 = async (
  filename,
  expiresIn = 600
) => {
  try {
    if (!filename) {
      throw new Error("S3 filename is required.");
    }

    if (!process.env.AWS_BUCKET_NAME) {
      throw new Error(
        "AWS_BUCKET_NAME is not configured."
      );
    }

    const command = new GetObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: filename,
    });

    const signedUrl = await getSignedUrl(
      s3,
      command,
      {
        expiresIn,
      }
    );

    return signedUrl;
  } catch (error) {
    console.error(
      "❌ S3 Signed URL Error:",
      error
    );

    throw error;
  }
};