"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart as RePieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Expense, Revenue } from "@/types";

function byDate(expenses: Expense[], revenues: Revenue[]) {
  const map = new Map<string, { date: string; expenses: number; revenue: number; profit: number }>();
  expenses.forEach((item) => {
    const row = map.get(item.date) || { date: item.date.slice(5), expenses: 0, revenue: 0, profit: 0 };
    row.expenses += item.amount;
    row.profit = row.revenue - row.expenses;
    map.set(item.date, row);
  });
  revenues.forEach((item) => {
    const row = map.get(item.date) || { date: item.date.slice(5), expenses: 0, revenue: 0, profit: 0 };
    row.revenue += item.amount;
    row.profit = row.revenue - row.expenses;
    map.set(item.date, row);
  });
  return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
}

const colors = ["#22c55e", "#38bdf8", "#f59e0b", "#ec4899", "#a78bfa", "#14b8a6", "#f97316"];

export function RevenueExpenseChart({ expenses, revenues }: { expenses: Expense[]; revenues: Revenue[] }) {
  const data = byDate(expenses, revenues);
  return (
    <Card className="min-h-80">
      <CardHeader>
        <CardTitle>Revenue vs expenses</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="revenue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="expenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ background: "#0b1120", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8 }} />
            <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="url(#revenue)" strokeWidth={2} />
            <Area type="monotone" dataKey="expenses" stroke="#38bdf8" fill="url(#expenses)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function CategoryChart({ expenses }: { expenses: Expense[] }) {
  const totals = expenses.reduce<Record<string, number>>((acc, item) => {
    acc[item.category] = (acc[item.category] || 0) + item.amount;
    return acc;
  }, {});
  const data = Object.entries(totals).map(([category, amount]) => ({ category, amount }));

  return (
    <Card className="min-h-80">
      <CardHeader>
        <CardTitle>Expense categories</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <RePieChart>
            <Tooltip contentStyle={{ background: "#0b1120", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8 }} />
            <Pie data={data} dataKey="amount" nameKey="category" innerRadius={52} outerRadius={88} paddingAngle={2}>
              {data.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
            </Pie>
          </RePieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function ProfitTrendChart({ expenses, revenues }: { expenses: Expense[]; revenues: Revenue[] }) {
  const data = byDate(expenses, revenues);
  return (
    <Card className="min-h-80">
      <CardHeader><CardTitle>Profit trend</CardTitle></CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ background: "#0b1120", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8 }} />
            <Line type="monotone" dataKey="profit" stroke="#f59e0b" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

export function WeeklyPerformanceChart({ expenses, revenues }: { expenses: Expense[]; revenues: Revenue[] }) {
  const data = byDate(expenses, revenues).slice(-7);
  return (
    <Card className="min-h-80">
      <CardHeader><CardTitle>Weekly performance</CardTitle></CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip contentStyle={{ background: "#0b1120", border: "1px solid rgba(255,255,255,.12)", borderRadius: 8 }} />
            <Bar dataKey="revenue" fill="#22c55e" radius={[6, 6, 0, 0]} />
            <Bar dataKey="expenses" fill="#38bdf8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
