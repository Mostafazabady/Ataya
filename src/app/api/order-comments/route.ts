import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orderComments } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");
  
  if (orderId) {
    const list = await db
      .select()
      .from(orderComments)
      .where(eq(orderComments.orderId, parseInt(orderId)))
      .orderBy(desc(orderComments.createdAt));
    return NextResponse.json(list);
  }
  
  return NextResponse.json([]);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [created] = await db.insert(orderComments).values({
      orderId: body.orderId,
      userId: body.userId || null,
      userName: body.userName,
      comment: body.comment,
    }).returning();
    return NextResponse.json(created, { status: 201 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await db.delete(orderComments).where(eq(orderComments.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
