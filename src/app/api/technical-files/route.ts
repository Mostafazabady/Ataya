import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { technicalFiles, users, notifications } from "@/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const all = await db
    .select({
      id: technicalFiles.id,
      orderId: technicalFiles.orderId,
      fileName: technicalFiles.fileName,
      fileSize: technicalFiles.fileSize,
      fileType: technicalFiles.fileType,
      description: technicalFiles.description,
      uploadedBy: technicalFiles.uploadedBy,
      sharedWith: technicalFiles.sharedWith,
      createdAt: technicalFiles.createdAt,
    })
    .from(technicalFiles)
    .orderBy(desc(technicalFiles.createdAt));
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const [created] = await db.insert(technicalFiles).values({
      orderId: body.orderId || null,
      fileName: body.fileName,
      fileSize: body.fileSize,
      fileType: body.fileType,
      fileData: body.fileData,
      description: body.description,
      uploadedBy: body.uploadedBy || null,
      sharedWith: body.sharedWith ? JSON.stringify(body.sharedWith) : null,
    }).returning();

    // Send notifications to shared departments
    if (body.sharedWith && Array.isArray(body.sharedWith) && body.sharedWith.length > 0) {
      for (const dept of body.sharedWith) {
        const deptUsers = await db.select().from(users).where(eq(users.department, dept));
        for (const u of deptUsers) {
          await db.insert(notifications).values({
            userId: u.id,
            title: "ملف جديد من المكتب الفني",
            message: `تم مشاركة ملف "${body.fileName}" معك`,
            type: "file",
            link: `/technical`,
          });
        }
      }
    }

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
  await db.delete(technicalFiles).where(eq(technicalFiles.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
