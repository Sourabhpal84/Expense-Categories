import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
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

export function subscribeUserCollection<T extends { id: string }>(
  userId: string,
  collectionName: string,
  callback: (items: T[]) => void,
  sortField = "createdAt"
) {
  const database = requireDb();
  return onSnapshot(
    query(collection(database, collectionName), where("userId", "==", userId), orderBy(sortField, "desc")),
    (snapshot) => callback(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as T))
  );
}

export async function addExpense(input: Omit<Expense, "id" | "createdAt" | "updatedAt">) {
  const database = requireDb();
  await addDoc(collection(database, "expenses"), {
    ...input,
    amount: Number(input.amount),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    createdServerAt: serverTimestamp()
  });
}

export async function updateExpense(id: string, input: Partial<Expense>) {
  const database = requireDb();
  await updateDoc(doc(database, "expenses", id), { ...input, updatedAt: nowIso() });
}

export async function deleteExpense(id: string) {
  const database = requireDb();
  await deleteDoc(doc(database, "expenses", id));
}

export async function addRevenue(input: Omit<Revenue, "id" | "createdAt">) {
  const database = requireDb();
  await addDoc(collection(database, "revenues"), {
    ...input,
    amount: Number(input.amount),
    orders: Number(input.orders),
    createdAt: nowIso(),
    createdServerAt: serverTimestamp()
  });
}

export async function addInventoryItem(input: Omit<InventoryItem, "id" | "updatedAt">) {
  const database = requireDb();
  await addDoc(collection(database, "inventory"), { ...input, updatedAt: nowIso() });
}

export async function updateInventoryItem(id: string, input: Partial<InventoryItem>) {
  const database = requireDb();
  await updateDoc(doc(database, "inventory", id), { ...input, updatedAt: nowIso() });
}

export async function addBudget(input: Omit<Budget, "id" | "spent">) {
  const database = requireDb();
  await addDoc(collection(database, "budgets"), { ...input, spent: 0 });
}
