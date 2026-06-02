"use client";

import Link from "next/link";
import { Menu, Moon, Plus, Sun } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-background/70 px-4 py-3 backdrop-blur-xl lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button className="lg:hidden" size="icon" variant="ghost" aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-sm text-muted-foreground">Operating console</p>
            <h1 className="text-lg font-semibold">MAGNEETOZ Business OS</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="hidden sm:inline-flex">
            <Link href="/dashboard/expenses">
              <Plus className="h-4 w-4" />
              Expense
            </Link>
          </Button>
          <Button size="icon" variant="ghost" onClick={toggleTheme} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </Button>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium">{user?.displayName || "Demo founder"}</p>
            <p className="text-xs text-muted-foreground">{user?.email || "demo@magneetoz.local"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
