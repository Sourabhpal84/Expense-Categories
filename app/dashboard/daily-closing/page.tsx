"use client";

import { FormEvent, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, CircleDollarSign, Landmark, PiggyBank, Plus, RefreshCw, Wallet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import { useBusinessData } from "@/hooks/use-business-data";
import { useDailyFinance } from "@/hooks/use-daily-finance";
import { currency } from "@/lib/utils";
import {
  addClosingAdjustment,
  addLedgerTransaction,
  closeDailySession,
  reopenDailySession,
  startDailySession
} from "@/services/daily-finance-service";
import type { ClosingAdjustment, DailySession, FinanceAccount, LedgerTransaction } from "@/types";

const todayIso = () => new Date().toISOString().slice(0, 10);
const activeStatuses = ["New Order", "In Kitchen", "Ready"];

const accountLabels: Record<FinanceAccount, string> = {
  shop_cash: "Shop Cash",
  business_bank_upi: "Business Bank/UPI",
  owner_personal_upi: "Owner Personal UPI",
  unknown: "Unknown / Allocate at closing"
};

const adjustmentLabels: Record<ClosingAdjustment["reason"], string> = {
  missing_expense: "Expense paid but not recorded",
  owner_withdrawal: "Owner withdrawal / reimbursement",
  owner_contribution: "Owner contribution",
  cash_to_bank: "Cash deposited to bank",
  bank_to_cash: "Bank/UPI converted to cash",
  supplier_payment: "Supplier payment",
  personal_expense_from_shop: "Personal expense mistakenly taken from shop cash",
  cash_shortage: "Cash shortage",
  extra_cash: "Extra cash found",
  other_adjustment: "Other adjustment"
};

function num(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sameDate(date?: string) {
  return String(date || "").slice(0, 10);
}

function byDate<T extends { date: string }>(items: T[], date: string) {
  return items.filter((item) => sameDate(item.date) === date);
}

function cashPayment(value?: string) {
  return ["cash", "cod"].includes(String(value || "").toLowerCase());
}

function bankPayment(value?: string) {
  const text = String(value || "").toLowerCase();
  return ["upi", "online", "razorpay", "card", "bank transfer"].some((item) => text.includes(item));
}

function calculateDay(session: DailySession | undefined, data: {
  revenues: ReturnType<typeof useBusinessData>["revenues"];
  expenses: ReturnType<typeof useBusinessData>["expenses"];
  transactions: LedgerTransaction[];
  adjustments: ClosingAdjustment[];
}) {
  const date = session?.date || todayIso();
  const revenues = byDate(data.revenues, date);
  const expenses = byDate(data.expenses, date);
  const transactions = byDate(data.transactions, date);
  const adjustments = byDate(data.adjustments, date);

  const cashRevenue = revenues.filter((item) => cashPayment(item.paymentMethod)).reduce((sum, item) => sum + item.amount, 0);
  const bankRevenue = revenues.filter((item) => bankPayment(item.paymentMethod) || item.source === "website").reduce((sum, item) => sum + item.amount, 0);
  const manualIncome = transactions.filter((item) => item.type === "income").reduce((sum, item) => sum + item.amount, 0);

  const cashExpenses = expenses.filter((item) => (item.paidFrom || "unknown") === "shop_cash").reduce((sum, item) => sum + item.amount, 0);
  const bankExpenses = expenses.filter((item) => (item.paidFrom || "unknown") === "business_bank_upi").reduce((sum, item) => sum + item.amount, 0);
  const ownerPaidExpenses = expenses.filter((item) => item.paidFrom === "owner_personal_upi").reduce((sum, item) => sum + item.amount, 0);
  const unknownExpenses = expenses.filter((item) => !item.paidFrom || item.paidFrom === "unknown").reduce((sum, item) => sum + item.amount, 0);

  const ownerWithdrawals = transactions.filter((item) => item.type === "owner_withdrawal").reduce((sum, item) => sum + item.amount, 0);
  const ownerContributions = ownerPaidExpenses + transactions.filter((item) => item.type === "owner_contribution").reduce((sum, item) => sum + item.amount, 0);
  const cashToBank = transactions.filter((item) => item.type === "transfer" && item.sourceAccount === "shop_cash" && item.destinationAccount === "business_bank_upi").reduce((sum, item) => sum + item.amount, 0);
  const bankToCash = transactions.filter((item) => item.type === "transfer" && item.sourceAccount === "business_bank_upi" && item.destinationAccount === "shop_cash").reduce((sum, item) => sum + item.amount, 0);
  const adjustmentCash = adjustments.reduce((sum, item) => sum + (item.account === "cash" || item.account === "both" ? item.amount : 0), 0);
  const adjustmentBank = adjustments.reduce((sum, item) => sum + (item.account === "bank" || item.account === "both" ? item.amount : 0), 0);

  const expectedCash = (session?.openingCash || 0) + cashRevenue + bankToCash - cashExpenses - cashToBank - ownerWithdrawals + adjustmentCash;
  const expectedBank = (session?.openingBank || 0) + bankRevenue + cashToBank - bankExpenses - bankToCash + adjustmentBank;
  const actualCash = session?.closingCashActual;
  const actualBank = session?.closingBankActual;
  const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);
  const totalRevenue = revenues.reduce((sum, item) => sum + item.amount, 0) + manualIncome;

  return {
    date,
    revenues,
    expenses,
    transactions,
    adjustments,
    cashRevenue,
    bankRevenue,
    manualIncome,
    cashExpenses,
    bankExpenses,
    ownerPaidExpenses,
    unknownExpenses,
    ownerWithdrawals,
    ownerContributions,
    cashToBank,
    bankToCash,
    expectedCash,
    expectedBank,
    actualCash,
    actualBank,
    cashDifference: actualCash === undefined ? 0 : actualCash - expectedCash,
    bankDifference: actualBank === undefined ? 0 : actualBank - expectedBank,
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    ownerBalanceClosing: (session?.openingOwnerBalance || 0) + ownerContributions - ownerWithdrawals
  };
}

export default function DailyClosingPage() {
  const { user, configured } = useAuth();
  const { revenues, expenses } = useBusinessData();
  const { sessions, transactions, adjustments, openSession, lastClosedSession, error, demoMode } = useDailyFinance();
  const { toast } = useToast();
  const [opening, setOpening] = useState({
    date: todayIso(),
    openingCash: String(lastClosedSession?.closingCashActual || ""),
    openingBank: String(lastClosedSession?.closingBankActual || ""),
    openingOwnerBalance: String(lastClosedSession?.ownerBalanceClosing || ""),
    notes: ""
  });
  const [closing, setClosing] = useState({ cash: "", bank: "", razorpay: "", notes: "" });
  const [adjustment, setAdjustment] = useState<{ reason: ClosingAdjustment["reason"]; amount: string; account: ClosingAdjustment["account"]; note: string }>({
    reason: "missing_expense",
    amount: "",
    account: "cash",
    note: ""
  });
  const [movement, setMovement] = useState({ type: "owner_withdrawal", amount: "", from: "shop_cash" as FinanceAccount, to: "business_bank_upi" as FinanceAccount, note: "" });

  const currentSession = openSession || sessions[0];
  const report = useMemo(() => calculateDay(currentSession, { revenues, expenses, transactions, adjustments }), [adjustments, currentSession, expenses, revenues, transactions]);
  const hasOpenDay = Boolean(openSession);

  async function startDay(event: FormEvent) {
    event.preventDefault();
    if (!user || !configured) return toast({ title: "Login required", description: "Start Day save karne ke liye login required hai." });
    if (openSession) return toast({ title: "Day already open", description: "Pehle current day close karein." });
    await startDailySession({
      userId: user.uid,
      date: opening.date,
      openingCash: num(opening.openingCash),
      openingBank: num(opening.openingBank),
      openingOwnerBalance: num(opening.openingOwnerBalance),
      notes: opening.notes
    });
    toast({ title: "Day started", description: "Aaj ka daily ledger open ho gaya." });
  }

  async function addMovement(event: FormEvent) {
    event.preventDefault();
    if (!user || !openSession) return;
    const amount = num(movement.amount);
    if (!amount) return toast({ title: "Amount required" });
    await addLedgerTransaction({
      userId: user.uid,
      date: openSession.date,
      sessionId: openSession.id,
      type: movement.type as LedgerTransaction["type"],
      amount,
      sourceAccount: movement.type === "transfer" || movement.type === "owner_withdrawal" ? movement.from : "owner_personal_upi",
      destinationAccount: movement.type === "transfer" ? movement.to : movement.type === "owner_contribution" ? movement.to : undefined,
      note: movement.note,
      createdBy: user.email || user.uid
    });
    setMovement({ ...movement, amount: "", note: "" });
    toast({ title: "Movement recorded" });
  }

  async function saveAdjustment(event: FormEvent) {
    event.preventDefault();
    if (!user || !openSession) return;
    const amount = num(adjustment.amount);
    if (!amount) return toast({ title: "Amount required" });
    await addClosingAdjustment({
      userId: user.uid,
      date: openSession.date,
      sessionId: openSession.id,
      reason: adjustment.reason,
      amount,
      account: adjustment.account,
      note: adjustment.note
    });
    setAdjustment({ ...adjustment, amount: "", note: "" });
    toast({ title: "Adjustment added", description: "Difference classification saved." });
  }

  async function closeDay(event: FormEvent) {
    event.preventDefault();
    if (!openSession) return;
    const closingCashActual = num(closing.cash);
    const closingBankActual = num(closing.bank);
    const nextReport = calculateDay({ ...openSession, closingCashActual, closingBankActual }, { revenues, expenses, transactions, adjustments });
    await closeDailySession(openSession.id, {
      closingCashActual,
      closingBankActual,
      pendingRazorpaySettlement: num(closing.razorpay),
      expectedCash: nextReport.expectedCash,
      expectedBank: nextReport.expectedBank,
      cashDifference: nextReport.cashDifference,
      bankDifference: nextReport.bankDifference,
      totalRevenue: nextReport.totalRevenue,
      totalExpenses: nextReport.totalExpenses,
      netProfit: nextReport.netProfit,
      ownerContributionToday: nextReport.ownerContributions,
      ownerWithdrawalToday: nextReport.ownerWithdrawals,
      ownerBalanceClosing: nextReport.ownerBalanceClosing,
      adjustmentNotes: closing.notes
    });
    toast({ title: "Day closed", description: "Daily closing report final ho gaya." });
  }

  async function reopenDay() {
    if (!currentSession) return;
    const reason = prompt("Reopen reason?");
    if (!reason) return;
    await reopenDailySession(currentSession.id, reason);
    toast({ title: "Day reopened" });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Daily Closing & Cashbook</h1>
        <p className="text-sm text-muted-foreground">Subah opening balance daalo, raat ko actual cash/bank daalo — system difference aur owner ledger calculate karega.</p>
      </div>
      {error ? <Card className="border-destructive/50"><CardContent className="p-4 text-sm text-destructive">{error}</CardContent></Card> : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {([
          { label: "Today Sales", value: report.totalRevenue, icon: CircleDollarSign },
          { label: "Today Expenses", value: report.totalExpenses, icon: Wallet },
          { label: "Today Profit", value: report.netProfit, icon: PiggyBank },
          { label: "Business owes owner", value: report.ownerBalanceClosing, icon: Landmark }
        ] satisfies Array<{ label: string; value: number; icon: LucideIcon }>).map((item) => {
          const Icon = item.icon;
          return <Card key={item.label}><CardContent className="p-5"><p className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="h-4 w-4" />{item.label}</p><p className="mt-2 text-2xl font-semibold">{currency(item.value)}</p></CardContent></Card>;
        })}
      </div>

      {!hasOpenDay ? (
        <Card>
          <CardHeader><CardTitle>Morning: Start Day</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={startDay}>
              <div className="space-y-2"><Label>Date</Label><Input type="date" value={opening.date} onChange={(event) => setOpening({ ...opening, date: event.target.value })} /></div>
              <div className="space-y-2"><Label>Shop Cash Opening</Label><Input type="number" value={opening.openingCash} onChange={(event) => setOpening({ ...opening, openingCash: event.target.value })} /></div>
              <div className="space-y-2"><Label>Bank/UPI Opening</Label><Input type="number" value={opening.openingBank} onChange={(event) => setOpening({ ...opening, openingBank: event.target.value })} /></div>
              <div className="space-y-2"><Label>Owner balance carried forward</Label><Input type="number" value={opening.openingOwnerBalance} onChange={(event) => setOpening({ ...opening, openingOwnerBalance: event.target.value })} /></div>
              <div className="space-y-2 md:col-span-2"><Label>Notes / correction reason</Label><Textarea value={opening.notes} onChange={(event) => setOpening({ ...opening, notes: event.target.value })} /></div>
              <Button className="md:col-span-2" disabled={demoMode}><Plus className="h-4 w-4" />Start Day</Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-emerald-500/30">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="font-medium">Day open: {openSession?.date}</p><p className="text-sm text-muted-foreground">Opening Cash {currency(openSession?.openingCash || 0)} · Bank/UPI {currency(openSession?.openingBank || 0)}</p></div>
            <span className="flex items-center gap-2 text-sm text-emerald-300"><CheckCircle2 className="h-4 w-4" />Open</span>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
        <Card>
          <CardHeader><CardTitle>During Day: Record movement</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={addMovement}>
              <div className="space-y-2"><Label>Movement type</Label><Select value={movement.type} onValueChange={(value) => setMovement({ ...movement, type: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="owner_withdrawal">Owner withdrawal</SelectItem><SelectItem value="owner_contribution">Owner contribution</SelectItem><SelectItem value="transfer">Cash/Bank transfer</SelectItem><SelectItem value="income">Manual income</SelectItem><SelectItem value="adjustment">Other adjustment</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Amount</Label><Input type="number" value={movement.amount} onChange={(event) => setMovement({ ...movement, amount: event.target.value })} /></div>
              <div className="space-y-2"><Label>From</Label><Select value={movement.from} onValueChange={(value) => setMovement({ ...movement, from: value as FinanceAccount })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(accountLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>To</Label><Select value={movement.to} onValueChange={(value) => setMovement({ ...movement, to: value as FinanceAccount })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(accountLabels).filter(([value]) => value !== "unknown").map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2 md:col-span-2"><Label>Note</Label><Input value={movement.note} onChange={(event) => setMovement({ ...movement, note: event.target.value })} placeholder="Supplier, reimbursement, transfer note..." /></div>
              <Button className="md:col-span-2" disabled={!hasOpenDay || demoMode}>Save movement</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Night: Close Day</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={closeDay}>
              <div className="space-y-2"><Label>Actual Shop Cash counted</Label><Input type="number" value={closing.cash} onChange={(event) => setClosing({ ...closing, cash: event.target.value })} /></div>
              <div className="space-y-2"><Label>Actual Bank/UPI balance</Label><Input type="number" value={closing.bank} onChange={(event) => setClosing({ ...closing, bank: event.target.value })} /></div>
              <div className="space-y-2"><Label>Pending Razorpay settlement</Label><Input type="number" value={closing.razorpay} onChange={(event) => setClosing({ ...closing, razorpay: event.target.value })} /></div>
              <div className="space-y-2"><Label>Total unrecorded movement</Label><Input readOnly value={currency((num(closing.cash) - report.expectedCash) + (num(closing.bank) - report.expectedBank))} /></div>
              <div className="space-y-2 md:col-span-2"><Label>Closing notes</Label><Textarea value={closing.notes} onChange={(event) => setClosing({ ...closing, notes: event.target.value })} /></div>
              <Button className="md:col-span-2" disabled={!hasOpenDay || demoMode}>Close Day</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          ["Expected Cash", report.expectedCash],
          ["Actual Cash", report.actualCash ?? 0],
          ["Cash Difference", report.cashDifference],
          ["Expected Bank/UPI", report.expectedBank],
          ["Actual Bank/UPI", report.actualBank ?? 0],
          ["Bank Difference", report.bankDifference],
          ["Owner paid today", report.ownerContributions],
          ["Owner took/repaid", report.ownerWithdrawals]
        ].map(([label, value]) => <Card key={label as string}><CardContent className="p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-2 text-2xl font-semibold">{currency(value as number)}</p></CardContent></Card>)}
      </div>

      {(Math.abs(report.cashDifference) > 0 || Math.abs(report.bankDifference) > 0 || report.unknownExpenses > 0) ? (
        <Card className="border-amber-500/40">
          <CardHeader><CardTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-300" />Difference / Unknown allocation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">Cash difference {currency(report.cashDifference)} · Bank difference {currency(report.bankDifference)} · Unknown expenses {currency(report.unknownExpenses)}. Please classify movement.</p>
            <form className="grid gap-3 md:grid-cols-4" onSubmit={saveAdjustment}>
              <Select value={adjustment.reason} onValueChange={(value) => setAdjustment({ ...adjustment, reason: value as ClosingAdjustment["reason"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(adjustmentLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent></Select>
              <Select value={adjustment.account} onValueChange={(value) => setAdjustment({ ...adjustment, account: value as ClosingAdjustment["account"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cash">Cash</SelectItem><SelectItem value="bank">Bank/UPI</SelectItem><SelectItem value="both">Both</SelectItem></SelectContent></Select>
              <Input type="number" placeholder="Amount" value={adjustment.amount} onChange={(event) => setAdjustment({ ...adjustment, amount: event.target.value })} />
              <Button disabled={!hasOpenDay || demoMode}>Add reason</Button>
              <Input className="md:col-span-4" placeholder="Note" value={adjustment.note} onChange={(event) => setAdjustment({ ...adjustment, note: event.target.value })} />
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-3">
        <Card><CardHeader><CardTitle>Daily P&L</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p>Cash sales: {currency(report.cashRevenue)}</p><p>UPI/Online sales: {currency(report.bankRevenue)}</p><p>Total revenue: {currency(report.totalRevenue)}</p><p>Total expenses: {currency(report.totalExpenses)}</p><p className="text-lg font-semibold">Net profit/loss: {currency(report.netProfit)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Cashbook</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p>Opening cash: {currency(currentSession?.openingCash || 0)}</p><p>Cash inflow: {currency(report.cashRevenue + report.bankToCash)}</p><p>Cash outflow: {currency(report.cashExpenses + report.cashToBank + report.ownerWithdrawals)}</p><p>Expected cash: {currency(report.expectedCash)}</p><p>Difference: {currency(report.cashDifference)}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Owner Ledger</CardTitle></CardHeader><CardContent className="space-y-2 text-sm"><p>Opening owner balance: {currency(currentSession?.openingOwnerBalance || 0)}</p><p>Owner paid for business: {currency(report.ownerContributions)}</p><p>Owner withdrew/reimbursed: {currency(report.ownerWithdrawals)}</p><p className="text-lg font-semibold">Business owes owner: {currency(report.ownerBalanceClosing)}</p></CardContent></Card>
      </div>

      {currentSession?.status === "closed" ? <Button variant="outline" onClick={reopenDay}><RefreshCw className="h-4 w-4" />Reopen day with reason</Button> : null}
    </div>
  );
}
