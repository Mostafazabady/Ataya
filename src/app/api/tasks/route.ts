import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { tasks } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const all = await db.select().from(tasks);
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [created] = await db.insert(tasks).values({
      title: body.title,
      description: body.description,
      orderId: body.orderId || null,
      assignedTo: body.assignedTo || null,
      createdBy: body.createdBy || null,
      status: body.status || "todo",
      priority: body.priority || "medium",
      dueDate: body.dueDate || null,
    }).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) return NextResponse.json({ error: "ID required" }, { status: 400 });
    const [updated] = await db.update(tasks).set({
      status: body.status,
      title: body.title,
      priority: body.priority,
    }).where(eq(tasks.id, body.id)).returning();
    return NextResponse.json(updated);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await db.delete(tasks).where(eq(tasks.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
