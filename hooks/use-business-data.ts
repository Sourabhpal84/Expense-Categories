"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { subscribeUserCollection } from "@/services/data-service";
import { subscribeWebsiteOnlineRevenue } from "@/services/website-revenue-service";
import { sampleBudgets, sampleExpenses, sampleInventory, sampleRevenue } from "@/data/sample-data";
import type { Budget, CustomerProfile, Expense, FeedbackRecord, InventoryItem, NotificationItem, Revenue } from "@/types";

const todayIso = () => new Date().toISOString().slice(0, 10);
const monthIso = () => new Date().toISOString().slice(0, 7);
const moneyDate = (value?: string) => String(value || "").slice(0, 10);

export function useBusinessData() {
  const { user, configured } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>(sampleExpenses);
  const [manualRevenues, setManualRevenues] = useState<Revenue[]>(sampleRevenue);
  const [websiteRevenueLedger, setWebsiteRevenueLedger] = useState<Revenue[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>(sampleInventory);
  const [budgets, setBudgets] = useState<Budget[]>(sampleBudgets);
  const [feedback, setFeedback] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !configured) return;
    setLoading(true);
    const unsubs = [
      subscribeUserCollection<Expense>(user.uid, "expenses", setExpenses),
      subscribeUserCollection<Revenue>(user.uid, "revenues", setManualRevenues),
      subscribeWebsiteOnlineRevenue(user.uid, setWebsiteRevenueLedger),
      subscribeUserCollection<InventoryItem>(user.uid, "inventory", setInventory, "updatedAt"),
      subscribeUserCollection<Budget>(user.uid, "budgets", setBudgets, "month"),
      subscribeUserCollection<FeedbackRecord>(user.uid, "feedback", setFeedback)
    ];
    setLoading(false);
    return () => unsubs.forEach((unsub) => unsub());
  }, [configured, user]);

  const revenues = useMemo(() => {
    if (!user || !configured) return manualRevenues;
    const netWebsiteRevenues = websiteRevenueLedger.filter((item) => item.revenueState === "net");
    return [...netWebsiteRevenues, ...manualRevenues].sort((a, b) => b.date.localeCompare(a.date));
  }, [configured, manualRevenues, user, websiteRevenueLedger]);

  const metrics = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
    const totalRevenue = revenues.reduce((sum, item) => sum + item.amount, 0);
    const today = todayIso();
    const month = monthIso();
    const todayRevenue = revenues.filter((item) => item.date === today).reduce((sum, item) => sum + item.amount, 0);
    const todayExpenses = expenses.filter((item) => item.date === today).reduce((sum, item) => sum + item.amount, 0);
    const monthlyRevenue = revenues.filter((item) => item.date.startsWith(month)).reduce((sum, item) => sum + item.amount, 0);
    const monthlyExpenses = expenses.filter((item) => item.date.startsWith(month)).reduce((sum, item) => sum + item.amount, 0);
    const websiteRevenue = revenues.filter((item) => item.source === "website").reduce((sum, item) => sum + item.amount, 0);
    const manualRevenue = revenues.filter((item) => item.source !== "website").reduce((sum, item) => sum + item.amount, 0);
    const pendingRevenue = websiteRevenueLedger.filter((item) => item.revenueState === "pending").reduce((sum, item) => sum + item.amount, 0);
    const refundedRevenue = websiteRevenueLedger.filter((item) => item.revenueState === "refunded").reduce((sum, item) => sum + item.amount, 0);
    const codPendingCollection = websiteRevenueLedger
      .filter((item) => item.revenueState === "pending" && ["cod", "cash"].includes(String(item.paymentMethod || "").toLowerCase()))
      .reduce((sum, item) => sum + item.amount, 0);
    const grossRevenue = totalRevenue + refundedRevenue;
    const netProfit = totalRevenue - totalExpenses;
    const growth = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const lowStock = inventory.filter((item) => item.quantity <= item.lowStockThreshold);
    const inventoryValue = inventory.reduce((sum, item) => sum + item.quantity * Number(item.unitCost || 0), 0);
    const totalOrders = revenues.reduce((sum, item) => sum + Number(item.orders || 0), 0) + websiteRevenueLedger.filter((item) => item.revenueState !== "net").length;
    const deliveredOrders = revenues.reduce((sum, item) => sum + Number(item.orders || 0), 0);
    const pendingOrders = websiteRevenueLedger.filter((item) => item.revenueState === "pending").length;
    const cancelledOrders = websiteRevenueLedger.filter((item) => item.revenueState === "lost").length;
    const feedbackAverage = feedback.length ? feedback.reduce((sum, item) => sum + Number(item.rating || 0), 0) / feedback.length : 0;
    const satisfactionScore = Math.round((feedbackAverage / 5) * 100) || 0;
    return { totalExpenses, totalRevenue, todayRevenue, todayExpenses, todayProfit: todayRevenue - todayExpenses, monthlyRevenue, monthlyExpenses, monthlyProfit: monthlyRevenue - monthlyExpenses, grossRevenue, pendingRevenue, refundedRevenue, codPendingCollection, websiteRevenue, manualRevenue, netProfit, growth, lowStock, inventoryValue, totalOrders, deliveredOrders, pendingOrders, cancelledOrders, feedbackAverage, satisfactionScore };
  }, [expenses, feedback, inventory, revenues, websiteRevenueLedger]);

  const customers = useMemo<CustomerProfile[]>(() => {
    const map = new Map<string, CustomerProfile>();
    websiteRevenueLedger.forEach((item) => {
      const phone = String((item as unknown as { phone?: string }).phone || item.id).trim();
      const row = map.get(phone) || { id: phone, name: item.product || "Customer", phone, totalOrders: 0, deliveredOrders: 0, totalSpent: 0, feedbackCount: 0, averageRating: 0, lifetimeValue: 0 };
      row.totalOrders += 1;
      if (item.revenueState === "net") {
        row.deliveredOrders += 1;
        row.totalSpent += item.amount;
        row.lifetimeValue += item.amount;
      }
      row.lastOrderDate = moneyDate(item.date);
      map.set(phone, row);
    });
    feedback.forEach((item) => {
      const phone = String(item.phone || item.id).trim();
      const row = map.get(phone) || { id: phone, name: item.customerName || "Customer", phone, totalOrders: 0, deliveredOrders: 0, totalSpent: 0, feedbackCount: 0, averageRating: 0, lifetimeValue: 0 };
      row.name = item.customerName || row.name;
      row.feedbackCount += 1;
      row.averageRating = ((row.averageRating * (row.feedbackCount - 1)) + Number(item.rating || 0)) / row.feedbackCount;
      map.set(phone, row);
    });
    return Array.from(map.values()).sort((a, b) => b.lifetimeValue - a.lifetimeValue);
  }, [feedback, websiteRevenueLedger]);

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = [];
    metrics.lowStock.forEach((item) => items.push({ id: `stock-${item.id}`, type: "low_stock", title: "Low stock", detail: `${item.name} is at ${item.quantity} ${item.unit}`, severity: item.quantity <= 0 ? "critical" : "warning", createdAt: item.updatedAt }));
    feedback.filter((item) => item.highPriority || item.ai?.highPriority).forEach((item) => items.push({ id: `feedback-${item.id}`, type: "new_feedback", title: "High priority feedback", detail: item.message || item.comment || "Customer needs attention", severity: "critical", createdAt: moneyDate(typeof item.createdAt === "string" ? item.createdAt : undefined) || todayIso() }));
    budgets.forEach((budget) => {
      const spent = expenses.filter((expense) => expense.category === budget.category && expense.date.startsWith(budget.month)).reduce((sum, expense) => sum + expense.amount, 0);
      if (spent > budget.limit) items.push({ id: `budget-${budget.id}`, type: "budget_exceeded", title: "Budget exceeded", detail: `${budget.category} crossed the monthly limit`, severity: "warning", createdAt: todayIso() });
    });
    if (metrics.todayRevenue >= 10000) items.push({ id: "revenue-today", type: "revenue_milestone", title: "Revenue milestone", detail: "Today's revenue crossed Rs. 10,000", severity: "success", createdAt: todayIso() });
    return items.slice(0, 20);
  }, [budgets, expenses, feedback, metrics.lowStock, metrics.todayRevenue]);

  return { expenses, revenues, websiteRevenueLedger, inventory, budgets, feedback, customers, notifications, metrics, loading, demoMode: !user || !configured };
}
