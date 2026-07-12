import { NextResponse } from "next/server";
import { db } from "@/db";
import { users, departments } from "@/db/schema";
import { hashPassword } from "@/lib/auth";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    // Check if admin exists
    const existing = await db.select().from(users).where(eq(users.email, "admin@ataya.com")).limit(1);
    if (existing.length > 0) {
      return NextResponse.json({ message: "تم التهيئة مسبقاً" });
    }
    
    const hashed = await hashPassword("Admin@123");
    
    // Create admin only
    await db.insert(users).values({
      name: "مدير النظام",
      email: "admin@ataya.com",
      password: hashed,
      role: "admin",
      department: "الإدارة",
    });

    // Create default departments
    const deptList = [
      { name: "الإدارة", nameEn: "Administration" },
      { name: "المبيعات", nameEn: "Sales" },
      { name: "المكتب الفني", nameEn: "Technical Office" },
      { name: "التصنيع", nameEn: "Manufacturing" },
      { name: "المشتريات", nameEn: "Purchasing" },
      { name: "المخازن", nameEn: "Warehouse" },
      { name: "الإنتاج", nameEn: "Production" },
      { name: "الجودة", nameEn: "Quality" },
    ];

    for (const dept of deptList) {
      try {
        await db.insert(departments).values(dept);
      } catch {
        // Ignore if already exists
      }
    }

    return NextResponse.json({ message: "تم تهيئة النظام بنجاح - يمكنك البدء بإضافة البيانات" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Seed error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
