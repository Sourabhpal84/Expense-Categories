"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, configured } = useAuth();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && configured && !user) router.push("/login");
  }, [configured, loading, router, user]);

  if (loading) {
    return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading workspace...</div>;
  }

  return (
    <div className="min-h-screen lg:pl-72">
      <Sidebar mobileOpen={mobileMenuOpen} onMobileClose={() => setMobileMenuOpen(false)} />
      <Topbar onMenuClick={() => setMobileMenuOpen(true)} />
      <main className="px-4 py-6 lg:px-8">{children}</main>
    </div>
  );
}
