"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Edit, Home, Trash2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import { currency } from "@/lib/utils";
import { addPersonalExpense, deletePersonalExpense, subscribeUserCollection, updatePersonalExpense } from "@/services/data-service";
import { personalExpenseCategories, type PersonalExpense, type PersonalExpenseCategory } from "@/types";

const today = new Date().toISOString().slice(0, 10);
const currentMonth = new Date().toISOString().slice(0, 7);
const paymentMethods = ["Cash", "UPI", "Card", "Bank Transfer", "Other"];

export default function PersonalExpensesPage() {
  const { user, configured } = useAuth();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<PersonalExpense[]>([]);
  const [form, setForm] = useState({
    title: "",
    amount: "",
    category: "Room Rent" as PersonalExpenseCategory,
    date: today,
    paidBy: "",
    paymentMethod: "UPI",
    notes: ""
  });
  const [editing, setEditing] = useState<PersonalExpense | null>(null);

  useEffect(() => {
    if (!user || !configured) return;
    return subscribeUserCollection<PersonalExpense>(user.uid, "personalExpenses", setExpenses);
  }, [configured, user]);

  const totals = useMemo(() => {
    const total = expenses.reduce((sum, item) => sum + item.amount, 0);
    const monthly = expenses.filter((item) => item.date.startsWith(currentMonth)).reduce((sum, item) => sum + item.amount, 0);
    const room = expenses
      .filter((item) => ["Room Rent", "Room Maintenance", "Electricity", "Water", "Internet"].includes(item.category))
      .reduce((sum, item) => sum + item.amount, 0);
    return { total, monthly, room };
  }, [expenses]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !configured) return toast({ title: "Demo mode", description: "Connect Firebase to save personal expenses." });

    await addPersonalExpense({
      userId: user.uid,
      title: form.title,
      amount: Number(form.amount),
      category: form.category,
      date: form.date,
      paidBy: form.paidBy,
      paymentMethod: form.paymentMethod,
      notes: form.notes
    });

    setForm({ ...form, title: "", amount: "", notes: "" });
    toast({ title: "Personal expense saved" });
  }

  async function remove(item: PersonalExpense) {
    if (!confirm(`Delete ${item.title}?`)) return;
    if (!confirm("Final confirmation: this personal expense cannot be recovered.")) return;
    await deletePersonalExpense(item.id);
    toast({ title: "Personal expense deleted" });
  }

  async function saveEdit() {
    if (!editing) return;
    await updatePersonalExpense(editing.id, {
      title: editing.title,
      amount: Number(editing.amount),
      category: editing.category,
      date: editing.date,
      paidBy: editing.paidBy,
      paymentMethod: editing.paymentMethod,
      notes: editing.notes
    });
    setEditing(null);
    toast({ title: "Personal expense updated" });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">This month</p><p className="mt-2 text-2xl font-semibold">{currency(totals.monthly)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Room expenses</p><p className="mt-2 text-2xl font-semibold">{currency(totals.room)}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">All personal</p><p className="mt-2 text-2xl font-semibold">{currency(totals.total)}</p></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Home className="h-5 w-5 text-primary" />Personal / Room Expense</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
            <div className="space-y-2"><Label>Expense Name</Label><Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required /></div>
            <div className="space-y-2"><Label>Amount</Label><Input type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required /></div>
            <div className="space-y-2"><Label>Category</Label><Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value as PersonalExpenseCategory })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{personalExpenseCategories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></div>
            <div className="space-y-2"><Label>Paid By</Label><Input value={form.paidBy} onChange={(event) => setForm({ ...form, paidBy: event.target.value })} placeholder="Your name / roommate" /></div>
            <div className="space-y-2"><Label>Payment Method</Label><Select value={form.paymentMethod} onValueChange={(value) => setForm({ ...form, paymentMethod: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{paymentMethods.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-2 md:col-span-2"><Label>Notes</Label><Input value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Room rent, food, recharge, shared expense..." /></div>
            <Button className="md:col-span-2">Save personal expense</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Personal expense history</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-sm">
            <thead className="text-left text-muted-foreground"><tr className="border-b border-white/10"><th className="py-3">Date</th><th>Name</th><th>Category</th><th>Paid By</th><th>Payment</th><th>Notes</th><th className="text-right">Amount</th><th className="text-right">Actions</th></tr></thead>
            <tbody>{expenses.map((item) => <tr key={item.id} className="border-b border-white/5"><td className="py-3">{item.date}</td><td>{item.title}</td><td>{item.category}</td><td>{item.paidBy || "-"}</td><td>{item.paymentMethod || "-"}</td><td className="max-w-xs truncate text-muted-foreground">{item.notes || "-"}</td><td className="text-right font-medium">{currency(item.amount)}</td><td className="text-right"><Button size="icon" variant="ghost" onClick={() => setEditing(item)} aria-label="Edit personal expense"><Edit className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => remove(item)} aria-label="Delete personal expense"><Trash2 className="h-4 w-4" /></Button></td></tr>)}</tbody>
          </table>
        </CardContent>
      </Card>

      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <Card className="w-full max-w-xl">
            <CardHeader><CardTitle>Edit personal expense</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>Expense Name</Label><Input value={editing.title} onChange={(event) => setEditing({ ...editing, title: event.target.value })} /></div>
              <div className="space-y-2"><Label>Amount</Label><Input type="number" value={editing.amount} onChange={(event) => setEditing({ ...editing, amount: Number(event.target.value) })} /></div>
              <div className="space-y-2"><Label>Category</Label><Select value={editing.category} onValueChange={(value) => setEditing({ ...editing, category: value as PersonalExpenseCategory })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{personalExpenseCategories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={editing.date} onChange={(event) => setEditing({ ...editing, date: event.target.value })} /></div>
              <div className="space-y-2"><Label>Paid By</Label><Input value={editing.paidBy || ""} onChange={(event) => setEditing({ ...editing, paidBy: event.target.value })} /></div>
              <div className="space-y-2"><Label>Payment Method</Label><Select value={editing.paymentMethod || "UPI"} onValueChange={(value) => setEditing({ ...editing, paymentMethod: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{paymentMethods.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2 sm:col-span-2"><Label>Notes</Label><Input value={editing.notes || ""} onChange={(event) => setEditing({ ...editing, notes: event.target.value })} /></div>
              <div className="flex justify-end gap-2 sm:col-span-2"><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button onClick={saveEdit}>Save</Button></div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
