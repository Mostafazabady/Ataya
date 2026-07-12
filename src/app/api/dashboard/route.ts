import { NextResponse } from "next/server";
import { db } from "@/db";
import { orders, customers, tasks, production, invoices, inventory } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const [orderCount] = await db.select({ count: count() }).from(orders);
    const [customerCount] = await db.select({ count: count() }).from(customers);
    const [taskCount] = await db.select({ count: count() }).from(tasks);
    const [prodCount] = await db.select({ count: count() }).from(production);
    const [invoiceCount] = await db.select({ count: count() }).from(invoices);
    const [inventoryCount] = await db.select({ count: count() }).from(inventory);

    const newOrders = await db.select({ count: count() }).from(orders).where(eq(orders.status, "new"));
    const activeProduction = await db.select({ count: count() }).from(orders).where(eq(orders.status, "manufacturing"));
    const pendingTasks = await db.select({ count: count() }).from(tasks).where(eq(tasks.status, "todo"));
    const deliveredOrders = await db.select({ count: count() }).from(orders).where(eq(orders.status, "delivered"));

    const revenueResult = await db.select({
      total: sql<string>`COALESCE(SUM(CAST(${orders.totalPrice} AS NUMERIC)), 0)`,
    }).from(orders);

    const ordersByStatus = await db.select({
      status: orders.status,
      count: count(),
    }).from(orders).groupBy(orders.status);

    const lowStockItems = await db.select().from(inventory)
      .where(sql`${inventory.quantity} <= ${inventory.minQuantity}`);

    return NextResponse.json({
      orders: orderCount.count,
      customers: customerCount.count,
      tasks: taskCount.count,
      production: prodCount.count,
      invoices: invoiceCount.count,
      inventory: inventoryCount.count,
      newOrders: newOrders[0].count,
      activeProduction: activeProduction[0].count,
      pendingTasks: pendingTasks[0].count,
      deliveredOrders: deliveredOrders[0].count,
      totalRevenue: revenueResult[0].total,
      ordersByStatus,
      lowStockItems,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
