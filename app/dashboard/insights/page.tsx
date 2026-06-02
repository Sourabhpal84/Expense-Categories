"use client";

import { AiInsightsCard } from "@/components/dashboard/ai-insights-card";
import { useBusinessData } from "@/hooks/use-business-data";

export default function InsightsPage() {
  const { expenses, revenues, inventory, budgets } = useBusinessData();
  return <AiInsightsCard expenses={expenses} revenues={revenues} inventory={inventory} budgets={budgets} />;
}
