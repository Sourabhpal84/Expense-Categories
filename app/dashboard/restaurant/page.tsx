"use client";

import { FormEvent, useMemo, useState } from "react";
import { ChefHat, Clock3, History, MessageCircle, Plus, Printer, Search, ShoppingCart, Trash2, TrendingUp } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { KitchenTicket } from "@/components/restaurant/kitchen-ticket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import { useRestaurantOperations } from "@/hooks/use-restaurant-operations";
import { createRestaurantOrder, updateRestaurantOrderStatus } from "@/services/restaurant-operations-service";
import type {
  RestaurantMenuItem,
  RestaurantOfferCode,
  RestaurantOrder,
  RestaurantOrderItem,
  RestaurantOrderStatus,
  RestaurantOrderType,
  RestaurantPaymentMethod,
  RestaurantPaymentStatus
} from "@/types";

const statuses: RestaurantOrderStatus[] = ["New Order", "In Kitchen", "Ready", "Delivered", "Cancelled"];
const activeStatuses: RestaurantOrderStatus[] = ["New Order", "In Kitchen", "Ready"];
const currency = (value: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
const localDate = (value: string) => new Date(value).toLocaleDateString("en-CA");
const localTime = (value: string) => new Date(value).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
const offerLabels: Record<RestaurantOfferCode, string> = {
  NONE: "No offer",
  OBGO: "OBGO - Buy 1 Get 1 Free",
  TBGO: "TBGO - Buy 2 Get 1 Free"
};

type Section = "new" | "active" | "history" | "summary";

function statusClass(status: RestaurantOrderStatus) {
  if (status === "Ready") return "bg-emerald-500/15 text-emerald-300";
  if (status === "In Kitchen") return "bg-amber-500/15 text-amber-300";
  if (status === "Delivered") return "bg-blue-500/15 text-blue-300";
  if (status === "Cancelled") return "bg-red-500/15 text-red-300";
  return "bg-violet-500/15 text-violet-300";
}

function whatsappMessage(order: RestaurantOrder) {
  const itemLines = order.items.map((item) => `${item.quantity} x ${item.name}${item.size && item.size !== "Standard" ? ` (${item.size.charAt(0)})` : ""}${item.notes ? ` - ${item.notes}` : ""}`).join("\n");
  return [
    "MAGNEETOZ - NEW ORDER",
    "",
    `Order No: ${order.orderNumber}`,
    `Time: ${localTime(order.createdAt)}`,
    `Type: ${order.orderType}`,
    ...(order.orderType === "Dine In" ? [`Table: ${order.tableNumber || "-"}`] : []),
    "",
    "Items:",
    itemLines,
    "",
    `Notes:`,
    order.notes || "None",
    "",
    "Payment:",
    order.paymentMethod,
    ...(order.offerCode && order.offerCode !== "NONE" ? ["", "Offer:", `${order.offerLabel || order.offerCode} (-${currency(order.discountAmount || 0)})`] : []),
    "",
    "Total:",
    currency(order.totalAmount),
    "",
    "Please prepare this order."
  ].join("\n");
}

function calculateOfferDiscount(items: RestaurantOrderItem[], offerCode: RestaurantOfferCode) {
  const unitPrices = items.flatMap((item) => Array.from({ length: Math.max(0, item.quantity) }, () => item.unitPrice)).sort((a, b) => a - b);
  if (offerCode === "OBGO") {
    const freeCount = Math.floor(unitPrices.length / 2);
    return unitPrices.slice(0, freeCount).reduce((sum, price) => sum + price, 0);
  }
  if (offerCode === "TBGO") {
    const freeCount = Math.floor(unitPrices.length / 3);
    return unitPrices.slice(0, freeCount).reduce((sum, price) => sum + price, 0);
  }
  return 0;
}

export default function RestaurantOperationsPage() {
  const { user, configured } = useAuth();
  const { menu, orders, loading, error, demoMode } = useRestaurantOperations();
  const { toast } = useToast();
  const [section, setSection] = useState<Section>("new");
  const [saving, setSaving] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null);
  const [menuSearch, setMenuSearch] = useState("");
  const [cart, setCart] = useState<RestaurantOrderItem[]>([]);
  const [offerCode, setOfferCode] = useState<RestaurantOfferCode>("NONE");
  const [form, setForm] = useState({
    customerName: "",
    mobileNumber: "",
    orderType: "Takeaway" as RestaurantOrderType,
    tableNumber: "",
    paymentMethod: "Cash" as RestaurantPaymentMethod,
    paymentStatus: "Unpaid" as RestaurantPaymentStatus,
    notes: ""
  });
  const [historySearch, setHistorySearch] = useState("");
  const [historyDate, setHistoryDate] = useState("");
  const [historyStatus, setHistoryStatus] = useState("all");
  const [historyPayment, setHistoryPayment] = useState("all");
  const [historyType, setHistoryType] = useState("all");

  const filteredMenu = useMemo(() => {
    const search = menuSearch.toLowerCase().trim();
    return menu.filter((item) => `${item.name} ${item.categoryName}`.toLowerCase().includes(search));
  }, [menu, menuSearch]);

  const subTotal = useMemo(() => cart.reduce((sum, item) => sum + item.lineTotal, 0), [cart]);
  const discountAmount = useMemo(() => calculateOfferDiscount(cart, offerCode), [cart, offerCode]);
  const total = Math.max(0, subTotal - discountAmount);
  const activeOrders = orders.filter((order) => activeStatuses.includes(order.status));
  const historyOrders = useMemo(() => orders.filter((order) => {
    const search = historySearch.toLowerCase().trim();
    const textMatch = !search || `${order.orderNumber} ${order.customerName || ""} ${order.mobileNumber || ""}`.toLowerCase().includes(search);
    return textMatch
      && (!historyDate || localDate(order.createdAt) === historyDate)
      && (historyStatus === "all" || order.status === historyStatus)
      && (historyPayment === "all" || order.paymentMethod === historyPayment)
      && (historyType === "all" || order.orderType === historyType);
  }), [historyDate, historyPayment, historySearch, historyStatus, historyType, orders]);

  const todayOrders = orders.filter((order) => localDate(order.createdAt) === localDate(new Date().toISOString()));
  const deliveredToday = todayOrders.filter((order) => order.status === "Delivered");
  const summary = {
    totalOrders: todayOrders.length,
    revenue: deliveredToday.reduce((sum, order) => sum + order.totalAmount, 0),
    cash: deliveredToday.filter((order) => order.paymentMethod === "Cash").reduce((sum, order) => sum + order.totalAmount, 0),
    upi: deliveredToday.filter((order) => order.paymentMethod === "UPI").reduce((sum, order) => sum + order.totalAmount, 0),
    delivered: deliveredToday.length,
    cancelled: todayOrders.filter((order) => order.status === "Cancelled").length,
    pending: todayOrders.filter((order) => activeStatuses.includes(order.status)).length
  };

  function addMenuItem(item: RestaurantMenuItem, variantIndex: number) {
    const variant = item.variants[variantIndex] || item.variants[0];
    const existingIndex = cart.findIndex((line) => line.menuItemId === item.id && line.size === variant.name && !line.notes);
    if (existingIndex >= 0) {
      setCart(cart.map((line, index) => index === existingIndex ? { ...line, quantity: line.quantity + 1, lineTotal: (line.quantity + 1) * line.unitPrice } : line));
      return;
    }
    setCart([...cart, { menuItemId: item.id, name: item.name, categoryName: item.categoryName, size: variant.name, unitPrice: variant.price, quantity: 1, lineTotal: variant.price }]);
  }

  function updateCart(index: number, patch: Partial<RestaurantOrderItem>) {
    setCart(cart.map((item, itemIndex) => {
      if (itemIndex !== index) return item;
      const next = { ...item, ...patch };
      return { ...next, quantity: Math.max(1, Number(next.quantity)), lineTotal: Math.max(1, Number(next.quantity)) * next.unitPrice };
    }));
  }

  async function submitOrder(event: FormEvent) {
    event.preventDefault();
    if (!user || !configured) return toast({ title: "Firebase required", description: "Connect Firebase to save restaurant orders." });
    if (!cart.length) return toast({ title: "Add at least one item", description: "Select an item from the live menu." });
    if (form.orderType === "Dine In" && !form.tableNumber.trim()) return toast({ title: "Table number required" });
    setSaving(true);
    try {
      const result = await createRestaurantOrder({
        userId: user.uid,
        customerName: form.customerName.trim() || undefined,
        mobileNumber: form.mobileNumber.trim() || undefined,
        orderType: form.orderType,
        tableNumber: form.orderType === "Dine In" ? form.tableNumber.trim() : undefined,
        items: cart,
        notes: form.notes.trim() || undefined,
        offerCode: offerCode === "NONE" ? undefined : offerCode,
        offerLabel: offerCode === "NONE" ? undefined : offerLabels[offerCode],
        discountAmount: discountAmount || undefined,
        subTotal,
        paymentMethod: form.paymentMethod,
        paymentStatus: form.paymentStatus,
        totalAmount: total,
        status: "New Order"
      });
      const printableOrder: RestaurantOrder = { id: result.id, orderNumber: result.orderNumber, userId: user.uid, ...form, tableNumber: form.orderType === "Dine In" ? form.tableNumber : undefined, items: cart, offerCode: offerCode === "NONE" ? undefined : offerCode, offerLabel: offerCode === "NONE" ? undefined : offerLabels[offerCode], discountAmount: discountAmount || undefined, subTotal, totalAmount: total, status: "New Order", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
      setSelectedOrder(printableOrder);
      setCart([]);
      setOfferCode("NONE");
      setForm({ customerName: "", mobileNumber: "", orderType: "Takeaway", tableNumber: "", paymentMethod: "Cash", paymentStatus: "Unpaid", notes: "" });
      toast({ title: `${result.orderNumber} created`, description: "Kitchen ticket is ready to print." });
    } catch (value) {
      toast({ title: "Order was not saved", description: value instanceof Error ? value.message : "Please try again." });
    } finally {
      setSaving(false);
    }
  }

  async function changeStatus(order: RestaurantOrder, status: RestaurantOrderStatus) {
    try {
      await updateRestaurantOrderStatus(order.id, status);
      toast({ title: `${order.orderNumber} marked ${status}` });
    } catch (value) {
      toast({ title: "Status update failed", description: value instanceof Error ? value.message : "Please try again." });
    }
  }

  function sendToCook(order: RestaurantOrder) {
    const url = `https://wa.me/919555971061?text=${encodeURIComponent(whatsappMessage(order))}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function printOrder(order: RestaurantOrder) {
    setSelectedOrder(order);
    setTimeout(() => window.print(), 50);
  }

  const tabs: Array<{ id: Section; label: string; icon: typeof Plus }> = [
    { id: "new", label: "New Order", icon: Plus },
    { id: "active", label: `Active Orders (${activeOrders.length})`, icon: ChefHat },
    { id: "history", label: "Order History", icon: History },
    { id: "summary", label: "Daily Summary", icon: TrendingUp }
  ];

  return (
    <>
      <div className="restaurant-screen space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Restaurant Operations</h1>
          <p className="text-sm text-muted-foreground">Take orders, print kitchen tickets, and track every order through delivery.</p>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return <Button key={tab.id} variant={section === tab.id ? "default" : "outline"} className="shrink-0" onClick={() => setSection(tab.id)}><Icon className="h-4 w-4" />{tab.label}</Button>;
          })}
        </div>
        {error ? <Card className="border-destructive/50"><CardContent className="p-4 text-sm text-destructive">{error}</CardContent></Card> : null}

        {section === "new" ? (
          <form className="grid gap-6 xl:grid-cols-[1.25fr_.75fr]" onSubmit={submitOrder}>
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-primary" />Live menu</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="relative"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={menuSearch} onChange={(event) => setMenuSearch(event.target.value)} placeholder="Search pizzas, sides, categories..." /></div>
                {loading ? <p className="py-10 text-center text-muted-foreground">Loading live menu...</p> : null}
                {!loading && !filteredMenu.length ? <p className="py-10 text-center text-muted-foreground">No available menu items found in the dishes collection.</p> : null}
                <div className="grid gap-3 sm:grid-cols-2">
                  {filteredMenu.map((item) => (
                    <div key={item.id} className="rounded-lg border border-white/10 bg-white/[.03] p-4">
                      <p className="font-medium">{item.name}</p>
                      <p className="mb-3 text-xs text-muted-foreground">{item.categoryName}</p>
                      <div className="flex flex-wrap gap-2">
                        {item.variants.map((variant, index) => <Button key={`${variant.name}-${index}`} type="button" size="sm" variant="outline" onClick={() => addMenuItem(item, index)}>{variant.name !== "Standard" ? `${variant.name} · ` : ""}{currency(variant.price)}</Button>)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader><CardTitle>Order information</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Customer name (optional)</Label><Input value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} /></div>
                  <div className="space-y-2"><Label>Mobile number (optional)</Label><Input inputMode="tel" value={form.mobileNumber} onChange={(event) => setForm({ ...form, mobileNumber: event.target.value })} /></div>
                  <div className="space-y-2"><Label>Order type</Label><Select value={form.orderType} onValueChange={(value) => setForm({ ...form, orderType: value as RestaurantOrderType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Dine In">Dine In</SelectItem><SelectItem value="Takeaway">Takeaway</SelectItem></SelectContent></Select></div>
                  {form.orderType === "Dine In" ? <div className="space-y-2"><Label>Table number</Label><Input value={form.tableNumber} onChange={(event) => setForm({ ...form, tableNumber: event.target.value })} required /></div> : null}
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Selected items</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  {!cart.length ? <p className="py-6 text-center text-sm text-muted-foreground">Choose items from the live menu.</p> : null}
                  {cart.map((item, index) => (
                    <div key={`${item.menuItemId}-${item.size}-${index}`} className="space-y-3 rounded-lg border border-white/10 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <div><p className="font-medium">{item.name}</p><p className="text-xs text-muted-foreground">{item.size} · {currency(item.unitPrice)}</p></div>
                        <Button type="button" size="icon" variant="ghost" onClick={() => setCart(cart.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                      <div className="grid grid-cols-[90px_1fr] gap-2"><Input type="number" min="1" value={item.quantity} onChange={(event) => updateCart(index, { quantity: Number(event.target.value) })} /><Input value={item.notes || ""} onChange={(event) => updateCart(index, { notes: event.target.value })} placeholder="Item instructions" /></div>
                    </div>
                  ))}
                  <div className="space-y-2"><Label>Order notes / special instructions</Label><Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /></div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle>Payment</CardTitle></CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2"><Label>Method</Label><Select value={form.paymentMethod} onValueChange={(value) => setForm({ ...form, paymentMethod: value as RestaurantPaymentMethod })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Cash">Cash</SelectItem><SelectItem value="UPI">UPI</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2"><Label>Status</Label><Select value={form.paymentStatus} onValueChange={(value) => setForm({ ...form, paymentStatus: value as RestaurantPaymentStatus })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Paid">Paid</SelectItem><SelectItem value="Unpaid">Unpaid</SelectItem></SelectContent></Select></div>
                  <div className="space-y-2 sm:col-span-2">
                    <Label>Offer</Label>
                    <Select value={offerCode} onValueChange={(value) => setOfferCode(value as RestaurantOfferCode)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">No offer</SelectItem>
                        <SelectItem value="OBGO">OBGO - Buy 1 Get 1 Free</SelectItem>
                        <SelectItem value="TBGO">TBGO - Buy 2 Get 1 Free</SelectItem>
                      </SelectContent>
                    </Select>
                    {offerCode !== "NONE" ? <p className="text-xs text-muted-foreground">Free item discount is applied on the lowest priced eligible item.</p> : null}
                  </div>
                  {discountAmount > 0 ? <div className="space-y-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm sm:col-span-2"><div className="flex justify-between"><span>Subtotal</span><span>{currency(subTotal)}</span></div><div className="flex justify-between text-emerald-300"><span>{offerLabels[offerCode]}</span><span>-{currency(discountAmount)}</span></div></div> : null}
                  <div className="flex items-center justify-between text-xl font-semibold sm:col-span-2"><span>Total</span><span>{currency(total)}</span></div>
                  <Button className="sm:col-span-2" disabled={saving || demoMode || !cart.length}>{saving ? "Saving order..." : "Save Order & Generate KOT"}</Button>
                </CardContent>
              </Card>
              {selectedOrder ? <Card className="border-primary/40"><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-medium">{selectedOrder.orderNumber} is ready</p><p className="text-sm text-muted-foreground">Print the kitchen ticket or send it to the cook.</p></div><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => sendToCook(selectedOrder)}><MessageCircle className="h-4 w-4" />Send to Cook</Button><Button type="button" onClick={() => printOrder(selectedOrder)}><Printer className="h-4 w-4" />Print KOT</Button></div></CardContent></Card> : null}
            </div>
          </form>
        ) : null}

        {section === "active" ? (
          <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {!activeOrders.length && !loading ? <Card><CardContent className="p-8 text-center text-muted-foreground">No active orders.</CardContent></Card> : null}
            {activeOrders.map((order) => (
              <Card key={order.id}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start justify-between"><div><p className="text-xl font-semibold">{order.orderNumber}</p><p className="text-sm text-muted-foreground">{order.customerName || "Walk-in customer"} · {order.orderType}{order.tableNumber ? ` · ${order.tableNumber}` : ""}</p></div><span className={`rounded-full px-2.5 py-1 text-xs ${statusClass(order.status)}`}>{order.status}</span></div>
                  <div className="space-y-1 text-sm">{order.items.map((item, index) => <p key={index}>{item.quantity} × {item.name}{item.size !== "Standard" ? ` (${item.size})` : ""}</p>)}</div>
                  {order.offerCode ? <p className="text-sm text-emerald-300">{order.offerLabel || order.offerCode}: -{currency(order.discountAmount || 0)}</p> : null}
                  <div className="flex justify-between border-t border-white/10 pt-3 text-sm"><span>{order.paymentMethod} · {order.paymentStatus}</span><strong>{currency(order.totalAmount)}</strong></div>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="h-3.5 w-3.5" />{localTime(order.createdAt)}</p>
                  <div className="flex flex-wrap gap-2">
                    {order.status === "New Order" ? <Button size="sm" onClick={() => changeStatus(order, "In Kitchen")}>Start Kitchen</Button> : null}
                    {order.status === "In Kitchen" ? <Button size="sm" onClick={() => changeStatus(order, "Ready")}>Mark Ready</Button> : null}
                    {order.status === "Ready" ? <Button size="sm" onClick={() => changeStatus(order, "Delivered")}>Mark Delivered</Button> : null}
                    <Button size="sm" variant="outline" onClick={() => sendToCook(order)}><MessageCircle className="h-4 w-4" />Send to Cook</Button>
                    <Button size="sm" variant="outline" onClick={() => printOrder(order)}><Printer className="h-4 w-4" />KOT</Button>
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => changeStatus(order, "Cancelled")}>Cancel</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : null}

        {section === "history" ? (
          <Card>
            <CardHeader><CardTitle>Order history</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-5">
                <div className="relative md:col-span-2"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={historySearch} onChange={(event) => setHistorySearch(event.target.value)} placeholder="Order, customer, mobile..." /></div>
                <Input type="date" value={historyDate} onChange={(event) => setHistoryDate(event.target.value)} />
                <Select value={historyStatus} onValueChange={setHistoryStatus}><SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{statuses.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select>
                <Button variant="outline" onClick={() => { setHistorySearch(""); setHistoryDate(""); setHistoryStatus("all"); setHistoryPayment("all"); setHistoryType("all"); }}>Clear filters</Button>
                <Select value={historyPayment} onValueChange={setHistoryPayment}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All payments</SelectItem><SelectItem value="Cash">Cash</SelectItem><SelectItem value="UPI">UPI</SelectItem></SelectContent></Select>
                <Select value={historyType} onValueChange={setHistoryType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All order types</SelectItem><SelectItem value="Dine In">Dine In</SelectItem><SelectItem value="Takeaway">Takeaway</SelectItem></SelectContent></Select>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-sm">
                  <thead className="text-left text-muted-foreground"><tr className="border-b border-white/10"><th className="py-3">Order</th><th>Customer</th><th>Type</th><th>Payment</th><th>Status</th><th>Time</th><th className="text-right">Total</th><th className="text-right">Actions</th></tr></thead>
                  <tbody>{historyOrders.map((order) => <tr key={order.id} className="border-b border-white/5"><td className="py-3 font-medium">{order.orderNumber}</td><td>{order.customerName || "Walk-in"}<br /><span className="text-xs text-muted-foreground">{order.mobileNumber || ""}</span></td><td>{order.orderType}</td><td>{order.paymentMethod} · {order.paymentStatus}{order.offerCode ? <><br /><span className="text-xs text-emerald-300">{order.offerCode} -{currency(order.discountAmount || 0)}</span></> : null}</td><td><span className={`rounded-full px-2 py-1 text-xs ${statusClass(order.status)}`}>{order.status}</span></td><td>{localDate(order.createdAt)}<br /><span className="text-xs text-muted-foreground">{localTime(order.createdAt)}</span></td><td className="text-right font-medium">{currency(order.totalAmount)}</td><td><div className="flex justify-end gap-1"><Button size="icon" variant="ghost" onClick={() => sendToCook(order)} aria-label="Send to cook"><MessageCircle className="h-4 w-4" /></Button><Button size="icon" variant="ghost" onClick={() => printOrder(order)} aria-label="Print KOT"><Printer className="h-4 w-4" /></Button></div></td></tr>)}</tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {section === "summary" ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[
              ["Total Orders", summary.totalOrders],
              ["Total Revenue", currency(summary.revenue)],
              ["Cash Collection", currency(summary.cash)],
              ["UPI Collection", currency(summary.upi)],
              ["Delivered Orders", summary.delivered],
              ["Cancelled Orders", summary.cancelled],
              ["Pending Orders", summary.pending]
            ].map(([label, value]) => <Card key={label}><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-3xl font-semibold">{value}</p></CardContent></Card>)}
          </div>
        ) : null}
      </div>
      <KitchenTicket order={selectedOrder} />
    </>
  );
}
