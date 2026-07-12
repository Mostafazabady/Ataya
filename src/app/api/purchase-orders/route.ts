import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { purchaseOrders, orders, suppliers } from "@/db/schema";
import { eq, desc, count } from "drizzle-orm";

export async function GET() {
  const all = await db
    .select({
      id: purchaseOrders.id,
      poNumber: purchaseOrders.poNumber,
      orderId: purchaseOrders.orderId,
      orderNumber: orders.orderNumber,
      supplierId: purchaseOrders.supplierId,
      supplierName: suppliers.name,
      items: purchaseOrders.items,
      totalCost: purchaseOrders.totalCost,
      status: purchaseOrders.status,
      createdBy: purchaseOrders.createdBy,
      createdAt: purchaseOrders.createdAt,
    })
    .from(purchaseOrders)
    .leftJoin(orders, eq(purchaseOrders.orderId, orders.id))
    .leftJoin(suppliers, eq(purchaseOrders.supplierId, suppliers.id))
    .orderBy(desc(purchaseOrders.createdAt));
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [countResult] = await db.select({ count: count() }).from(purchaseOrders);
    const poNumber = `PO-${new Date().getFullYear()}-${String(countResult.count + 1).padStart(4, "0")}`;
    
    const [created] = await db.insert(purchaseOrders).values({
      poNumber,
      orderId: body.orderId || null,
      supplierId: body.supplierId || null,
      items: body.items,
      totalCost: body.totalCost,
      status: body.status || "pending",
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
    const [updated] = await db.update(purchaseOrders).set({
      status: body.status,
      items: body.items,
      totalCost: body.totalCost,
    }).where(eq(purchaseOrders.id, body.id)).returning();
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
  await db.delete(purchaseOrders).where(eq(purchaseOrders.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
