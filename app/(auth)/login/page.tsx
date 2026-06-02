"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { Chrome, Loader2 } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";

function LoginForm() {
  const { login, loginWithGoogle, configured } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      router.push(search.get("next") || "/dashboard");
    } catch (error) {
      toast({ title: "Login failed", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="relative w-full max-w-md">
      <CardHeader>
        <p className="text-sm font-semibold text-primary">MAGNEETOZ Business OS</p>
        <CardTitle className="text-2xl">Welcome back</CardTitle>
        <CardDescription>Sign in to manage expenses, revenue, budgets, inventory, and AI insights.</CardDescription>
      </CardHeader>
      <CardContent>
        {!configured ? (
          <div className="mb-4 rounded-md border border-primary/30 bg-primary/10 p-3 text-sm text-primary">
            Firebase keys are missing. Add them to .env.local using .env.example.
          </div>
        ) : null}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          </div>
          <Button className="w-full" disabled={loading || !configured}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Login
          </Button>
        </form>
        <Button className="mt-3 w-full" variant="outline" onClick={loginWithGoogle} disabled={!configured}>
          <Chrome className="h-4 w-4" />
          Continue with Google
        </Button>
        <p className="mt-5 text-center text-sm text-muted-foreground">
          New here?{" "}
          <Link className="text-primary hover:underline" href="/signup">
            Create account
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<Card className="w-full max-w-md p-8 text-center text-muted-foreground">Loading login...</Card>}>
      <LoginForm />
    </Suspense>
  );
}
