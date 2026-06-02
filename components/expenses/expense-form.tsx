"use client";

import { FormEvent, useState } from "react";
import { Loader2, Mic, ScanLine, Upload } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toaster";
import { useSpeech } from "@/hooks/use-speech";
import { parseReceiptWithAi, parseVoiceExpense } from "@/lib/ai";
import { addExpense } from "@/services/data-service";
import { uploadReceipt } from "@/services/storage-service";
import { expenseCategories, type ExpenseCategory } from "@/types";
import { fileToDataUrl, extractTextFromImage } from "@/utils/ocr";

type FormState = {
  vendor: string;
  amount: string;
  category: ExpenseCategory;
  date: string;
  notes: string;
};

const defaultForm: FormState = {
  vendor: "",
  amount: "",
  category: "Misc",
  date: new Date().toISOString().slice(0, 10),
  notes: ""
};

export function ExpenseForm() {
  const { user, configured } = useAuth();
  const { toast } = useToast();
  const speech = useSpeech();
  const [form, setForm] = useState<FormState>(defaultForm);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  function applyExtraction(data: { vendor?: string; amount?: number; category?: string; date?: string; rawText?: string }) {
    setForm((current) => ({
      ...current,
      vendor: data.vendor || current.vendor,
      amount: data.amount ? String(data.amount) : current.amount,
      category: expenseCategories.includes(data.category as ExpenseCategory) ? (data.category as ExpenseCategory) : current.category,
      date: data.date || current.date,
      notes: data.rawText ? `${current.notes}\nOCR: ${data.rawText}`.trim() : current.notes
    }));
  }

  async function scanReceipt(file: File) {
    setReceipt(file);
    setScanning(true);
    try {
      const [rawText, imageDataUrl] = await Promise.all([extractTextFromImage(file), fileToDataUrl(file)]);
      const extracted = await parseReceiptWithAi({ text: rawText, imageDataUrl });
      applyExtraction(extracted);
      toast({ title: "Receipt scanned", description: "The expense form was auto-filled." });
    } catch (error) {
      toast({ title: "Scan failed", description: error instanceof Error ? error.message : "Try another image.", variant: "destructive" });
    } finally {
      setScanning(false);
    }
  }

  async function handleVoiceParse() {
    if (!speech.transcript) return;
    setScanning(true);
    try {
      const extracted = await parseVoiceExpense(speech.transcript);
      applyExtraction(extracted);
      toast({ title: "Voice expense parsed", description: speech.transcript });
    } finally {
      setScanning(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !configured) {
      toast({ title: "Demo mode", description: "Connect Firebase and sign in to save expenses." });
      return;
    }
    setLoading(true);
    try {
      const receiptUrl = receipt ? await uploadReceipt(user.uid, receipt) : undefined;
      await addExpense({
        userId: user.uid,
        vendor: form.vendor,
        amount: Number(form.amount),
        category: form.category,
        date: form.date,
        notes: form.notes,
        receiptUrl
      });
      setForm(defaultForm);
      setReceipt(null);
      toast({ title: "Expense saved", description: `${form.vendor} was added to your books.` });
    } catch (error) {
      toast({ title: "Could not save expense", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add expense</CardTitle>
        <CardDescription>Use receipt OCR, AI parsing, or voice input to speed up entry.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
          <div className="space-y-2">
            <Label>Vendor/shop</Label>
            <Input value={form.vendor} onChange={(event) => setForm({ ...form, vendor: event.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: event.target.value })} required />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(value) => setForm({ ...form, category: value as ExpenseCategory })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{expenseCategories.map((category) => <SelectItem key={category} value={category}>{category}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date</Label>
            <Input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Notes</Label>
            <Textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} />
          </div>
          <div className="flex flex-wrap gap-3 md:col-span-2">
            <Button type="button" variant="outline" disabled={scanning}>
              <label className="flex cursor-pointer items-center gap-2">
                {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                Upload receipt
                <input className="hidden" type="file" accept="image/*" onChange={(event) => event.target.files?.[0] && scanReceipt(event.target.files[0])} />
              </label>
            </Button>
            <Button type="button" variant="outline" onClick={speech.listening ? speech.stop : speech.start} disabled={!speech.supported}>
              <Mic className="h-4 w-4" />
              {speech.listening ? "Listening..." : "Voice entry"}
            </Button>
            <Button type="button" variant="outline" onClick={handleVoiceParse} disabled={!speech.transcript || scanning}>
              <ScanLine className="h-4 w-4" />
              Parse voice
            </Button>
            <Button disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Save expense
            </Button>
          </div>
          {speech.transcript ? <p className="text-sm text-muted-foreground md:col-span-2">Voice: {speech.transcript}</p> : null}
        </form>
      </CardContent>
    </Card>
  );
}
