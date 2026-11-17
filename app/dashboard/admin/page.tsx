"use client";

import React, { useState, useEffect } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Database,
  Users,
  ShieldCheck,
  CheckCircle2,
  Clock,
  KeyRound,
  Copy,
  Check,
  CreditCard,
  Sparkles,
  FileText,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import {
  EASYPAISA_CONFIG,
  PaymentSubmission,
  getPaymentSubmissions,
  approveSubmission,
  rejectSubmission,
  generate30DayLicenseKey,
  isStatusApproved,
  isStatusRejected,
  isStatusPending,
} from "@/lib/auth-flow";
import { cn } from "@/lib/utils";

export default function AdminPage() {
  const [submissions, setSubmissions] = useState<PaymentSubmission[]>([]);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [quickKeyGenerated, setQuickKeyGenerated] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("all");

  const refreshData = () => {
    setSubmissions(getPaymentSubmissions());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener("apex_submissions_updated", refreshData);
    return () => window.removeEventListener("apex_submissions_updated", refreshData);
  }, []);

  const handleApprove = (id: string) => {
    const res = approveSubmission(id);
    if (res) {
      refreshData();
    }
  };

  const handleReject = (id: string) => {
    const reason = window.prompt(
      "Enter rejection note for trader:",
      "TRX ID not found in Easypaisa ledger or screenshot unclear."
    );
    if (reason !== null) {
      rejectSubmission(id, reason.trim() || undefined);
      refreshData();
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateManualKey = () => {
    const key = generate30DayLicenseKey("APEX");
    setQuickKeyGenerated(key);
  };

  const pendingCount = submissions.filter((s) => isStatusPending(s.status)).length;
  const approvedCount = submissions.filter((s) => isStatusApproved(s.status)).length;
  const rejectedCount = submissions.filter((s) => isStatusRejected(s.status)).length;

  const filteredSubmissions = submissions.filter((sub) => {
    if (filter === "pending") return isStatusPending(sub.status);
    if (filter === "approved") return isStatusApproved(sub.status);
    if (filter === "rejected") return isStatusRejected(sub.status);
    return true;
  });

  const filterButtons = [
    { key: "all", label: "All", count: submissions.length },
    { key: "pending", label: "Pending", count: pendingCount },
    { key: "approved", label: "Approved", count: approvedCount },
    { key: "rejected", label: "Rejected", count: rejectedCount },
  ] as const;

  return (
    <AppShell
      title="Admin Dashboard"
      description="Easypaisa manual transaction verification, 30-day licensing approvals, and payment audit telemetry."
    >
      <div className="space-y-5">
        {/* Metric Cards */}
        <section className="grid gap-3 grid-cols-2 lg:grid-cols-4">
          <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              Pending Verifications
            </p>
            <p className="text-2xl font-bold font-mono text-warning mt-1">{pendingCount}</p>
            <p className="text-[10px] text-subtle mt-1">Awaiting Easypaisa audit</p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              Active 30-Day Licenses
            </p>
            <p className="text-2xl font-bold font-mono text-up mt-1">
              {approvedCount + 1118}
            </p>
            <p className="text-[10px] text-subtle mt-1">Verified platform subscribers</p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              Easypaisa Account
            </p>
            <p className="text-sm font-bold font-mono text-primary mt-1">
              {EASYPAISA_CONFIG.accountNumber}
            </p>
            <p className="text-[10px] text-muted-foreground mt-0.5 truncate">
              {EASYPAISA_CONFIG.accountTitle}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-card border border-border shadow-sm">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
              Fixed Period Policy
            </p>
            <p className="text-2xl font-bold font-mono text-foreground mt-1">30 Days</p>
            <p className="text-[10px] text-subtle mt-1">Strict expiry per license</p>
          </div>
        </section>

        {/* User Management and Verification Queue */}
        <section className="grid gap-5 xl:grid-cols-[1.5fr_0.9fr]">
          <Card className={cn("border-border bg-card shadow-sm")}>
            <CardHeader className="pb-3 border-b border-border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-primary" />
                    Easypaisa Payment Verification Queue
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground">
                    Review incoming transaction IDs and generate 30-day access keys.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-1.5 self-start sm:self-auto">
                  {filterButtons.map((fb) => (
                    <button
                      key={fb.key}
                      onClick={() => setFilter(fb.key)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-mono transition-colors whitespace-nowrap",
                        filter === fb.key
                          ? fb.key === "all"
                            ? "bg-primary text-white"
                            : fb.key === "pending"
                              ? "bg-warning text-white"
                              : "bg-up text-white"
                          : "bg-secondary text-muted-foreground hover:text-foreground border border-border"
                      )}
                    >
                      {fb.label} ({fb.count})
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-4 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground font-semibold uppercase text-[10px] tracking-wider bg-secondary/40">
                      <th className="px-4 py-3">User / Sender</th>
                      <th className="px-4 py-3">Transaction ID (TID)</th>
                      <th className="px-4 py-3">Amount &amp; Pass</th>
                      <th className="px-4 py-3">Status / Key</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredSubmissions.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-10 text-center text-xs text-muted-foreground font-mono">
                          <div className="flex flex-col items-center gap-2">
                            <Clock className="w-5 h-5 text-muted-foreground mx-auto mb-1" />
                            <p>No submissions matching selected filter.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredSubmissions.map((sub) => (
                        <tr
                          key={sub.id}
                          className="hover:bg-secondary/50 transition-colors group"
                        >
                          <td className="px-4 py-3">
                            <p className="font-semibold text-foreground">{sub.name}</p>
                            <p className="text-[11px] text-muted-foreground font-mono">{sub.email}</p>
                            <p className="text-[10px] text-subtle mt-0.5">
                              Sender: {sub.senderName} ({sub.senderPhone})
                            </p>
                          </td>
                          <td className="px-4 py-3 font-mono">
                            <span className={cn(
                              "font-bold text-foreground bg-secondary px-2 py-1 rounded border border-border",
                              "truncate max-w-[140px]"
                            )}>
                              {sub.transactionId}
                            </span>
                            <p className="text-[10px] text-subtle mt-1">{sub.submittedAt}</p>
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold font-mono text-foreground">{sub.amount}</span>
                            <p className="text-[10px] text-up font-mono">30 Days Fixed</p>
                          </td>
                          <td className="px-4 py-3">
                            {isStatusApproved(sub.status) ? (
                              <div className="space-y-1">
                                <span className={cn(
                                  "text-[10px] font-bold font-mono px-2 py-0.5 rounded border bg-up/10 text-up border-up/20 inline-block"
                                )}>
                                  VERIFIED
                                </span>
                                {sub.licenseKey && (
                                  <div className="flex items-center gap-1 font-mono text-[11px] text-primary">
                                    <span className="truncate max-w-[120px]">{sub.licenseKey}</span>
                                    <button
                                      onClick={() => copyToClipboard(sub.licenseKey!, sub.id)}
                                      className="p-0.5 hover:text-foreground"
                                      title="Copy Key"
                                    >
                                      {copiedKey === sub.id ? (
                                        <Check className="w-3 h-3 text-up" />
                                      ) : (
                                        <Copy className="w-3 h-3" />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : isStatusRejected(sub.status) ? (
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded border bg-down/10 text-down border-down/20 inline-block">
                                  REJECTED
                                </span>
                                {sub.rejectionReason && (
                                  <p className="text-[10px] text-muted-foreground truncate max-w-[180px]">
                                    {sub.rejectionReason}
                                  </p>
                                )}
                              </div>
                            ) : (
                              <span className={cn(
                                "text-[10px] font-bold font-mono px-2 py-0.5 rounded border bg-warning/10 text-warning border-warning/20 inline-block"
                              )}>
                                PENDING REVIEW
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {isStatusPending(sub.status) ? (
                              <div className="inline-flex items-center gap-1.5 justify-end">
                                <button
                                  onClick={() => handleApprove(sub.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold whitespace-nowrap transition-colors shadow-sm inline-flex items-center gap-1"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleReject(sub.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-down/10 hover:bg-down/20 text-down border border-down/30 text-xs font-semibold whitespace-nowrap transition-colors inline-flex items-center gap-1"
                                >
                                  <AlertCircle className="w-3.5 h-3.5" />
                                  Reject
                                </button>
                              </div>
                            ) : isStatusRejected(sub.status) ? (
                              <span className="text-[11px] font-mono text-down">
                                Audit Rejected
                              </span>
                            ) : (
                              <span className="text-[11px] font-mono text-muted-foreground">
                                Active ({sub.expiresAt || "30 days"})
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Operational Checks & Manual License Issuer */}
          <div className="space-y-5">
            {/* Quick License Generator */}
            <Card className={cn("border-border bg-card shadow-sm")}>
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-primary" />
                  Instant 30-Day License Generator
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Create a pre-approved key for manual customer support allocation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 pt-4 text-xs">
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Generated keys grant precisely 30 days of platform access from the time the user enters them in Step 4
                  or on the License page.
                </p>

                {quickKeyGenerated && (
                  <div className="p-3 rounded-lg bg-secondary border border-border flex items-center justify-between shadow-sm">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-mono">
                        Issued 30-Day Key
                      </p>
                      <p className="text-xs font-bold font-mono text-primary mt-0.5 truncate">
                        {quickKeyGenerated}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(quickKeyGenerated, "manual-gen")}
                      className="p-1.5 rounded bg-card hover:bg-secondary text-subtle hover:text-foreground transition-colors"
                      title="Copy Key"
                    >
                      {copiedKey === "manual-gen" ? (
                        <Check className="w-4 h-4 text-up" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                )}

                <button
                  onClick={handleGenerateManualKey}
                  className="w-full py-2 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generate New 30-Day Key
                </button>
              </CardContent>
            </Card>

            {/* Easypaisa Official Configuration Card */}
            <Card className={cn("border-border bg-card shadow-sm")}>
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-up" />
                  Easypaisa Gateway Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2.5 pt-4 text-xs font-mono">
                <div className="p-2.5 rounded-lg bg-secondary border border-border flex justify-between shadow-sm">
                  <span className="text-muted-foreground">Title:</span>
                  <span className="font-semibold text-foreground">{EASYPAISA_CONFIG.accountTitle}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-secondary border border-border flex justify-between shadow-sm">
                  <span className="text-muted-foreground">Account:</span>
                  <span className="font-bold text-primary">{EASYPAISA_CONFIG.accountNumber}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-secondary border border-border flex justify-between shadow-sm">
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="text-up font-bold">30 Days Fixed</span>
                </div>
                <div className="p-2.5 rounded-lg bg-secondary border border-border flex justify-between shadow-sm">
                  <span className="text-muted-foreground">SLA:</span>
                  <span className="text-foreground">&lt; 30 Minutes</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
