import arcjet, { fixedWindow } from "@/lib/arcjet";
import { env } from "@/lib/env";
import { S3 } from "@/lib/s3Client";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { NextResponse } from "next/server";
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

export async function DELETE(request: Request) {
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
    const key = body.key;

    if (!key) {
      return NextResponse.json(
        { error: "Missing or invalid object key" },
        { status: 400 },
      );
    }

    const command = new DeleteObjectCommand({
      Bucket: env.NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES,
      Key: key,
    });

    await S3.send(command);
    return NextResponse.json(
      {
        message: "File Deleted successfully",
      },
      {
        status: 200,
      },
    );
  } catch {
    return NextResponse.json(
      { error: "Missing or invalid object key" },
      { status: 500 },
    );
  }
}
