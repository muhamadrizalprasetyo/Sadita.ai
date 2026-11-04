import { createEnv } from "@t3-oss/env-core";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(1),
    BETTER_AUTH_URL: z.string().url(),
    GITHUB_CLIENT_ID: z.string().optional().default(""),
    GITHUB_CLIENT_SECRET: z.string().optional().default(""),
    RESEND_API_KEY: z.string().optional().default(""),
    AWS_ACCESS_KEY_ID: z.string().optional().default(""),
    AWS_SECRET_ACCESS_KEY: z.string().optional().default(""),
    AWS_ENDPOINT_URL_S3: z.string().optional().default(""),
    AWS_ENDPOINT_URL_IAM: z.string().optional().default(""),
    AWS_REGION: z.string().optional().default("us-east-1"),
    ARCJET_KEY: z.string().optional().default(""),
  },

  /**
   * The prefix used by Next.js for client-side environment variables.
   */
  clientPrefix: "NEXT_PUBLIC_", // ✅ FIXED

  client: {
    NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES: z.string().min(1), // now valid
  },

  /**
   * Runtime env variables.
   */
  runtimeEnv: process.env,

  emptyStringAsUndefined: true,
});
