import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  if (!userId) return NextResponse.json([]);
  
  const list = await db
    .select({
      id: notifications.id,
      userId: notifications.userId,
      title: notifications.title,
      message: notifications.message,
      type: notifications.type,
      link: notifications.link,
      isRead: notifications.isRead,
      createdAt: notifications.createdAt,
    })
    .from(notifications)
    .where(eq(notifications.userId, parseInt(userId)))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
  
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // If sending to department, get all users in that department
    if (body.toDepartment) {
      const deptUsers = await db.select().from(users).where(eq(users.department, body.toDepartment));
      for (const u of deptUsers) {
        await db.insert(notifications).values({
          userId: u.id,
          title: body.title,
          message: body.message,
          type: body.type || "info",
          link: body.link,
        });
      }
      return NextResponse.json({ ok: true, count: deptUsers.length }, { status: 201 });
    }
    
    // Single user notification
    const [created] = await db.insert(notifications).values({
      userId: body.userId,
      title: body.title,
      message: body.message,
      type: body.type || "info",
      link: body.link,
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
    if (body.markAllRead && body.userId) {
      await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.userId, body.userId));
      return NextResponse.json({ ok: true });
    }
    if (body.id) {
      await db.update(notifications)
        .set({ isRead: true })
        .where(eq(notifications.id, body.id));
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await db.delete(notifications).where(eq(notifications.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
