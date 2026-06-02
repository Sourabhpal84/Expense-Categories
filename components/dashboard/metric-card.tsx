import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "primary"
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  tone?: "primary" | "accent" | "warning";
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-2 text-2xl font-semibold tracking-normal">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
          </div>
          <div
            className={cn(
              "grid h-10 w-10 place-items-center rounded-md",
              tone === "primary" && "bg-primary/15 text-primary",
              tone === "accent" && "bg-accent/15 text-accent",
              tone === "warning" && "bg-amber-400/15 text-amber-300"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
