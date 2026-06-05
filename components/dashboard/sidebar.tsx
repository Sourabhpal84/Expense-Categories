"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BarChart3, Bell, Boxes, Brain, CircleDollarSign, LayoutDashboard, LogOut, MessageSquare, PieChart, ReceiptText, Settings, Users, WalletCards } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/expenses", label: "Expenses", icon: ReceiptText },
  { href: "/dashboard/revenue", label: "Revenue", icon: CircleDollarSign },
  { href: "/dashboard/inventory", label: "Inventory", icon: Boxes },
  { href: "/dashboard/crm", label: "CRM", icon: Users },
  { href: "/dashboard/feedback", label: "Feedback", icon: MessageSquare },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/budgets", label: "Budgets", icon: WalletCards },
  { href: "/dashboard/reports", label: "Reports", icon: PieChart },
  { href: "/dashboard/insights", label: "AI Insights", icon: Brain },
  { href: "/dashboard/settings", label: "Settings", icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  return (
    <aside className="glass fixed inset-y-0 left-0 z-40 hidden w-72 flex-col rounded-none border-l-0 border-y-0 p-4 lg:flex">
      <Link href="/dashboard" className="mb-8 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md bg-primary text-primary-foreground">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <p className="font-semibold">MAGNEETOZ</p>
          <p className="text-xs text-muted-foreground">Business OS</p>
        </div>
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-white/10 hover:text-foreground", active && "bg-white/10 text-foreground")}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <Button
        variant="ghost"
        className="justify-start"
        onClick={async () => {
          await logout();
          router.push("/login");
        }}
      >
        <LogOut className="h-4 w-4" />
        Logout
      </Button>
    </aside>
  );
}
