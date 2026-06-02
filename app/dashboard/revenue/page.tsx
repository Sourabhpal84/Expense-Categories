"use client";

import { FormEvent, useState } from "react";
import { Plus } from "lucide-react";
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
import { addRevenue } from "@/services/data-service";

export default function RevenuePage() {
  const { user, configured } = useAuth();
  const { revenues, expenses, demoMode } = useBusinessData();
  const { toast } = useToast();
  const [form, setForm] = useState({ product: "", orders: "1", amount: "", date: new Date().toISOString().slice(0, 10), channel: "WhatsApp" as const });

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !configured) return toast({ title: "Demo mode", description: "Connect Firebase to save revenue." });
    await addRevenue({ userId: user.uid, product: form.product, orders: Number(form.orders), amount: Number(form.amount), date: form.date, channel: form.channel });
    setForm({ ...form, product: "", amount: "" });
    toast({ title: "Revenue saved" });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[.75fr_1.25fr]">
        <Card>
          <CardHeader><CardTitle>Add daily sales</CardTitle></CardHeader>
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
            <thead className="text-left text-muted-foreground"><tr className="border-b border-white/10"><th className="py-3">Date</th><th>Product</th><th>Channel</th><th>Orders</th><th className="text-right">Revenue</th></tr></thead>
            <tbody>{revenues.map((item) => <tr key={item.id} className="border-b border-white/5"><td className="py-3 text-muted-foreground">{item.date}</td><td>{item.product}</td><td>{item.channel}</td><td>{item.orders}</td><td className="text-right font-medium">{currency(item.amount)}</td></tr>)}</tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
