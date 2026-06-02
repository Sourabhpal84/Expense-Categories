"use client";

import { FormEvent, useState } from "react";
import { Boxes, Plus } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import { useBusinessData } from "@/hooks/use-business-data";
import { addInventoryItem, updateInventoryItem } from "@/services/data-service";

export default function InventoryPage() {
  const { user, configured } = useAuth();
  const { inventory, demoMode } = useBusinessData();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", quantity: "", unit: "pcs", lowStockThreshold: "10", restockStatus: "Healthy" as const });

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !configured) return toast({ title: "Demo mode", description: "Connect Firebase to save inventory." });
    await addInventoryItem({ userId: user.uid, name: form.name, quantity: Number(form.quantity), unit: form.unit, lowStockThreshold: Number(form.lowStockThreshold), restockStatus: form.restockStatus });
    setForm({ ...form, name: "", quantity: "" });
    toast({ title: "Inventory item saved" });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Boxes className="h-5 w-5 text-primary" />Inventory management</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-5" onSubmit={submit}>
            <div className="space-y-2 md:col-span-2"><Label>Item name</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div>
            <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required /></div>
            <div className="space-y-2"><Label>Unit</Label><Input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} /></div>
            <div className="space-y-2"><Label>Low alert</Label><Input type="number" value={form.lowStockThreshold} onChange={(event) => setForm({ ...form, lowStockThreshold: event.target.value })} /></div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={form.restockStatus} onValueChange={(value) => setForm({ ...form, restockStatus: value as typeof form.restockStatus })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Healthy", "Watch", "Restock"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <Button className="md:col-span-4 md:self-end" disabled={demoMode}><Plus className="h-4 w-4" />Add item</Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {inventory.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div><p className="font-medium">{item.name}</p><p className="mt-1 text-sm text-muted-foreground">AI warning threshold: {item.lowStockThreshold} {item.unit}</p></div>
                <span className="rounded-md bg-white/10 px-2 py-1 text-xs">{item.restockStatus}</span>
              </div>
              <p className="mt-5 text-3xl font-semibold">{item.quantity} <span className="text-base text-muted-foreground">{item.unit}</span></p>
              <Button className="mt-4 w-full" variant="outline" disabled={demoMode} onClick={() => updateInventoryItem(item.id, { restockStatus: item.quantity <= item.lowStockThreshold ? "Restock" : "Healthy" })}>Refresh AI status</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
