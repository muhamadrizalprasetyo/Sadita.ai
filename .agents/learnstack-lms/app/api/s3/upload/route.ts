import { env } from "@/lib/env";
import { fileUploadSchema } from "@/schemas/fileUploadSchema";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { S3 } from "@/lib/s3Client";
import arcjet, { fixedWindow } from "@/lib/arcjet";
import { requireAdmin } from "@/app/data/admin/require-admin";

const aj = arcjet
  // .withRule(
  //   detectBot({
  //     mode: "LIVE",
  //     allow: [],
  //   }),
  // )
  .withRule(
    fixedWindow({
      mode: "LIVE",
      window: "1m",
      max: 5,
    }),
  );

export async function POST(request: Request) {
  const session = await requireAdmin();
  try {
    const decission = await aj.protect(request, {
      fingerprint: session?.user.id as string,
    });
    if (decission.isDenied()) {
      return NextResponse.json(
        {
          error: "Melicious request",
        },
        { status: 429 },
      );
    }
    const body = await request.json();
    const validation = fileUploadSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Invalid Request Body",
        },
        { status: 400 },
      );
    }

    const { fileName, contentType, size } = validation.data;
    const uniqueKey = `${uuidv4()}-${fileName}`;
    const command = new PutObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      // Bucket: "learnstack-lms",
      ContentType: contentType,
      ContentLength: size,
      Key: uniqueKey,
    });

    const preSignedUrl = await getSignedUrl(S3, command, {
      expiresIn: 360, // url expires in 6 minutes
    });

    const response = {
      preSignedUrl,
      key: uniqueKey,
    };

    return NextResponse.json(response);
  } catch {
    return NextResponse.json(
      {
        error: "Failed to generate pre-signed url",
      },
      { status: 500 },
    );
  }
}
