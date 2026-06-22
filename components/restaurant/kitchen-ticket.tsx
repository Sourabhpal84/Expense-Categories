"use client";

import type { RestaurantOrder } from "@/types";

export function KitchenTicket({ order }: { order: RestaurantOrder | null }) {
  if (!order) return null;
  const time = new Date(order.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  return (
    <section id="kitchen-ticket" className="hidden print:block">
      <div className="mx-auto max-w-3xl border-2 border-black p-8 font-sans text-black">
        <h1 className="text-center text-3xl font-bold">MAGNEETOZ - KITCHEN ORDER</h1>
        <div className="my-6 grid grid-cols-2 gap-3 border-y-2 border-black py-4 text-xl">
          <p><strong>Order:</strong> {order.orderNumber}</p>
          <p><strong>Time:</strong> {time}</p>
          <p><strong>Type:</strong> {order.orderType}</p>
          <p><strong>{order.orderType === "Dine In" ? "Table" : "Order"}:</strong> {order.orderType === "Dine In" ? order.tableNumber || "-" : "Takeaway"}</p>
        </div>
        <table className="w-full border-collapse text-xl">
          <thead><tr className="border-b-2 border-black"><th className="py-3 text-left">Qty</th><th className="text-left">Item</th><th className="text-left">Instructions</th></tr></thead>
          <tbody>
            {order.items.map((item, index) => (
              <tr key={`${item.menuItemId}-${index}`} className="border-b border-black">
                <td className="py-4 align-top font-bold">{item.quantity}</td>
                <td className="align-top font-semibold">{item.name}{item.size && item.size !== "Standard" ? ` (${item.size})` : ""}</td>
                <td className="align-top">{item.notes || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {order.notes ? <div className="mt-8 border-2 border-black p-4 text-xl"><strong>Order Notes:</strong> {order.notes}</div> : null}
      </div>
    </section>
  );
}
