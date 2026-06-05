"use client";

import { FormEvent, useState } from "react";
import { Boxes, Edit, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import { useBusinessData } from "@/hooks/use-business-data";
import { addInventoryItem, deleteInventoryItem, updateInventoryItem } from "@/services/data-service";
import type { InventoryItem } from "@/types";

export default function InventoryPage() {
  const { user, configured } = useAuth();
  const { inventory, demoMode } = useBusinessData();
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", quantity: "", unit: "pcs", lowStockThreshold: "10", restockStatus: "Healthy" as const, unitCost: "", supplier: "" });
  const [editing, setEditing] = useState<InventoryItem | null>(null);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !configured) return toast({ title: "Demo mode", description: "Connect Firebase to save inventory." });
    await addInventoryItem({ userId: user.uid, name: form.name, quantity: Number(form.quantity), unit: form.unit, lowStockThreshold: Number(form.lowStockThreshold), restockStatus: form.restockStatus, unitCost: Number(form.unitCost || 0), supplier: form.supplier, lastStockAction: "Stock In", purchaseHistory: [{ date: new Date().toISOString().slice(0, 10), quantity: Number(form.quantity), unitCost: Number(form.unitCost || 0), supplier: form.supplier }] });
    setForm({ ...form, name: "", quantity: "" });
    toast({ title: "Inventory item saved" });
  }

  async function removeItem(id: string) {
    if (demoMode) return toast({ title: "Demo mode", description: "Connect Firebase to delete inventory." });
    await deleteInventoryItem(id);
    toast({ title: "Inventory item deleted" });
  }

  async function saveEdit() {
    if (!editing) return;
    if (demoMode) return toast({ title: "Demo mode", description: "Connect Firebase to edit inventory." });
    await updateInventoryItem(editing.id, {
      name: editing.name,
      quantity: Number(editing.quantity),
      unit: editing.unit,
      lowStockThreshold: Number(editing.lowStockThreshold),
      restockStatus: editing.restockStatus,
      unitCost: Number(editing.unitCost || 0),
      supplier: editing.supplier
    });
    setEditing(null);
    toast({ title: "Inventory item updated" });
  }

  async function adjustStock(item: InventoryItem, direction: "Stock In" | "Stock Out") {
    const raw = prompt(`${direction} quantity for ${item.name}`);
    const amount = Number(raw || 0);
    if (!amount || amount < 0) return;
    const nextQuantity = direction === "Stock In" ? item.quantity + amount : Math.max(0, item.quantity - amount);
    await updateInventoryItem(item.id, {
      quantity: nextQuantity,
      restockStatus: nextQuantity <= item.lowStockThreshold ? "Restock" : "Healthy",
      lastStockAction: direction,
      purchaseHistory: direction === "Stock In" ? [...(item.purchaseHistory || []), { date: new Date().toISOString().slice(0, 10), quantity: amount, unitCost: item.unitCost, supplier: item.supplier }] : item.purchaseHistory
    });
    toast({ title: `${direction} saved` });
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Boxes className="h-5 w-5 text-primary" />Inventory management</CardTitle></CardHeader>
        <CardContent>
          <form className="grid gap-4 md:grid-cols-6" onSubmit={submit}>
            <div className="space-y-2 md:col-span-2"><Label>Item name</Label><Input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></div>
            <div className="space-y-2"><Label>Quantity</Label><Input type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: event.target.value })} required /></div>
            <div className="space-y-2"><Label>Unit</Label><Input value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} /></div>
            <div className="space-y-2"><Label>Low alert</Label><Input type="number" value={form.lowStockThreshold} onChange={(event) => setForm({ ...form, lowStockThreshold: event.target.value })} /></div>
            <div className="space-y-2"><Label>Unit cost</Label><Input type="number" value={form.unitCost} onChange={(event) => setForm({ ...form, unitCost: event.target.value })} /></div>
            <div className="space-y-2 md:col-span-2"><Label>Supplier</Label><Input value={form.supplier} onChange={(event) => setForm({ ...form, supplier: event.target.value })} /></div>
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
                <div><p className="font-medium">{item.name}</p><p className="mt-1 text-sm text-muted-foreground">Supplier: {item.supplier || "Not set"} | Alert: {item.lowStockThreshold} {item.unit}</p></div>
                <div className="flex items-center gap-1">
                  <span className="rounded-md bg-white/10 px-2 py-1 text-xs">{item.restockStatus}</span>
                  <Button size="icon" variant="ghost" className="h-8 w-8" disabled={demoMode} onClick={() => setEditing(item)} aria-label="Edit inventory item">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" disabled={demoMode} onClick={() => removeItem(item.id)} aria-label="Delete inventory item">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="mt-5 text-3xl font-semibold">{item.quantity} <span className="text-base text-muted-foreground">{item.unit}</span></p>
              <p className="mt-1 text-sm text-muted-foreground">Value: Rs. {Math.round(item.quantity * Number(item.unitCost || 0)).toLocaleString("en-IN")} | Last: {item.lastStockAction || "Adjustment"}</p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="outline" disabled={demoMode} onClick={() => adjustStock(item, "Stock In")}>Stock in</Button>
                <Button variant="outline" disabled={demoMode} onClick={() => adjustStock(item, "Stock Out")}>Stock out</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {editing ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4">
          <Card className="w-full max-w-xl">
            <CardHeader>
              <CardTitle>Edit inventory item</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Item name</Label>
                <Input value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input type="number" value={editing.quantity} onChange={(event) => setEditing({ ...editing, quantity: Number(event.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Unit</Label>
                <Input value={editing.unit} onChange={(event) => setEditing({ ...editing, unit: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Low alert</Label>
                <Input type="number" value={editing.lowStockThreshold} onChange={(event) => setEditing({ ...editing, lowStockThreshold: Number(event.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Unit cost</Label>
                <Input type="number" value={editing.unitCost || 0} onChange={(event) => setEditing({ ...editing, unitCost: Number(event.target.value) })} />
              </div>
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Input value={editing.supplier || ""} onChange={(event) => setEditing({ ...editing, supplier: event.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={editing.restockStatus} onValueChange={(value) => setEditing({ ...editing, restockStatus: value as InventoryItem["restockStatus"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["Healthy", "Watch", "Restock"].map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2 sm:col-span-2">
                <Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button>
                <Button onClick={saveEdit}>Save changes</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
