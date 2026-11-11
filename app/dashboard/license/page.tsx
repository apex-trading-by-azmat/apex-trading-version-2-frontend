"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ShieldCheck,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Copy,
  Check,
  KeyRound,
  Sparkles,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  EASYPAISA_CONFIG,
  getActiveLicense,
  activateLicenseKey,
  ActiveLicense,
} from "@/lib/auth-flow";

export default function LicensePage() {
  const [license, setLicense] = useState<ActiveLicense | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const refreshLicense = () => {
    setLicense(getActiveLicense());
  };

  useEffect(() => {
    refreshLicense();
    window.addEventListener("apex_license_updated", refreshLicense);
    return () => window.removeEventListener("apex_license_updated", refreshLicense);
  }, []);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleActivateNewKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyInput.trim()) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    setTimeout(() => {
      const res = activateLicenseKey(keyInput.trim());
      setIsSubmitting(false);
      if (res.success && res.license) {
        setStatusMessage({ text: res.message, isError: false });
        setKeyInput("");
        setLicense(res.license);
      } else {
        setStatusMessage({ text: res.message, isError: true });
      }
    }, 500);
  };

  const daysRemaining = license?.daysRemaining ?? 30;
  const progressPercent = Math.max(0, Math.min(100, Math.round(((30 - daysRemaining) / 30) * 100)));

  return (
    <AppShell
      title="License & Subscription"
      description="Manage your 30-day platform access pass and Easypaisa manual payment verification."
    >
      <div className="space-y-5">
        <div className="grid gap-5 md:grid-cols-[1.3fr_1.1fr]">
          {/* Active Pass Card */}
          <Card className="border-border bg-card">
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-foreground">Active Subscription Pass</CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">Single 30-day fixed period access</CardDescription>
                </div>
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-up/10 text-up border border-up/20">
                  {daysRemaining > 0 ? "ACTIVE" : "EXPIRED"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-baseline justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">30-Day Signal Pass</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Activated on {license?.activatedAt || "2026-11-11"}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold font-mono text-primary">{daysRemaining}</span>
                  <span className="text-xs text-muted-foreground block">days remaining</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                  <span>30-Day Cycle Consumption</span>
                  <span>{30 - daysRemaining} / 30 Days ({progressPercent}%)</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-xs font-mono">
                <div className="p-3 rounded-lg bg-secondary border border-border">
                  <p className="text-[10px] text-subtle">EXPIRATION DATE</p>
                  <p className="mt-1 font-semibold text-foreground">{license?.expiresAt || "30 days from activation"}</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary border border-border">
                  <p className="text-[10px] text-subtle">GATEWAY VERIFICATION</p>
                  <p className="mt-1 font-semibold text-up flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Easypaisa Verified
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-secondary/60 border border-border flex items-center justify-between text-xs font-mono">
                <div>
                  <span className="text-muted-foreground text-[10px] block">CURRENT LICENSE KEY:</span>
                  <span className="font-bold text-primary">{license?.key || "APEX-30D-AZMT-9900-V1"}</span>
                </div>
                <button
                  onClick={() => copyToClipboard(license?.key || "APEX-30D-AZMT-9900-V1", "active-key")}
                  className="p-1 rounded hover:bg-secondary text-subtle hover:text-foreground"
                  title="Copy Key"
                >
                  {copiedField === "active-key" ? <Check className="w-3.5 h-3.5 text-up" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Renewal & Payment Policy */}
          <Card className="border-border bg-card flex flex-col justify-between">
            <CardHeader className="pb-3 border-b border-border">
              <CardTitle className="text-base text-foreground flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                Easypaisa Official Deposit Account
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Manual renewals via Easypaisa transaction ID verification.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="p-3 rounded-lg bg-secondary border border-border text-xs text-muted-foreground leading-relaxed">
                Apex Signal Trading operates on a single 30-day fixed model with zero recurring auto-debits. Renewals are handled via manual Easypaisa transaction ID submission verified by administrators.
              </div>

              <div className="space-y-2.5 text-xs font-mono">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary border border-border">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">ACCOUNT TITLE</span>
                    <span className="font-bold text-foreground">{EASYPAISA_CONFIG.accountTitle}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(EASYPAISA_CONFIG.accountTitle, "acc-title")}
                    className="p-1 rounded hover:bg-card text-subtle hover:text-foreground"
                  >
                    {copiedField === "acc-title" ? <Check className="w-3.5 h-3.5 text-up" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary border border-border">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">EASYPAISA NUMBER</span>
                    <span className="font-bold text-primary">{EASYPAISA_CONFIG.accountNumber}</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(EASYPAISA_CONFIG.accountNumber, "acc-num")}
                    className="p-1 rounded hover:bg-card text-subtle hover:text-foreground"
                  >
                    {copiedField === "acc-num" ? <Check className="w-3.5 h-3.5 text-up" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                <div className="flex justify-between py-1 px-1 border-b border-border/60 text-xs">
                  <span className="text-muted-foreground">Verification SLA:</span>
                  <span className="font-bold text-primary">&lt; 30 Minutes</span>
                </div>
              </div>

              {/* Enter New 30-Day License Key Form */}
              <form onSubmit={handleActivateNewKey} className="pt-2 space-y-2.5">
                <label className="block text-xs font-medium text-foreground uppercase font-mono tracking-wider">
                  Activate / Extend with 30-Day Key
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value.toUpperCase())}
                    placeholder="e.g. APEX-30D-XXXX-XXXX"
                    className="flex-1 px-3 py-2 rounded-lg bg-secondary border border-border text-xs font-mono font-semibold text-foreground focus:outline-none focus:border-primary uppercase"
                  />
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold whitespace-nowrap transition-colors shadow-sm disabled:opacity-50"
                  >
                    {isSubmitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Apply Key"}
                  </button>
                </div>

                {statusMessage && (
                  <p
                    className={`text-xs flex items-center gap-1.5 ${
                      statusMessage.isError ? "text-down" : "text-up"
                    }`}
                  >
                    {statusMessage.isError ? (
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    )}
                    {statusMessage.text}
                  </p>
                )}
              </form>

              <Link
                href="/auth/register"
                className="w-full mt-2 py-2.5 rounded-lg bg-secondary hover:bg-card border border-border text-xs font-semibold text-foreground transition-colors flex items-center justify-center gap-1.5"
              >
                Submit New Payment Proof
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
