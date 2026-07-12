import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { inventory } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const all = await db.select().from(inventory);
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [created] = await db.insert(inventory).values({
      itemName: body.itemName,
      sku: body.sku,
      category: body.category,
      quantity: body.quantity || 0,
      minQuantity: body.minQuantity || 0,
      unit: body.unit,
      location: body.location,
      costPerUnit: body.costPerUnit,
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
  await db.delete(inventory).where(eq(inventory.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
