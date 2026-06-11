"use client";

import { Edit, Search, Trash2 } from "lucide-react";
import { ExpenseForm } from "@/components/expenses/expense-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import { useBusinessData } from "@/hooks/use-business-data";
import { currency } from "@/lib/utils";
import { deleteExpense, updateExpense } from "@/services/data-service";
import { expenseCategories, type Expense, type ExpenseCategory } from "@/types";
import { useState } from "react";

export default function ExpensesPage() {
  const { expenses, demoMode } = useBusinessData();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [editing, setEditing] = useState<Expense | null>(null);
  const filtered = expenses.filter((item) => {
    const textMatch = `${item.vendor} ${item.category} ${item.notes}`.toLowerCase().includes(search.toLowerCase());
    const categoryMatch = category === "all" || item.category === category;
    const fromMatch = !from || item.date >= from;
    const toMatch = !to || item.date <= to;
    return textMatch && categoryMatch && fromMatch && toMatch;
  });

  async function remove(id: string) {
    if (demoMode) return toast({ title: "Demo mode", description: "Sign in with Firebase to delete records." });
    if (!confirm("Delete this business expense?")) return;
    if (!confirm("Final confirmation: this expense cannot be recovered.")) return;
    await deleteExpense(id);
    toast({ title: "Expense deleted" });
  }

  async function saveEdit() {
    if (!editing) return;
    if (demoMode) return toast({ title: "Demo mode", description: "Sign in with Firebase to edit records." });
    await updateExpense(editing.id, {
      vendor: editing.vendor,
      amount: Number(editing.amount),
      category: editing.category,
      date: editing.date,
      notes: editing.notes
    });
    setEditing(null);
    toast({ title: "Expense updated" });
  }

  return (
    <div className="space-y-6">
      <ExpenseForm />
      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <CardTitle>Expense history</CardTitle>
          <div className="grid w-full gap-2 sm:grid-cols-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search expenses" value={search} onChange={(event) => setSearch(event.target.value)} />
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">All categories</SelectItem>{expenseCategories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
            </Select>
            <Input type="date" value={from} onChange={(event) => setFrom(event.target.value)} />
            <Input type="date" value={to} onChange={(event) => setTo(event.target.value)} />
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
                    <Button size="icon" variant="ghost" aria-label="Edit expense" onClick={() => setEditing(expense)}><Edit className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" aria-label="Delete expense" onClick={() => remove(expense.id)}><Trash2 className="h-4 w-4" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <Card className="w-full max-w-xl">
            <CardHeader><CardTitle>Edit expense</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Vendor</Label><Input value={editing.vendor} onChange={(event) => setEditing({ ...editing, vendor: event.target.value })} /></div>
              <div className="space-y-2"><Label>Amount</Label><Input type="number" value={editing.amount} onChange={(event) => setEditing({ ...editing, amount: Number(event.target.value) })} /></div>
              <div className="space-y-2"><Label>Category</Label><Select value={editing.category} onValueChange={(value) => setEditing({ ...editing, category: value as ExpenseCategory })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{expenseCategories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={editing.date} onChange={(event) => setEditing({ ...editing, date: event.target.value })} /></div>
              <div className="flex justify-end gap-2 sm:col-span-2"><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={saveEdit}>Save</Button></div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
