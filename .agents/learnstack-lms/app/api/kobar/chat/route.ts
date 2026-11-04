import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { processKobarChat } from "@/app/services/kobar/kobar-engine";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const query = body.message;

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Pesan wajib diisi" }, { status: 400 });
    }

    const response = await processKobarChat(session.user, query);

    return NextResponse.json(response);
  } catch (error: any) {
    console.error("SI KOBAR Error:", error);
    return NextResponse.json(
      { error: "Gagal memproses pesan KOBAR", details: error.message },
      { status: 500 }
    );
  }
}
