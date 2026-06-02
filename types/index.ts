export type ExpenseCategory =
  | "Ingredients"
  | "Packaging"
  | "Delivery"
  | "Marketing"
  | "Salary"
  | "Rent"
  | "Utilities"
  | "Software"
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
