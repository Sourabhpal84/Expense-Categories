import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/firebase/config";
import type { Revenue } from "@/types";

type WebsiteOrder = {
  orderNumber?: string;
  orderId?: string;
  customerName?: string;
  name?: string;
  phone?: string;
  mobileNumber?: string;
  customerPhone?: string;
  address?: string;
  deliveryAddress?: string | { address?: string; line1?: string; city?: string; pincode?: string };
  totalAmount?: number;
  amount?: number;
  grandTotal?: number;
  paymentMethod?: string;
  paymentMode?: string;
  paymentStatus?: string;
  status?: string;
  orderStatus?: string;
  refundStatus?: string;
  cancelledAt?: unknown;
  rejectedAt?: unknown;
  paymentCaptured?: boolean;
  razorpayPaymentId?: string;
  createdAt?: { toDate?: () => Date } | string;
  items?: Array<{ name?: string; title?: string; productName?: string; qty?: number; quantity?: number; size?: string; price?: number }>;
};

function requireDb() {
  if (!db) throw new Error("Firebase is not configured.");
  return db;
}

function orderDate(order: WebsiteOrder) {
  if (order.createdAt && typeof order.createdAt === "object" && "toDate" in order.createdAt && order.createdAt.toDate) {
    return order.createdAt.toDate().toISOString().slice(0, 10);
  }
  if (typeof order.createdAt === "string") {
    const date = new Date(order.createdAt);
    if (!Number.isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

function isPaidOnline(order: WebsiteOrder) {
  const method = String(order.paymentMethod || order.paymentMode || "").toLowerCase();
  const status = String(order.paymentStatus || "").toLowerCase();
  return (method === "upi" || method === "online") && (status === "paid" || status === "success" || order.paymentCaptured === true || Boolean(order.razorpayPaymentId));
}

function orderStatus(order: WebsiteOrder) {
  return String(order.status || order.orderStatus || "").toLowerCase();
}

function isDelivered(order: WebsiteOrder) {
  return orderStatus(order) === "delivered";
}

function isCod(order: WebsiteOrder) {
  const method = String(order.paymentMethod || order.paymentMode || "").toLowerCase();
  return method === "cod" || method === "cash";
}

function isRefunded(order: WebsiteOrder) {
  const status = orderStatus(order);
  const payment = String(order.paymentStatus || "").toLowerCase();
  return status === "refunded" || status === "returned" || payment === "refunded" || order.refundStatus === "refunded";
}

function isLost(order: WebsiteOrder) {
  return ["cancelled", "canceled", "rejected", "failed"].includes(orderStatus(order)) || Boolean(order.cancelledAt) || Boolean(order.rejectedAt);
}

function revenueState(order: WebsiteOrder): Revenue["revenueState"] {
  if (isRefunded(order)) return "refunded";
  if (isLost(order)) return "lost";
  if (isCod(order)) return isDelivered(order) ? "net" : "pending";
  return isDelivered(order) && isPaidOnline(order) ? "net" : "pending";
}

function bestSellingProduct(order: WebsiteOrder) {
  const firstItem = order.items?.[0];
  return firstItem?.name || firstItem?.title || firstItem?.productName || `Online order #${order.orderNumber || order.orderId || "MAGNEETOZ"}`;
}

function customerName(order: WebsiteOrder) {
  return order.customerName || order.name || "Online customer";
}

function customerPhone(order: WebsiteOrder) {
  return order.phone || order.mobileNumber || order.customerPhone || "";
}

function orderItems(order: WebsiteOrder) {
  return (order.items || [])
    .map((item) => {
      const name = item.name || item.title || item.productName || "Item";
      const quantity = Number(item.quantity || item.qty || 1);
      const size = item.size ? ` (${item.size})` : "";
      return `${quantity} x ${name}${size}`;
    })
    .join(", ");
}

function deliveryAddress(order: WebsiteOrder) {
  if (typeof order.deliveryAddress === "string") return order.deliveryAddress;
  if (order.deliveryAddress && typeof order.deliveryAddress === "object") {
    return [order.deliveryAddress.address, order.deliveryAddress.line1, order.deliveryAddress.city, order.deliveryAddress.pincode].filter(Boolean).join(", ");
  }
  return order.address || "";
}

function orderTotal(order: WebsiteOrder) {
  return Number(order.totalAmount || order.grandTotal || order.amount || 0);
}

export function subscribeWebsiteOnlineRevenue(userId: string, callback: (items: Revenue[]) => void, onError?: (error: Error) => void) {
  const database = requireDb();
  const ordersQuery = query(collection(database, "orders"), where("orderSource", "==", "online"));

  return onSnapshot(
    ordersQuery,
    (snapshot) => {
      const revenues = snapshot.docs
        .map((docSnap) => {
          const order = docSnap.data() as WebsiteOrder;
          const state = revenueState(order);
          return {
            id: `website-${docSnap.id}`,
            userId,
            product: bestSellingProduct(order),
            orders: 1,
            amount: orderTotal(order),
            date: orderDate(order),
            channel: "Website",
            createdAt: orderDate(order),
            source: "website",
            revenueSource: `Online order ${order.orderNumber || order.orderId || docSnap.id}`,
            revenueType: "Food Sales",
            paymentStatus: order.paymentStatus || (isPaidOnline(order) ? "paid" : "pending"),
            paymentMethod: order.paymentMethod || order.paymentMode,
            orderStatus: order.status || order.orderStatus,
            orderNumber: order.orderNumber || order.orderId || docSnap.id,
            customerName: customerName(order),
            orderItems: orderItems(order),
            deliveryAddress: deliveryAddress(order),
            paymentReference: order.razorpayPaymentId,
            notes: [
              `Customer: ${customerName(order)}`,
              customerPhone(order) ? `Phone: ${customerPhone(order)}` : "",
              orderItems(order) ? `Items: ${orderItems(order)}` : "",
              deliveryAddress(order) ? `Address: ${deliveryAddress(order)}` : "",
              order.razorpayPaymentId ? `Payment Ref: ${order.razorpayPaymentId}` : ""
            ].filter(Boolean).join(" | "),
            revenueState: state,
            phone: customerPhone(order)
          } satisfies Revenue;
        })
        .sort((a, b) => b.date.localeCompare(a.date));
      callback(revenues);
    },
    (error) => {
      console.warn("[MAGNEETOZ] Website revenue sync failed", error);
      callback([]);
      onError?.(error);
    }
  );
}
