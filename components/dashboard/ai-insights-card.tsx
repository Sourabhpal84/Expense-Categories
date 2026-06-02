"use client";

import { useState } from "react";
import { Brain, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { generateBusinessInsights } from "@/lib/ai";
import type { AiInsight, Budget, Expense, InventoryItem, Revenue } from "@/types";

export function AiInsightsCard({
  expenses,
  revenues,
  inventory,
  budgets
}: {
  expenses: Expense[];
  revenues: Revenue[];
  inventory: InventoryItem[];
  budgets: Budget[];
}) {
  const [loading, setLoading] = useState(false);
  const [insight, setInsight] = useState<AiInsight>({
    summary: "Your sample workspace is profitable. Marketing spend is rising, while inventory has one restock risk.",
    warnings: ["Chocolate base is below threshold.", "Marketing budget is near its monthly limit."],
    opportunities: ["Bundle premium hampers with lower-cost packaging.", "Shift repeat customers to WhatsApp reorders."],
    healthScore: 78
  });

  async function refresh() {
    setLoading(true);
    try {
      setInsight(await generateBusinessInsights({ expenses, revenues, inventory, budgets }));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI business insights
          </CardTitle>
          <CardDescription>Financial health, warnings, and growth ideas.</CardDescription>
        </div>
        <Button size="sm" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Refresh
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Financial health</span>
            <span className="font-semibold">{insight.healthScore}/100</span>
          </div>
          <Progress value={insight.healthScore} />
        </div>
        <p className="text-sm leading-6 text-muted-foreground">{insight.summary}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-medium text-amber-300">Warnings</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {insight.warnings.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-accent">Opportunities</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {insight.opportunities.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
