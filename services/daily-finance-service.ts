import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";
import { db } from "@/firebase/config";
import type { ClosingAdjustment, DailySession, LedgerTransaction } from "@/types";

const nowIso = () => new Date().toISOString();

function requireDb() {
  if (!db) throw new Error("Firebase is not configured.");
  return db;
}

function clean<T extends Record<string, unknown>>(data: T) {
  return Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
}

export function subscribeDailySessions(userId: string, callback: (items: DailySession[]) => void, onError?: (error: Error) => void) {
  const database = requireDb();
  return onSnapshot(
    query(collection(database, "dailySessions"), where("userId", "==", userId)),
    (snapshot) => {
      const items = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }) as DailySession)
        .sort((a, b) => b.date.localeCompare(a.date));
      callback(items);
    },
    (error) => onError?.(error)
  );
}

export function subscribeLedgerTransactions(userId: string, callback: (items: LedgerTransaction[]) => void, onError?: (error: Error) => void) {
  const database = requireDb();
  return onSnapshot(
    query(collection(database, "ledgerTransactions"), where("userId", "==", userId)),
    (snapshot) => {
      const items = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }) as LedgerTransaction)
        .filter((item) => !item.voided)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
      callback(items);
    },
    (error) => onError?.(error)
  );
}

export function subscribeCashAdjustments(userId: string, callback: (items: ClosingAdjustment[]) => void, onError?: (error: Error) => void) {
  const database = requireDb();
  return onSnapshot(
    query(collection(database, "cashAdjustments"), where("userId", "==", userId)),
    (snapshot) => {
      const items = snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }) as ClosingAdjustment)
        .sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt));
      callback(items);
    },
    (error) => onError?.(error)
  );
}

export async function startDailySession(input: Omit<DailySession, "id" | "status" | "createdAt" | "updatedAt">) {
  const database = requireDb();
  const saved = await addDoc(collection(database, "dailySessions"), clean({
    ...input,
    status: "open",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    createdServerAt: serverTimestamp()
  }));
  return saved.id;
}

export async function closeDailySession(id: string, input: Partial<DailySession>) {
  const database = requireDb();
  await updateDoc(doc(database, "dailySessions", id), clean({
    ...input,
    status: "closed",
    closedAt: nowIso(),
    updatedAt: nowIso()
  }));
}

export async function reopenDailySession(id: string, reason: string) {
  const database = requireDb();
  await updateDoc(doc(database, "dailySessions", id), clean({
    status: "reopened",
    reopenedReason: reason,
    needsRecalculation: true,
    updatedAt: nowIso()
  }));
}

export async function addLedgerTransaction(input: Omit<LedgerTransaction, "id" | "createdAt">) {
  const database = requireDb();
  const saved = await addDoc(collection(database, "ledgerTransactions"), clean({
    ...input,
    amount: Number(input.amount),
    createdAt: nowIso(),
    createdServerAt: serverTimestamp()
  }));
  return saved.id;
}

export async function voidLedgerTransaction(id: string, reason: string) {
  const database = requireDb();
  await updateDoc(doc(database, "ledgerTransactions", id), clean({
    voided: true,
    voidReason: reason,
    updatedAt: nowIso()
  }));
}

export async function addClosingAdjustment(input: Omit<ClosingAdjustment, "id" | "createdAt">) {
  const database = requireDb();
  const saved = await addDoc(collection(database, "cashAdjustments"), clean({
    ...input,
    amount: Number(input.amount),
    createdAt: nowIso(),
    createdServerAt: serverTimestamp()
  }));
  return saved.id;
}
