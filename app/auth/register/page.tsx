"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Copy,
  Check,
  Upload,
  CreditCard,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Clock,
  Sparkles,
  ExternalLink,
  RefreshCw,
  FileText,
} from "lucide-react";
import {
  EASYPAISA_CONFIG,
  PaymentSubmission,
  getPaymentSubmissions,
  savePaymentSubmission,
  approveSubmission,
  activateLicenseKey,
  getActiveLicense,
  generate30DayLicenseKey,
} from "@/lib/auth-flow";

export default function RegisterWizardPage() {
  const router = useRouter();

  // Wizard Step: 1 = Sign Up, 2 = Payment Proof, 3 = Admin Verification, 4 = License Key Activation
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Step 1: Sign up data
  const [formData, setFormData] = useState({
    name: "Azmat Khan",
    email: "azmat@example.com",
    password: "",
    confirmPassword: "",
    termsAgreed: true,
  });

  // Step 2: Payment proof submission data
  const [paymentData, setPaymentData] = useState({
    senderName: "",
    senderPhone: "",
    transactionId: "",
    receiptFile: null as File | null,
    receiptFileName: "",
    receiptPreviewUrl: "",
    amount: "PKR 3,000",
  });

  // Step 3 & 4: Status and License data
  const [submissionId, setSubmissionId] = useState<string>("");
  const [submissionStatus, setSubmissionStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [issuedLicenseKey, setIssuedLicenseKey] = useState<string>("");
  const [licenseInput, setLicenseInput] = useState<string>("");
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);
  const [accountComplete, setAccountComplete] = useState(false);
  const [activeExpiryDate, setActiveExpiryDate] = useState<string>("");

  // Load saved state from localStorage if available
  useEffect(() => {
    try {
      const savedStep = localStorage.getItem("apex_reg_step");
      if (savedStep) {
        const stepNum = parseInt(savedStep, 10);
        if (stepNum >= 1 && stepNum <= 4) {
          setCurrentStep(stepNum as 1 | 2 | 3 | 4);
        }
      }

      const savedUser = localStorage.getItem("apex_reg_user");
      if (savedUser) {
        setFormData((prev) => ({ ...prev, ...JSON.parse(savedUser) }));
      }

      const savedPayment = localStorage.getItem("apex_reg_payment");
      if (savedPayment) {
        const parsed = JSON.parse(savedPayment);
        setPaymentData((prev) => ({ ...prev, ...parsed }));
        if (parsed.submissionId) {
          setSubmissionId(parsed.submissionId);
        }
      }

      const latestApproved = localStorage.getItem("apex_latest_approved_key");
      if (latestApproved) {
        setIssuedLicenseKey(latestApproved);
        setLicenseInput(latestApproved);
      }
    } catch {
      // ignore
    }
  }, []);

  // Listen for admin approvals across tabs
  useEffect(() => {
    const handleSubmissionsUpdated = () => {
      if (!submissionId) return;
      const submissions = getPaymentSubmissions();
      const current = submissions.find((s) => s.id === submissionId || s.transactionId === paymentData.transactionId);
      if (current && current.status === "approved" && current.licenseKey) {
        setSubmissionStatus("approved");
        setIssuedLicenseKey(current.licenseKey);
        setLicenseInput(current.licenseKey);
      }
    };

    window.addEventListener("apex_submissions_updated", handleSubmissionsUpdated);
    return () => window.removeEventListener("apex_submissions_updated", handleSubmissionsUpdated);
  }, [submissionId, paymentData.transactionId]);

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Step 1: Submit Registration
  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    localStorage.setItem(
      "apex_reg_user",
      JSON.stringify({ name: formData.name, email: formData.email })
    );

    // Pre-fill sender name if empty
    if (!paymentData.senderName) {
      setPaymentData((prev) => ({ ...prev, senderName: formData.name }));
    }

    setCurrentStep(2);
    localStorage.setItem("apex_reg_step", "2");
  };

  // Step 2: Handle File Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPaymentData((prev) => ({
        ...prev,
        receiptFile: file,
        receiptFileName: file.name,
        receiptPreviewUrl: URL.createObjectURL(file),
      }));
    }
  };

  // Step 2: Submit Payment Proof
  const handleStep2Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentData.transactionId.trim()) {
      alert("Please provide the Easypaisa Transaction ID (TID)");
      return;
    }

    const subId = "sub-" + Date.now();
    setSubmissionId(subId);

    const submission: PaymentSubmission = {
      id: subId,
      name: formData.name,
      email: formData.email,
      senderName: paymentData.senderName || formData.name,
      senderPhone: paymentData.senderPhone,
      transactionId: paymentData.transactionId.trim(),
      amount: "PKR 3,000",
      status: "pending",
      submittedAt: new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC",
      screenshotName: paymentData.receiptFileName || "easypaisa_receipt.jpg",
    };

    savePaymentSubmission(submission);

    localStorage.setItem(
      "apex_reg_payment",
      JSON.stringify({
        ...paymentData,
        submissionId: subId,
        receiptFile: null,
      })
    );

    setSubmissionStatus("pending");
    setCurrentStep(3);
    localStorage.setItem("apex_reg_step", "3");
  };

  // Step 3: Fast-track demo approval (simulates admin action instantly)
  const handleSimulateAdminApproval = () => {
    const key = generate30DayLicenseKey(formData.name.replace(/\s+/g, "").slice(0, 4) || "APEX");
    setIssuedLicenseKey(key);
    setLicenseInput(key);
    setSubmissionStatus("approved");

    if (submissionId) {
      approveSubmission(submissionId);
    } else {
      localStorage.setItem("apex_latest_approved_key", key);
    }
  };

  // Step 4: Validate and Activate License Key
  const handleActivateLicense = (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError(null);
    setIsActivating(true);

    setTimeout(() => {
      const res = activateLicenseKey(licenseInput || issuedLicenseKey);
      setIsActivating(false);
      if (res.success && res.license) {
        setAccountComplete(true);
        setActiveExpiryDate(res.license.expiresAt);
        localStorage.removeItem("apex_reg_step");
      } else {
        setActivationError(res.message);
      }
    }, 600);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* 4-Step Progress Stepper Header */}
      <div className="mb-6 p-4 rounded-xl bg-card border border-border">
        <div className="grid grid-cols-4 gap-2 text-center">
          {/* Step 1 */}
          <div
            className={`flex flex-col items-center gap-1.5 cursor-pointer ${
              currentStep === 1
                ? "text-primary font-semibold"
                : currentStep > 1
                ? "text-up font-medium"
                : "text-muted-foreground opacity-60"
            }`}
            onClick={() => {
              if (currentStep > 1 && !accountComplete) setCurrentStep(1);
            }}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono transition-all ${
                currentStep === 1
                  ? "bg-primary text-white ring-4 ring-primary/20"
                  : currentStep > 1
                  ? "bg-up text-white"
                  : "bg-secondary text-muted-foreground border border-border"
              }`}
            >
              {currentStep > 1 ? <Check className="w-4 h-4" /> : "1"}
            </div>
            <span className="text-[11px] leading-tight">1. Sign Up</span>
          </div>

          {/* Step 2 */}
          <div
            className={`flex flex-col items-center gap-1.5 cursor-pointer ${
              currentStep === 2
                ? "text-primary font-semibold"
                : currentStep > 2
                ? "text-up font-medium"
                : "text-muted-foreground opacity-60"
            }`}
            onClick={() => {
              if (currentStep > 2 && !accountComplete) setCurrentStep(2);
            }}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono transition-all ${
                currentStep === 2
                  ? "bg-primary text-white ring-4 ring-primary/20"
                  : currentStep > 2
                  ? "bg-up text-white"
                  : "bg-secondary text-muted-foreground border border-border"
              }`}
            >
              {currentStep > 2 ? <Check className="w-4 h-4" /> : "2"}
            </div>
            <span className="text-[11px] leading-tight">2. Payment Proof</span>
          </div>

          {/* Step 3 */}
          <div
            className={`flex flex-col items-center gap-1.5 cursor-pointer ${
              currentStep === 3
                ? "text-primary font-semibold"
                : currentStep > 3
                ? "text-up font-medium"
                : "text-muted-foreground opacity-60"
            }`}
            onClick={() => {
              if (currentStep > 3 && !accountComplete) setCurrentStep(3);
            }}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono transition-all ${
                currentStep === 3
                  ? "bg-primary text-white ring-4 ring-primary/20"
                  : currentStep > 3
                  ? "bg-up text-white"
                  : "bg-secondary text-muted-foreground border border-border"
              }`}
            >
              {currentStep > 3 ? <Check className="w-4 h-4" /> : "3"}
            </div>
            <span className="text-[11px] leading-tight">3. Admin Review</span>
          </div>

          {/* Step 4 */}
          <div
            className={`flex flex-col items-center gap-1.5 ${
              currentStep === 4
                ? "text-primary font-semibold"
                : accountComplete
                ? "text-up font-medium"
                : "text-muted-foreground opacity-60"
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono transition-all ${
                accountComplete
                  ? "bg-up text-white"
                  : currentStep === 4
                  ? "bg-primary text-white ring-4 ring-primary/20"
                  : "bg-secondary text-muted-foreground border border-border"
              }`}
            >
              {accountComplete ? <Check className="w-4 h-4" /> : "4"}
            </div>
            <span className="text-[11px] leading-tight">4. 30-Day License</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          STEP 1: SIGN UP
      ══════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-2xl">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-xs font-mono text-primary mb-2">
              Step 1 of 4: Account Details
            </div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Create Your Account</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Start registration for 30-day fixed signal terminal access.
            </p>
          </div>

          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase font-mono tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-subtle absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="Azmat Ullah"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase font-mono tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-subtle absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                  placeholder="trader@apextrading.io"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase font-mono tracking-wider">
                  Create Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-subtle absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                    placeholder="Min 8 characters"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase font-mono tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-subtle absolute left-3 top-3" />
                  <input
                    type="password"
                    required
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                    placeholder="Repeat password"
                  />
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-secondary/80 border border-border text-xs text-muted-foreground space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>30-Day Fixed License Model</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Accounts are activated via a dedicated 30-day license key issued upon manual Easypaisa payment verification. No recurring debits or automatic renewals.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
            >
              Continue to Step 2: Payment Proof
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-border text-center text-xs text-muted-foreground">
            Already have an active account?{" "}
            <Link href="/auth/login" className="text-primary font-semibold hover:underline">
              Sign In
            </Link>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          STEP 2: PAYMENT PROOF SUBMISSION
      ══════════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-2xl">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-xs font-mono text-primary mb-2">
              Step 2 of 4: Manual Payment
            </div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Easypaisa Payment Transfer</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Transfer PKR 3,000 for your 30-day license and submit proof below.
            </p>
          </div>

          {/* Official Easypaisa Account Details Box */}
          <div className="mb-6 p-4 rounded-xl bg-secondary/90 border border-border">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-up/15 border border-up/30 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-up" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
                    Easypaisa Official Deposit Account
                  </h3>
                  <p className="text-[10px] text-muted-foreground">Telenor Microfinance Bank</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                30-DAY PASS
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Account Title */}
              <div className="p-3 rounded-lg bg-card border border-border flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">Account Title</p>
                  <p className="text-sm font-bold text-foreground mt-0.5">{EASYPAISA_CONFIG.accountTitle}</p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(EASYPAISA_CONFIG.accountTitle, "title")}
                  className="p-1.5 rounded-md hover:bg-secondary text-subtle hover:text-foreground transition-colors"
                  title="Copy Title"
                >
                  {copiedField === "title" ? (
                    <Check className="w-4 h-4 text-up" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Account Number */}
              <div className="p-3 rounded-lg bg-card border border-border flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-mono text-muted-foreground uppercase">Easypaisa Number</p>
                  <p className="text-sm font-bold font-mono text-primary mt-0.5">
                    {EASYPAISA_CONFIG.accountNumber}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => copyToClipboard(EASYPAISA_CONFIG.accountNumber, "account")}
                  className="p-1.5 rounded-md hover:bg-secondary text-subtle hover:text-foreground transition-colors"
                  title="Copy Account Number"
                >
                  {copiedField === "account" ? (
                    <Check className="w-4 h-4 text-up" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-muted-foreground bg-card/60 p-2.5 rounded-lg border border-border">
              <span>Required Amount: <strong className="text-foreground font-mono">PKR 3,000</strong></span>
              <span>Validity: <strong className="text-up font-mono">30 Days Fixed</strong></span>
            </div>
          </div>

          {/* Submission Form */}
          <form onSubmit={handleStep2Submit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase font-mono tracking-wider">
                  Sender Account Name
                </label>
                <input
                  type="text"
                  required
                  value={paymentData.senderName}
                  onChange={(e) => setPaymentData({ ...paymentData, senderName: e.target.value })}
                  placeholder="Your Easypaisa Title"
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase font-mono tracking-wider">
                  Sender Mobile Number
                </label>
                <input
                  type="text"
                  required
                  value={paymentData.senderPhone}
                  onChange={(e) => setPaymentData({ ...paymentData, senderPhone: e.target.value })}
                  placeholder="03XX-XXXXXXX"
                  className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase font-mono tracking-wider">
                Easypaisa Transaction ID (TID / TRX ID) <span className="text-down">*</span>
              </label>
              <input
                type="text"
                required
                value={paymentData.transactionId}
                onChange={(e) => setPaymentData({ ...paymentData, transactionId: e.target.value })}
                placeholder="e.g. TX9841029410 or 11-digit TID"
                className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-xs font-mono text-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <p className="text-[10px] text-subtle mt-1">
                Enter the unique reference code from the Easypaisa SMS receipt or app confirmation.
              </p>
            </div>

            {/* Proof Screenshot Upload */}
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase font-mono tracking-wider">
                Payment Screenshot / Receipt
              </label>
              <label className="flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-border hover:border-primary/60 bg-secondary/50 hover:bg-secondary cursor-pointer transition-all">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                {paymentData.receiptPreviewUrl ? (
                  <div className="flex items-center gap-3 w-full">
                    <img
                      src={paymentData.receiptPreviewUrl}
                      alt="Receipt Preview"
                      className="w-12 h-12 object-cover rounded-lg border border-border"
                    />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {paymentData.receiptFileName}
                      </p>
                      <p className="text-[10px] text-up flex items-center gap-1 mt-0.5">
                        <CheckCircle2 className="w-3 h-3" /> Ready for verification
                      </p>
                    </div>
                    <span className="text-xs text-primary underline">Change</span>
                  </div>
                ) : (
                  <div className="text-center">
                    <Upload className="w-6 h-6 text-subtle mx-auto mb-1.5" />
                    <p className="text-xs font-medium text-foreground">Click or Drag Easypaisa screenshot here</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">PNG, JPG or PDF (Max 5MB)</p>
                  </div>
                )}
              </label>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="py-2.5 px-4 rounded-lg bg-secondary hover:bg-card border border-border text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                Submit Payment Proof for Verification
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          STEP 3: PAYMENT VERIFICATION BY ADMIN
      ══════════════════════════════════════════════════ */}
      {currentStep === 3 && (
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-2xl">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-warning/10 border border-warning/20 text-xs font-mono text-warning mb-2">
              Step 3 of 4: Admin Verification
            </div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Payment Verification</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Your transaction is queued for administrative audit and approval.
            </p>
          </div>

          {submissionStatus === "pending" ? (
            <div className="space-y-5">
              {/* Animated verification radar */}
              <div className="p-5 rounded-xl bg-secondary/80 border border-border text-center">
                <div className="relative w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-warning/20 animate-ping opacity-75" />
                  <div className="w-12 h-12 rounded-full bg-warning/15 border border-warning/30 flex items-center justify-center text-warning relative z-10">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                </div>

                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-warning/10 border border-warning/20 text-xs font-mono text-warning font-semibold">
                  Awaiting Admin Audit
                </div>
                <h3 className="text-sm font-semibold text-foreground mt-2">
                  Verifying Easypaisa TID: {paymentData.transactionId || "TX9823419082"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
                  Our financial admin verifies the ledger against Easypaisa account{" "}
                  <strong className="text-foreground">{EASYPAISA_CONFIG.accountNumber} ({EASYPAISA_CONFIG.accountTitle})</strong>.
                  Verification takes 15-45 minutes during operational hours.
                </p>
              </div>

              {/* Submitted Details Review Card */}
              <div className="p-4 rounded-xl bg-card border border-border text-xs space-y-2.5 font-mono">
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Registered User:</span>
                  <span className="text-foreground font-semibold">{formData.name} ({formData.email})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Easypaisa Sender:</span>
                  <span className="text-foreground">{paymentData.senderName} ({paymentData.senderPhone || "03XX-XXXXXXX"})</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Transaction ID (TID):</span>
                  <span className="text-primary font-bold">{paymentData.transactionId || "TX9823419082"}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Pass Duration:</span>
                  <span className="text-up font-bold">30 Days Fixed</span>
                </div>
              </div>

              {/* Fast Track / Interactive Simulation Action */}
              <div className="p-4 rounded-xl bg-primary/8 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Instant Demo Admin Verification
                  </p>
                  <p className="text-[11px] mt-0.5">
                    Click to simulate immediate admin approval and receive your 30-day key.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSimulateAdminApproval}
                  className="w-full sm:w-auto px-4 py-2 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold whitespace-nowrap transition-colors shadow-md"
                >
                  Approve as Admin (Demo)
                </button>
              </div>

              <div className="text-center pt-2">
                <Link
                  href="/dashboard/admin"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-mono"
                >
                  Open Admin Dashboard queue in new tab <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            /* Approved State */
            <div className="space-y-5">
              <div className="p-5 rounded-xl bg-up/10 border border-up/20 text-center">
                <div className="w-12 h-12 rounded-full bg-up/15 border border-up/30 flex items-center justify-center text-up mx-auto mb-3">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-up/15 border border-up/25 text-xs font-mono text-up font-semibold">
                  Payment Verified by Admin
                </div>
                <h3 className="text-base font-bold text-foreground mt-2">
                  Easypaisa Payment Confirmed!
                </h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  Your 30-Day License Key has been issued by the administrator. Proceed to Step 4 to activate your account.
                </p>

                {/* Issued License Key Display */}
                <div className="mt-4 p-3 rounded-lg bg-card border border-border inline-flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground">ISSUED KEY:</span>
                  <span className="text-sm font-bold font-mono text-primary tracking-wider">
                    {issuedLicenseKey}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(issuedLicenseKey, "key")}
                    className="p-1 rounded hover:bg-secondary text-subtle hover:text-foreground"
                    title="Copy Key"
                  >
                    {copiedField === "key" ? (
                      <Check className="w-3.5 h-3.5 text-up" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setCurrentStep(4);
                  localStorage.setItem("apex_reg_step", "4");
                }}
                className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
              >
                Proceed to Step 4: Enter License Key
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          STEP 4: ENTERING THE LICENSE (ACCOUNT CREATION COMPLETE)
      ══════════════════════════════════════════════════ */}
      {currentStep === 4 && (
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-2xl">
          {!accountComplete ? (
            <>
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-xs font-mono text-primary mb-2">
                  Step 4 of 4: License Key Activation
                </div>
                <h2 className="text-xl font-bold text-foreground tracking-tight">Enter Your License Key</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Activate your 30-day signal license to finalize account creation.
                </p>
              </div>

              <form onSubmit={handleActivateLicense} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-muted-foreground uppercase font-mono tracking-wider">
                      30-Day License Key
                    </label>
                    {issuedLicenseKey && (
                      <button
                        type="button"
                        onClick={() => setLicenseInput(issuedLicenseKey)}
                        className="text-[11px] text-primary hover:underline font-mono"
                      >
                        Auto-fill Approved Key
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-subtle absolute left-3 top-3" />
                    <input
                      type="text"
                      required
                      value={licenseInput}
                      onChange={(e) => setLicenseInput(e.target.value.toUpperCase())}
                      placeholder="e.g. APEX-30D-XXXX-YYYY"
                      className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-secondary border border-border text-xs font-mono font-semibold text-foreground focus:outline-none focus:border-primary transition-colors uppercase tracking-wider"
                    />
                  </div>
                </div>

                {activationError && (
                  <div className="p-3 rounded-lg bg-down/10 border border-down/20 text-xs text-down flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{activationError}</span>
                  </div>
                )}

                <div className="p-3.5 rounded-lg bg-secondary border border-border text-xs text-muted-foreground space-y-2">
                  <div className="flex items-center justify-between text-foreground font-semibold">
                    <span>License Parameters</span>
                    <span className="text-up font-mono">30-Day Fixed Period</span>
                  </div>
                  <p className="text-[11px] text-subtle leading-relaxed">
                    Upon activation, a strict 30-day timer begins. This grant unlocks full access to 6-strategy agreement telemetry, live closed-candle signals, and risk analytics.
                  </p>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="py-2.5 px-4 rounded-lg bg-secondary hover:bg-card border border-border text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={isActivating}
                    className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {isActivating ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Validating License...
                      </>
                    ) : (
                      <>
                        Validate &amp; Complete Account Creation
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          ) : (
            /* Account Creation Complete Celebration Card */
            <div className="text-center space-y-5 py-4">
              <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                <div className="absolute inset-0 rounded-full bg-up/20 animate-ping opacity-75" />
                <div className="w-16 h-16 rounded-full bg-up/20 border-2 border-up flex items-center justify-center text-up relative z-10 shadow-lg shadow-up/20">
                  <Sparkles className="w-8 h-8" />
                </div>
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-up/10 border border-up/20 text-xs font-mono font-bold text-up mb-2">
                  ACCOUNT CREATION COMPLETE
                </span>
                <h2 className="text-2xl font-bold text-foreground tracking-tight">
                  Welcome to Apex Signal Trading
                </h2>
                <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                  Your 30-Day Terminal License is active and verified. You have full clearance to access the institutional decision engine.
                </p>
              </div>

              {/* License Summary Card */}
              <div className="max-w-md mx-auto p-4 rounded-xl bg-secondary/80 border border-border text-left text-xs font-mono space-y-2">
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">License Key:</span>
                  <span className="text-primary font-bold">{licenseInput || issuedLicenseKey}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Access Plan:</span>
                  <span className="text-foreground font-semibold">30-Day Signal Pass</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/60">
                  <span className="text-muted-foreground">Validity:</span>
                  <span className="text-up font-bold">30 Days (Active)</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Expiration Date:</span>
                  <span className="text-foreground">{activeExpiryDate}</span>
                </div>
              </div>

              <div className="pt-3">
                <button
                  type="button"
                  onClick={() => router.push("/dashboard/live-signals")}
                  className="w-full max-w-md mx-auto py-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-xl shadow-primary/25"
                >
                  Launch Live Signals Terminal
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
