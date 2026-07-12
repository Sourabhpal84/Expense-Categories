"use client";

import { useMemo, useState } from "react";
import { Bell, ChefHat, Clock3, Flame, Volume2, VolumeX } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/toaster";
import { useRestaurantOperations } from "@/hooks/use-restaurant-operations";
import { updateRestaurantOrderStatus } from "@/services/restaurant-operations-service";
import type { RestaurantOrder, RestaurantOrderStatus } from "@/types";

const tabs: RestaurantOrderStatus[] = ["New", "Accepted", "Preparing", "Ready", "Completed"];
const currency = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const time = (value: string) => new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

function elapsed(createdAt: string) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000));
  if (minutes < 1) return "Just now";
  return `${minutes} min`;
}

function delayLabel(order: RestaurantOrder) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 60000));
  if (order.status === "Completed" || order.status === "Cancelled") return "";
  if (minutes >= 25) return `Delayed by ${minutes - 20} min`;
  if (minutes >= 18) return "Nearing delay";
  return "On time";
}

function sortKitchen(a: RestaurantOrder, b: RestaurantOrder) {
  const rank = (order: RestaurantOrder) => order.priority === "Urgent" ? 0 : order.priority === "Priority" ? 1 : 2;
  return rank(a) - rank(b) || new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
}

export default function KitchenDashboardPage() {
  const { user } = useAuth();
  const { orders, loading, error } = useRestaurantOperations();
  const { toast } = useToast();
  const [tab, setTab] = useState<RestaurantOrderStatus>("New");
  const [sound, setSound] = useState(false);

  const kitchenOrders = useMemo(() => orders.filter((order) => order.status !== "Cancelled").sort(sortKitchen), [orders]);
  const visibleOrders = kitchenOrders.filter((order) => order.status === tab || (tab === "New" && order.status === "New Order") || (tab === "Preparing" && order.status === "In Kitchen") || (tab === "Completed" && order.status === "Delivered"));

  async function move(order: RestaurantOrder, status: RestaurantOrderStatus) {
    try {
      await updateRestaurantOrderStatus(order.id, status, user?.uid);
      if (sound && status === "Ready") navigator.vibrate?.(120);
      toast({ title: `${order.orderNumber} marked ${status}` });
    } catch (value) {
      toast({ title: "Status update failed", description: value instanceof Error ? value.message : "Please try again." });
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Kitchen Dashboard</h1>
          <p className="text-sm text-muted-foreground">Only kitchen order details. No payment/profit data.</p>
        </div>
        <Button variant="outline" onClick={() => setSound(!sound)}>{sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}{sound ? "Sound On" : "Sound Off"}</Button>
      </div>

      {error ? <Card className="border-destructive/50"><CardContent className="p-4 text-sm text-destructive">{error}</CardContent></Card> : null}

      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {tabs.map((item) => <Button key={item} className="shrink-0" variant={tab === item ? "default" : "outline"} onClick={() => setTab(item)}>{item} ({kitchenOrders.filter((order) => order.status === item || (item === "New" && order.status === "New Order") || (item === "Preparing" && order.status === "In Kitchen") || (item === "Completed" && order.status === "Delivered")).length})</Button>)}
      </div>

      {loading ? <p className="text-muted-foreground">Loading kitchen queue...</p> : null}
      {!loading && !visibleOrders.length ? <Card><CardContent className="p-8 text-center text-muted-foreground"><ChefHat className="mx-auto mb-2 h-8 w-8" />No {tab.toLowerCase()} orders.</CardContent></Card> : null}

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        {visibleOrders.map((order) => {
          const delay = delayLabel(order);
          return (
            <Card key={order.id} className={order.priority === "Urgent" ? "border-red-500/60" : order.priority === "Priority" ? "border-amber-500/60" : ""}>
              <CardHeader>
                <CardTitle className="flex items-start justify-between gap-3">
                  <span>{order.orderNumber}</span>
                  <span className="rounded-full bg-white/10 px-2 py-1 text-xs">{order.priority || "Normal"}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                  <span>{order.orderType}{order.tableNumber ? ` · ${order.tableNumber}` : ""}</span>
                  <span className="text-right"><Clock3 className="mr-1 inline h-3.5 w-3.5" />{time(order.createdAt)} · {elapsed(order.createdAt)}</span>
                </div>
                {delay ? <div className={`rounded-lg p-2 text-sm ${delay.startsWith("Delayed") ? "bg-red-500/15 text-red-300" : delay === "Nearing delay" ? "bg-amber-500/15 text-amber-300" : "bg-emerald-500/10 text-emerald-300"}`}><Flame className="mr-1 inline h-4 w-4" />{delay}</div> : null}
                <div className="space-y-2 text-sm">
                  {order.items.map((item, index) => (
                    <div key={index} className="rounded-lg border border-white/10 p-3">
                      <p className="font-semibold">{item.quantity} × {item.name}{item.size && item.size !== "Standard" ? ` (${item.size})` : ""}</p>
                      {item.crustType ? <p className="text-muted-foreground">Crust: {item.crustType}</p> : null}
                      {item.extras?.length ? <p className="text-muted-foreground">Extras: {item.extras.map((extra) => extra.name).join(", ")}</p> : null}
                      {item.notes ? <p className="text-amber-300">Note: {item.notes}</p> : null}
                    </div>
                  ))}
                </div>
                {order.notes || order.kitchenNotes ? <p className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-200"><Bell className="mr-1 inline h-4 w-4" />{order.kitchenNotes || order.notes}</p> : null}
                <div className="grid gap-2 sm:grid-cols-2">
                  {(order.status === "New" || order.status === "New Order") ? <Button onClick={() => move(order, "Accepted")}>Accept Order</Button> : null}
                  {order.status === "Accepted" ? <Button onClick={() => move(order, "Preparing")}>Start Preparing</Button> : null}
                  {(order.status === "Preparing" || order.status === "In Kitchen") ? <Button onClick={() => move(order, "Ready")}>Mark Ready</Button> : null}
                  {order.status === "Ready" ? <Button onClick={() => move(order, "Completed")}>Mark Completed</Button> : null}
                  {order.status !== "Completed" && order.status !== "Delivered" ? <Button variant="outline" className="text-destructive" onClick={() => move(order, "Cancelled")}>Cancel</Button> : null}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
