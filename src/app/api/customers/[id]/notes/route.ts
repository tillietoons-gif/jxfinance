import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { serverError, validationError } from "@/lib/api";
import { z } from "zod";

const noteSchema = z.object({ content: z.string().trim().min(1).max(2000) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const parsed = noteSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);
    const note = await db.customerNote.create({
      data: { customerId: id, content: parsed.data.content },
    });
    await db.auditLog.create({
      data: {
        customerId: id,
        entity: "CustomerNote",
        entityId: note.id,
        action: "created",
        details: note.content,
      },
    });
    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    return serverError(error);
  }
}
