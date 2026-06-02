"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import { useBusinessData } from "@/hooks/use-business-data";
import { currency } from "@/lib/utils";
import { addBudget } from "@/services/data-service";
import { expenseCategories, type ExpenseCategory } from "@/types";

export default function BudgetsPage() {
  const { user, configured } = useAuth();
  const { budgets, expenses, demoMode } = useBusinessData();
  const { toast } = useToast();
  const [form, setForm] = useState({ category: "Ingredients" as ExpenseCategory, limit: "", month: new Date().toISOString().slice(0, 7) });

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !configured) return toast({ title: "Demo mode", description: "Connect Firebase to save budgets." });
    await addBudget({ userId: user.uid, category: form.category, month: form.month, limit: Number(form.limit) });
    toast({ title: "Budget saved" });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle>Monthly budget planner</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-4" onSubmit={submit}>
            <div className="space-y-2"><Label>Month</Label><Input type="month" value={form.month} onChange={(event) => setForm({ ...form, month: event.target.value })} /></div>
            <div className="space-y-2"><Label>Category</Label><Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value as ExpenseCategory })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{expenseCategories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Limit</Label><Input type="number" value={form.limit} onChange={(event) => setForm({ ...form, limit: event.target.value })} required /></div>
            <Button className="self-end" disabled={demoMode}>Set budget</Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2">
        {budgets.map((budget) => {
          const liveSpent = expenses.filter((expense) => expense.category === budget.category && expense.date.startsWith(budget.month)).reduce((sum, expense) => sum + expense.amount, 0) || budget.spent;
          const usage = Math.min(100, (liveSpent / budget.limit) * 100);
          return (
            <Card key={budget.id}>
              <CardContent className="p-5">
                <div className="mb-4 flex justify-between"><div><p className="font-medium">{budget.category}</p><p className="text-sm text-muted-foreground">{budget.month}</p></div><p className={usage >= 90 ? "text-amber-300" : "text-primary"}>{Math.round(usage)}%</p></div>
                <Progress value={usage} />
                <p className="mt-3 text-sm text-muted-foreground">{currency(liveSpent)} used of {currency(budget.limit)}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
