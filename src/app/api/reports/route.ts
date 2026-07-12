import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { reports, notifications, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const department = searchParams.get("department");
  
  if (department) {
    const list = await db
      .select()
      .from(reports)
      .where(eq(reports.department, department))
      .orderBy(desc(reports.createdAt));
    return NextResponse.json(list);
  }
  
  const all = await db
    .select()
    .from(reports)
    .orderBy(desc(reports.createdAt));
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const [created] = await db.insert(reports).values({
      title: body.title,
      content: body.content,
      department: body.department,
      reportType: body.reportType || "general",
      createdBy: body.createdBy || null,
      createdByName: body.createdByName,
      status: "submitted",
    }).returning();

    // Notify all admins
    const admins = await db.select().from(users).where(eq(users.role, "admin"));
    for (const admin of admins) {
      await db.insert(notifications).values({
        userId: admin.id,
        title: "تقرير جديد",
        message: `تقرير جديد من ${body.department}: ${body.title}`,
        type: "info",
        link: "/reports",
      });
    }

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
    
    const [updated] = await db.update(reports).set({
      status: body.status,
      adminNotes: body.adminNotes,
    }).where(eq(reports.id, body.id)).returning();
    
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
  await db.delete(reports).where(eq(reports.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
