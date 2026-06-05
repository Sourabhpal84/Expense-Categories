import type { Budget, Expense, InventoryItem, Revenue } from "@/types";

export const sampleExpenses: Expense[] = [
  { id: "e1", userId: "demo", vendor: "Fresh Mart", amount: 8200, category: "Ingredients", date: "2026-05-03", notes: "Bulk supplies", createdAt: "2026-05-03", updatedAt: "2026-05-03" },
  { id: "e2", userId: "demo", vendor: "Meta Ads", amount: 4500, category: "Marketing", date: "2026-05-07", notes: "Launch campaign", createdAt: "2026-05-07", updatedAt: "2026-05-07" },
  { id: "e3", userId: "demo", vendor: "QuickShip", amount: 2800, category: "Delivery", date: "2026-05-10", notes: "Local deliveries", createdAt: "2026-05-10", updatedAt: "2026-05-10" }
];

export const sampleRevenue: Revenue[] = [
  { id: "r1", userId: "demo", product: "Signature Box", orders: 42, amount: 54600, date: "2026-05-03", channel: "WhatsApp", createdAt: "2026-05-03", source: "manual" },
  { id: "r2", userId: "demo", product: "Premium Hamper", orders: 18, amount: 46800, date: "2026-05-08", channel: "Website", createdAt: "2026-05-08", source: "website" },
  { id: "r3", userId: "demo", product: "Mini Pack", orders: 65, amount: 32500, date: "2026-05-12", channel: "Store", createdAt: "2026-05-12", source: "manual" }
];

export const sampleInventory: InventoryItem[] = [
  { id: "i1", userId: "demo", name: "Cheese", quantity: 8, unit: "kg", lowStockThreshold: 10, restockStatus: "Restock", updatedAt: "2026-05-14", unitCost: 420, supplier: "Fresh Dairy" },
  { id: "i2", userId: "demo", name: "Pizza Boxes", quantity: 120, unit: "pcs", lowStockThreshold: 50, restockStatus: "Healthy", updatedAt: "2026-05-12", unitCost: 14, supplier: "PackPro" },
  { id: "i3", userId: "demo", name: "Paneer", quantity: 12, unit: "kg", lowStockThreshold: 15, restockStatus: "Watch", updatedAt: "2026-05-11", unitCost: 360, supplier: "Fresh Dairy" },
  { id: "i4", userId: "demo", name: "Carry Bags", quantity: 35, unit: "pcs", lowStockThreshold: 40, restockStatus: "Watch", updatedAt: "2026-05-10", unitCost: 5, supplier: "PackPro" }
];

export const sampleBudgets: Budget[] = [
  { id: "b1", userId: "demo", category: "Ingredients", month: "2026-05", limit: 35000, spent: 18200 },
  { id: "b2", userId: "demo", category: "Marketing", month: "2026-05", limit: 12000, spent: 9500 },
  { id: "b3", userId: "demo", category: "Delivery", month: "2026-05", limit: 9000, spent: 5800 }
];
