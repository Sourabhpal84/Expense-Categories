import type { AiInsight, Budget, Expense, InventoryItem, ReceiptExtraction, Revenue } from "@/types";

export async function generateBusinessInsights(payload: {
  expenses: Expense[];
  revenues: Revenue[];
  inventory: InventoryItem[];
  budgets: Budget[];
}): Promise<AiInsight> {
  const response = await fetch("/api/ai/insights", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!response.ok) throw new Error("Unable to generate insights.");
  return response.json();
}

export async function parseReceiptWithAi(input: { text?: string; imageDataUrl?: string }): Promise<ReceiptExtraction> {
  const response = await fetch("/api/ai/receipt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input)
  });
  if (!response.ok) throw new Error("Unable to parse receipt.");
  return response.json();
}

export async function parseVoiceExpense(transcript: string): Promise<ReceiptExtraction> {
  const response = await fetch("/api/ai/voice-expense", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ transcript })
  });
  if (!response.ok) throw new Error("Unable to parse voice entry.");
  return response.json();
}
