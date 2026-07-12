import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { maintenance, machines, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const all = await db
    .select({
      id: maintenance.id,
      machineId: maintenance.machineId,
      machineName: machines.name,
      description: maintenance.description,
      maintenanceType: maintenance.maintenanceType,
      status: maintenance.status,
      scheduledDate: maintenance.scheduledDate,
      completedDate: maintenance.completedDate,
      cost: maintenance.cost,
      performedBy: maintenance.performedBy,
      performedByName: users.name,
      parts: maintenance.parts,
      createdAt: maintenance.createdAt,
    })
    .from(maintenance)
    .leftJoin(machines, eq(maintenance.machineId, machines.id))
    .leftJoin(users, eq(maintenance.performedBy, users.id))
    .orderBy(desc(maintenance.createdAt));
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const [created] = await db.insert(maintenance).values({
      machineId: body.machineId,
      description: body.description,
      maintenanceType: body.maintenanceType,
      status: body.status || "scheduled",
      scheduledDate: body.scheduledDate || null,
      cost: body.cost || null,
      performedBy: body.performedBy || null,
      parts: body.parts,
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
    const updateData: Record<string, unknown> = { status: body.status };
    if (body.status === "completed") {
      updateData.completedDate = new Date().toISOString().split("T")[0];
    }
    if (body.cost) updateData.cost = body.cost;
    const [updated] = await db.update(maintenance).set(updateData).where(eq(maintenance.id, body.id)).returning();
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
  await db.delete(maintenance).where(eq(maintenance.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
