import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function GET() {
  const all = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    department: users.department,
    isActive: users.isActive,
    createdAt: users.createdAt,
  }).from(users);
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const hashed = await hashPassword(body.password || "Ataya@123");
    const [created] = await db.insert(users).values({
      name: body.name,
      email: body.email,
      password: hashed,
      role: body.role || "sales",
      department: body.department,
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
  await db.delete(users).where(eq(users.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
