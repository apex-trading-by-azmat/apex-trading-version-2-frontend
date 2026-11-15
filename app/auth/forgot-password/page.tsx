"use client";

import Link from "next/link";
import { ArrowLeft, ArrowRight, Mail } from "lucide-react";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 sm:p-6 lg:p-10">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 sm:p-8 shadow-lg shadow-primary/10">
        <div className="mb-6 flex flex-col items-center">
          <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3 shadow-sm shadow-primary/10">
            <Mail className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Reset Password</h2>
          <p className="text-xs text-muted-foreground mt-1">
            Enter your account email to receive recovery instructions.
          </p>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-up/10 border border-up/20 text-xs text-up leading-relaxed shadow-sm">
              Recovery instructions have been dispatched to your registered address. Please check your inbox.
            </div>
            <Link
              href="/auth/login"
              className="w-full py-3 rounded-lg bg-secondary border border-border text-xs font-semibold text-foreground flex items-center justify-center gap-2 hover:bg-secondary/80 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Sign In
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase font-mono tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-subtle absolute left-3 top-3.5" />
                <input
                  type="email"
                  required
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  placeholder="operator@apextrading.io"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20 cursor-pointer"
            >
              Send Recovery Link
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <Link
                href="/auth/login"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
