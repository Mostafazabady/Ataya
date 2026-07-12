import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, customers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const all = await db
    .select({
      id: invoices.id,
      invoiceNumber: invoices.invoiceNumber,
      orderId: invoices.orderId,
      customerId: invoices.customerId,
      customerName: customers.name,
      amount: invoices.amount,
      tax: invoices.tax,
      totalAmount: invoices.totalAmount,
      status: invoices.status,
      dueDate: invoices.dueDate,
      createdAt: invoices.createdAt,
    })
    .from(invoices)
    .leftJoin(customers, eq(invoices.customerId, customers.id));
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const count = await db.select().from(invoices);
    const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count.length + 1).padStart(3, "0")}`;
    const amount = parseFloat(body.amount) || 0;
    const tax = amount * 0.15;
    const [created] = await db.insert(invoices).values({
      invoiceNumber,
      orderId: body.orderId || null,
      customerId: body.customerId,
      amount: String(amount),
      tax: String(tax),
      totalAmount: String(amount + tax),
      status: body.status || "draft",
      dueDate: body.dueDate || null,
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
  await db.delete(invoices).where(eq(invoices.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
