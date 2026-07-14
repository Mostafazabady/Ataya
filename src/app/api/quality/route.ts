import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { qualityChecks, orders, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const all = await db
    .select({
      id: qualityChecks.id,
      orderId: qualityChecks.orderId,
      orderNumber: orders.orderNumber,
      orderTitle: orders.title,
      productionId: qualityChecks.productionId,
      inspectorId: qualityChecks.inspectorId,
      inspectorName: users.name,
      checkDate: qualityChecks.checkDate,
      status: qualityChecks.status,
      criteria: qualityChecks.criteria,
      results: qualityChecks.results,
      notes: qualityChecks.notes,
      createdAt: qualityChecks.createdAt,
    })
    .from(qualityChecks)
    .leftJoin(orders, eq(qualityChecks.orderId, orders.id))
    .leftJoin(users, eq(qualityChecks.inspectorId, users.id))
    .orderBy(desc(qualityChecks.createdAt));
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [created] = await db.insert(qualityChecks).values({
      orderId: body.orderId,
      productionId: body.productionId || null,
      inspectorId: body.inspectorId || null,
      checkDate: body.checkDate || null,
      status: body.status || "pending",
      criteria: body.criteria,
      results: body.results,
      notes: body.notes,
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
    const [updated] = await db.update(qualityChecks).set({
      status: body.status,
      results: body.results,
      notes: body.notes,
    }).where(eq(qualityChecks.id, body.id)).returning();
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
  await db.delete(qualityChecks).where(eq(qualityChecks.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}



