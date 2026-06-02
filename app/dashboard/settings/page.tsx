"use client";

import { FormEvent, useState } from "react";
import { Save } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/toaster";
import { updateBusinessProfile } from "@/services/profile-service";

export default function SettingsPage() {
  const { user, configured } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [form, setForm] = useState({ ownerName: user?.displayName || "", businessName: "MAGNEETOZ Business OS", currency: "INR" });

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!user || !configured) return toast({ title: "Demo mode", description: "Connect Firebase to save settings." });
    await updateBusinessProfile(user.uid, { ...form, theme });
    toast({ title: "Settings saved" });
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>Workspace settings</CardTitle>
        <CardDescription>Profile, business identity, currency, and theme preferences.</CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={submit}>
          <div className="space-y-2"><Label>Owner name</Label><Input value={form.ownerName} onChange={(event) => setForm({ ...form, ownerName: event.target.value })} /></div>
          <div className="space-y-2"><Label>Business name</Label><Input value={form.businessName} onChange={(event) => setForm({ ...form, businessName: event.target.value })} /></div>
          <div className="space-y-2"><Label>Currency</Label><Input value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value.toUpperCase() })} /></div>
          <div className="flex items-center justify-between rounded-md border border-white/10 p-3">
            <div><p className="text-sm font-medium">Light mode</p><p className="text-sm text-muted-foreground">Dark mode is the default SaaS experience.</p></div>
            <Switch checked={theme === "light"} onCheckedChange={toggleTheme} />
          </div>
          <Button><Save className="h-4 w-4" />Save settings</Button>
        </form>
      </CardContent>
    </Card>
  );
}
