import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { serverError, validationError } from "@/lib/api";

const noteSchema = z.object({ content: z.string().trim().min(1).max(2000) });

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const { id, noteId } = await params;
    const parsed = noteSchema.safeParse(await req.json());
    if (!parsed.success) return validationError(parsed.error);
    const note = await db.customerNote.updateMany({ where: { id: noteId, customerId: id }, data: parsed.data });
    if (!note.count) return NextResponse.json({ error: "Note not found" }, { status: 404 });
    return NextResponse.json(await db.customerNote.findUnique({ where: { id: noteId } }));
  } catch (error) {
    return serverError(error);
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; noteId: string }> }
) {
  try {
    const { id, noteId } = await params;
    const note = await db.customerNote.deleteMany({ where: { id: noteId, customerId: id } });
    if (!note.count) return NextResponse.json({ error: "Note not found" }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return serverError(error);
  }
}
