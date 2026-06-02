"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { subscribeUserCollection } from "@/services/data-service";
import { sampleBudgets, sampleExpenses, sampleInventory, sampleRevenue } from "@/data/sample-data";
import type { Budget, Expense, InventoryItem, Revenue } from "@/types";

export function useBusinessData() {
  const { user, configured } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>(sampleExpenses);
  const [revenues, setRevenues] = useState<Revenue[]>(sampleRevenue);
  const [inventory, setInventory] = useState<InventoryItem[]>(sampleInventory);
  const [budgets, setBudgets] = useState<Budget[]>(sampleBudgets);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !configured) return;
    setLoading(true);
    const unsubs = [
      subscribeUserCollection<Expense>(user.uid, "expenses", setExpenses),
      subscribeUserCollection<Revenue>(user.uid, "revenues", setRevenues),
      subscribeUserCollection<InventoryItem>(user.uid, "inventory", setInventory, "updatedAt"),
      subscribeUserCollection<Budget>(user.uid, "budgets", setBudgets, "month")
    ];
    setLoading(false);
    return () => unsubs.forEach((unsub) => unsub());
  }, [configured, user]);

  const metrics = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalRevenue = revenues.reduce((sum, item) => sum + item.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const growth = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const lowStock = inventory.filter((item) => item.quantity <= item.lowStockThreshold);
    return { totalExpenses, totalRevenue, netProfit, growth, lowStock };
  }, [expenses, inventory, revenues]);

  return { expenses, revenues, inventory, budgets, metrics, loading, demoMode: !user || !configured };
}
