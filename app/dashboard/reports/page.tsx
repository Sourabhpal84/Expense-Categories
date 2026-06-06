"use client";

import { Download, FileText, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useBusinessData } from "@/hooks/use-business-data";
import { currency } from "@/lib/utils";
import type { Expense, Revenue } from "@/types";

function exportCsv(rows: Array<Record<string, unknown>>, filename: string) {
  const headers = Object.keys(rows[0] || {});
  const csv = [headers.join(","), ...rows.map((row) => headers.map((header) => JSON.stringify(row[header] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function printReport(expenses: Expense[], revenues: Revenue[], title = "MAGNEETOZ Business OS Report") {
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalRevenue = revenues.reduce((sum, item) => sum + item.amount, 0);
  const expenseRows = expenses
    .map(
      (item) =>
        `<tr><td>${item.date}</td><td>${item.vendor}</td><td>${item.category}</td><td>${item.notes || ""}</td><td style="text-align:right">${currency(item.amount)}</td></tr>`
    )
    .join("");
  const revenueRows = revenues
    .map(
      (item) =>
        `<tr><td>${item.date}</td><td>${item.revenueSource || item.channel}</td><td>${item.revenueType || "Food Sales"}</td><td>${item.paymentMethod || ""}</td><td>${item.notes || item.product}</td><td style="text-align:right">${currency(item.amount)}</td></tr>`
    )
    .join("");

  const reportWindow = window.open("", "_blank", "width=900,height=700");
  if (!reportWindow) return;

  reportWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <title>MAGNEETOZ Monthly Report</title>
        <style>
          body { font-family: Arial, sans-serif; color: #111827; padding: 32px; }
          h1 { margin: 0 0 6px; font-size: 26px; }
          p { color: #6b7280; }
          .metrics { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 24px 0; }
          .metric { border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; }
          .metric span { display: block; color: #6b7280; font-size: 12px; margin-bottom: 8px; }
          .metric strong { font-size: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 18px; }
          th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; font-size: 13px; text-align: left; }
          th { color: #374151; }
        </style>
      </head>
      <body>
        <h1>${title}</h1>
        <p>Revenue, expense, tax, and profit/loss report</p>
        <div class="metrics">
          <div class="metric"><span>Revenue</span><strong>${currency(totalRevenue)}</strong></div>
          <div class="metric"><span>Expenses</span><strong>${currency(totalExpenses)}</strong></div>
          <div class="metric"><span>Profit/Loss</span><strong>${currency(totalRevenue - totalExpenses)}</strong></div>
        </div>
        <h2>Revenue Detail</h2>
        <table>
          <thead><tr><th>Date</th><th>Revenue Source</th><th>Revenue Type</th><th>Payment Method</th><th>Description/Notes</th><th style="text-align:right">Amount</th></tr></thead>
          <tbody>${revenueRows || `<tr><td colspan="6">No revenue found for this period.</td></tr>`}</tbody>
        </table>
        <h2>Expense Summary</h2>
        <table>
          <thead><tr><th>Date</th><th>Vendor</th><th>Category</th><th>Notes</th><th style="text-align:right">Amount</th></tr></thead>
          <tbody>${expenseRows || `<tr><td colspan="5">No expenses found for this period.</td></tr>`}</tbody>
        </table>
        <script>window.onload = () => window.print();</script>
      </body>
    </html>
  `);
  reportWindow.document.close();
}

export default function ReportsPage() {
  const { expenses, revenues, metrics } = useBusinessData();
  const [selectedDay, setSelectedDay] = useState(new Date().toISOString().slice(0, 10));
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const taxRows = revenues.map((item) => ({ date: item.date, source: item.source || "manual", amount: item.amount, estimatedGst: Math.round(item.amount * 0.05) }));
  const dailyExpenses = expenses.filter((item) => item.date === selectedDay);
  const dailyRevenues = revenues.filter((item) => item.date === selectedDay);
  const monthlyExpenses = expenses.filter((item) => item.date.startsWith(selectedMonth));
  const monthlyRevenues = revenues.filter((item) => item.date.startsWith(selectedMonth));
  const monthlyDetail = useMemo(() => Array.from(new Set([...revenues.map((item) => item.date.slice(0, 7)), ...expenses.map((item) => item.date.slice(0, 7))]))
    .sort((a, b) => b.localeCompare(a))
    .map((month) => {
      const revenue = revenues.filter((item) => item.date.startsWith(month)).reduce((sum, item) => sum + item.amount, 0);
      const expense = expenses.filter((item) => item.date.startsWith(month)).reduce((sum, item) => sum + item.amount, 0);
      return { month, revenue, expense, profit: revenue - expense };
    }), [expenses, revenues]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Revenue</p><p className="mt-2 text-2xl font-semibold">{currency(metrics.totalRevenue)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Expenses</p><p className="mt-2 text-2xl font-semibold">{currency(metrics.totalExpenses)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Profit/Loss</p><p className="mt-2 text-2xl font-semibold">{currency(metrics.netProfit)}</p></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Downloadable reports</CardTitle></CardHeader>
        <CardContent className="grid gap-5">
          <div className="grid gap-3 md:grid-cols-[1fr_auto_1fr_auto] md:items-end">
            <div className="space-y-2">
              <Label>Particular day</Label>
              <Input type="date" value={selectedDay} onChange={(event) => setSelectedDay(event.target.value)} />
            </div>
            <Button onClick={() => printReport(dailyExpenses, dailyRevenues, `MAGNEETOZ Daily Report - ${selectedDay}`)}>
              <Printer className="h-4 w-4" />
              Selected Day PDF
            </Button>
            <div className="space-y-2">
              <Label>Particular month</Label>
              <Input type="month" value={selectedMonth} onChange={(event) => setSelectedMonth(event.target.value)} />
            </div>
            <Button onClick={() => printReport(monthlyExpenses, monthlyRevenues, `MAGNEETOZ Monthly Report - ${selectedMonth}`)}>
              <Printer className="h-4 w-4" />
              Selected Month PDF
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
          <Button onClick={() => printReport(expenses, revenues, "MAGNEETOZ Daily Report")}>
            <Printer className="h-4 w-4" />
            Daily PDF
          </Button>
          <Button onClick={() => printReport(expenses, revenues, "MAGNEETOZ Weekly Report")}>
            <Printer className="h-4 w-4" />
            Weekly PDF
          </Button>
          <Button onClick={() => printReport(expenses, revenues, "MAGNEETOZ Monthly Report")}>
            <Printer className="h-4 w-4" />
            Monthly PDF
          </Button>
          <Button variant="outline" onClick={() => exportCsv(expenses.map(({ id, userId, ...expense }) => expense), "magneetoz-expense-report.csv")}>
            <Download className="h-4 w-4" />
            Expense CSV
          </Button>
          <Button variant="outline" onClick={() => exportCsv(revenues.map(({ id, userId, ...revenue }) => revenue), "magneetoz-profit-loss.csv")}>
            <Download className="h-4 w-4" />
            P&L CSV
          </Button>
          <Button variant="outline" onClick={() => exportCsv(taxRows, "magneetoz-tax-summary.csv")}>
            <Download className="h-4 w-4" />
            Tax CSV
          </Button>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Every month revenue, expense, and total</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="text-left text-muted-foreground"><tr className="border-b border-white/10"><th className="py-3">Month</th><th className="text-right">Revenue</th><th className="text-right">Expense</th><th className="text-right">Total Profit/Loss</th></tr></thead>
            <tbody>{monthlyDetail.map((item) => <tr key={item.month} className="border-b border-white/5"><td className="py-3">{item.month}</td><td className="text-right font-medium">{currency(item.revenue)}</td><td className="text-right font-medium">{currency(item.expense)}</td><td className="text-right font-semibold">{currency(item.profit)}</td></tr>)}</tbody>
          </table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Profit and loss detail</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>Total revenue minus total expenses is {currency(metrics.netProfit)}.</p>
          <p>Use the PDF export for investor, accountant, or monthly founder review workflows.</p>
        </CardContent>
      </Card>
    </div>
  );
}
