import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const settings = await db.appSettings.findUnique({ where: { id: "default" } });
    if (!settings?.logoUrl) {
      return NextResponse.json({ error: "Logo is not configured" }, { status: 404 });
    }

    const response = await fetch(settings.logoUrl, { cache: "no-store" });
    if (!response.ok) {
      return NextResponse.json({ error: "Logo could not be loaded" }, { status: 404 });
    }

    const contentType = response.headers.get("content-type") || "image/png";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ error: "Configured logo URL is not an image" }, { status: 400 });
    }

    return new NextResponse(await response.arrayBuffer(), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("Failed to load configured logo", error);
    return NextResponse.json({ error: "Logo could not be loaded" }, { status: 404 });
  }
}
