"use client";

import Link from "next/link";
import { ArrowRight, Lock, Mail, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  return (
    <div className="max-w-md mx-auto rounded-xl border border-border bg-card p-6 sm:p-8 shadow-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground tracking-tight">Sign In</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Access your Apex Signal Trading terminal session.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase font-mono tracking-wider">
            Email Address
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 text-subtle absolute left-3 top-3" />
            <input
              type="email"
              defaultValue="azmat@apextrading.io"
              required
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
              placeholder="operator@apextrading.io"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-muted-foreground uppercase font-mono tracking-wider">
              Password
            </label>
            <Link
              href="/auth/forgot-password"
              className="text-[11px] text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="w-4 h-4 text-subtle absolute left-3 top-3" />
            <input
              type="password"
              defaultValue="••••••••••••"
              required
              className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
              placeholder="••••••••••••"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="remember"
            defaultChecked
            className="rounded bg-secondary border-border text-primary focus:ring-0"
          />
          <label htmlFor="remember" className="text-xs text-muted-foreground">
            Keep monitoring session active
          </label>
        </div>

        <button
          type="submit"
          className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
        >
          Authenticate &amp; Launch Terminal
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>

      <div className="mt-6 pt-5 border-t border-border text-center text-xs text-muted-foreground">
        Don&apos;t have an active license?{" "}
        <Link href="/auth/register" className="text-primary font-semibold hover:underline">
          Request Membership
        </Link>
      </div>
    </div>
  );
}

