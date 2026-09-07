import { NextRequest, NextResponse } from "next/server";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Receipt file is required" }, { status: 400 });
    }
    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ error: "Only PDF, JPG, PNG, or WebP receipts are supported" }, { status: 400 });
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "Receipt must be 10MB or smaller" }, { status: 400 });
    }

    const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".bin";
    const directory = path.join(process.cwd(), "public", "uploads", "receipts");
    const filename = `${randomUUID()}${extension.toLowerCase()}`;
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, filename), Buffer.from(await file.arrayBuffer()));
    return NextResponse.json({ url: `/uploads/receipts/${filename}` }, { status: 201 });
  } catch (error) {
    console.error("Receipt upload failed", error);
    return NextResponse.json({ error: "Receipt upload failed" }, { status: 500 });
  }
}
