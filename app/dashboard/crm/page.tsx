"use client";

import { Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBusinessData } from "@/hooks/use-business-data";
import { currency } from "@/lib/utils";

export default function CrmPage() {
  const { customers } = useBusinessData();
  const top = customers.slice(0, 10);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Customer CRM</CardTitle></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <div><p className="text-sm text-muted-foreground">Customers</p><p className="mt-2 text-2xl font-semibold">{customers.length}</p></div>
          <div><p className="text-sm text-muted-foreground">Repeat customers</p><p className="mt-2 text-2xl font-semibold">{customers.filter((item) => item.totalOrders > 1).length}</p></div>
          <div><p className="text-sm text-muted-foreground">VIP customers</p><p className="mt-2 text-2xl font-semibold">{customers.filter((item) => item.lifetimeValue >= 3000).length}</p></div>
          <div><p className="text-sm text-muted-foreground">Total CLV</p><p className="mt-2 text-2xl font-semibold">{currency(customers.reduce((sum, item) => sum + item.lifetimeValue, 0))}</p></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Top customers</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-muted-foreground"><tr className="border-b border-white/10"><th className="py-3">Customer</th><th>Phone</th><th>Orders</th><th>Delivered</th><th>Feedback</th><th>Avg rating</th><th className="text-right">Lifetime value</th></tr></thead>
            <tbody>{top.map((item) => <tr key={item.id} className="border-b border-white/5"><td className="py-3">{item.name}</td><td>{item.phone}</td><td>{item.totalOrders}</td><td>{item.deliveredOrders}</td><td>{item.feedbackCount}</td><td>{item.averageRating.toFixed(1)}</td><td className="text-right font-medium">{currency(item.lifetimeValue)}</td></tr>)}</tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
