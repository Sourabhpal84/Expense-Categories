"use client";

import { AlertTriangle, Boxes, CircleDollarSign, ClipboardList, Star, TrendingUp, Users, Wallet } from "lucide-react";
import { AiInsightsCard } from "@/components/dashboard/ai-insights-card";
import { CategoryChart, ProfitTrendChart, RevenueExpenseChart, WeeklyPerformanceChart } from "@/components/dashboard/charts";
import { MetricCard } from "@/components/dashboard/metric-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useBusinessData } from "@/hooks/use-business-data";
import { currency, percent } from "@/lib/utils";

export default function DashboardPage() {
  const { expenses, revenues, inventory, budgets, customers, notifications, metrics, demoMode } = useBusinessData();

  return (
    <div className="space-y-6">
      {demoMode ? (
        <div className="rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
          Demo data is showing until Firebase credentials are added and you sign in.
        </div>
      ) : null}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Today's revenue" value={currency(metrics.todayRevenue)} helper="Delivered net orders only" icon={CircleDollarSign} tone="accent" />
        <MetricCard label="Today's expenses" value={currency(metrics.todayExpenses)} helper="Live expense entries" icon={Wallet} />
        <MetricCard label="Today's profit" value={currency(metrics.todayProfit)} helper="Revenue minus expenses" icon={TrendingUp} tone="accent" />
        <MetricCard label="Inventory value" value={currency(metrics.inventoryValue)} helper={`${metrics.lowStock.length} low stock alerts`} icon={Boxes} tone="warning" />
        <MetricCard label="Monthly revenue" value={currency(metrics.monthlyRevenue)} helper="Current month" icon={CircleDollarSign} tone="accent" />
        <MetricCard label="Monthly expenses" value={currency(metrics.monthlyExpenses)} helper="Current month" icon={Wallet} />
        <MetricCard label="Monthly profit" value={currency(metrics.monthlyProfit)} helper={percent(metrics.growth)} icon={TrendingUp} tone="accent" />
        <MetricCard label="Repeat customers" value={String(customers.filter((item) => item.totalOrders > 1).length)} helper={`${customers.length} customers tracked`} icon={Users} />
        <MetricCard label="Total orders" value={String(metrics.totalOrders)} helper={`${metrics.deliveredOrders} delivered`} icon={ClipboardList} />
        <MetricCard label="Pending orders" value={String(metrics.pendingOrders)} helper={`${metrics.cancelledOrders} cancelled/lost`} icon={AlertTriangle} tone="warning" />
        <MetricCard label="Satisfaction score" value={`${metrics.satisfactionScore}%`} helper={`${metrics.feedbackAverage.toFixed(1)} average rating`} icon={Star} tone="accent" />
        <MetricCard label="COD pending" value={currency(metrics.codPendingCollection)} helper="Not counted as net revenue" icon={Wallet} tone="warning" />
      </section>
      {notifications.length ? (
        <section className="grid gap-3 md:grid-cols-3">
          {notifications.slice(0, 3).map((item) => (
            <Card key={item.id} className="border-amber-400/25 bg-amber-400/10">
              <CardContent className="p-4"><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p></CardContent>
            </Card>
          ))}
        </section>
      ) : null}
      <section className="grid gap-6 xl:grid-cols-[1.3fr_.7fr]">
        <RevenueExpenseChart expenses={expenses} revenues={revenues} />
        <CategoryChart expenses={expenses} />
      </section>
      <section className="grid gap-6 xl:grid-cols-2">
        <ProfitTrendChart expenses={expenses} revenues={revenues} />
        <WeeklyPerformanceChart expenses={expenses} revenues={revenues} />
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
