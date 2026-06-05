import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "@/firebase/config";
import type { Revenue } from "@/types";

type WebsiteOrder = {
  orderNumber?: string;
  orderId?: string;
  customerName?: string;
  phone?: string;
  totalAmount?: number;
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
  items?: Array<{ name?: string; qty?: number }>;
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
  return firstItem?.name || `Online order #${order.orderNumber || order.orderId || "MAGNEETOZ"}`;
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
            amount: Number(order.totalAmount) || 0,
            date: orderDate(order),
            channel: "Website",
            createdAt: orderDate(order),
            source: "website",
            paymentStatus: order.paymentStatus || (isPaidOnline(order) ? "paid" : "pending"),
            paymentMethod: order.paymentMethod || order.paymentMode,
            orderStatus: order.status || order.orderStatus,
            revenueState: state,
            phone: order.phone
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
