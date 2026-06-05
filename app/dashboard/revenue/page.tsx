"use client";

import { FormEvent, useState } from "react";
import { Edit, Plus, Save, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import { useAuth } from "@/components/providers/auth-provider";
import { RevenueExpenseChart } from "@/components/dashboard/charts";
import { useBusinessData } from "@/hooks/use-business-data";
import { currency } from "@/lib/utils";
import { addRevenue, deleteRevenue, updateRevenue } from "@/services/data-service";
import type { Revenue } from "@/types";

export default function RevenuePage() {
  const { user, configured } = useAuth();
  const { revenues, expenses, metrics, demoMode } = useBusinessData();
  const { toast } = useToast();
  const [form, setForm] = useState({ product: "", orders: "1", amount: "", date: new Date().toISOString().slice(0, 10), channel: "WhatsApp" as const });
  const [editing, setEditing] = useState<Revenue | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !configured) return toast({ title: "Demo mode", description: "Connect Firebase to save revenue." });
    await addRevenue({ userId: user.uid, product: form.product, orders: Number(form.orders), amount: Number(form.amount), date: form.date, channel: form.channel });
    setForm({ ...form, product: "", amount: "" });
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
      revenueState: "net"
    });
    setEditing(null);
    toast({ title: "Revenue updated" });
  }

  async function remove(item: Revenue) {
    if (item.source === "website") return toast({ title: "Website revenue is order-linked", description: "Update the source order instead of deleting the synced row." });
    if (!confirm("Permanently delete this revenue entry? Dashboard, chart, and profit totals will refresh automatically.")) return;
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
          <CardHeader><CardTitle>Add offline sales</CardTitle></CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2"><Label>Best selling product</Label><Input value={form.product} onChange={(event) => setForm({ ...form, product: event.target.value })} required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Orders</Label><Input type="number" value={form.orders} onChange={(event) => setForm({ ...form, orders: event.target.value })} /></div>
                <div className="space-y-2"><Label>Revenue</Label><Input type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required /></div>
              </div>
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} /></div>
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={form.channel} onValueChange={(value) => setForm({ ...form, channel: value as typeof form.channel })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Store", "WhatsApp", "Marketplace", "Website", "Other"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button disabled={demoMode}><Plus className="h-4 w-4" />Save revenue</Button>
            </form>
          </CardContent>
        </Card>
        <RevenueExpenseChart expenses={expenses} revenues={revenues} />
      </div>
      <Card>
        <CardHeader><CardTitle>Revenue analytics</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[680px] text-sm">
            <thead className="text-left text-muted-foreground"><tr className="border-b border-white/10"><th className="py-3">Date</th><th>Product</th><th>Channel</th><th>Source</th><th>Orders</th><th className="text-right">Revenue</th><th className="text-right">Actions</th></tr></thead>
            <tbody>{revenues.map((item) => <tr key={item.id} className="border-b border-white/5"><td className="py-3 text-muted-foreground">{item.date}</td><td>{item.product}</td><td>{item.channel}</td><td>{item.source === "website" ? "Auto website" : "Manual offline"}</td><td>{item.orders}</td><td className="text-right font-medium">{currency(item.amount)}</td><td className="text-right"><Button size="icon" variant="ghost" disabled={item.source === "website"} onClick={() => setEditing(item)} aria-label="Edit revenue"><Edit className="h-4 w-4" /></Button><Button size="icon" variant="ghost" disabled={item.source === "website"} onClick={() => remove(item)} aria-label="Delete revenue"><Trash2 className="h-4 w-4" /></Button></td></tr>)}</tbody>
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
              <div className="flex gap-2"><Button type="submit"><Save className="h-4 w-4" />Save</Button><Button type="button" variant="outline" onClick={() => setEditing(null)}><X className="h-4 w-4" />Cancel</Button></div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
