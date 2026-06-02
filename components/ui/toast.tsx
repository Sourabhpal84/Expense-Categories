"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Toast = { id: string; title: string; description?: string; variant?: "default" | "destructive" };
type ToastContextValue = { toast: (toast: Omit<Toast, "id">) => void };

const ToastContext = createContext<ToastContextValue | null>(null);
let externalToast: ToastContextValue["toast"] | null = null;

export function useToast() {
  const context = useContext(ToastContext);
  if (context) return context;
  return {
    toast: (toast: Omit<Toast, "id">) => externalToast?.(toast)
  };
}

export function Toaster() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const remove = useCallback((id: string) => setToasts((items) => items.filter((item) => item.id !== id)), []);
  const toast = useCallback(
    (input: Omit<Toast, "id">) => {
      const id = crypto.randomUUID();
      setToasts((items) => [{ id, ...input }, ...items].slice(0, 4));
      window.setTimeout(() => remove(id), 4500);
    },
    [remove]
  );

  externalToast = toast;
  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      <div className="fixed right-4 top-4 z-[100] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((item) => (
          <div
            key={item.id}
            className={cn(
              "glass rounded-lg p-4 shadow-xl animate-in slide-in-from-top-2",
              item.variant === "destructive" && "border-destructive/40"
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{item.title}</p>
                {item.description ? <p className="mt-1 text-sm text-muted-foreground">{item.description}</p> : null}
              </div>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => remove(item.id)} aria-label="Dismiss toast">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
