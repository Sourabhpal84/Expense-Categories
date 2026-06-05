"use client";

import { Bell } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useBusinessData } from "@/hooks/use-business-data";

export default function NotificationsPage() {
  const { notifications } = useBusinessData();
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" />Notifications</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {notifications.map((item) => (
            <div key={item.id} className="rounded-md border border-white/10 p-4">
              <div className="flex items-center justify-between gap-3"><p className="font-medium">{item.title}</p><span className="rounded-md bg-white/10 px-2 py-1 text-xs">{item.severity}</span></div>
              <p className="mt-1 text-sm text-muted-foreground">{item.detail}</p>
            </div>
          ))}
          {!notifications.length ? <p className="text-sm text-muted-foreground">No active notifications.</p> : null}
        </CardContent>
      </Card>
    </div>
  );
}
