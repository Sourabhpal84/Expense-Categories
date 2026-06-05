export type ExpenseCategory =
  | "Ingredients"
  | "Packaging"
  | "Delivery"
  | "Marketing"
  | "Salary"
  | "Rent"
  | "Utilities"
  | "Software"
  | "Vehicle Maintenance"
  | "Payment Gateway"
  | "Payment Gateway Charges"
  | "Misc";

export const expenseCategories: ExpenseCategory[] = [
  "Ingredients",
  "Packaging",
  "Delivery",
  "Marketing",
  "Salary",
  "Rent",
  "Utilities",
  "Software",
  "Vehicle Maintenance",
  "Payment Gateway",
  "Payment Gateway Charges",
  "Misc"
];

export type Expense = {
  id: string;
  userId: string;
  vendor: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  notes?: string;
  receiptUrl?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
};

export type Revenue = {
  id: string;
  userId: string;
  product: string;
  orders: number;
  amount: number;
  date: string;
  channel: "Store" | "WhatsApp" | "Marketplace" | "Website" | "Other";
  createdAt: string;
  source?: "manual" | "website";
  paymentStatus?: string;
  paymentMethod?: string;
  orderStatus?: string;
  phone?: string;
  revenueState?: "net" | "pending" | "refunded" | "lost";
  notes?: string;
  updatedAt?: string;
  createdBy?: string;
  updatedBy?: string;
};

export type InventoryItem = {
  id: string;
  userId: string;
  name: string;
  quantity: number;
  unit: string;
  lowStockThreshold: number;
  restockStatus: "Healthy" | "Watch" | "Restock";
  updatedAt: string;
  unitCost?: number;
  supplier?: string;
  lastStockAction?: "Stock In" | "Stock Out" | "Adjustment";
  purchaseHistory?: Array<{ date: string; quantity: number; unitCost?: number; supplier?: string }>;
};

export type Budget = {
  id: string;
  userId: string;
  category: ExpenseCategory;
  month: string;
  limit: number;
  spent: number;
};

export type BusinessProfile = {
  userId: string;
  ownerName: string;
  businessName: string;
  currency: string;
  theme: "dark" | "light";
};

export type AiInsight = {
  summary: string;
  warnings: string[];
  opportunities: string[];
  healthScore: number;
};

export type ReceiptExtraction = {
  amount?: number;
  vendor?: string;
  date?: string;
  category?: ExpenseCategory;
  rawText?: string;
};

export type CustomerProfile = {
  id: string;
  name: string;
  phone: string;
  totalOrders: number;
  deliveredOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
  feedbackCount: number;
  averageRating: number;
  lifetimeValue: number;
};

export type FeedbackRecord = {
  id: string;
  customerName?: string;
  phone?: string;
  orderId?: string;
  orderNumber?: string;
  rating?: number;
  message?: string;
  comment?: string;
  sentiment?: "positive" | "neutral" | "negative" | string;
  feedbackType?: "order_feedback" | "general_feedback";
  createdAt?: { toDate?: () => Date } | string;
  highPriority?: boolean;
  ai?: { sentiment?: string; highPriority?: boolean; recommendedAction?: string };
};

export type NotificationItem = {
  id: string;
  type: "low_stock" | "new_order" | "new_feedback" | "budget_exceeded" | "revenue_milestone";
  title: string;
  detail: string;
  severity: "info" | "warning" | "critical" | "success";
  createdAt: string;
};
