import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "@/firebase/config";
import type {
  RestaurantMenuItem,
  RestaurantMenuVariant,
  RestaurantOrder,
  RestaurantPaymentStatus,
  RestaurantPaymentMethod,
  RestaurantOrderStatus
} from "@/types";

const nowIso = () => new Date().toISOString();

function requireDb() {
  if (!db) throw new Error("Firebase is not configured.");
  return db;
}

function numberValue(value: unknown) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function withoutUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => withoutUndefined(entry)) as T;
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .map(([key, entry]) => [key, withoutUndefined(entry)])
    ) as T;
  }
  return value;
}

function canonicalStatus(status: RestaurantOrderStatus): RestaurantOrderStatus {
  if (status === "New Order") return "New";
  if (status === "In Kitchen") return "Preparing";
  if (status === "Delivered") return "Completed";
  return status;
}

function statusTimestampField(status: RestaurantOrderStatus) {
  const normalized = canonicalStatus(status);
  if (normalized === "Accepted") return "acceptedAt";
  if (normalized === "Preparing") return "preparingAt";
  if (normalized === "Ready") return "readyAt";
  if (normalized === "Completed") return "completedAt";
  if (normalized === "Cancelled") return "cancelledAt";
  return "";
}

function normalizePayment(totalAmount: number, paymentStatus: RestaurantPaymentStatus, amountReceived = 0) {
  const received = paymentStatus === "Paid" ? totalAmount : paymentStatus === "Partially paid" ? Math.min(totalAmount, Math.max(0, amountReceived)) : 0;
  const pending = Math.max(0, totalAmount - received);
  return {
    amountReceived: received,
    pendingAmount: pending,
    paymentStatus: pending <= 0 ? "Paid" as RestaurantPaymentStatus : received > 0 ? "Partially paid" as RestaurantPaymentStatus : "Unpaid" as RestaurantPaymentStatus
  };
}

function normalizeOrderPricing(input: Omit<RestaurantOrder, "id" | "orderNumber" | "createdAt" | "updatedAt">) {
  let onionCount = 0;
  const items = input.items.map((item) => {
    const quantity = Math.max(1, Number(item.quantity || 1));
    const isOnionPizza = item.name.trim().toLowerCase() === "onion pizza";
    let lineBase = 0;
    if (isOnionPizza) {
      for (let index = 0; index < quantity; index += 1) {
        onionCount += 1;
        lineBase += onionCount === 1 ? 49 : 59;
      }
    } else {
      lineBase = Number(item.unitPrice || 0) * quantity;
    }
    const extrasTotal = (item.extras || []).reduce((sum, extra) => sum + Number(extra.price || 0), 0);
    const lineTotal = lineBase + extrasTotal * quantity;
    return withoutUndefined({
      ...item,
      quantity,
      baseUnitPrice: isOnionPizza ? (onionCount === 1 ? 49 : 59) : item.baseUnitPrice || item.unitPrice,
      unitPrice: isOnionPizza ? lineBase / quantity : Number(item.unitPrice || 0),
      extrasTotal,
      lineTotal
    });
  });
  const itemSubTotal = items.reduce((sum, item) => sum + Number(item.lineTotal || 0), 0);
  const discountAmount = Number(input.discountAmount || 0) + Number(input.manualDiscountAmount || 0);
  const taxAmount = Number(input.taxAmount || 0);
  const deliveryCharge = Number(input.deliveryCharge || 0);
  const packagingCharge = Number(input.packagingCharge || 0);
  const totalAmount = Math.max(0, itemSubTotal - discountAmount + taxAmount + deliveryCharge + packagingCharge);
  const payment = normalizePayment(totalAmount, input.paymentStatus, input.amountReceived);
  return {
    items,
    subTotal: itemSubTotal,
    discountAmount,
    taxAmount,
    deliveryCharge,
    packagingCharge,
    totalAmount,
    ...payment
  };
}

function variantsFromDish(data: Record<string, unknown>): RestaurantMenuVariant[] {
  const candidates = data.sizes || data.variants || data.prices;
  if (Array.isArray(candidates)) {
    const variants = candidates.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const row = entry as Record<string, unknown>;
      const name = String(row.name || row.size || row.label || "").trim();
      const price = numberValue(row.price || row.amount || row.value);
      return name && price >= 0 ? [{ name, price }] : [];
    });
    if (variants.length) return variants;
  }
  if (candidates && typeof candidates === "object") {
    const variants = Object.entries(candidates as Record<string, unknown>)
      .map(([name, value]) => {
        const price = value && typeof value === "object"
          ? numberValue((value as Record<string, unknown>).price || (value as Record<string, unknown>).amount || (value as Record<string, unknown>).sellingPrice)
          : numberValue(value);
        return { name, price };
      })
      .filter((variant) => variant.price >= 0);
    if (variants.length) return variants;
  }
  return [{ name: String(data.size || "Standard"), price: numberValue(data.price || data.basePrice || data.sellingPrice) }];
}

function comboDescription(data: Record<string, unknown>) {
  if (data.description) return String(data.description);
  const items = data.items || data.comboItems || data.products || data.dishes;
  if (!Array.isArray(items)) return "";
  return items
    .map((entry) => {
      if (!entry || typeof entry !== "object") return String(entry || "").trim();
      const row = entry as Record<string, unknown>;
      const quantity = Number(row.quantity || row.qty || 1);
      const name = String(row.name || row.title || row.productName || row.dishName || "").trim();
      return name ? `${quantity} x ${name}` : "";
    })
    .filter(Boolean)
    .join(", ");
}

function variantsFromCombo(data: Record<string, unknown>): RestaurantMenuVariant[] {
  const sizedVariants = variantsFromDish(data).filter((variant) => variant.price > 0);
  if (sizedVariants.length) return sizedVariants;
  const price = numberValue(data.price || data.comboPrice || data.offerPrice || data.sellingPrice || data.totalPrice || data.amount);
  return [{ name: "Combo", price }];
}

export function subscribeRestaurantMenu(
  callback: (items: RestaurantMenuItem[]) => void,
  onError: (error: Error) => void
) {
  const database = requireDb();
  let categoryNames = new Map<string, string>();
  let dishes: Array<{ id: string; data: Record<string, unknown> }> = [];
  let combos: Array<{ id: string; data: Record<string, unknown> }> = [];

  const publish = () => {
    const dishItems = dishes.map(({ id, data }) => {
      const categoryId = String(data.categoryId || "");
      const directCategoryName = typeof data.category === "string" ? data.category : "";
      return {
        id,
        name: String(data.name || data.title || data.productName || "Unnamed item"),
        categoryId: categoryId || undefined,
        categoryName: String(data.categoryName || categoryNames.get(categoryId) || directCategoryName || "Other"),
        description: String(data.description || ""),
        imageUrl: String(data.imageUrl || data.image || ""),
        available: data.available !== false && data.isAvailable !== false && data.active !== false,
        variants: variantsFromDish(data),
        productType: "dish" as const
      };
    });
    const comboItems = combos.map(({ id, data }) => {
      const categoryId = String(data.categoryId || "");
      return {
        id: `combo-${id}`,
        name: String(data.name || data.title || data.comboName || "Unnamed combo"),
        categoryId: categoryId || undefined,
        categoryName: String(data.categoryName || categoryNames.get(categoryId) || data.category || "Combos"),
        description: comboDescription(data),
        imageUrl: String(data.imageUrl || data.image || data.photoUrl || ""),
        available: data.available !== false && data.isAvailable !== false && data.active !== false && data.enabled !== false,
        variants: variantsFromCombo(data),
        productType: "combo" as const
      };
    });
    callback(
      [...dishItems, ...comboItems]
        .filter((item) => item.available)
        .sort((a, b) => a.categoryName.localeCompare(b.categoryName) || a.name.localeCompare(b.name))
    );
  };

  const unsubscribeCategories = onSnapshot(
    collection(database, "categories"),
    (snapshot) => {
      categoryNames = new Map(
        snapshot.docs.map((category) => {
          const data = category.data();
          return [category.id, String(data.name || data.title || category.id)];
        })
      );
      publish();
    },
    (error) => onError(error)
  );

  const unsubscribeDishes = onSnapshot(
    collection(database, "dishes"),
    (snapshot) => {
      dishes = snapshot.docs.map((dish) => ({ id: dish.id, data: dish.data() }));
      publish();
    },
    (error) => onError(error)
  );

  const unsubscribeCombos = onSnapshot(
    collection(database, "combos"),
    (snapshot) => {
      combos = snapshot.docs.map((combo) => ({ id: combo.id, data: combo.data() }));
      publish();
    },
    (error) => onError(error)
  );

  return () => {
    unsubscribeCategories();
    unsubscribeDishes();
    unsubscribeCombos();
  };
}

export function subscribeRestaurantOrders(
  userId: string,
  callback: (orders: RestaurantOrder[]) => void,
  onError: (error: Error) => void
) {
  const database = requireDb();
  return onSnapshot(
    query(collection(database, "restaurantOrders"), where("userId", "==", userId)),
    (snapshot) => {
      const orders = snapshot.docs
        .map((order) => ({ id: order.id, ...order.data() }) as RestaurantOrder)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      callback(orders);
    },
    (error) => onError(error)
  );
}

export function subscribeKitchenOrders(
  userId: string,
  callback: (orders: RestaurantOrder[]) => void,
  onError: (error: Error) => void
) {
  return subscribeRestaurantOrders(userId, callback, onError);
}

export async function createRestaurantOrder(input: Omit<RestaurantOrder, "id" | "orderNumber" | "createdAt" | "updatedAt">) {
  const database = requireDb();
  const counterRef = doc(database, "counters", `restaurantOrders-${input.userId}`);
  const orderRef = doc(collection(database, "restaurantOrders"));
  const pricing = normalizeOrderPricing(input);

  return runTransaction(database, async (transaction) => {
    const counter = await transaction.get(counterRef);
    const next = numberValue(counter.data()?.value) + 1;
    const orderNumber = `M${String(next).padStart(3, "0")}`;
    const timestamp = nowIso();
    transaction.set(counterRef, { value: next, userId: input.userId, updatedAt: timestamp }, { merge: true });
    transaction.set(orderRef, withoutUndefined({
      ...input,
      ...pricing,
      orderNumber,
      status: canonicalStatus(input.status || "New"),
      priority: input.priority || "Normal",
      createdBy: input.createdBy || input.userId,
      updatedBy: input.updatedBy || input.userId,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdServerAt: serverTimestamp()
    }));
    return { id: orderRef.id, orderNumber };
  });
}

export async function updateRestaurantOrderStatus(id: string, status: RestaurantOrderStatus, actorId?: string, note?: string) {
  const database = requireDb();
  const timestamp = nowIso();
  const normalized = canonicalStatus(status);
  const timestampField = statusTimestampField(normalized);
  await updateDoc(doc(database, "restaurantOrders", id), withoutUndefined({
    status: normalized,
    updatedAt: timestamp,
    updatedBy: actorId,
    kitchenNotes: note || undefined,
    ...(timestampField ? { [timestampField]: timestamp } : {})
  }));
  await addDoc(collection(database, "restaurantOrderStatusHistory"), withoutUndefined({
    orderId: id,
    status: normalized,
    note,
    actorId,
    createdAt: timestamp,
    createdServerAt: serverTimestamp()
  }));
  await addDoc(collection(database, "auditLogs"), {
    action: "status_update",
    collectionName: "restaurantOrders",
    payload: { id, status: normalized },
    createdAt: timestamp,
    createdServerAt: serverTimestamp()
  });
}

export async function updateRestaurantOrderPaymentStatus(
  id: string,
  paymentStatus: RestaurantPaymentStatus,
  amountReceived?: number,
  paymentMethod?: RestaurantPaymentMethod,
  actorId?: string
) {
  const database = requireDb();
  const timestamp = nowIso();
  await runTransaction(database, async (transaction) => {
    const orderRef = doc(database, "restaurantOrders", id);
    const orderSnap = await transaction.get(orderRef);
    const order = orderSnap.data() as RestaurantOrder | undefined;
    if (!order) throw new Error("Order not found.");
    const payment = normalizePayment(Number(order.totalAmount || 0), paymentStatus, amountReceived);
    transaction.update(orderRef, withoutUndefined({
      ...payment,
      paymentMethod: paymentMethod || order.paymentMethod,
      updatedAt: timestamp,
      updatedBy: actorId,
      paidAt: payment.paymentStatus === "Paid" ? timestamp : order.paidAt
    }));
    transaction.set(doc(collection(database, "restaurantPaymentHistory")), withoutUndefined({
      orderId: id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      paymentStatus: payment.paymentStatus,
      paymentMethod: paymentMethod || order.paymentMethod,
      amountReceived: payment.amountReceived,
      pendingAmount: payment.pendingAmount,
      actorId,
      createdAt: timestamp,
      createdServerAt: serverTimestamp()
    }));
    transaction.set(doc(collection(database, "auditLogs")), {
      action: "payment_status_update",
      collectionName: "restaurantOrders",
      payload: { id, paymentStatus: payment.paymentStatus },
      createdAt: timestamp,
      createdServerAt: serverTimestamp()
    });
  });
}

export async function cancelRestaurantOrder(id: string, reason: string, refundStatus: string, actorId?: string) {
  const database = requireDb();
  const timestamp = nowIso();
  await updateDoc(doc(database, "restaurantOrders", id), withoutUndefined({
    status: "Cancelled",
    cancellationReason: reason,
    refundStatus,
    updatedBy: actorId,
    updatedAt: timestamp,
    cancelledAt: timestamp
  }));
  await addDoc(collection(database, "restaurantOrderStatusHistory"), withoutUndefined({
    orderId: id,
    status: "Cancelled",
    note: reason,
    actorId,
    createdAt: timestamp,
    createdServerAt: serverTimestamp()
  }));
}
