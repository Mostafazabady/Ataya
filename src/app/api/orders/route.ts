import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { orders, customers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const all = await db
    .select({
      id: orders.id,
      orderNumber: orders.orderNumber,
      customerId: orders.customerId,
      customerName: customers.name,
      title: orders.title,
      description: orders.description,
      productType: orders.productType,
      quantity: orders.quantity,
      unitPrice: orders.unitPrice,
      totalPrice: orders.totalPrice,
      status: orders.status,
      priority: orders.priority,
      assignedTo: orders.assignedTo,
      dueDate: orders.dueDate,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
    })
    .from(orders)
    .leftJoin(customers, eq(orders.customerId, customers.id));
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const count = await db.select().from(orders);
    const orderNumber = `ORD-${new Date().getFullYear()}-${String(count.length + 1).padStart(3, "0")}`;
    const totalPrice = (body.quantity || 1) * (parseFloat(body.unitPrice) || 0);
    const [created] = await db.insert(orders).values({
      orderNumber,
      customerId: body.customerId,
      title: body.title,
      description: body.description,
      productType: body.productType,
      quantity: body.quantity || 1,
      unitPrice: body.unitPrice,
      totalPrice: String(totalPrice),
      status: body.status || "new",
      priority: body.priority || "medium",
      assignedTo: body.assignedTo || null,
      dueDate: body.dueDate || null,
      createdBy: body.createdBy || null,
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
    const [updated] = await db.update(orders).set({
      status: body.status,
      priority: body.priority,
      assignedTo: body.assignedTo,
      title: body.title,
      updatedAt: new Date(),
    }).where(eq(orders.id, body.id)).returning();
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
  await db.delete(orders).where(eq(orders.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
