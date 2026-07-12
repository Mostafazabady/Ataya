import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  numeric,
  boolean,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";

// ─── Enums ───
export const userRoleEnum = pgEnum("user_role", [
  "admin",
  "sales",
  "technical",
  "manufacturing",
  "purchasing",
  "warehouse",
  "production",
]);

export const orderStatusEnum = pgEnum("order_status", [
  "new",
  "technical_review",
  "approved",
  "purchasing",
  "manufacturing",
  "quality_check",
  "ready",
  "delivered",
  "cancelled",
]);

export const approvalStatusEnum = pgEnum("approval_status", [
  "pending",
  "approved",
  "rejected",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in_progress",
  "done",
]);

export const taskPriorityEnum = pgEnum("task_priority", [
  "low",
  "medium",
  "high",
  "urgent",
]);

export const invoiceStatusEnum = pgEnum("invoice_status", [
  "draft",
  "sent",
  "paid",
  "overdue",
  "cancelled",
]);

export const maintenanceStatusEnum = pgEnum("maintenance_status", [
  "scheduled",
  "in_progress",
  "completed",
  "overdue",
]);

export const qualityStatusEnum = pgEnum("quality_status", [
  "pending",
  "passed",
  "failed",
  "rework",
]);

export const notificationTypeEnum = pgEnum("notification_type", [
  "info",
  "success",
  "warning",
  "error",
  "file",
  "order",
  "task",
]);

// ─── Users ───
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  role: userRoleEnum("role").notNull().default("sales"),
  department: varchar("department", { length: 100 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Notifications ───
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message"),
  type: notificationTypeEnum("type").notNull().default("info"),
  link: varchar("link", { length: 500 }),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Customers ───
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  company: varchar("company", { length: 255 }),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Orders ───
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  orderNumber: varchar("order_number", { length: 50 }).notNull().unique(),
  customerId: integer("customer_id").notNull().references(() => customers.id, { onDelete: "cascade" }),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  productType: varchar("product_type", { length: 100 }),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: numeric("unit_price", { precision: 12, scale: 2 }),
  totalPrice: numeric("total_price", { precision: 12, scale: 2 }),
  status: orderStatusEnum("status").notNull().default("new"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  assignedTo: integer("assigned_to").references(() => users.id, { onDelete: "set null" }),
  dueDate: date("due_date"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Technical Files ───
export const technicalFiles = pgTable("technical_files", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileSize: integer("file_size"),
  fileType: varchar("file_type", { length: 100 }),
  fileData: text("file_data").notNull(), // Base64 encoded
  description: text("description"),
  uploadedBy: integer("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  sharedWith: text("shared_with"), // JSON array of department names
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Suppliers ───
export const suppliers = pgTable("suppliers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  address: text("address"),
  category: varchar("category", { length: 100 }),
  rating: integer("rating").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Purchase Orders ───
export const purchaseOrders = pgTable("purchase_orders", {
  id: serial("id").primaryKey(),
  poNumber: varchar("po_number", { length: 50 }).notNull().unique(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
  supplierId: integer("supplier_id").references(() => suppliers.id, { onDelete: "set null" }),
  items: text("items"),
  totalCost: numeric("total_cost", { precision: 12, scale: 2 }),
  status: approvalStatusEnum("status").notNull().default("pending"),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Inventory ───
export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  itemName: varchar("item_name", { length: 255 }).notNull(),
  sku: varchar("sku", { length: 100 }).unique(),
  category: varchar("category", { length: 100 }),
  quantity: integer("quantity").notNull().default(0),
  minQuantity: integer("min_quantity").default(0),
  unit: varchar("unit", { length: 50 }),
  location: varchar("location", { length: 100 }),
  costPerUnit: numeric("cost_per_unit", { precision: 12, scale: 2 }),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Production ───
export const production = pgTable("production", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  machineName: varchar("machine_name", { length: 255 }),
  startDate: date("start_date"),
  endDate: date("end_date"),
  progress: integer("progress").default(0),
  status: orderStatusEnum("status").notNull().default("manufacturing"),
  assignedTo: integer("assigned_to").references(() => users.id, { onDelete: "set null" }),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Quality Checks ───
export const qualityChecks = pgTable("quality_checks", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productionId: integer("production_id").references(() => production.id, { onDelete: "cascade" }),
  inspectorId: integer("inspector_id").references(() => users.id, { onDelete: "set null" }),
  checkDate: date("check_date"),
  status: qualityStatusEnum("status").notNull().default("pending"),
  criteria: text("criteria"),
  results: text("results"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Invoices ───
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: varchar("invoice_number", { length: 50 }).notNull().unique(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
  customerId: integer("customer_id").references(() => customers.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  tax: numeric("tax", { precision: 12, scale: 2 }).default("0"),
  totalAmount: numeric("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  dueDate: date("due_date"),
  paidDate: date("paid_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Machines ───
export const machines = pgTable("machines", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }),
  model: varchar("model", { length: 100 }),
  serialNumber: varchar("serial_number", { length: 100 }),
  status: varchar("status", { length: 50 }).default("active"),
  lastMaintenance: date("last_maintenance"),
  nextMaintenance: date("next_maintenance"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Maintenance ───
export const maintenance = pgTable("maintenance", {
  id: serial("id").primaryKey(),
  machineId: integer("machine_id").notNull().references(() => machines.id, { onDelete: "cascade" }),
  description: text("description"),
  maintenanceType: varchar("maintenance_type", { length: 50 }),
  status: maintenanceStatusEnum("status").notNull().default("scheduled"),
  scheduledDate: date("scheduled_date"),
  completedDate: date("completed_date"),
  cost: numeric("cost", { precision: 12, scale: 2 }),
  performedBy: integer("performed_by").references(() => users.id, { onDelete: "set null" }),
  parts: text("parts"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Approvals ───
export const approvals = pgTable("approvals", {
  id: serial("id").primaryKey(),
  entityType: varchar("entity_type", { length: 50 }).notNull(), // order, purchase_order, etc
  entityId: integer("entity_id").notNull(),
  requestedBy: integer("requested_by").references(() => users.id, { onDelete: "set null" }),
  approvedBy: integer("approved_by").references(() => users.id, { onDelete: "set null" }),
  status: approvalStatusEnum("status").notNull().default("pending"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Activity Log ───
export const activityLog = pgTable("activity_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  userName: varchar("user_name", { length: 255 }),
  action: varchar("action", { length: 255 }).notNull(),
  entity: varchar("entity", { length: 100 }),
  entityId: integer("entity_id"),
  details: text("details"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Messages ───
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  fromUserId: integer("from_user_id").references(() => users.id, { onDelete: "cascade" }),
  toUserId: integer("to_user_id").references(() => users.id, { onDelete: "cascade" }),
  subject: varchar("subject", { length: 255 }),
  body: text("body").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Tasks ───
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
  assignedTo: integer("assigned_to").references(() => users.id, { onDelete: "set null" }),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  status: taskStatusEnum("status").notNull().default("todo"),
  priority: taskPriorityEnum("priority").notNull().default("medium"),
  dueDate: date("due_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Cost Tracking ───
export const costTracking = pgTable("cost_tracking", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
  category: varchar("category", { length: 100 }).notNull(),
  description: text("description"),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Departments ───
export const departments = pgTable("departments", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull().unique(),
  nameEn: varchar("name_en", { length: 100 }),
  description: text("description"),
  managerId: integer("manager_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Reports ───
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  department: varchar("department", { length: 100 }).notNull(),
  reportType: varchar("report_type", { length: 50 }),
  createdBy: integer("created_by").references(() => users.id, { onDelete: "set null" }),
  createdByName: varchar("created_by_name", { length: 255 }),
  status: varchar("status", { length: 50 }).default("submitted"),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Delivery Schedule ───
export const deliverySchedule = pgTable("delivery_schedule", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id, { onDelete: "cascade" }),
  scheduledDate: date("scheduled_date").notNull(),
  actualDate: date("actual_date"),
  status: varchar("status", { length: 50 }).default("scheduled"),
  address: text("address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Order Comments ───
export const orderComments = pgTable("order_comments", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "set null" }),
  userName: varchar("user_name", { length: 255 }),
  comment: text("comment").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
