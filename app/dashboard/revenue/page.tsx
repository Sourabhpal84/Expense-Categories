"use client";

import { FormEvent, useState } from "react";
import { Edit, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import { useAuth } from "@/components/providers/auth-provider";
import { RevenueExpenseChart } from "@/components/dashboard/charts";
import { useBusinessData } from "@/hooks/use-business-data";
import { currency } from "@/lib/utils";
import { addRevenue, deleteRevenue, updateRevenue } from "@/services/data-service";
import type { Revenue } from "@/types";

const revenueChannels: Revenue["channel"][] = ["Store", "Dine-in", "Takeaway", "WhatsApp", "Phone", "Marketplace", "Website", "Catering", "Other"];
const revenueTypes: NonNullable<Revenue["revenueType"]>[] = ["Food Sales", "Delivery Fee", "Catering", "Party Order", "Subscription", "Commission", "Refund Reversal", "Other"];
const paymentMethods = ["Cash", "UPI", "Card", "COD", "Bank Transfer", "Zomato", "Swiggy", "Razorpay", "Other"];

export default function RevenuePage() {
  const { user, configured } = useAuth();
  const { revenues, expenses, metrics, demoMode } = useBusinessData();
  const { toast } = useToast();
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    amount: "",
    revenueSource: "Store counter",
    revenueType: "Food Sales" as NonNullable<Revenue["revenueType"]>,
    paymentMethod: "UPI",
    product: "",
    orders: "1",
    channel: "Store" as Revenue["channel"],
    notes: "",
    addedBy: user?.email || user?.displayName || ""
  });
  const [editing, setEditing] = useState<Revenue | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !configured) return toast({ title: "Demo mode", description: "Connect Firebase to save revenue." });
    await addRevenue({
      userId: user.uid,
      product: form.product || form.revenueType,
      orders: Number(form.orders || 1),
      amount: Number(form.amount),
      date: form.date,
      channel: form.channel,
      source: "manual",
      revenueSource: form.revenueSource,
      revenueType: form.revenueType,
      paymentMethod: form.paymentMethod,
      notes: form.notes,
      createdBy: form.addedBy || user.email || user.displayName || user.uid,
      revenueState: "net"
    });
    setForm({ ...form, product: "", amount: "", notes: "" });
    toast({ title: "Revenue saved" });
  }

  async function saveEdit(event: FormEvent) {
    event.preventDefault();
    if (!editing || editing.source === "website") return;
    await updateRevenue(editing.id, {
      product: editing.product,
      orders: Number(editing.orders),
      amount: Number(editing.amount),
      date: editing.date,
      channel: editing.channel,
      notes: editing.notes,
      revenueSource: editing.revenueSource,
      revenueType: editing.revenueType,
      paymentMethod: editing.paymentMethod,
      createdBy: editing.createdBy,
      revenueState: "net"
    });
    setEditing(null);
    toast({ title: "Revenue updated" });
  }

  async function remove(item: Revenue) {
    if (item.source === "website") return toast({ title: "Website revenue is order-linked", description: "Update the source order instead of deleting the synced row." });
    if (!confirm("Permanently delete this revenue entry? Dashboard, chart, and profit totals will refresh automatically.")) return;
    if (!confirm("Final confirmation: this revenue entry cannot be recovered.")) return;
    await deleteRevenue(item.id);
    toast({ title: "Revenue deleted" });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-5">
        {[
          ["Net revenue", metrics.totalRevenue],
          ["Gross revenue", metrics.grossRevenue],
          ["Pending revenue", metrics.pendingRevenue],
          ["Refund amount", metrics.refundedRevenue],
          ["COD pending", metrics.codPendingCollection]
        ].map(([label, value]) => (
          <Card key={label as string}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 text-xl font-semibold">{currency(value as number)}</p></CardContent></Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[.75fr_1.25fr]">
        <Card>
          <CardHeader><CardTitle>Offline revenue system</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
              <div className="space-y-2"><Label>Revenue Date</Label><Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required /></div>
              <div className="space-y-2"><Label>Revenue Amount</Label><Input type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required /></div>
              <div className="space-y-2"><Label>Revenue Source</Label><Input value={form.revenueSource} onChange={(event) => setForm({ ...form, revenueSource: event.target.value })} placeholder="Store counter, Swiggy, event stall" required /></div>
              <div className="space-y-2">
                <Label>Revenue Type</Label>
                <Select value={form.revenueType} onValueChange={(value) => setForm({ ...form, revenueType: value as typeof form.revenueType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{revenueTypes.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={form.paymentMethod} onValueChange={(value) => setForm({ ...form, paymentMethod: value })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{paymentMethods.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={form.channel} onValueChange={(value) => setForm({ ...form, channel: value as typeof form.channel })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{revenueChannels.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Product / Combo</Label><Input value={form.product} onChange={(event) => setForm({ ...form, product: event.target.value })} placeholder="Pizza combo, burger meal, party order" /></div>
              <div className="space-y-2"><Label>Orders</Label><Input type="number" value={form.orders} onChange={(event) => setForm({ ...form, orders: event.target.value })} /></div>
              <div className="space-y-2 md:col-span-2"><Label>Description/Notes</Label><Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div>
              <div className="space-y-2 md:col-span-2"><Label>Added By</Label><Input value={form.addedBy} onChange={(event) => setForm({ ...form, addedBy: event.target.value })} placeholder="Staff name" /></div>
              <Button className="md:col-span-2" disabled={demoMode}><Plus className="h-4 w-4" />Save offline revenue</Button>
            </form>
          </CardContent>
        </Card>
        <RevenueExpenseChart expenses={expenses} revenues={revenues} />
      </div>
      <Card>
        <CardHeader><CardTitle>Monthly revenue and expense detail</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead className="text-left text-muted-foreground"><tr className="border-b border-white/10"><th className="py-3">Month</th><th className="text-right">Revenue</th><th className="text-right">Expenses</th><th className="text-right">Profit/Loss</th></tr></thead>
            <tbody>{Array.from(new Set([...revenues.map((item) => item.date.slice(0, 7)), ...expenses.map((item) => item.date.slice(0, 7))])).sort((a, b) => b.localeCompare(a)).map((month) => {
              const revenue = revenues.filter((item) => item.date.startsWith(month)).reduce((sum, item) => sum + item.amount, 0);
              const expense = expenses.filter((item) => item.date.startsWith(month)).reduce((sum, item) => sum + item.amount, 0);
              return <tr key={month} className="border-b border-white/5"><td className="py-3">{month}</td><td className="text-right font-medium">{currency(revenue)}</td><td className="text-right font-medium">{currency(expense)}</td><td className="text-right font-semibold">{currency(revenue - expense)}</td></tr>;
            })}</tbody>
          </table>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Revenue analytics</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="text-left text-muted-foreground"><tr className="border-b border-white/10"><th className="py-3">Date</th><th>Source</th><th>Type</th><th>Payment</th><th>Channel</th><th>Product</th><th>Added By</th><th>Notes</th><th className="text-right">Orders</th><th className="text-right">Revenue</th><th className="text-right">Actions</th></tr></thead>
            <tbody>{revenues.map((item) => <tr key={item.id} className="border-b border-white/5"><td className="py-3 text-muted-foreground">{item.date}</td><td>{item.revenueSource || (item.source === "website" ? "Website order" : "Manual offline")}</td><td>{item.revenueType || "Food Sales"}</td><td>{item.paymentMethod || "-"}</td><td>{item.channel}</td><td>{item.product}</td><td>{item.createdBy || "-"}</td><td className="max-w-xs truncate text-muted-foreground">{item.notes || "-"}</td><td className="text-right">{item.orders}</td><td className="text-right font-medium">{currency(item.amount)}</td><td className="text-right"><Button size="icon" variant="ghost" disabled={item.source === "website"} onClick={() => setEditing(item)} aria-label="Edit revenue"><Edit className="h-4 w-4" /></Button><Button size="icon" variant="ghost" disabled={item.source === "website"} onClick={() => remove(item)} aria-label="Delete revenue"><Trash2 className="h-4 w-4" /></Button></td></tr>)}</tbody>
          </table>
        </CardContent>
      </Card>
      {editing && (
        <Card>
          <CardHeader><CardTitle>Edit revenue</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-3 md:grid-cols-6" onSubmit={saveEdit}>
              <Input className="md:col-span-2" value={editing.product} onChange={(event) => setEditing({ ...editing, product: event.target.value })} />
              <Input type="number" value={editing.orders} onChange={(event) => setEditing({ ...editing, orders: Number(event.target.value) })} />
              <Input type="number" value={editing.amount} onChange={(event) => setEditing({ ...editing, amount: Number(event.target.value) })} />
              <Input type="date" value={editing.date} onChange={(event) => setEditing({ ...editing, date: event.target.value })} />
              <Select value={editing.paymentMethod || "UPI"} onValueChange={(value) => setEditing({ ...editing, paymentMethod: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{paymentMethods.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select>
              <Input value={editing.revenueSource || ""} onChange={(event) => setEditing({ ...editing, revenueSource: event.target.value })} placeholder="Revenue source" />
              <Input value={editing.createdBy || ""} onChange={(event) => setEditing({ ...editing, createdBy: event.target.value })} placeholder="Added by" />
              <Input className="md:col-span-3" value={editing.notes || ""} onChange={(event) => setEditing({ ...editing, notes: event.target.value })} placeholder="Description/notes" />
              <div className="flex gap-2"><Button type="submit"><Save className="h-4 w-4" />Save</Button><Button type="button" variant="outline" onClick={() => setEditing(null)}><X className="h-4 w-4" />Cancel</Button></div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
