"use client";

import { useState, useEffect, useCallback, createContext, useContext, type ReactNode, useRef } from "react";

// ─── Types ───
interface User { id: number; name: string; email: string; role: string; department?: string; isActive?: boolean; }
interface Customer { id: number; name: string; email?: string; phone?: string; company?: string; address?: string; }
interface Order { id: number; orderNumber: string; customerId: number; customerName?: string; title: string; description?: string; productType?: string; quantity: number; unitPrice?: string; totalPrice?: string; status: string; priority: string; assignedTo?: number; dueDate?: string; createdAt: string; }
interface Supplier { id: number; name: string; email?: string; phone?: string; address?: string; category?: string; rating?: number; }
interface InventoryItem { id: number; itemName: string; sku?: string; category?: string; quantity: number; minQuantity?: number; unit?: string; location?: string; costPerUnit?: string; }
interface Task { id: number; title: string; description?: string; orderId?: number; assignedTo?: number; status: string; priority: string; dueDate?: string; }
interface ProductionItem { id: number; orderId: number; orderTitle?: string; orderNumber?: string; machineName?: string; startDate?: string; endDate?: string; progress?: number; status: string; notes?: string; }
interface Machine { id: number; name: string; type?: string; status?: string; model?: string; serialNumber?: string; }
interface Invoice { id: number; invoiceNumber: string; orderId?: number; customerId?: number; customerName?: string; amount: string; tax: string; totalAmount: string; status: string; dueDate?: string; createdAt: string; }
interface Message { id: number; fromUserId?: number; toUserId?: number; subject?: string; body: string; isRead?: boolean; createdAt: string; fromName?: string; }
interface TechnicalFile { id: number; orderId?: number; fileName: string; fileSize?: number; fileType?: string; description?: string; uploadedBy?: number; sharedWith?: string; createdAt: string; }
interface Notification { id: number; userId: number; title: string; message?: string; type: string; link?: string; isRead: boolean; createdAt: string; }
interface QualityCheck { id: number; orderId: number; orderNumber?: string; orderTitle?: string; inspectorId?: number; inspectorName?: string; checkDate?: string; status: string; criteria?: string; results?: string; notes?: string; }
interface PurchaseOrder { id: number; poNumber: string; orderId?: number; orderNumber?: string; supplierId?: number; supplierName?: string; items?: string; totalCost?: string; status: string; createdAt: string; }
interface MaintenanceItem { id: number; machineId: number; machineName?: string; description?: string; maintenanceType?: string; status: string; scheduledDate?: string; completedDate?: string; cost?: string; performedByName?: string; }
interface Report { id: number; title: string; content: string; department: string; reportType?: string; createdBy?: number; createdByName?: string; status: string; adminNotes?: string; createdAt: string; }
interface DeliveryItem { id: number; orderId?: number; orderNumber?: string; orderTitle?: string; scheduledDate: string; actualDate?: string; status: string; address?: string; notes?: string; }
interface DashboardData { orders: number; customers: number; tasks: number; production: number; invoices: number; inventory: number; newOrders: number; activeProduction: number; pendingTasks: number; deliveredOrders: number; totalRevenue: string; ordersByStatus: { status: string; count: number }[]; lowStockItems: InventoryItem[]; }
type Toast = { id: number; message: string; type: "success" | "error" | "info" };

// ─── Role-based page access ───
const rolePageAccess: Record<string, string[]> = {
  admin: ["dashboard", "orders", "customers", "technical", "production", "tasks", "inventory", "purchasing", "suppliers", "machines", "maintenance", "quality", "invoices", "messages", "timeline", "users", "reports", "calendar", "settings"],
  sales: ["orders", "customers", "invoices", "messages", "calendar"],
  technical: ["orders", "technical", "messages", "quality"],
  manufacturing: ["orders", "production", "machines", "maintenance", "messages", "quality"],
  purchasing: ["orders", "purchasing", "suppliers", "inventory", "messages"],
  warehouse: ["inventory", "orders", "messages"],
  production: ["orders", "production", "machines", "tasks", "messages", "quality"],
};

const departmentNames: Record<string, string> = {
  sales: "المبيعات",
  technical: "المكتب الفني",
  manufacturing: "التصنيع",
  purchasing: "المشتريات",
  warehouse: "المخازن",
  production: "الإنتاج",
  admin: "الإدارة",
};

// ─── i18n ───
const translations: Record<string, Record<string, string>> = {
  ar: {
    appName: "عطايا ERP", login: "تسجيل الدخول", email: "البريد الإلكتروني", password: "كلمة المرور",
    dashboard: "لوحة التحكم", orders: "الطلبات", customers: "العملاء", technical: "المكتب الفني",
    manufacturing: "التصنيع", purchasing: "المشتريات", warehouse: "المخازن", production: "الإنتاج",
    tasks: "المهام", invoices: "الفواتير", suppliers: "الموردين", machines: "الماكينات",
    messages: "الرسائل", users: "المستخدمين", settings: "الإعدادات", logout: "تسجيل الخروج",
    add: "إضافة", delete: "حذف", save: "حفظ", cancel: "إلغاء", search: "بحث...",
    name: "الاسم", phone: "الهاتف", company: "الشركة", address: "العنوان",
    status: "الحالة", priority: "الأولوية", quantity: "الكمية", price: "السعر",
    total: "الإجمالي", date: "التاريخ", notes: "ملاحظات", actions: "إجراءات",
    new: "جديد", technical_review: "مراجعة فنية", approved: "معتمد", cancelled: "ملغي",
    ready: "جاهز", delivered: "تم التسليم", todo: "للتنفيذ", in_progress: "قيد التنفيذ",
    done: "مكتمل", low: "منخفض", medium: "متوسط", high: "عالي", urgent: "عاجل",
    totalOrders: "إجمالي الطلبات", totalCustomers: "إجمالي العملاء", pendingTasks: "مهام معلقة",
    totalRevenue: "إجمالي الإيرادات", newOrders: "طلبات جديدة", activeProduction: "إنتاج نشط",
    deliveredOrders: "طلبات مسلمة", lowStock: "مخزون منخفض", kanban: "لوحة كانبان",
    gantt: "مخطط جانت", timeline: "المسار الزمني", approvals: "الموافقات",
    qualityCheck: "فحص الجودة", costTracking: "تتبع التكاليف", darkMode: "الوضع الليلي",
    language: "اللغة", title: "العنوان", description: "الوصف", productType: "نوع المنتج",
    dueDate: "تاريخ التسليم", orderNumber: "رقم الطلب", category: "التصنيف",
    unit: "الوحدة", sku: "رمز المخزون", role: "الدور", department: "القسم",
    admin: "مدير", sales: "مبيعات", subject: "الموضوع", send: "إرسال",
    to: "إلى", from: "من", amount: "المبلغ", tax: "الضريبة", invoiceNumber: "رقم الفاتورة",
    draft: "مسودة", sent: "مرسلة", paid: "مدفوعة", overdue: "متأخرة",
    spherical: "إسفريكل", elastomeric: "إلاستوميرك", progress: "التقدم",
    machine: "الماكينة", rating: "التقييم", welcome: "مرحباً بك في نظام عطايا",
    loginDesc: "نظام إدارة الموارد المتكامل لتصنيع الركائز", type: "النوع",
    location: "الموقع", minQty: "الحد الأدنى", costPerUnit: "تكلفة الوحدة",
    active: "نشط", maintenance: "الصيانة", inactive: "غير نشط",
    manufacturing_status: "تصنيع", quality_check: "فحص جودة",
    uploadFile: "رفع ملف", files: "الملفات", shareWith: "مشاركة مع",
    notifications: "الإشعارات", markAllRead: "تحديد الكل كمقروء", noNotifications: "لا توجد إشعارات",
    quality: "الجودة", purchaseOrders: "أوامر الشراء", maintenanceManagement: "إدارة الصيانة",
    activityLog: "سجل النشاطات", selectDepartments: "اختر الأقسام", fileUploaded: "تم رفع الملف",
    pending: "معلق", passed: "ناجح", failed: "فاشل", rework: "إعادة عمل",
    scheduled: "مجدول", completed: "مكتمل", poNumber: "رقم أمر الشراء",
    items: "العناصر", inspector: "المفتش", checkDate: "تاريخ الفحص",
    criteria: "معايير الفحص", results: "النتائج", noData: "لا توجد بيانات",
    model: "الموديل", serialNumber: "الرقم التسلسلي", maintenanceType: "نوع الصيانة",
    scheduledDate: "تاريخ الجدولة", cost: "التكلفة", parts: "القطع",
    preventive: "وقائية", corrective: "تصحيحية", emergency: "طارئة",
    currency: "ج.م", downloading: "جاري التحميل...", download: "تحميل",
    info: "معلومات", warning: "تحذير", error: "خطأ", success: "نجاح",
    file: "ملف", order: "طلب", task: "مهمة", size: "الحجم",
    reports: "التقارير", writeReport: "كتابة تقرير", reportTitle: "عنوان التقرير",
    reportContent: "محتوى التقرير", reportType: "نوع التقرير", daily: "يومي",
    weekly: "أسبوعي", monthly: "شهري", general: "عام", submitted: "مُرسل",
    reviewed: "تمت المراجعة", adminNotes: "ملاحظات المدير", calendar: "التقويم",
    deliveryCalendar: "تقويم التسليمات", addDelivery: "إضافة موعد تسليم",
    onTime: "في الموعد", delayed: "متأخر", recentActivity: "النشاط الأخير",
    quickStats: "إحصائيات سريعة", rejected: "مرفوض",
  },
  en: {
    appName: "Ataya ERP", login: "Login", email: "Email", password: "Password",
    dashboard: "Dashboard", orders: "Orders", customers: "Customers", technical: "Technical Office",
    manufacturing: "Manufacturing", purchasing: "Purchasing", warehouse: "Warehouse", production: "Production",
    tasks: "Tasks", invoices: "Invoices", suppliers: "Suppliers", machines: "Machines",
    messages: "Messages", users: "Users", settings: "Settings", logout: "Logout",
    add: "Add", delete: "Delete", save: "Save", cancel: "Cancel", search: "Search...",
    name: "Name", phone: "Phone", company: "Company", address: "Address",
    status: "Status", priority: "Priority", quantity: "Quantity", price: "Price",
    total: "Total", date: "Date", notes: "Notes", actions: "Actions",
    new: "New", technical_review: "Technical Review", approved: "Approved", cancelled: "Cancelled",
    ready: "Ready", delivered: "Delivered", todo: "To Do", in_progress: "In Progress",
    done: "Done", low: "Low", medium: "Medium", high: "High", urgent: "Urgent",
    totalOrders: "Total Orders", totalCustomers: "Total Customers", pendingTasks: "Pending Tasks",
    totalRevenue: "Total Revenue", newOrders: "New Orders", activeProduction: "Active Production",
    deliveredOrders: "Delivered Orders", lowStock: "Low Stock", kanban: "Kanban Board",
    gantt: "Gantt Chart", timeline: "Timeline", approvals: "Approvals",
    qualityCheck: "Quality Check", costTracking: "Cost Tracking", darkMode: "Dark Mode",
    language: "Language", title: "Title", description: "Description", productType: "Product Type",
    dueDate: "Due Date", orderNumber: "Order Number", category: "Category",
    unit: "Unit", sku: "SKU", role: "Role", department: "Department",
    admin: "Admin", sales: "Sales", subject: "Subject", send: "Send",
    to: "To", from: "From", amount: "Amount", tax: "Tax", invoiceNumber: "Invoice Number",
    draft: "Draft", sent: "Sent", paid: "Paid", overdue: "Overdue",
    spherical: "Spherical", elastomeric: "Elastomeric", progress: "Progress",
    machine: "Machine", rating: "Rating", welcome: "Welcome to Ataya ERP",
    loginDesc: "Integrated ERP System for Bearing Manufacturing", type: "Type",
    location: "Location", minQty: "Min Qty", costPerUnit: "Cost/Unit",
    active: "Active", maintenance: "Maintenance", inactive: "Inactive",
    manufacturing_status: "Manufacturing", quality_check: "Quality Check",
    uploadFile: "Upload File", files: "Files", shareWith: "Share With",
    notifications: "Notifications", markAllRead: "Mark All Read", noNotifications: "No notifications",
    quality: "Quality", purchaseOrders: "Purchase Orders", maintenanceManagement: "Maintenance",
    activityLog: "Activity Log", selectDepartments: "Select Departments", fileUploaded: "File Uploaded",
    pending: "Pending", passed: "Passed", failed: "Failed", rework: "Rework",
    scheduled: "Scheduled", completed: "Completed", poNumber: "PO Number",
    items: "Items", inspector: "Inspector", checkDate: "Check Date",
    criteria: "Criteria", results: "Results", noData: "No data",
    model: "Model", serialNumber: "Serial Number", maintenanceType: "Maintenance Type",
    scheduledDate: "Scheduled Date", cost: "Cost", parts: "Parts",
    preventive: "Preventive", corrective: "Corrective", emergency: "Emergency",
    currency: "EGP", downloading: "Downloading...", download: "Download",
    info: "Info", warning: "Warning", error: "Error", success: "Success",
    file: "File", order: "Order", task: "Task", size: "Size",
    reports: "Reports", writeReport: "Write Report", reportTitle: "Report Title",
    reportContent: "Report Content", reportType: "Report Type", daily: "Daily",
    weekly: "Weekly", monthly: "Monthly", general: "General", submitted: "Submitted",
    reviewed: "Reviewed", adminNotes: "Admin Notes", calendar: "Calendar",
    deliveryCalendar: "Delivery Calendar", addDelivery: "Add Delivery",
    onTime: "On Time", delayed: "Delayed", recentActivity: "Recent Activity",
    quickStats: "Quick Stats", rejected: "Rejected",
  },
};

// ─── Context ───
interface AppContextType {
  lang: "ar" | "en";
  setLang: (l: "ar" | "en") => void;
  dark: boolean;
  setDark: (d: boolean) => void;
  t: (key: string) => string;
  user: User | null;
  addToast: (msg: string, type?: "success" | "error" | "info") => void;
  logActivity: (action: string, entity?: string, entityId?: number, details?: string) => void;
}
const AppCtx = createContext<AppContextType>({
  lang: "ar", setLang: () => {}, dark: false, setDark: () => {},
  t: (k) => k, user: null, addToast: () => {}, logActivity: () => {},
});
function useApp() { return useContext(AppCtx); }

// ─── Icons ───
function Icon({ name, className = "w-5 h-5" }: { name: string; className?: string }) {
  const paths: Record<string, string> = {
    dashboard: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
    orders: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01",
    customers: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z",
    technical: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    manufacturing: "M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z",
    purchasing: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z",
    warehouse: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
    production: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    tasks: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
    invoices: "M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z",
    suppliers: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4",
    machines: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    messages: "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
    users: "M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z",
    settings: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4",
    logout: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
    search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
    plus: "M12 4v16m8-8H4",
    trash: "M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16",
    moon: "M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z",
    sun: "M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z",
    menu: "M4 6h16M4 12h16M4 18h16",
    x: "M6 18L18 6M6 6l12 12",
    check: "M5 13l4 4L19 7",
    eye: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
    bell: "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
    upload: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12",
    download: "M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4",
    file: "M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z",
    quality: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
    wrench: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z",
    report: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
    calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
    chart: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  };
  const d = paths[name] || paths.dashboard;
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

// ─── Toast Container ───
function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} className={`animate-toast px-6 py-3 rounded-lg shadow-lg text-white text-sm font-medium ${
          t.type === "success" ? "bg-green-500" : t.type === "error" ? "bg-red-500" : "bg-blue-500"
        }`}>
          {t.message}
        </div>
      ))}
    </div>
  );
}

// ─── Notifications Panel ───
function NotificationsPanel({ open, onClose, userId }: { open: boolean; onClose: () => void; userId: number }) {
  const { t } = useApp();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`/api/notifications?userId=${userId}`)
      .then(r => r.json())
      .then(setNotifications)
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => { if (open) load(); }, [open, load]);

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true, userId }),
    });
    load();
  };

  const deleteNotif = async (id: number) => {
    await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    load();
  };

  const typeIcons: Record<string, string> = { info: "💬", success: "✅", warning: "⚠️", error: "❌", file: "📄", order: "📦", task: "✔️" };

  if (!open) return null;

  return (
    <div className="absolute top-full end-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 animate-fadeIn overflow-hidden">
      <div className="p-3 border-b dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-bold text-gray-800 dark:text-white">{t("notifications")}</h3>
        <button onClick={markAllRead} className="text-xs text-blue-500 hover:text-blue-600">{t("markAllRead")}</button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center"><div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full mx-auto" /></div>
        ) : notifications.length === 0 ? (
          <p className="p-6 text-center text-gray-400 dark:text-gray-500">{t("noNotifications")}</p>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className={`p-3 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${!n.isRead ? "bg-blue-50/50 dark:bg-blue-900/20" : ""}`}>
              <div className="flex items-start gap-2">
                <span className="text-lg">{typeIcons[n.type] || "📢"}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-gray-800 dark:text-white">{n.title}</p>
                  {n.message && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{n.message}</p>}
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString("ar-EG")}</p>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteNotif(n.id); }} className="text-gray-400 hover:text-red-500 p-1">
                  <Icon name="x" className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
      <button onClick={onClose} className="w-full p-2 text-center text-sm text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 border-t dark:border-gray-700">{t("cancel")}</button>
    </div>
  );
}

// ─── Report Modal ───
function ReportModal({ open, onClose, department, userId, userName }: { open: boolean; onClose: () => void; department: string; userId?: number; userName?: string }) {
  const { t, addToast } = useApp();
  const [form, setForm] = useState({ title: "", content: "", reportType: "general" });
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!form.title || !form.content) { addToast("الرجاء ملء جميع الحقول", "error"); return; }
    setSubmitting(true);
    await fetch("/api/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, department, createdBy: userId, createdByName: userName }),
    });
    setSubmitting(false);
    setForm({ title: "", content: "", reportType: "general" });
    onClose();
    addToast("تم إرسال التقرير للمدير", "success");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg animate-fadeIn" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">📝 {t("writeReport")} - {department}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="x" /></button>
        </div>
        <div className="p-4 space-y-4">
          <input placeholder={t("reportTitle")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          <select value={form.reportType} onChange={(e) => setForm({ ...form, reportType: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="general">{t("general")}</option>
            <option value="daily">{t("daily")}</option>
            <option value="weekly">{t("weekly")}</option>
            <option value="monthly">{t("monthly")}</option>
          </select>
          <textarea placeholder={t("reportContent")} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={6} />
          <button onClick={submit} disabled={submitting}
            className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">
            {submitting ? "..." : t("send")}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Login Page ───
function LoginPage({ onLogin }: { onLogin: (u: User) => void }) {
  const [email, setEmail] = useState("admin@ataya.com");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    setSeeding(true);
    await fetch("/api/seed", { method: "POST" });
    setSeeding(false);
  };

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Login failed");
      else onLogin(data.user);
    } catch {
      setError("Connection error");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg">
            <span className="text-3xl font-bold text-white">عـ</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">عطايا ERP</h1>
          <p className="text-blue-200 text-sm">نظام إدارة الموارد المتكامل لتصنيع الركائز</p>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-blue-200 text-sm mb-1">البريد الإلكتروني</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-amber-400" />
          </div>
          <div>
            <label className="block text-blue-200 text-sm mb-1">كلمة المرور</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-amber-400"
              onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
          </div>
          {error && <p className="text-red-300 text-sm text-center">{error}</p>}
          <button onClick={handleLogin} disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg font-bold hover:from-amber-600 hover:to-amber-700 transition-all disabled:opacity-50 shadow-lg">
            {loading ? "..." : "تسجيل الدخول"}
          </button>
          <button onClick={handleSeed} disabled={seeding}
            className="w-full py-2 bg-white/10 text-blue-200 rounded-lg text-sm hover:bg-white/20 transition-all disabled:opacity-50">
            {seeding ? "جاري التهيئة..." : "تهيئة النظام (أول مرة)"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal ───
function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto animate-fadeIn`}
        onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icon name="x" /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

// ─── Status Badge ───
function StatusBadge({ status }: { status: string }) {
  const { t } = useApp();
  const colors: Record<string, string> = {
    new: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    technical_review: "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    approved: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    purchasing: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
    manufacturing: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    quality_check: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300",
    ready: "bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300",
    delivered: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
    cancelled: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    todo: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    done: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    low: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    medium: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
    urgent: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    draft: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    sent: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    paid: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    overdue: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    active: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    maintenance: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    inactive: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    passed: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    failed: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    rework: "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
    scheduled: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    completed: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    reviewed: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    rejected: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300"}`}>
      {t(status) || status}
    </span>
  );
}

// ─── Data Table ───
function DataTable({ columns, data, onDelete }: {
  columns: { key: string; label: string; render?: (val: unknown, row: Record<string, unknown>) => ReactNode }[];
  data: Record<string, unknown>[];
  onDelete?: (id: number) => void;
}) {
  const { t } = useApp();
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b dark:border-gray-700">
            {columns.map((col) => (
              <th key={col.key} className="text-start p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">{col.label}</th>
            ))}
            {onDelete && <th className="p-3 text-sm font-semibold text-gray-600 dark:text-gray-300">{t("actions")}</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, i) => (
            <tr key={i} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              {columns.map((col) => (
                <td key={col.key} className="p-3 text-sm text-gray-700 dark:text-gray-200">
                  {col.render ? col.render(row[col.key], row) : String(row[col.key] ?? "-")}
                </td>
              ))}
              {onDelete && (
                <td className="p-3">
                  <button onClick={() => onDelete(row.id as number)} className="text-red-500 hover:text-red-700 p-1.5 rounded-lg">
                    <Icon name="trash" className="w-4 h-4" />
                  </button>
                </td>
              )}
            </tr>
          ))}
          {data.length === 0 && (
            <tr><td colSpan={columns.length + (onDelete ? 1 : 0)} className="p-8 text-center text-gray-400">{t("noData")}</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Stat Card ───
function StatCard({ title, value, icon, color }: { title: string; value: string | number; icon: string; color: string }) {
  return (
    <div className={`rounded-xl p-5 ${color} shadow-md animate-fadeIn`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm opacity-80">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center">
          <Icon name={icon} className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard (Admin Only) ───
function DashboardPage() {
  const { t } = useApp();
  const [data, setData] = useState<DashboardData | null>(null);
  const [recentReports, setRecentReports] = useState<Report[]>([]);
  
  useEffect(() => {
    fetch("/api/dashboard").then(r => r.json()).then(setData);
    fetch("/api/reports").then(r => r.json()).then((r: Report[]) => setRecentReports(r.slice(0, 5)));
  }, []);
  
  if (!data) return <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
  
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t("totalOrders")} value={data.orders} icon="orders" color="bg-gradient-to-br from-blue-500 to-blue-600 text-white" />
        <StatCard title={t("totalCustomers")} value={data.customers} icon="customers" color="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white" />
        <StatCard title={t("pendingTasks")} value={data.pendingTasks} icon="tasks" color="bg-gradient-to-br from-amber-500 to-amber-600 text-white" />
        <StatCard title={t("totalRevenue")} value={`${Number(data.totalRevenue || 0).toLocaleString()} ${t("currency")}`} icon="invoices" color="bg-gradient-to-br from-purple-500 to-purple-600 text-white" />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">{t("orders")} - {t("status")}</h3>
          <div className="space-y-3">
            {data.ordersByStatus.length === 0 ? (
              <p className="text-gray-400 text-center py-4">{t("noData")}</p>
            ) : data.ordersByStatus.map((s) => (
              <div key={s.status} className="flex items-center gap-3">
                <StatusBadge status={s.status} />
                <div className="flex-1 bg-gray-100 dark:bg-gray-700 rounded-full h-6 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-end px-2 text-white text-xs font-bold"
                    style={{ width: `${Math.max((s.count / data.orders) * 100, 15)}%` }}>
                    {s.count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">📝 آخر التقارير</h3>
          {recentReports.length === 0 ? (
            <p className="text-gray-400 text-center py-4">{t("noData")}</p>
          ) : (
            <div className="space-y-2">
              {recentReports.map((r) => (
                <div key={r.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="font-medium text-sm text-gray-800 dark:text-white">{r.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{r.department} • {r.createdByName}</p>
                  <StatusBadge status={r.status} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">{t("lowStock")}</h3>
          {data.lowStockItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">✅ جميع المواد متوفرة</p>
          ) : (
            <div className="space-y-2">
              {data.lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <span className="font-medium text-gray-800 dark:text-white">{item.itemName}</span>
                  <span className="text-red-600 font-bold">{item.quantity} / {item.minQuantity}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
          <h3 className="text-lg font-bold mb-4 text-gray-800 dark:text-white">{t("quickStats")}</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
              <p className="text-2xl font-bold text-blue-600">{data.newOrders}</p>
              <p className="text-xs text-gray-500">{t("newOrders")}</p>
            </div>
            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-center">
              <p className="text-2xl font-bold text-yellow-600">{data.activeProduction}</p>
              <p className="text-xs text-gray-500">{t("activeProduction")}</p>
            </div>
            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
              <p className="text-2xl font-bold text-green-600">{data.deliveredOrders}</p>
              <p className="text-xs text-gray-500">{t("deliveredOrders")}</p>
            </div>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center">
              <p className="text-2xl font-bold text-purple-600">{data.inventory}</p>
              <p className="text-xs text-gray-500">{t("warehouse")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Reports Page (Admin Only) ───
function ReportsPage() {
  const { t, addToast } = useApp();
  const [reports, setReports] = useState<Report[]>([]);
  
  const load = useCallback(() => {
    fetch("/api/reports").then(r => r.json()).then(setReports);
  }, []);
  
  useEffect(() => { load(); }, [load]);
  
  const updateStatus = async (id: number, status: string, adminNotes?: string) => {
    await fetch("/api/reports", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, adminNotes }),
    });
    load();
    addToast("تم تحديث التقرير", "success");
  };
  
  const del = async (id: number) => {
    await fetch(`/api/reports?id=${id}`, { method: "DELETE" });
    load();
    addToast("تم الحذف", "info");
  };
  
  const groupedByDept = reports.reduce((acc, r) => {
    if (!acc[r.department]) acc[r.department] = [];
    acc[r.department].push(r);
    return acc;
  }, {} as Record<string, Report[]>);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">📊 {t("reports")} - تقارير الأقسام</h2>
        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium">
          {reports.length} تقرير
        </span>
      </div>
      
      {Object.keys(groupedByDept).length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
          <Icon name="report" className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400">{t("noData")}</p>
        </div>
      ) : (
        Object.entries(groupedByDept).map(([dept, deptReports]) => (
          <div key={dept} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b dark:border-gray-600">
              <h3 className="font-bold text-gray-800 dark:text-white">📁 {dept}</h3>
            </div>
            <div className="divide-y dark:divide-gray-700">
              {deptReports.map((report) => (
                <div key={report.id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-gray-800 dark:text-white">{report.title}</h4>
                        <StatusBadge status={report.status} />
                        <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-500">{t(report.reportType || "general")}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{report.content}</p>
                      <p className="text-xs text-gray-400 mt-2">✍️ {report.createdByName} • {new Date(report.createdAt).toLocaleString("ar-EG")}</p>
                      {report.adminNotes && (
                        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded text-sm">
                          <strong>ملاحظات المدير:</strong> {report.adminNotes}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ms-4">
                      <select value={report.status} onChange={(e) => updateStatus(report.id, e.target.value)}
                        className="text-xs border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option value="submitted">{t("submitted")}</option>
                        <option value="reviewed">{t("reviewed")}</option>
                        <option value="rejected">{t("rejected")}</option>
                      </select>
                      <button onClick={() => del(report.id)} className="text-red-500 hover:text-red-700 p-1">
                        <Icon name="trash" className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── Calendar Page ───
function CalendarPage() {
  const { t, addToast } = useApp();
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ orderId: "", scheduledDate: "", address: "", notes: "" });
  
  const load = useCallback(() => {
    fetch("/api/delivery-schedule").then(r => r.json()).then(setDeliveries);
    fetch("/api/orders").then(r => r.json()).then(setOrders);
  }, []);
  
  useEffect(() => { load(); }, [load]);
  
  const add = async () => {
    if (!form.orderId || !form.scheduledDate) { addToast("الرجاء ملء الحقول المطلوبة", "error"); return; }
    await fetch("/api/delivery-schedule", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, orderId: parseInt(form.orderId) }),
    });
    setShowAdd(false);
    setForm({ orderId: "", scheduledDate: "", address: "", notes: "" });
    load();
    addToast("تم إضافة موعد التسليم", "success");
  };
  
  const updateStatus = async (id: number, status: string) => {
    await fetch("/api/delivery-schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, actualDate: status === "delivered" ? new Date().toISOString().split("T")[0] : null }),
    });
    load();
  };
  
  const del = async (id: number) => {
    await fetch(`/api/delivery-schedule?id=${id}`, { method: "DELETE" });
    load();
  };
  
  // Group by date
  const grouped = deliveries.reduce((acc, d) => {
    const date = d.scheduledDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(d);
    return acc;
  }, {} as Record<string, DeliveryItem[]>);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Icon name="plus" className="w-4 h-4" /> {t("addDelivery")}
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => (
          <div key={date} className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border-b dark:border-gray-700">
              <h3 className="font-bold text-blue-600 dark:text-blue-400">📅 {new Date(date).toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</h3>
            </div>
            <div className="divide-y dark:divide-gray-700">
              {items.map((d) => (
                <div key={d.id} className="p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-gray-800 dark:text-white">{d.orderTitle || d.orderNumber}</p>
                      {d.address && <p className="text-xs text-gray-500">📍 {d.address}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <select value={d.status} onChange={(e) => updateStatus(d.id, e.target.value)}
                        className="text-xs border rounded px-1 py-0.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                        <option value="scheduled">{t("scheduled")}</option>
                        <option value="delivered">{t("delivered")}</option>
                        <option value="delayed">{t("delayed")}</option>
                      </select>
                      <button onClick={() => del(d.id)} className="text-red-400 hover:text-red-600 p-1">
                        <Icon name="trash" className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      
      {deliveries.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center">
          <Icon name="calendar" className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-400">{t("noData")}</p>
        </div>
      )}
      
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={t("addDelivery")}>
        <div className="space-y-3">
          <select value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">{t("orders")}</option>
            {orders.map(o => <option key={o.id} value={o.id}>{o.orderNumber} - {o.title}</option>)}
          </select>
          <input type="date" value={form.scheduledDate} onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          <input placeholder={t("address")} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          <textarea placeholder={t("notes")} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={2} />
          <button onClick={add} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">{t("save")}</button>
        </div>
      </Modal>
    </div>
  );
}

// ─── Simple Page Components (shortened for space) ───
function OrdersPage() {
  const { t, addToast, logActivity } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ title: "", customerId: "", productType: "spherical", quantity: "1", unitPrice: "", dueDate: "", priority: "medium", description: "" });
  
  const load = useCallback(() => {
    fetch("/api/orders").then(r => r.json()).then(setOrders);
    fetch("/api/customers").then(r => r.json()).then(setCustomers);
  }, []);
  useEffect(() => { load(); }, [load]);

  const addOrder = async () => {
    if (!form.title || !form.customerId) { addToast("الرجاء ملء الحقول المطلوبة", "error"); return; }
    await fetch("/api/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, customerId: parseInt(form.customerId), quantity: parseInt(form.quantity) }),
    });
    setShowAdd(false);
    setForm({ title: "", customerId: "", productType: "spherical", quantity: "1", unitPrice: "", dueDate: "", priority: "medium", description: "" });
    load();
    addToast("تم إضافة الطلب", "success");
    logActivity("إضافة طلب", "orders");
  };

  const del = async (id: number) => {
    await fetch(`/api/orders?id=${id}`, { method: "DELETE" });
    load();
    addToast("تم الحذف", "info");
  };

  const updateStatus = async (id: number, status: string) => {
    await fetch("/api/orders", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Icon name="plus" className="w-4 h-4" /> {t("add")}
        </button>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <DataTable columns={[
          { key: "orderNumber", label: t("orderNumber") },
          { key: "title", label: t("title") },
          { key: "customerName", label: t("customers") },
          { key: "quantity", label: t("quantity") },
          { key: "totalPrice", label: t("total"), render: (v) => v ? `${Number(v).toLocaleString()} ${t("currency")}` : "-" },
          { key: "status", label: t("status"), render: (v, row) => (
            <select value={v as string} onChange={(e) => updateStatus(row.id as number, e.target.value)}
              className="text-xs border rounded px-1 py-0.5 dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              {["new", "technical_review", "approved", "purchasing", "manufacturing", "quality_check", "ready", "delivered", "cancelled"].map(s => <option key={s} value={s}>{t(s)}</option>)}
            </select>
          )},
          { key: "priority", label: t("priority"), render: (v) => <StatusBadge status={v as string} /> },
          { key: "dueDate", label: t("dueDate") },
        ]} data={orders as unknown as Record<string, unknown>[]} onDelete={del} />
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={`${t("add")} ${t("orders")}`}>
        <div className="space-y-3">
          <input placeholder={t("title")} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">{t("customers")}</option>
            {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" placeholder={t("quantity")} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <input type="number" placeholder={t("price")} value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          </div>
          <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          <button onClick={addOrder} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">{t("save")}</button>
        </div>
      </Modal>
    </div>
  );
}

// Create simplified versions of other pages with report button
function createCrudPage(endpoint: string, pageKey: string, columns: { key: string; label: string; render?: (v: unknown, row: Record<string, unknown>) => ReactNode }[], formFields: { key: string; type: string; label: string; options?: { value: string; label: string }[] }[]) {
  return function CrudPage() {
    const { t, addToast, user } = useApp();
    const [list, setList] = useState<Record<string, unknown>[]>([]);
    const [showAdd, setShowAdd] = useState(false);
    const [showReport, setShowReport] = useState(false);
    const [form, setForm] = useState<Record<string, string>>({});
    
    const load = useCallback(() => { fetch(`/api/${endpoint}`).then(r => r.json()).then(setList); }, []);
    useEffect(() => { load(); }, [load]);
    
    const add = async () => {
      await fetch(`/api/${endpoint}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      setShowAdd(false);
      setForm({});
      load();
      addToast("تمت الإضافة بنجاح", "success");
    };
    
    const del = async (id: number) => {
      await fetch(`/api/${endpoint}?id=${id}`, { method: "DELETE" });
      load();
      addToast("تم الحذف", "info");
    };
    
    const dept = departmentNames[user?.role || ""] || user?.department || "";
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between gap-2">
          <button onClick={() => setShowReport(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium">
            <Icon name="report" className="w-4 h-4" /> {t("writeReport")}
          </button>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            <Icon name="plus" className="w-4 h-4" /> {t("add")}
          </button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
          <DataTable columns={columns.map(c => ({ ...c, label: t(c.label) }))} data={list} onDelete={del} />
        </div>
        <Modal open={showAdd} onClose={() => setShowAdd(false)} title={`${t("add")}`}>
          <div className="space-y-3">
            {formFields.map((f) => (
              f.type === "select" ? (
                <select key={f.key} value={form[f.key] || ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
                  <option value="">{t(f.label)}</option>
                  {f.options?.map(o => <option key={o.value} value={o.value}>{t(o.label)}</option>)}
                </select>
              ) : f.type === "textarea" ? (
                <textarea key={f.key} placeholder={t(f.label)} value={form[f.key] || ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={3} />
              ) : (
                <input key={f.key} type={f.type} placeholder={t(f.label)} value={form[f.key] || ""} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              )
            ))}
            <button onClick={add} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">{t("save")}</button>
          </div>
        </Modal>
        <ReportModal open={showReport} onClose={() => setShowReport(false)} department={dept} userId={user?.id} userName={user?.name} />
      </div>
    );
  };
}

// Create page components
const CustomersPage = createCrudPage("customers", "customers", [
  { key: "name", label: "name" }, { key: "email", label: "email" }, { key: "phone", label: "phone" }, { key: "company", label: "company" }
], [
  { key: "name", type: "text", label: "name" }, { key: "email", type: "email", label: "email" }, { key: "phone", type: "text", label: "phone" }, { key: "company", type: "text", label: "company" }, { key: "address", type: "text", label: "address" }
]);

const SuppliersPage = createCrudPage("suppliers", "suppliers", [
  { key: "name", label: "name" }, { key: "email", label: "email" }, { key: "phone", label: "phone" }, { key: "category", label: "category" }
], [
  { key: "name", type: "text", label: "name" }, { key: "email", type: "email", label: "email" }, { key: "phone", type: "text", label: "phone" }, { key: "category", type: "text", label: "category" }
]);

const InventoryPage = createCrudPage("inventory", "warehouse", [
  { key: "itemName", label: "name" }, { key: "sku", label: "sku" }, { key: "category", label: "category" },
  { key: "quantity", label: "quantity", render: (v, row) => <span className={Number(v) <= Number(row.minQuantity || 0) ? "text-red-600 font-bold" : "text-green-600 font-bold"}>{String(v)}</span> },
  { key: "unit", label: "unit" }, { key: "location", label: "location" }
], [
  { key: "itemName", type: "text", label: "name" }, { key: "sku", type: "text", label: "sku" }, { key: "category", type: "text", label: "category" },
  { key: "quantity", type: "number", label: "quantity" }, { key: "minQuantity", type: "number", label: "minQty" }, { key: "unit", type: "text", label: "unit" }, { key: "location", type: "text", label: "location" }
]);

const MachinesPage = createCrudPage("machines", "machines", [
  { key: "name", label: "name" }, { key: "type", label: "type" }, { key: "model", label: "model" },
  { key: "status", label: "status", render: (v) => <StatusBadge status={v as string || ""} /> }
], [
  { key: "name", type: "text", label: "name" }, { key: "type", type: "text", label: "type" }, { key: "model", type: "text", label: "model" },
  { key: "status", type: "select", label: "status", options: [{ value: "active", label: "active" }, { value: "maintenance", label: "maintenance" }, { value: "inactive", label: "inactive" }] }
]);

const TasksPage = createCrudPage("tasks", "tasks", [
  { key: "title", label: "title" }, { key: "description", label: "description" },
  { key: "status", label: "status", render: (v) => <StatusBadge status={v as string || ""} /> },
  { key: "priority", label: "priority", render: (v) => <StatusBadge status={v as string || ""} /> }, { key: "dueDate", label: "dueDate" }
], [
  { key: "title", type: "text", label: "title" }, { key: "description", type: "textarea", label: "description" },
  { key: "priority", type: "select", label: "priority", options: [{ value: "low", label: "low" }, { value: "medium", label: "medium" }, { value: "high", label: "high" }, { value: "urgent", label: "urgent" }] },
  { key: "dueDate", type: "date", label: "dueDate" }
]);

const InvoicesPage = createCrudPage("invoices", "invoices", [
  { key: "invoiceNumber", label: "invoiceNumber" }, { key: "customerName", label: "customers" },
  { key: "totalAmount", label: "total", render: (v) => `${Number(v || 0).toLocaleString()} ج.م` },
  { key: "status", label: "status", render: (v) => <StatusBadge status={v as string || ""} /> }, { key: "dueDate", label: "dueDate" }
], [
  { key: "customerId", type: "number", label: "customers" }, { key: "amount", type: "number", label: "amount" }, { key: "dueDate", type: "date", label: "dueDate" }
]);

// Production, Technical, Quality, Purchasing, Maintenance, Messages, Users, Timeline pages
function ProductionPage() {
  const { t, addToast, user } = useApp();
  const [items, setItems] = useState<ProductionItem[]>([]);
  const [showReport, setShowReport] = useState(false);
  const load = useCallback(() => { fetch("/api/production").then(r => r.json()).then(setItems); }, []);
  useEffect(() => { load(); }, [load]);
  const del = async (id: number) => { await fetch(`/api/production?id=${id}`, { method: "DELETE" }); load(); addToast("تم الحذف", "info"); };
  const updateProgress = async (id: number, progress: number) => {
    await fetch("/api/production", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, progress }) });
    load();
  };
  const dept = departmentNames[user?.role || ""] || "الإنتاج";
  return (
    <div className="space-y-4">
      <div className="flex justify-start">
        <button onClick={() => setShowReport(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium">
          <Icon name="report" className="w-4 h-4" /> {t("writeReport")}
        </button>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <DataTable columns={[
          { key: "orderNumber", label: t("orderNumber") }, { key: "orderTitle", label: t("title") }, { key: "machineName", label: t("machine") },
          { key: "progress", label: t("progress"), render: (v, row) => (
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-600 rounded-full h-4 min-w-[80px]">
                <div className="bg-blue-500 h-full rounded-full" style={{ width: `${v || 0}%` }} />
              </div>
              <span className="text-xs font-bold">{String(v || 0)}%</span>
              <input type="range" min="0" max="100" value={Number(v || 0)} onChange={(e) => updateProgress(row.id as number, parseInt(e.target.value))} className="w-12 h-1" />
            </div>
          )},
          { key: "status", label: t("status"), render: (v) => <StatusBadge status={v as string} /> },
        ]} data={items as unknown as Record<string, unknown>[]} onDelete={del} />
      </div>
      <ReportModal open={showReport} onClose={() => setShowReport(false)} department={dept} userId={user?.id} userName={user?.name} />
    </div>
  );
}

function TechnicalPage() {
  const { t, addToast, user } = useApp();
  const [files, setFiles] = useState<TechnicalFile[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ description: "", sharedWith: [] as string[] });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const departments = ["المبيعات", "التصنيع", "المشتريات", "المخازن", "الإنتاج", "الجودة", "الإدارة"];
  
  const load = useCallback(() => { fetch("/api/technical-files").then(r => r.json()).then(setFiles); }, []);
  useEffect(() => { load(); }, [load]);
  
  const uploadFile = async () => {
    if (!selectedFile) { addToast("اختر ملف", "error"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      await fetch("/api/technical-files", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: selectedFile.name, fileSize: selectedFile.size, fileType: selectedFile.type, fileData: reader.result, description: form.description, uploadedBy: user?.id, sharedWith: form.sharedWith }),
      });
      setShowUpload(false);
      setSelectedFile(null);
      setForm({ description: "", sharedWith: [] });
      load();
      addToast("تم الرفع", "success");
      setUploading(false);
    };
    reader.readAsDataURL(selectedFile);
  };
  
  const downloadFile = async (id: number, fileName: string) => {
    const res = await fetch(`/api/technical-files/${id}`);
    const data = await res.json();
    if (data.fileData) { const link = document.createElement("a"); link.href = data.fileData; link.download = fileName; link.click(); }
  };
  
  const del = async (id: number) => { await fetch(`/api/technical-files?id=${id}`, { method: "DELETE" }); load(); };
  const toggleDept = (d: string) => setForm(p => ({ ...p, sharedWith: p.sharedWith.includes(d) ? p.sharedWith.filter(x => x !== d) : [...p.sharedWith, d] }));
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between gap-2">
        <button onClick={() => setShowReport(true)} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium">
          <Icon name="report" className="w-4 h-4" /> {t("writeReport")}
        </button>
        <button onClick={() => setShowUpload(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          <Icon name="upload" className="w-4 h-4" /> {t("uploadFile")}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file) => (
          <div key={file.id} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Icon name="file" className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 dark:text-white truncate">{file.fileName}</p>
                {file.sharedWith && <div className="flex flex-wrap gap-1 mt-1">{JSON.parse(file.sharedWith).map((d: string) => <span key={d} className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 px-1 rounded">{d}</span>)}</div>}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => downloadFile(file.id, file.fileName)} className="flex-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded text-sm">{t("download")}</button>
              <button onClick={() => del(file.id)} className="px-2 py-1 text-red-500"><Icon name="trash" className="w-4 h-4" /></button>
            </div>
          </div>
        ))}
        {files.length === 0 && <div className="col-span-full text-center py-8 text-gray-400">{t("noData")}</div>}
      </div>
      <Modal open={showUpload} onClose={() => setShowUpload(false)} title={t("uploadFile")} wide>
        <div className="space-y-4">
          <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400">
            <input type="file" ref={fileInputRef} onChange={(e) => setSelectedFile(e.target.files?.[0] || null)} className="hidden" />
            <Icon name="upload" className="w-10 h-10 mx-auto text-gray-400 mb-2" />
            {selectedFile ? <p className="text-blue-600">{selectedFile.name}</p> : <p className="text-gray-500">اختر ملف</p>}
          </div>
          <textarea placeholder={t("description")} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={2} />
          <div>
            <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">{t("shareWith")}:</p>
            <div className="flex flex-wrap gap-2">{departments.map(d => <button key={d} type="button" onClick={() => toggleDept(d)} className={`px-3 py-1 rounded-lg text-sm ${form.sharedWith.includes(d) ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}>{d}</button>)}</div>
          </div>
          <button onClick={uploadFile} disabled={uploading} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50">{uploading ? "..." : t("uploadFile")}</button>
        </div>
      </Modal>
      <ReportModal open={showReport} onClose={() => setShowReport(false)} department="المكتب الفني" userId={user?.id} userName={user?.name} />
    </div>
  );
}

const QualityPage = createCrudPage("quality", "quality", [
  { key: "orderNumber", label: "orderNumber" }, { key: "checkDate", label: "checkDate" },
  { key: "status", label: "status", render: (v) => <StatusBadge status={v as string || ""} /> }, { key: "notes", label: "notes" }
], [
  { key: "orderId", type: "number", label: "orders" }, { key: "checkDate", type: "date", label: "checkDate" }, { key: "criteria", type: "textarea", label: "criteria" }, { key: "notes", type: "textarea", label: "notes" }
]);

const PurchaseOrdersPage = createCrudPage("purchase-orders", "purchasing", [
  { key: "poNumber", label: "poNumber" }, { key: "supplierName", label: "suppliers" },
  { key: "totalCost", label: "total", render: (v) => v ? `${Number(v).toLocaleString()} ج.م` : "-" },
  { key: "status", label: "status", render: (v) => <StatusBadge status={v as string || ""} /> }
], [
  { key: "supplierId", type: "number", label: "suppliers" }, { key: "items", type: "textarea", label: "items" }, { key: "totalCost", type: "number", label: "total" }
]);

const MaintenancePage = createCrudPage("maintenance", "maintenance", [
  { key: "machineName", label: "machine" }, { key: "maintenanceType", label: "maintenanceType" }, { key: "scheduledDate", label: "scheduledDate" },
  { key: "status", label: "status", render: (v) => <StatusBadge status={v as string || ""} /> }
], [
  { key: "machineId", type: "number", label: "machine" }, { key: "maintenanceType", type: "select", label: "maintenanceType", options: [{ value: "preventive", label: "preventive" }, { value: "corrective", label: "corrective" }, { value: "emergency", label: "emergency" }] },
  { key: "description", type: "textarea", label: "description" }, { key: "scheduledDate", type: "date", label: "scheduledDate" }, { key: "cost", type: "number", label: "cost" }
]);

function MessagesPage() {
  const { t, user, addToast } = useApp();
  const [list, setList] = useState<Message[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ toUserId: "", subject: "", body: "" });
  const load = useCallback(() => {
    if (user) fetch(`/api/messages?userId=${user.id}`).then(r => r.json()).then(setList);
    fetch("/api/users").then(r => r.json()).then(setUsers);
  }, [user]);
  useEffect(() => { load(); }, [load]);
  const send = async () => {
    await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, fromUserId: user?.id, toUserId: parseInt(form.toUserId) }) });
    setShowAdd(false); setForm({ toUserId: "", subject: "", body: "" }); load(); addToast("تم الإرسال", "success");
  };
  const del = async (id: number) => { await fetch(`/api/messages?id=${id}`, { method: "DELETE" }); load(); };
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"><Icon name="plus" className="w-4 h-4" /> {t("send")}</button></div>
      <div className="space-y-3">
        {list.map((msg) => (
          <div key={msg.id} className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border-r-4 ${msg.isRead ? "border-gray-200" : "border-blue-500"}`}>
            <div className="flex justify-between"><div><p className="font-bold text-gray-800 dark:text-white">{msg.subject || "(بدون عنوان)"}</p><p className="text-sm text-gray-500">{t("from")}: {msg.fromName}</p><p className="text-sm mt-2 text-gray-700 dark:text-gray-300">{msg.body}</p></div><button onClick={() => del(msg.id)} className="text-red-400"><Icon name="trash" className="w-4 h-4" /></button></div>
          </div>
        ))}
        {list.length === 0 && <p className="text-center text-gray-400 py-8">{t("noData")}</p>}
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={t("send")}>
        <div className="space-y-3">
          <select value={form.toUserId} onChange={(e) => setForm({ ...form, toUserId: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">{t("to")}</option>
            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
          <input placeholder={t("subject")} value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          <textarea placeholder="..." value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={4} />
          <button onClick={send} className="w-full py-2 bg-blue-600 text-white rounded-lg">{t("send")}</button>
        </div>
      </Modal>
    </div>
  );
}

function UsersPage() {
  const { t, addToast } = useApp();
  const [list, setList] = useState<User[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "Ataya@123", role: "sales", department: "" });
  const load = useCallback(() => { fetch("/api/users").then(r => r.json()).then(setList); }, []);
  useEffect(() => { load(); }, [load]);
  const add = async () => {
    await fetch("/api/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setShowAdd(false); setForm({ name: "", email: "", password: "Ataya@123", role: "sales", department: "" }); load(); addToast("تمت الإضافة", "success");
  };
  const del = async (id: number) => { await fetch(`/api/users?id=${id}`, { method: "DELETE" }); load(); };
  const roles = ["admin", "sales", "technical", "manufacturing", "purchasing", "warehouse", "production"];
  const depts = ["الإدارة", "المبيعات", "المكتب الفني", "التصنيع", "المشتريات", "المخازن", "الإنتاج", "الجودة"];
  return (
    <div className="space-y-4">
      <div className="flex justify-end"><button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium"><Icon name="plus" className="w-4 h-4" /> {t("add")}</button></div>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden">
        <DataTable columns={[
          { key: "name", label: t("name") }, { key: "email", label: t("email") },
          { key: "role", label: t("role"), render: (v) => <StatusBadge status={v as string || ""} /> },
          { key: "department", label: t("department") },
          { key: "isActive", label: t("status"), render: (v) => v ? "✅" : "❌" }
        ]} data={list as unknown as Record<string, unknown>[]} onDelete={del} />
      </div>
      <Modal open={showAdd} onClose={() => setShowAdd(false)} title={`${t("add")} ${t("users")}`}>
        <div className="space-y-3">
          <input placeholder={t("name")} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          <input placeholder={t("email")} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          <input placeholder={t("password")} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
          <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            {roles.map(r => <option key={r} value={r}>{t(r)}</option>)}
          </select>
          <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
            <option value="">{t("department")}</option>
            {depts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
          <button onClick={add} className="w-full py-2 bg-blue-600 text-white rounded-lg">{t("save")}</button>
        </div>
      </Modal>
    </div>
  );
}

function TimelinePage() {
  const { t } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  useEffect(() => { fetch("/api/orders").then(r => r.json()).then(setOrders); }, []);
  const statusFlow = [
    { key: "new", icon: "📋", color: "bg-blue-500" }, { key: "technical_review", icon: "📐", color: "bg-purple-500" },
    { key: "approved", icon: "✅", color: "bg-green-500" }, { key: "purchasing", icon: "🛒", color: "bg-orange-500" },
    { key: "manufacturing", icon: "🏭", color: "bg-yellow-500" }, { key: "quality_check", icon: "🔍", color: "bg-indigo-500" },
    { key: "ready", icon: "📦", color: "bg-teal-500" }, { key: "delivered", icon: "🚚", color: "bg-emerald-500" },
  ];
  const getIdx = (status: string) => statusFlow.findIndex(s => s.key === status);
  return (
    <div className="space-y-6">
      {orders.map((order) => {
        const idx = getIdx(order.status);
        return (
          <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div><h3 className="font-bold text-gray-800 dark:text-white">{order.title}</h3><p className="text-sm text-gray-500">{order.orderNumber}</p></div>
              <StatusBadge status={order.priority} />
            </div>
            <div className="flex items-center gap-1 overflow-x-auto">
              {statusFlow.map((step, i) => (
                <div key={step.key} className="flex items-center">
                  <div className={`flex flex-col items-center min-w-[70px] ${i <= idx ? "" : "opacity-30"}`}>
                    <div className={`w-8 h-8 rounded-full ${i <= idx ? step.color : "bg-gray-300"} flex items-center justify-center text-sm`}>{step.icon}</div>
                    <p className="text-xs mt-1 text-gray-700 dark:text-gray-300">{t(step.key)}</p>
                  </div>
                  {i < statusFlow.length - 1 && <div className={`h-0.5 w-6 ${i < idx ? "bg-green-500" : "bg-gray-300"}`} />}
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {orders.length === 0 && <p className="text-center text-gray-400 py-8">{t("noData")}</p>}
    </div>
  );
}

function SettingsPage() {
  const { t, dark, setDark, lang, setLang } = useApp();
  return (
    <div className="max-w-md mx-auto space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-md">
        <h3 className="font-bold text-gray-800 dark:text-white mb-4">{t("settings")}</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">{t("darkMode")}</span>
            <button onClick={() => setDark(!dark)} className={`w-12 h-6 rounded-full ${dark ? "bg-blue-600" : "bg-gray-300"} relative`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${dark ? "right-0.5" : "left-0.5"}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-700 dark:text-gray-300">{t("language")}</span>
            <select value={lang} onChange={(e) => setLang(e.target.value as "ar" | "en")} className="px-3 py-1 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white">
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main App ───
type Page = "dashboard" | "orders" | "customers" | "technical" | "production" | "tasks" | "inventory" | "purchasing" | "suppliers" | "machines" | "maintenance" | "quality" | "invoices" | "messages" | "users" | "timeline" | "reports" | "calendar" | "settings";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState<"ar" | "en">("ar");
  const [page, setPage] = useState<Page>("orders");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [search, setSearch] = useState("");
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const t = useCallback((key: string) => translations[lang]?.[key] || key, [lang]);
  const addToast = useCallback((message: string, type: "success" | "error" | "info" = "info") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);
  const logActivity = useCallback(async (action: string, entity?: string, entityId?: number, details?: string) => {
    if (!user) return;
    await fetch("/api/activity", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: user.id, userName: user.name, action, entity, entityId, details }) });
  }, [user]);

  const loadNotificationCount = useCallback(() => {
    if (!user) return;
    fetch(`/api/notifications?userId=${user.id}`).then(r => r.json()).then((data: Notification[]) => setUnreadCount(data.filter(n => !n.isRead).length));
  }, [user]);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(data => { if (data.user) setUser(data.user); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  useEffect(() => { if (user) { loadNotificationCount(); const interval = setInterval(loadNotificationCount, 30000); return () => clearInterval(interval); } }, [user, loadNotificationCount]);
  useEffect(() => { document.documentElement.dir = lang === "ar" ? "rtl" : "ltr"; document.documentElement.lang = lang; }, [lang]);
  useEffect(() => { if (dark) document.documentElement.classList.add("dark"); else document.documentElement.classList.remove("dark"); }, [dark]);

  // Set default page based on role
  useEffect(() => {
    if (user) {
      const allowed = rolePageAccess[user.role] || ["orders"];
      if (user.role === "admin") setPage("dashboard");
      else setPage(allowed[0] as Page);
    }
  }, [user]);

  const handleLogout = async () => { await fetch("/api/auth/logout", { method: "POST" }); setUser(null); };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
  if (!user) return <LoginPage onLogin={setUser} />;

  const allowedPages = rolePageAccess[user.role] || ["orders"];
  const menuItems: { key: Page; icon: string }[] = [
    { key: "dashboard", icon: "dashboard" }, { key: "orders", icon: "orders" }, { key: "customers", icon: "customers" },
    { key: "technical", icon: "technical" }, { key: "production", icon: "production" }, { key: "tasks", icon: "tasks" },
    { key: "inventory", icon: "warehouse" }, { key: "purchasing", icon: "purchasing" }, { key: "suppliers", icon: "suppliers" },
    { key: "machines", icon: "machines" }, { key: "maintenance", icon: "wrench" }, { key: "quality", icon: "quality" },
    { key: "invoices", icon: "invoices" }, { key: "messages", icon: "messages" }, { key: "timeline", icon: "eye" },
    { key: "users", icon: "users" }, { key: "reports", icon: "report" }, { key: "calendar", icon: "calendar" },
    { key: "settings", icon: "settings" },
  ].filter(item => allowedPages.includes(item.key)) as { key: Page; icon: string }[];

  const filteredMenu = menuItems.filter(item => !search || t(item.key).toLowerCase().includes(search.toLowerCase()));

  const renderPage = () => {
    switch (page) {
      case "dashboard": return <DashboardPage />;
      case "orders": return <OrdersPage />;
      case "customers": return <CustomersPage />;
      case "technical": return <TechnicalPage />;
      case "production": return <ProductionPage />;
      case "tasks": return <TasksPage />;
      case "inventory": return <InventoryPage />;
      case "purchasing": return <PurchaseOrdersPage />;
      case "suppliers": return <SuppliersPage />;
      case "machines": return <MachinesPage />;
      case "maintenance": return <MaintenancePage />;
      case "quality": return <QualityPage />;
      case "invoices": return <InvoicesPage />;
      case "messages": return <MessagesPage />;
      case "users": return <UsersPage />;
      case "timeline": return <TimelinePage />;
      case "reports": return <ReportsPage />;
      case "calendar": return <CalendarPage />;
      case "settings": return <SettingsPage />;
      default: return <OrdersPage />;
    }
  };

  return (
    <AppCtx.Provider value={{ lang, setLang, dark, setDark, t, user, addToast, logActivity }}>
      <div className={`min-h-screen flex ${dark ? "bg-gray-900" : "bg-gray-50"}`}>
        <ToastContainer toasts={toasts} />
        <aside className={`${sidebarOpen ? "w-64" : "w-16"} transition-all duration-300 ${dark ? "bg-gray-800" : "bg-white"} border-e border-gray-200 dark:border-gray-700 flex flex-col shadow-lg fixed h-full z-40`}>
          <div className="p-4 flex items-center gap-3 border-b border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0"><span className="text-lg font-bold text-white">عـ</span></div>
            {sidebarOpen && <div><h1 className="font-bold text-lg text-gray-800 dark:text-white">عطايا</h1><p className="text-xs text-gray-500">ERP System</p></div>}
          </div>
          <nav className="flex-1 p-2 overflow-y-auto">
            {filteredMenu.map((item) => (
              <button key={item.key} onClick={() => setPage(item.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all text-sm ${page === item.key ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 font-medium" : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50"}`}>
                <Icon name={item.icon} className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && <span>{t(item.key)}</span>}
              </button>
            ))}
          </nav>
          <div className="p-3 border-t border-gray-200 dark:border-gray-700">
            {sidebarOpen && <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">{user.name.charAt(0)}</div><div><p className="text-sm font-medium text-gray-800 dark:text-white truncate">{user.name}</p><p className="text-xs text-gray-500">{t(user.role)}</p></div></div>}
            <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm"><Icon name="logout" className="w-5 h-5" />{sidebarOpen && <span>{t("logout")}</span>}</button>
          </div>
        </aside>
        <main className={`flex-1 ${sidebarOpen ? "ms-64" : "ms-16"} transition-all duration-300`}>
          <header className={`sticky top-0 z-30 ${dark ? "bg-gray-800/90" : "bg-white/90"} backdrop-blur-lg border-b border-gray-200 dark:border-gray-700 px-6 py-3`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"><Icon name="menu" className="w-5 h-5" /></button>
                <h2 className="text-lg font-bold text-gray-800 dark:text-white">{t(page)}</h2>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative"><Icon name="search" className="w-4 h-4 absolute start-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="text" placeholder={t("search")} value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 pe-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm w-48 text-gray-800 dark:text-white placeholder-gray-400" /></div>
                <div className="relative">
                  <button onClick={() => { setShowNotifications(!showNotifications); loadNotificationCount(); }} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg relative text-gray-600 dark:text-gray-300">
                    <Icon name="bell" className="w-5 h-5" />
                    {unreadCount > 0 && <span className="absolute -top-0.5 -end-0.5 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">{unreadCount > 9 ? "9+" : unreadCount}</span>}
                  </button>
                  <NotificationsPanel open={showNotifications} onClose={() => setShowNotifications(false)} userId={user.id} />
                </div>
                <button onClick={() => setDark(!dark)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-600 dark:text-gray-300"><Icon name={dark ? "sun" : "moon"} className="w-5 h-5" /></button>
                <button onClick={() => setLang(lang === "ar" ? "en" : "ar")} className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300">{lang === "ar" ? "EN" : "عربي"}</button>
              </div>
            </div>
          </header>
          <div className="p-6">{renderPage()}</div>
        </main>
      </div>
    </AppCtx.Provider>
  );
}
