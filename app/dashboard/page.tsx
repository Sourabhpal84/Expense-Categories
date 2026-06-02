"use client";

import { AlertTriangle, CircleDollarSign, TrendingUp, Wallet } from "lucide-react";
import { AiInsightsCard } from "@/components/dashboard/ai-insights-card";
import { CategoryChart, RevenueExpenseChart } from "@/components/dashboard/charts";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useBusinessData } from "@/hooks/use-business-data";
import { currency, percent } from "@/lib/utils";

export default function DashboardPage() {
  const { expenses, revenues, inventory, budgets, metrics, demoMode } = useBusinessData();

  return (
    <div className="space-y-6">
      {demoMode ? (
        <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
          Demo data is showing until Firebase credentials are added and you sign in.
        </div>
      ) : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Total revenue" value={currency(metrics.totalRevenue)} helper="Current tracked period" icon={CircleDollarSign} tone="accent" />
        <MetricCard label="Total expenses" value={currency(metrics.totalExpenses)} helper="Across all categories" icon={Wallet} />
        <MetricCard label="Net profit" value={currency(metrics.netProfit)} helper="Revenue minus expenses" icon={TrendingUp} tone="accent" />
        <MetricCard label="Monthly growth" value={percent(metrics.growth)} helper="Profit margin proxy" icon={AlertTriangle} tone="warning" />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <RevenueExpenseChart expenses={expenses} revenues={revenues} />
        <CategoryChart expenses={expenses} />
      </section>
      <section className="grid gap-6 xl:grid-cols-[1fr_.8fr]">
        <AiInsightsCard expenses={expenses} revenues={revenues} inventory={inventory} budgets={budgets} />
        <Card>
          <CardHeader>
            <CardTitle>Budget and inventory status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {budgets.map((budget) => {
              const usage = Math.min(100, (budget.spent / budget.limit) * 100);
              return (
                <div key={budget.id}>
                  <div className="mb-2 flex justify-between text-sm">
                    <span>{budget.category}</span>
                    <span className="text-muted-foreground">{currency(budget.spent)} / {currency(budget.limit)}</span>
                  </div>
                  <Progress value={usage} />
                </div>
              );
            })}
            <div className="rounded-md bg-white/[0.05] p-4">
              <p className="text-sm font-medium">Inventory alerts</p>
              <div className="mt-3 space-y-2">
                {metrics.lowStock.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{item.name}</span>
                    <span className="text-amber-300">{item.quantity} {item.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
