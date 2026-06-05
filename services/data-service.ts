import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "@/firebase/config";
import type { Budget, Expense, InventoryItem, Revenue } from "@/types";

const nowIso = () => new Date().toISOString();

function requireDb() {
  if (!db) throw new Error("Firebase is not configured.");
  return db;
}

function removeUndefinedFields<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

async function addAuditLog(action: string, collectionName: string, payload: Record<string, unknown>) {
  const database = requireDb();
  await addDoc(collection(database, "auditLogs"), removeUndefinedFields({
    action,
    collectionName,
    payload,
    createdAt: nowIso(),
    createdServerAt: serverTimestamp()
  }));
}

export function subscribeUserCollection<T extends { id: string }>(
  userId: string,
  collectionName: string,
  callback: (items: T[]) => void,
  sortField = "createdAt"
) {
  const database = requireDb();
  return onSnapshot(
    query(collection(database, collectionName), where("userId", "==", userId)),
    (snapshot) => {
      const items = snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T);
      callback(
        items.sort((a, b) => {
          const left = String((a as Record<string, unknown>)[sortField] || "");
          const right = String((b as Record<string, unknown>)[sortField] || "");
          return right.localeCompare(left);
        })
      );
    }
  );
}

export async function addExpense(input: Omit<Expense, "id" | "createdAt" | "updatedAt">) {
  const database = requireDb();
  const saved = await addDoc(collection(database, "expenses"), removeUndefinedFields({
    ...input,
    amount: Number(input.amount),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    createdServerAt: serverTimestamp()
  }));
  await addAuditLog("create", "expenses", { id: saved.id, amount: input.amount, category: input.category, userId: input.userId });
}

export async function updateExpense(id: string, input: Partial<Expense>) {
  const database = requireDb();
  await updateDoc(doc(database, "expenses", id), removeUndefinedFields({ ...input, updatedAt: nowIso() }));
  await addAuditLog("update", "expenses", { id, ...input });
}

export async function deleteExpense(id: string) {
  const database = requireDb();
  await deleteDoc(doc(database, "expenses", id));
  await addAuditLog("delete", "expenses", { id });
}

export async function addRevenue(input: Omit<Revenue, "id" | "createdAt">) {
  const database = requireDb();
  const saved = await addDoc(collection(database, "revenues"), removeUndefinedFields({
    ...input,
    amount: Number(input.amount),
    orders: Number(input.orders),
    createdAt: nowIso(),
    createdServerAt: serverTimestamp()
  }));
  await addAuditLog("create", "revenues", { id: saved.id, amount: input.amount, source: input.source, userId: input.userId });
}

export async function updateRevenue(id: string, input: Partial<Revenue>) {
  const database = requireDb();
  await updateDoc(doc(database, "revenues", id), removeUndefinedFields({ ...input, updatedAt: nowIso() }));
  await addAuditLog("update", "revenues", { id, ...input });
}

export async function deleteRevenue(id: string) {
  const database = requireDb();
  await deleteDoc(doc(database, "revenues", id));
  await addAuditLog("delete", "revenues", { id });
}

export async function addInventoryItem(input: Omit<InventoryItem, "id" | "updatedAt">) {
  const database = requireDb();
  const saved = await addDoc(collection(database, "inventory"), removeUndefinedFields({ ...input, updatedAt: nowIso() }));
  await addAuditLog("create", "inventory", { id: saved.id, name: input.name, quantity: input.quantity, userId: input.userId });
}

export async function updateInventoryItem(id: string, input: Partial<InventoryItem>) {
  const database = requireDb();
  await updateDoc(doc(database, "inventory", id), removeUndefinedFields({ ...input, updatedAt: nowIso() }));
  await addAuditLog("update", "inventory", { id, ...input });
}

export async function deleteInventoryItem(id: string) {
  const database = requireDb();
  await deleteDoc(doc(database, "inventory", id));
  await addAuditLog("delete", "inventory", { id });
}

export async function addBudget(input: Omit<Budget, "id" | "spent">) {
  const database = requireDb();
  await addDoc(collection(database, "budgets"), removeUndefinedFields({ ...input, spent: 0 }));
}
