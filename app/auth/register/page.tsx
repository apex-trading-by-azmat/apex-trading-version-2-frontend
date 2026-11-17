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
  ShieldCheck,
  Clock,
  Sparkles,
  ExternalLink,
  AlertCircle,
  RefreshCw,
  XCircle,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRegister, useSubmitPayment, useEasypaisaInfo } from "@/hook/useAuth";
import { authApi } from "@/lib/API/auth";
import {
  EASYPAISA_CONFIG,
  PaymentSubmission,
  getPaymentSubmissions,
  savePaymentSubmission,
  isStatusApproved,
  isStatusRejected,
  isStatusPending,
} from "@/lib/auth-flow";

export default function RegisterWizardPage() {
  const router = useRouter();

  // Fetch official EasyPaisa account details from GET /auth/easypaisa-info
  const { data: easypaisaInfo } = useEasypaisaInfo() as {
    data?: {
      bank_or_wallet?: string;
      account_title?: string;
      account_number?: string;
      amount?: number;
      instructions?: string;
    };
  };

  // Wizard Step: 1 = Sign Up, 2 = Subscription, 3 = Verification & Access
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Step 1: Sign up data & API states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    termsAgreed: true,
  });
  const [step1Error, setStep1Error] = useState<string | null>(null);
  const [paymentInstructions, setPaymentInstructions] = useState<{
    bank_or_wallet?: string;
    account_title?: string;
    account_number?: string;
    amount?: number | string;
    instructions?: string;
  } | null>(null);

  // Active resolved EasyPaisa details
  const easypaisaAccountTitle =
    easypaisaInfo?.account_title || paymentInstructions?.account_title || EASYPAISA_CONFIG.accountTitle;
  const easypaisaAccountNumber =
    easypaisaInfo?.account_number || paymentInstructions?.account_number || EASYPAISA_CONFIG.accountNumber;
  const easypaisaBankOrWallet =
    easypaisaInfo?.bank_or_wallet || paymentInstructions?.bank_or_wallet || "Easypaisa";
  const easypaisaInstructions =
    easypaisaInfo?.instructions || paymentInstructions?.instructions;

  // Hook for POST /auth/register
  const { mutate: registerUser, isPending: isRegistering } = useRegister({
    onSuccess: (data: any) => {
      setStep1Error(null);

      const user = data?.user;
      if (user) {
        localStorage.setItem(
          "apex_reg_user",
          JSON.stringify({
            name: user.full_name || formData.name,
            email: user.email || formData.email,
            id: user.id,
          })
        );
        if (user.session_id) {
          localStorage.setItem("session_id", user.session_id);
        }
      }

      if (data?.payment_instructions) {
        setPaymentInstructions(data.payment_instructions);
        localStorage.setItem("apex_payment_instructions", JSON.stringify(data.payment_instructions));
      }

      // Pre-fill sender name if empty
      if (!paymentData.senderName) {
        setPaymentData((prev) => ({ ...prev, senderName: user?.full_name || formData.name }));
      }

      setCurrentStep(2);
      localStorage.setItem("apex_reg_step", "2");
    },
    onError: (err: any) => {
      const msg =
        err?.message ||
        err?.data?.message ||
        err?.data?.detail ||
        "Registration failed. Please check your credentials and try again.";
      setStep1Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    },
  });

  const [step2Error, setStep2Error] = useState<string | null>(null);

  // Hook for POST /auth/submit-payment
  const { mutate: submitPaymentProof, isPending: isSubmittingPayment } = useSubmitPayment({
    onSuccess: (data: any) => {
      setStep2Error(null);
      const subId = data?.id || "sub-" + Date.now();
      const rawStatus = (data?.status || data?.user_status || "").toString();
      const isAlreadyApproved = isStatusApproved(rawStatus);
      const isRejected = isStatusRejected(rawStatus);
      setSubmissionId(subId);
      if (isAlreadyApproved) {
        setSubmissionStatus("approved");
        setAccountComplete(true);
      } else if (isRejected) {
        setSubmissionStatus("rejected");
        setRejectionReason(data?.rejection_reason || data?.detail || "Payment proof was rejected.");
      } else {
        setSubmissionStatus("pending");
      }

      // Save locally for persistence and cross-tab updates
      const submission: PaymentSubmission = {
        id: subId,
        name: formData.name,
        email: formData.email,
        senderName: data?.sender_name || paymentData.senderName || formData.name,
        senderPhone: paymentData.senderPhone,
        transactionId: data?.transaction_id || paymentData.transactionId.trim(),
        amount: data?.amount || paymentData.amount || "$25",
        status: isAlreadyApproved ? "APPROVED" : isRejected ? "REJECTED" : "PENDING",
        rejectionReason: data?.rejection_reason || data?.detail,
        submittedAt: data?.created_at
          ? new Date(data.created_at).toISOString().replace("T", " ").slice(0, 16) + " UTC"
          : new Date().toISOString().replace("T", " ").slice(0, 16) + " UTC",
        screenshotName: paymentData.receiptFileName || "easypaisa_receipt.jpg",
      };
      savePaymentSubmission(submission);

      localStorage.setItem(
        "apex_reg_payment",
        JSON.stringify({
          ...paymentData,
          submissionId: subId,
          receiptFile: null,
          status: isAlreadyApproved ? "APPROVED" : isRejected ? "REJECTED" : "PENDING",
          rejectionReason: data?.rejection_reason || data?.detail || "",
        })
      );

      localStorage.setItem("apex_reg_sub_option", "easypaisa");
      setCurrentStep(3);
      localStorage.setItem("apex_reg_step", "3");
    },
    onError: (err: any) => {
      const msg =
        err?.message ||
        err?.data?.message ||
        err?.data?.detail ||
        "Failed to submit payment proof. Please verify the transaction ID and receipt screenshot.";
      setStep2Error(typeof msg === "string" ? msg : JSON.stringify(msg));
    },
  });

  // Step 2 & 3: Subscription & Verification data
  const [subscriptionOption, setSubscriptionOption] = useState<"easypaisa" | "quotex">("easypaisa");
  const [quotexTraderId, setQuotexTraderId] = useState("");
  const [quotexTraderIdSubmitted, setQuotexTraderIdSubmitted] = useState(false);

  const [paymentData, setPaymentData] = useState({
    senderName: "",
    senderPhone: "",
    transactionId: "",
    receiptFile: null as File | null,
    receiptFileName: "",
    receiptPreviewUrl: "",
    amount: "$25",
  });

  // Step 3: Status and Access
  const [submissionId, setSubmissionId] = useState<string>("");
  const [submissionStatus, setSubmissionStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [accountComplete, setAccountComplete] = useState(false);
  const [isRefreshingStatus, setIsRefreshingStatus] = useState(false);
  const [refreshNotice, setRefreshNotice] = useState<{ type: "info" | "warning" | "success" | "error"; text: string } | null>(null);

  // Load saved state from localStorage if available
  useEffect(() => {
    try {
      const savedStep = localStorage.getItem("apex_reg_step");
      if (savedStep) {
        const stepNum = parseInt(savedStep, 10);
        if (stepNum >= 1 && stepNum <= 3) {
          setCurrentStep(stepNum as 1 | 2 | 3);
        } else if (stepNum > 3) {
          setCurrentStep(3);
          localStorage.setItem("apex_reg_step", "3");
        }
      }

      const savedUser = localStorage.getItem("apex_reg_user");
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          if (parsed?.name && parsed.name !== "Azmat Khan" && parsed.name !== "Azmat Ullah") {
            setFormData((prev) => ({ ...prev, name: parsed.name, email: parsed.email || prev.email }));
          }
        } catch {
          // ignore
        }
      }

      const savedPayment = localStorage.getItem("apex_reg_payment");
      if (savedPayment) {
        const parsed = JSON.parse(savedPayment);
        setPaymentData((prev) => ({ ...prev, ...parsed }));
        if (parsed.submissionId) {
          setSubmissionId(parsed.submissionId);
        }
        if (isStatusApproved(parsed.status)) {
          setSubmissionStatus("approved");
          setAccountComplete(true);
        } else if (isStatusRejected(parsed.status)) {
          setSubmissionStatus("rejected");
          if (parsed.rejectionReason) setRejectionReason(parsed.rejectionReason);
        } else {
          setSubmissionStatus("pending");
        }
      }

      const savedPwd = sessionStorage.getItem("apex_reg_pwd");
      if (savedPwd) {
        setFormData((prev) => ({ ...prev, password: savedPwd, confirmPassword: savedPwd }));
      }

      const savedInstructions = localStorage.getItem("apex_payment_instructions");
      if (savedInstructions) {
        try {
          const parsed = JSON.parse(savedInstructions);
          setPaymentInstructions(parsed);
        } catch {
          // ignore
        }
      }

      const savedSubOption = localStorage.getItem("apex_reg_sub_option");
      if (savedSubOption === "easypaisa" || savedSubOption === "quotex") {
        setSubscriptionOption(savedSubOption);
      }

      const savedTraderId = localStorage.getItem("apex_reg_quotex_id");
      if (savedTraderId) {
        setQuotexTraderId(savedTraderId);
      }
    } catch {
      // ignore
    }
  }, []);

  // Listen for admin approvals and rejections across tabs
  useEffect(() => {
    const handleSubmissionsUpdated = () => {
      if (!submissionId && !paymentData.transactionId) return;
      const submissions = getPaymentSubmissions();
      const current = submissions.find(
        (s) =>
          (submissionId && s.id === submissionId) ||
          (paymentData.transactionId && s.transactionId === paymentData.transactionId.trim())
      );
      if (current) {
        if (isStatusApproved(current.status)) {
          setSubmissionStatus("approved");
          setAccountComplete(true);
          setRefreshNotice({ type: "success", text: "Payment verified successfully by administrator!" });
        } else if (isStatusRejected(current.status)) {
          setSubmissionStatus("rejected");
          setRejectionReason(
            current.rejectionReason || "Payment proof was rejected by administration."
          );
          setRefreshNotice({ type: "error", text: "Payment proof was rejected by administration." });
        }
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
    setStep1Error(null);

    if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
      setStep1Error("Passwords do not match");
      return;
    }

    if (formData.password.length < 8) {
      setStep1Error("Password must be at least 8 characters long");
      return;
    }

    if (typeof window !== "undefined") {
      sessionStorage.setItem("apex_reg_pwd", formData.password);
    }

    registerUser({
      email: formData.email.trim(),
      password: formData.password,
      full_name: formData.name.trim(),
    });
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
    setStep2Error(null);

    const trimmedTid = paymentData.transactionId.trim();
    if (!trimmedTid) {
      setStep2Error("Please provide the Easypaisa Transaction ID (TID / TRX ID)");
      return;
    }

    if (!paymentData.receiptFile) {
      setStep2Error("Please upload your Easypaisa payment screenshot / receipt image");
      return;
    }

    submitPaymentProof({
      transaction_id: trimmedTid,
      sender_name: paymentData.senderName.trim() || formData.name || null,
      email: formData.email.trim() || null,
      screenshot: paymentData.receiptFile,
    });
  };

  // Step 3: Refresh payment status
  const handleRefreshStatus = async () => {
    setIsRefreshingStatus(true);
    setRefreshNotice(null);

    try {
      // 1. Check local submissions store (for cross-tab admin approvals/rejections)
      const submissions = getPaymentSubmissions();
      const localMatch = submissions.find(
        (s) =>
          (submissionId && s.id === submissionId) ||
          (paymentData.transactionId && s.transactionId === paymentData.transactionId.trim())
      );

      if (localMatch) {
        if (isStatusApproved(localMatch.status)) {
          setSubmissionStatus("approved");
          setAccountComplete(true);
          setRefreshNotice({ type: "success", text: "Payment confirmed! Your account is active." });
          setIsRefreshingStatus(false);
          return;
        } else if (isStatusRejected(localMatch.status)) {
          setSubmissionStatus("rejected");
          setRejectionReason(
            localMatch.rejectionReason ||
              "Your payment submission was rejected by the administrator. Please submit a valid Transaction ID."
          );
          setRefreshNotice({ type: "error", text: "Payment proof was rejected by administration." });
          setIsRefreshingStatus(false);
          return;
        }
      }

      // 2. Query backend using loginApi with saved credentials
      const email = formData.email?.trim();
      const password = formData.password;

      if (email && password) {
        try {
          const res = await authApi.login({ email, password });
          const userStatus = res?.user?.status || "";
          if (res?.access_token || isStatusApproved(userStatus)) {
            // Admin approved on the backend!
            localStorage.setItem("apex_token", res.access_token);
            if (res.refresh_token) {
              localStorage.setItem("apex_refresh_token", res.refresh_token);
            }
            if (res.user) {
              localStorage.setItem("apex_user", JSON.stringify(res.user));
            }

            // Update local payment state
            setSubmissionStatus("approved");
            setAccountComplete(true);
            setRefreshNotice({
              type: "success",
              text: "Payment verified successfully by administrator! Account is active.",
            });

            const savedPayment = localStorage.getItem("apex_reg_payment");
            if (savedPayment) {
              try {
                const parsed = JSON.parse(savedPayment);
                parsed.status = "APPROVED";
                localStorage.setItem("apex_reg_payment", JSON.stringify(parsed));
              } catch {}
            }
            setIsRefreshingStatus(false);
            return;
          }
        } catch (backendErr: any) {
          const status = backendErr?.response?.status;
          const data = backendErr?.response?.data;
          const apiStatus = (data?.status || data?.user_status || "").toString();
          const detail = data?.detail || data?.message || data?.rejection_reason || "";

          if (isStatusApproved(apiStatus)) {
            setSubmissionStatus("approved");
            setAccountComplete(true);
            setRefreshNotice({ type: "success", text: "Payment confirmed! Your account is active." });
            setIsRefreshingStatus(false);
            return;
          }

          if (
            isStatusRejected(apiStatus) ||
            apiStatus.toUpperCase().includes("REJECT") ||
            detail.toLowerCase().includes("reject")
          ) {
            setSubmissionStatus("rejected");
            setRejectionReason(
              detail ||
                data?.rejection_reason ||
                "Your payment proof was rejected by administration. Please verify your transaction ID or upload a new receipt."
            );
            setRefreshNotice({ type: "error", text: "Payment was rejected by admin." });
            setIsRefreshingStatus(false);
            return;
          }

          if (status === 403 && (isStatusPending(apiStatus) || apiStatus === "PENDING_APPROVAL")) {
            setSubmissionStatus("pending");
            setRefreshNotice({
              type: "info",
              text: "Payment is still queued for administrator audit. Please check again shortly.",
            });
            setIsRefreshingStatus(false);
            return;
          }

          if (status === 403 && apiStatus === "PENDING_PAYMENT") {
            setSubmissionStatus("rejected");
            setRejectionReason(detail || "Payment proof not recognized. Please submit your Easypaisa receipt.");
            setIsRefreshingStatus(false);
            return;
          }
        }
      }

      // Default feedback if still pending
      setRefreshNotice({
        type: "info",
        text: "Status refreshed: Payment verification is in progress.",
      });
    } catch {
      setRefreshNotice({
        type: "warning",
        text: "Could not refresh status at this time. Please try again.",
      });
    } finally {
      setIsRefreshingStatus(false);
    }
  };

  // Step 3: Handle resubmission in case of rejection
  const handleResubmitPayment = () => {
    setStep2Error("Previous payment proof was not verified. Please double-check your 10-12 digit TID and upload a clear receipt screenshot.");
    setPaymentData((prev) => ({
      ...prev,
      transactionId: "",
      receiptFile: null,
      receiptFileName: "",
      receiptPreviewUrl: "",
    }));
    setSubmissionStatus("pending");
    setCurrentStep(2);
    localStorage.setItem("apex_reg_step", "2");
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* 3-Step Progress Stepper Header */}
      <div className="mb-6 p-4 rounded-xl bg-card border border-border">
        <div className="grid grid-cols-3 gap-2 text-center">
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
            <span className="text-[11px] leading-tight">2. Subscription</span>
          </div>

          {/* Step 3 */}
          <div
            className={`flex flex-col items-center gap-1.5 cursor-pointer ${
              currentStep === 3
                ? isStatusRejected(submissionStatus)
                  ? "text-down font-semibold"
                  : isStatusApproved(submissionStatus)
                  ? "text-up font-semibold"
                  : "text-primary font-semibold"
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
                  ? isStatusRejected(submissionStatus)
                    ? "bg-down text-white ring-4 ring-down/20"
                    : isStatusApproved(submissionStatus)
                    ? "bg-up text-white ring-4 ring-up/20"
                    : "bg-primary text-white ring-4 ring-primary/20"
                  : accountComplete || isStatusApproved(submissionStatus)
                  ? "bg-up text-white"
                  : "bg-secondary text-muted-foreground border border-border"
              }`}
            >
              {accountComplete || isStatusApproved(submissionStatus) ? (
                <Check className="w-4 h-4" />
              ) : isStatusRejected(submissionStatus) ? (
                <AlertCircle className="w-4 h-4" />
              ) : (
                "3"
              )}
            </div>
            <span className="text-[11px] leading-tight">3. Verification & Access</span>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════
          STEP 1: SIGN UP
      ══════════════════════════════════════════════════ */}
      {currentStep === 1 && (
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-lg shadow-primary/10">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-xs font-mono text-primary mb-2">
              Step 1 of 3: Account Details
            </div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Create Your Account</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Start registration for instant signal terminal access.
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
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  placeholder="Enter your full name"
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
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                  placeholder="Enter your email address"
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
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
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
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    placeholder="Repeat your password"
                  />
                </div>
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-secondary/80 border border-border text-xs text-muted-foreground space-y-1.5">
              <div className="flex items-center gap-2 font-semibold text-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                <span>Direct Account Activation</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Accounts are verified and activated directly through EasyPaisa payment or free Quotex affiliate verification. No license keys required.
              </p>
            </div>

            {step1Error && (
              <div className="p-3 rounded-lg bg-down/10 border border-down/30 text-down text-xs flex items-start gap-2 shadow-sm">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{step1Error}</div>
              </div>
            )}

            <button
              type="submit"
              disabled={isRegistering}
              className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20 disabled:opacity-60 cursor-pointer"
            >
              {isRegistering ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Registering Account...</span>
                </>
              ) : (
                <>
                  <span>Continue to Step 2: Choose Subscription</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
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
          STEP 2: PAYMENT PROOF SUBMISSION & SUBSCRIPTION OPTIONS
      ══════════════════════════════════════════════════ */}
      {currentStep === 2 && (
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-lg shadow-primary/10">
          <div className="mb-6">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/20 text-xs font-mono text-primary mb-2">
              Step 2 of 3: Subscription &amp; Access
            </div>
            <h2 className="text-xl font-bold text-foreground tracking-tight">Select Subscription Option</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Choose direct EasyPaisa manual payment or unlock free terminal access through our Quotex partner program.
            </p>
          </div>

          {/* ── SUBSCRIPTION OPTION SELECTION TABS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
            {/* Option A: Paid Subscription (EasyPaisa) */}
            <button
              type="button"
              onClick={() => setSubscriptionOption("easypaisa")}
              className={cn(
                "p-4 rounded-xl border text-left transition-all duration-200 relative flex flex-col justify-between cursor-pointer",
                subscriptionOption === "easypaisa"
                  ? "bg-surface-2 border-primary shadow-[0_0_20px_rgba(240,185,11,0.15)] ring-1 ring-primary/40"
                  : "bg-secondary/60 border-border hover:bg-secondary hover:border-border/80",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center border shrink-0",
                      subscriptionOption === "easypaisa"
                        ? "bg-primary/15 text-primary border-primary/30"
                        : "bg-surface-3 text-muted-foreground border-border",
                    )}
                  >
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Paid Subscription</h3>
                    <p className="text-[10px] text-muted-foreground">EasyPaisa Manual Transfer</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 shrink-0">
                  $25 / 30D
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                Direct transfer to our official EasyPaisa account. Direct account activation upon manual admin verification.
              </p>
            </button>

            {/* Option B: Free Access (Quotex Affiliate) */}
            <button
              type="button"
              onClick={() => setSubscriptionOption("quotex")}
              className={cn(
                "p-4 rounded-xl border text-left transition-all duration-200 relative flex flex-col justify-between cursor-pointer",
                subscriptionOption === "quotex"
                  ? "bg-surface-2 border-emerald-500 shadow-[0_0_20px_rgba(14,203,129,0.15)] ring-1 ring-emerald-500/40"
                  : "bg-secondary/60 border-border hover:bg-secondary hover:border-border/80",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center border shrink-0",
                      subscriptionOption === "quotex"
                        ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                        : "bg-surface-3 text-muted-foreground border-border",
                    )}
                  >
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-foreground">Free Access</h3>
                    <p className="text-[10px] text-emerald-400 font-medium">Quotex Partner Program</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shrink-0">
                  100% FREE
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-3 leading-relaxed">
                Register on Quotex via our affiliate link and deposit $10 to receive complimentary full terminal access.
              </p>
            </button>
          </div>

          {/* ══════════════════════════════════════════════════
              OPTION A: EASYPAISA MANUAL TRANSFER
          ══════════════════════════════════════════════════ */}
          {subscriptionOption === "easypaisa" && (
            <div>
              {/* Official Easypaisa Account Details Box */}
              <div className="mb-6 p-4 rounded-xl bg-secondary/90 border border-border">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-border/80">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-up/15 border border-up/30 flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-up" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
                        {easypaisaBankOrWallet} Official Deposit Account
                      </h3>
                      <p className="text-[10px] text-muted-foreground">Telenor Microfinance Bank</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                    30-DAY ACCESS
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Account Title */}
                  <div className="p-3 rounded-lg bg-card border border-border flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-mono text-muted-foreground uppercase">Account Title</p>
                      <p className="text-sm font-bold text-foreground mt-0.5">{easypaisaAccountTitle}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(easypaisaAccountTitle, "title")}
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
                        {easypaisaAccountNumber}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(easypaisaAccountNumber, "account")}
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
                  <span>Required Amount: <strong className="text-foreground font-mono">$25</strong></span>
                  <span>Validity: <strong className="text-up font-mono">30 Days</strong></span>
                </div>

                {easypaisaInstructions && (
                  <p className="mt-2 text-[11px] text-muted-foreground bg-card/40 p-2.5 rounded-lg border border-border/60 leading-relaxed">
                    {easypaisaInstructions}
                  </p>
                )}
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
                      placeholder="Enter your Easypaisa account title"
                      className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
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
                      className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-xs text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
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
                    placeholder="Enter 10-12 digit TID / TRX ID"
                    className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-xs font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
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

                {step2Error && (
                  <div className="p-3 rounded-lg bg-down/10 border border-down/30 text-down text-xs flex items-start gap-2 shadow-sm">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <div className="flex-1 leading-relaxed">{step2Error}</div>
                  </div>
                )}

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
                    disabled={isSubmittingPayment}
                    className="flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20 disabled:opacity-60 cursor-pointer"
                  >
                    {isSubmittingPayment ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Submitting Payment Proof...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Payment Proof for Verification</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ══════════════════════════════════════════════════
              OPTION B: FREE ACCESS (QUOTEX AFFILIATE)
          ══════════════════════════════════════════════════ */}
          {subscriptionOption === "quotex" && (
            <div className="space-y-5">
              {/* Instructions Box */}
              <div className="p-4 rounded-xl bg-secondary/70 border border-border space-y-3">
                <div className="flex items-center gap-2 pb-2.5 border-b border-border/70">
                  <div className="w-6 h-6 rounded-md bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wide">
                    How to Claim Free Access via Quotex
                  </h3>
                </div>

                <div className="space-y-2.5 text-xs text-muted-foreground">
                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-surface-3 text-primary font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-border">
                      1
                    </span>
                    <p className="leading-relaxed">
                      Register on Quotex using our official affiliate link below. You must use this specific link so your account is linked to our partner network.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-surface-3 text-primary font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-border">
                      2
                    </span>
                    <p className="leading-relaxed">
                      Deposit at least <strong className="text-foreground font-mono">$10</strong> into your newly created Quotex account. The money remains 100% yours to trade.
                    </p>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-surface-3 text-primary font-mono text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5 border border-border">
                      3
                    </span>
                    <p className="leading-relaxed">
                      Click the confirmation button below and enter your <strong className="text-foreground">Quotex Trader ID</strong> to verify and activate your complimentary access.
                    </p>
                  </div>
                </div>
              </div>

              {/* Prominent Affiliate Link Button */}
              <div className="p-4 rounded-xl bg-surface-1 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
                <div className="text-left w-full sm:w-auto">
                  <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
                    Quotex Official Affiliate Registration
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Opens Quotex registration in a new tab with partner tracking attached.
                  </p>
                </div>

                <a
                  href="#"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-black text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 shrink-0"
                >
                  <span>Register on Quotex</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Confirmation Button to proceed to Step 3 */}
              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem("apex_reg_sub_option", "quotex");
                    setCurrentStep(3);
                    localStorage.setItem("apex_reg_step", "3");
                  }}
                  className="w-full py-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>I have created an account and deposited $10</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </button>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="py-2 px-3 rounded-lg bg-secondary hover:bg-card border border-border text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Account Details
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════
          STEP 3: VERIFICATION (EASYPAISA PAYMENT OR QUOTEX AFFILIATION)
      ══════════════════════════════════════════════════ */}
      {currentStep === 3 && (
        <div className="rounded-xl border border-border bg-card p-6 sm:p-8 shadow-lg shadow-primary/10">
          {subscriptionOption === "quotex" ? (
            /* ── QUOTEX AFFILIATE VERIFICATION ── */
            <>
              <div className="mb-6">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 mb-2">
                  Step 3 of 3: Quotex Affiliate Verification
                </div>
                <h2 className="text-xl font-bold text-foreground tracking-tight">Affiliation Verification</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Enter your Quotex Trader ID to verify your deposit and activate terminal access.
                </p>
              </div>

              {!quotexTraderIdSubmitted ? (
                /* Trader ID Input Card */
                <div className="space-y-4 pt-1">
                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center gap-2 text-xs text-emerald-300">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Deposit confirmed. Enter your Quotex Trader ID below to link and activate your account.</span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1.5 uppercase font-mono tracking-wider">
                      Quotex Trader ID <span className="text-primary">*</span>
                    </label>
                    <input
                      type="text"
                      value={quotexTraderId}
                      onChange={(e) => setQuotexTraderId(e.target.value)}
                      placeholder="Enter your Quotex Trader ID"
                      className="w-full px-3 py-2.5 rounded-lg bg-secondary border border-border text-xs font-mono text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Located in your Quotex top navigation profile menu under your account nickname.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="w-full sm:w-auto py-2.5 px-4 rounded-lg bg-secondary hover:bg-card border border-border text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!quotexTraderId.trim()) {
                          alert("Please enter your Quotex Trader ID");
                          return;
                        }
                        localStorage.setItem("apex_reg_quotex_id", quotexTraderId.trim());
                        setQuotexTraderIdSubmitted(true);
                        setSubmissionStatus("pending");
                      }}
                      className="w-full flex-1 py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20 cursor-pointer"
                    >
                      <span>Verify &amp; Activate</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ) : submissionStatus !== "approved" ? (
                /* Animated verification radar */
                <div className="space-y-5">
                  <div className="p-5 rounded-xl bg-secondary/80 border border-border text-center">
                    <div className="relative w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                      <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping opacity-75" />
                      <div className="w-12 h-12 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 relative z-10">
                        <Sparkles className="w-6 h-6 animate-pulse" />
                      </div>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-mono text-emerald-400 font-semibold">
                      Awaiting Affiliate Audit
                    </div>
                    <h3 className="text-sm font-semibold text-foreground mt-2">
                      Verifying Quotex Trader ID: {quotexTraderId || "54761223"}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto leading-relaxed">
                      Our partner manager checks your registration against the Quotex affiliate ledger to verify your account link and confirmed $10 initial deposit.
                    </p>
                  </div>

                  {/* Submitted Details Review Card */}
                  <div className="p-4 rounded-xl bg-card border border-border text-xs space-y-2.5 font-mono">
                    <div className="flex justify-between py-1 border-b border-border/60">
                      <span className="text-muted-foreground">Registered User:</span>
                      <span className="text-foreground font-semibold">{formData.name} ({formData.email})</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/60">
                      <span className="text-muted-foreground">Program:</span>
                      <span className="text-emerald-400 font-semibold">Quotex Partner Program (100% Free)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/60">
                      <span className="text-muted-foreground">Quotex Trader ID:</span>
                      <span className="text-primary font-bold">{quotexTraderId || "54761223"}</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/60">
                      <span className="text-muted-foreground">Required Deposit:</span>
                      <span className="text-foreground font-bold">≥ $10 (Confirmed)</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Terminal Access:</span>
                      <span className="text-up font-bold">Complimentary (Free)</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setQuotexTraderIdSubmitted(false)}
                      className="py-2 px-3 rounded-lg bg-secondary hover:bg-card border border-border text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Edit Trader ID
                    </button>
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
                      Affiliation Verified &amp; Active
                    </div>
                    <h3 className="text-base font-bold text-foreground mt-2">
                      Quotex Account Linked Successfully!
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                      Your Quotex Trader ID has been verified. Your Apex Trading account is fully activated.
                    </p>

                    {/* Account Summary Display */}
                    <div className="mt-4 p-3.5 rounded-lg bg-card border border-border max-w-md mx-auto text-left text-xs font-mono space-y-2">
                      <div className="flex justify-between py-1 border-b border-border/60">
                        <span className="text-muted-foreground">Registered Trader:</span>
                        <span className="text-foreground font-semibold">{formData.name}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/60">
                        <span className="text-muted-foreground">Quotex Trader ID:</span>
                        <span className="text-primary font-bold">{quotexTraderId || "54761223"}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Access Status:</span>
                        <span className="text-up font-bold">Active &amp; Unlocked</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/live-signals")}
                    className="w-full py-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20 cursor-pointer"
                  >
                    <span>Launch Trading Terminal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            /* ── EASYPAISA PAYMENT VERIFICATION ── */
            <>
              <div className="mb-6">
                <div
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono mb-2 ${
                    isStatusRejected(submissionStatus)
                      ? "bg-down/10 border border-down/20 text-down"
                      : isStatusApproved(submissionStatus)
                      ? "bg-up/10 border border-up/20 text-up"
                      : "bg-warning/10 border border-warning/20 text-warning"
                  }`}
                >
                  Step 3 of 3:{" "}
                  {isStatusRejected(submissionStatus)
                    ? "Verification Rejected"
                    : isStatusApproved(submissionStatus)
                    ? "Payment Approved"
                    : "Admin Verification"}
                </div>
                <h2 className="text-xl font-bold text-foreground tracking-tight">Payment Verification</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  {isStatusRejected(submissionStatus)
                    ? "Your payment submission was reviewed and rejected by the administrator."
                    : isStatusApproved(submissionStatus)
                    ? "Your payment has been verified. Welcome to Apex Signal Trading."
                    : "Your transaction is queued for administrative audit and approval."}
                </p>
              </div>

              {isStatusRejected(submissionStatus) ? (
                /* ── REJECTED PAYMENT STATE & MECHANISM ── */
                <div className="space-y-5">
                  <div className="p-6 rounded-xl bg-down/10 border border-down/30 text-center space-y-4">
                    <div className="w-14 h-14 rounded-full bg-down/15 border border-down/30 flex items-center justify-center text-down mx-auto shadow-sm">
                      <XCircle className="w-7 h-7" />
                    </div>

                    <div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-down/15 border border-down/30 text-xs font-mono text-down font-bold">
                        Verification Rejected
                      </div>
                      <h3 className="text-base font-bold text-foreground mt-2">
                        Easypaisa Payment Not Verified
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                        The administrator reviewed your payment submission and could not confirm the transaction.
                      </p>
                    </div>

                    {/* Admin Rejection Reason Box */}
                    <div className="p-3.5 rounded-lg bg-card/90 border border-down/30 max-w-md mx-auto text-left text-xs space-y-1">
                      <span className="text-[10px] uppercase font-mono font-bold text-muted-foreground tracking-wider block">
                        Administrator Rejection Reason:
                      </span>
                      <p className="text-down font-semibold text-xs leading-relaxed">
                        {rejectionReason || "Transaction ID was not found in Easypaisa account ledger or screenshot is invalid."}
                      </p>
                    </div>
                  </div>

                  {/* Rejected Submission Summary */}
                  <div className="p-4 rounded-xl bg-card border border-border text-xs space-y-2.5 font-mono">
                    <div className="flex justify-between py-1 border-b border-border/60">
                      <span className="text-muted-foreground">Registered Trader:</span>
                      <span className="text-foreground font-semibold">{formData.name} ({formData.email})</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-border/60">
                      <span className="text-muted-foreground">Rejected Transaction ID:</span>
                      <span className="text-down font-bold line-through">{paymentData.transactionId || "N/A"}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-muted-foreground">Verification Status:</span>
                      <span className="text-down font-bold">Rejected &bull; Action Required</span>
                    </div>
                  </div>

                  {/* Action Mechanism: Resubmit or Re-check */}
                  <div className="space-y-2.5 pt-2">
                    <button
                      type="button"
                      onClick={handleResubmitPayment}
                      className="w-full py-2.5 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20 cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Resubmit Correct Payment Proof (Step 2)</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleRefreshStatus}
                      disabled={isRefreshingStatus}
                      className="w-full py-2 px-3 rounded-lg bg-secondary hover:bg-card border border-border text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStatus ? "animate-spin" : ""}`} />
                      <span>{isRefreshingStatus ? "Re-checking Status..." : "Re-check Payment Status"}</span>
                    </button>
                  </div>
                </div>
              ) : !isStatusApproved(submissionStatus) ? (
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
                      <strong className="text-foreground">{easypaisaAccountNumber} ({easypaisaAccountTitle})</strong>.
                    </p>

                    {/* Refresh Status Button */}
                    <div className="mt-4 pt-3 border-t border-border/60 flex flex-col items-center gap-1.5">
                      <button
                        type="button"
                        onClick={handleRefreshStatus}
                        disabled={isRefreshingStatus}
                        className="py-2 px-4 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-60"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingStatus ? "animate-spin" : ""}`} />
                        <span>{isRefreshingStatus ? "Checking Status..." : "Refresh Payment Status"}</span>
                      </button>
                      <span className="text-[11px] text-muted-foreground">
                        Click to check if administration has approved or updated your payment.
                      </span>
                    </div>
                  </div>

                  {/* Refresh Feedback Notice Banner */}
                  {refreshNotice && (
                    <div
                      className={`p-3 rounded-lg text-xs flex items-center gap-2 shadow-sm ${
                        refreshNotice.type === "error"
                          ? "bg-down/10 border border-down/30 text-down"
                          : refreshNotice.type === "success"
                          ? "bg-up/10 border border-up/30 text-up"
                          : "bg-primary/10 border border-primary/30 text-primary"
                      }`}
                    >
                      {refreshNotice.type === "error" ? (
                        <AlertCircle className="w-4 h-4 shrink-0" />
                      ) : refreshNotice.type === "success" ? (
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                      ) : (
                        <Clock className="w-4 h-4 shrink-0" />
                      )}
                      <span className="flex-1 leading-relaxed">{refreshNotice.text}</span>
                    </div>
                  )}

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
                      <span className="text-muted-foreground">Subscription Access:</span>
                      <span className="text-up font-bold">30 Days Active</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="py-2 px-3 rounded-lg bg-secondary hover:bg-card border border-border text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" /> Back to Payment Details
                    </button>
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
                      Payment Verified &amp; Active
                    </div>
                    <h3 className="text-base font-bold text-foreground mt-2">
                      Easypaisa Payment Confirmed!
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
                      Your payment has been confirmed by administration. Your Apex Trading account is fully activated.
                    </p>

                    {/* Account Summary Display */}
                    <div className="mt-4 p-3.5 rounded-lg bg-card border border-border max-w-md mx-auto text-left text-xs font-mono space-y-2">
                      <div className="flex justify-between py-1 border-b border-border/60">
                        <span className="text-muted-foreground">Registered Trader:</span>
                        <span className="text-foreground font-semibold">{formData.name}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-border/60">
                        <span className="text-muted-foreground">Transaction ID (TID):</span>
                        <span className="text-primary font-bold">{paymentData.transactionId || "TX9823419082"}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Access Status:</span>
                        <span className="text-up font-bold">Active &amp; Unlocked</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push("/dashboard/live-signals")}
                    className="w-full py-3 rounded-lg bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/20 cursor-pointer"
                  >
                    <span>Launch Trading Terminal</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
