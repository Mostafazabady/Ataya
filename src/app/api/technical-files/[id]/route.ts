import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { technicalFiles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const [file] = await db
    .select()
    .from(technicalFiles)
    .where(eq(technicalFiles.id, parseInt(id)))
    .limit(1);
  
  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  
  return NextResponse.json(file);
}
