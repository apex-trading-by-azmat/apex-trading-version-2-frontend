"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Lock, Mail, AlertCircle, Loader2, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLogin } from "@/hook/useLogin";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authNotice, setAuthNotice] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("expired") === "true") {
        setAuthNotice("Your session has expired. Please sign in again to resume live trading.");
      } else if (params.get("unauthorized") === "true") {
        setAuthNotice("Please sign in to access the Apex Signal Trading terminal.");
      }
      const emailParam = params.get("email");
      if (emailParam) {
        setEmail(emailParam);
      }
    }
  }, []);

  const { mutate: login, isPending, isError, error } = useLogin({
    onSuccess: (data: any) => {
      const token = data?.access_token || data?.tokens?.access;
      if (typeof window !== "undefined" && token) {
        localStorage.setItem("access_token", token);
      }
      router.push("/dashboard");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login({ email, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 sm:p-8 shadow-lg shadow-primary/10">
        <div className="mb-6 flex flex-col items-center">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 shadow-sm shadow-primary/10">
            <Lock className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Sign In</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Access your Apex Signal Trading terminal session.
          </p>
        </div>

        {authNotice && (
          <div className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/30 text-warning text-xs flex items-start gap-2 shadow-sm">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-warning" />
            <div className="flex-1 leading-relaxed">{authNotice}</div>
          </div>
        )}

        {isError && (
          <div className="mb-4 p-3.5 rounded-lg bg-down/10 border border-down/30 text-down text-xs space-y-2 shadow-sm">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1 leading-relaxed">
                {(error as { message?: string })?.message || "Failed to sign in. Please verify your credentials."}
              </div>
            </div>
            {((error as any)?.status === 403 ||
              (error as any)?.data?.user_status === "PENDING_APPROVAL" ||
              (error as any)?.message?.toLowerCase().includes("pending approval") ||
              (error as any)?.message?.toLowerCase().includes("underway")) && (
              <div className="pt-2 border-t border-down/20 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  Awaiting administrator audit?
                </span>
                <Link
                  href={`/auth/register?step=3${email ? `&email=${encodeURIComponent(email)}` : ""}`}
                  className="px-2.5 py-1 rounded bg-down/20 hover:bg-down/30 text-[11px] font-semibold text-down transition-colors"
                >
                  Check Verification &rarr;
                </Link>
              </div>
            )}
            {((error as any)?.data?.user_status === "PENDING_PAYMENT" ||
              (error as any)?.message?.toLowerCase().includes("pending payment")) && (
              <div className="pt-2 border-t border-down/20 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground">
                  Payment proof required:
                </span>
                <Link
                  href={`/auth/register?step=2${email ? `&email=${encodeURIComponent(email)}` : ""}`}
                  className="px-2.5 py-1 rounded bg-down/20 hover:bg-down/30 text-[11px] font-semibold text-down transition-colors"
                >
                  Submit Payment &rarr;
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase font-mono tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-subtle absolute left-3 top-3.5" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                placeholder="Enter your email address"
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
                className="text-[11px] text-primary hover:underline underline-offset-2"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-subtle absolute left-3 top-3.5" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                placeholder="Enter your password"
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
            disabled={isPending}
            className="w-full py-3 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20 cursor-pointer disabled:cursor-not-allowed"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating…</span>
              </>
            ) : (
              <>
                <span>Authenticate &amp; Launch Terminal</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-border text-center text-xs text-muted-foreground">
          Don&apos;t have an active license?{" "}
          <Link href="/auth/register" className="text-primary font-semibold hover:underline underline-offset-2">
            Get 30-Day Pass ($25)
          </Link>
        </div>
      </div>
    </div>
  );
}
