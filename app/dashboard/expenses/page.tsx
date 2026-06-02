"use client";

import { Edit, Search, Trash2 } from "lucide-react";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toaster";
import { useBusinessData } from "@/hooks/use-business-data";
import { currency } from "@/lib/utils";
import { deleteExpense } from "@/services/data-service";
import { useState } from "react";

export default function ExpensesPage() {
  const { expenses, demoMode } = useBusinessData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const filtered = expenses.filter((item) => `${item.vendor} ${item.category} ${item.notes}`.toLowerCase().includes(search.toLowerCase()));

  async function remove(id: string) {
    if (demoMode) return toast({ title: "Demo mode", description: "Sign in with Firebase to delete records." });
    await deleteExpense(id);
    toast({ title: "Expense deleted" });
  }

  return (
    <div className="space-y-6">
      <ExpenseForm />
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <CardTitle>Expense history</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search expenses" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b border-white/10">
                <th className="py-3">Date</th>
                <th>Vendor</th>
                <th>Category</th>
                <th>Notes</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((expense) => (
                <tr key={expense.id} className="border-b border-white/5">
                  <td className="py-3 text-muted-foreground">{expense.date}</td>
                  <td>{expense.vendor}</td>
                  <td>{expense.category}</td>
                  <td className="max-w-xs truncate text-muted-foreground">{expense.notes}</td>
                  <td className="text-right font-medium">{currency(expense.amount)}</td>
                  <td className="text-right">
                    <Button size="icon" variant="ghost" aria-label="Edit expense"><Edit className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Delete expense" onClick={() => remove(expense.id)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
