"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import {
  subscribeCashAdjustments,
  subscribeDailySessions,
  subscribeLedgerTransactions
} from "@/services/daily-finance-service";
import type { ClosingAdjustment, DailySession, LedgerTransaction } from "@/types";

export function useDailyFinance() {
  const { user, configured } = useAuth();
  const [sessions, setSessions] = useState<DailySession[]>([]);
  const [transactions, setTransactions] = useState<LedgerTransaction[]>([]);
  const [adjustments, setAdjustments] = useState<ClosingAdjustment[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !configured) return;
    setLoading(true);
    const onError = (value: Error) => {
      console.warn("[MAGNEETOZ] Daily finance sync failed", value);
      setError(value.message || "Unable to load daily finance data.");
    };
    const unsubs = [
      subscribeDailySessions(user.uid, setSessions, onError),
      subscribeLedgerTransactions(user.uid, setTransactions, onError),
      subscribeCashAdjustments(user.uid, setAdjustments, onError)
    ];
    setLoading(false);
    return () => unsubs.forEach((unsub) => unsub());
  }, [configured, user]);

  const openSession = useMemo(() => sessions.find((item) => item.status === "open" || item.status === "reopened"), [sessions]);
  const lastClosedSession = useMemo(() => sessions.find((item) => item.status === "closed"), [sessions]);

  return {
    sessions,
    transactions,
    adjustments,
    openSession,
    lastClosedSession,
    loading,
    error,
    demoMode: !user || !configured
  };
}
