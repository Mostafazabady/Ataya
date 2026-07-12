import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { deliverySchedule, orders } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const all = await db
    .select({
      id: deliverySchedule.id,
      orderId: deliverySchedule.orderId,
      orderNumber: orders.orderNumber,
      orderTitle: orders.title,
      customerName: orders.customerId,
      scheduledDate: deliverySchedule.scheduledDate,
      actualDate: deliverySchedule.actualDate,
      status: deliverySchedule.status,
      address: deliverySchedule.address,
      notes: deliverySchedule.notes,
      createdAt: deliverySchedule.createdAt,
    })
    .from(deliverySchedule)
    .leftJoin(orders, eq(deliverySchedule.orderId, orders.id))
    .orderBy(desc(deliverySchedule.scheduledDate));
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [created] = await db.insert(deliverySchedule).values({
      orderId: body.orderId,
      scheduledDate: body.scheduledDate,
      address: body.address,
      notes: body.notes,
      status: "scheduled",
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
    const [updated] = await db.update(deliverySchedule).set({
      status: body.status,
      actualDate: body.actualDate,
    }).where(eq(deliverySchedule.id, body.id)).returning();
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
  await db.delete(deliverySchedule).where(eq(deliverySchedule.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
