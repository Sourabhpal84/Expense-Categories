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

export function subscribeRestaurantMenu(
  callback: (items: RestaurantMenuItem[]) => void,
  onError: (error: Error) => void
) {
  const database = requireDb();
  let categoryNames = new Map<string, string>();
  let dishes: Array<{ id: string; data: Record<string, unknown> }> = [];

  const publish = () => {
    callback(
      dishes
        .map(({ id, data }) => {
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
            variants: variantsFromDish(data)
          };
        })
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

  return () => {
    unsubscribeCategories();
    unsubscribeDishes();
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

export async function createRestaurantOrder(input: Omit<RestaurantOrder, "id" | "orderNumber" | "createdAt" | "updatedAt">) {
  const database = requireDb();
  const counterRef = doc(database, "counters", `restaurantOrders-${input.userId}`);
  const orderRef = doc(collection(database, "restaurantOrders"));

  return runTransaction(database, async (transaction) => {
    const counter = await transaction.get(counterRef);
    const next = numberValue(counter.data()?.value) + 1;
    const orderNumber = `M${String(next).padStart(3, "0")}`;
    const timestamp = nowIso();
    transaction.set(counterRef, { value: next, userId: input.userId, updatedAt: timestamp }, { merge: true });
    transaction.set(orderRef, {
      ...input,
      orderNumber,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdServerAt: serverTimestamp()
    });
    return { id: orderRef.id, orderNumber };
  });
}

export async function updateRestaurantOrderStatus(id: string, status: RestaurantOrderStatus) {
  const database = requireDb();
  const timestamp = nowIso();
  await updateDoc(doc(database, "restaurantOrders", id), {
    status,
    updatedAt: timestamp,
    ...(status === "Delivered" ? { deliveredAt: timestamp } : {}),
    ...(status === "Cancelled" ? { cancelledAt: timestamp } : {})
  });
  await addDoc(collection(database, "auditLogs"), {
    action: "status_update",
    collectionName: "restaurantOrders",
    payload: { id, status },
    createdAt: timestamp,
    createdServerAt: serverTimestamp()
  });
}
