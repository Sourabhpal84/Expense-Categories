"use client";

import { MessageSquare, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBusinessData } from "@/hooks/use-business-data";

function stars(value?: number) {
  const n = Math.max(0, Math.min(5, Number(value || 0)));
  return `${"★".repeat(n)}${"☆".repeat(5 - n)}`;
}

export default function FeedbackPage() {
  const { feedback, metrics } = useBusinessData();
  const positive = feedback.filter((item) => String(item.sentiment || item.ai?.sentiment).toLowerCase() === "positive").length;
  const negative = feedback.filter((item) => String(item.sentiment || item.ai?.sentiment).toLowerCase() === "negative").length;

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Average rating</p><p className="mt-2 text-2xl font-semibold">{metrics.feedbackAverage.toFixed(1)} / 5</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Satisfaction score</p><p className="mt-2 text-2xl font-semibold">{metrics.satisfactionScore}%</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Positive feedback</p><p className="mt-2 text-2xl font-semibold">{positive}</p></CardContent></Card>
        <Card><CardContent className="p-5"><p className="text-sm text-muted-foreground">Negative feedback</p><p className="mt-2 text-2xl font-semibold">{negative}</p></CardContent></Card>
      </section>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" />Feedback analytics</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {feedback.map((item) => (
            <div key={item.id} className="rounded-md border border-white/10 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3"><p className="font-medium">{item.customerName || "Customer"}</p><p className="text-amber-300"><Star className="mr-1 inline h-4 w-4" />{stars(item.rating)}</p></div>
              <p className="mt-2 text-sm text-muted-foreground">{item.message || item.comment || "No message"}</p>
              <p className="mt-2 text-xs text-muted-foreground">Sentiment: {item.sentiment || item.ai?.sentiment || "neutral"} | Suggested action: {item.ai?.recommendedAction || "Review and respond if needed."}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
