export interface PaymentSubmission {
  id: string;
  name: string;
  email: string;
  senderName: string;
  senderPhone: string;
  transactionId: string;
  amount: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  screenshotName?: string;
  licenseKey?: string;
  expiresAt?: string;
}

export interface ActiveLicense {
  isValid: boolean;
  key: string;
  plan: string;
  activatedAt: string;
  expiresAt: string;
  daysRemaining: number;
}

export const EASYPAISA_CONFIG = {
  accountTitle: "Azmat Ullah khan",
  accountNumber: "03445679900",
  bankName: "Easypaisa (Telenor Microfinance Bank)",
  priceUSD: "$25",
  validityDays: 30,
};

const DEFAULT_SUBMISSIONS: PaymentSubmission[] = [
  {
    id: "sub-101",
    name: "Omar Ali",
    email: "omar@example.com",
    senderName: "Omar Ali",
    senderPhone: "03001234567",
    transactionId: "TX9823419082",
    amount: "$25",
    status: "pending",
    submittedAt: "2026-11-11 19:45 UTC",
    screenshotName: "easypaisa_receipt_9823.png",
  },
  {
    id: "sub-102",
    name: "Aaliyah Khan",
    email: "aaliyah@example.com",
    senderName: "Aaliyah K.",
    senderPhone: "03335558899",
    transactionId: "TX7720912384",
    amount: "$25",
    status: "approved",
    submittedAt: "2026-11-10 14:12 UTC",
    screenshotName: "receipt_aaliyah.jpg",
    licenseKey: "APEX-30D-8821-4902-ALKH",
    expiresAt: "2026-12-10",
  },
];

export function generate30DayLicenseKey(userPrefix: string = "APEX"): string {
  const randomHex = () =>
    Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${userPrefix.slice(0, 4).toUpperCase()}-30D-${randomHex()}-${randomHex()}`;
}

export function calculateDaysRemaining(expiresAtIso: string): number {
  const expiry = new Date(expiresAtIso).getTime();
  const now = Date.now();
  const diff = expiry - now;
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export function getPaymentSubmissions(): PaymentSubmission[] {
  if (typeof window === "undefined") return DEFAULT_SUBMISSIONS;
  try {
    const raw = localStorage.getItem("apex_payment_submissions");
    if (!raw) {
      localStorage.setItem("apex_payment_submissions", JSON.stringify(DEFAULT_SUBMISSIONS));
      return DEFAULT_SUBMISSIONS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SUBMISSIONS;
  }
}

export function savePaymentSubmission(sub: PaymentSubmission): void {
  if (typeof window === "undefined") return;
  try {
    const list = getPaymentSubmissions();
    const existingIndex = list.findIndex((item) => item.id === sub.id || item.transactionId === sub.transactionId);
    if (existingIndex >= 0) {
      list[existingIndex] = sub;
    } else {
      list.unshift(sub);
    }
    localStorage.setItem("apex_payment_submissions", JSON.stringify(list));
    window.dispatchEvent(new Event("apex_submissions_updated"));
  } catch (err) {
    console.error("Failed to save submission:", err);
  }
}

export function approveSubmission(id: string): { submission: PaymentSubmission; licenseKey: string } | null {
  if (typeof window === "undefined") return null;
  const list = getPaymentSubmissions();
  const target = list.find((item) => item.id === id);
  if (!target) return null;

  const key = generate30DayLicenseKey(target.name.replace(/\s+/g, "").slice(0, 4) || "APEX");
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + 30);

  target.status = "approved";
  target.licenseKey = key;
  target.expiresAt = expiryDate.toISOString().split("T")[0];

  localStorage.setItem("apex_payment_submissions", JSON.stringify(list));
  window.dispatchEvent(new Event("apex_submissions_updated"));

  // Also update latest approved key in storage for easy autofill
  localStorage.setItem("apex_latest_approved_key", key);
  localStorage.setItem("apex_latest_approved_email", target.email);

  return { submission: target, licenseKey: key };
}

export function getActiveLicense(): ActiveLicense {
  if (typeof window === "undefined") {
    return {
      isValid: true,
      key: "APEX-30D-AZMT-9900-V1",
      plan: "30-Day Signal Pass",
      activatedAt: new Date().toISOString().split("T")[0],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      daysRemaining: 30,
    };
  }

  try {
    const raw = localStorage.getItem("apex_active_license");
    if (!raw) {
      const defaultLicense: ActiveLicense = {
        isValid: true,
        key: "APEX-30D-AZMT-9900-V1",
        plan: "30-Day Signal Pass",
        activatedAt: new Date().toISOString().split("T")[0],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        daysRemaining: 30,
      };
      localStorage.setItem("apex_active_license", JSON.stringify(defaultLicense));
      return defaultLicense;
    }
    const parsed: ActiveLicense = JSON.parse(raw);
    parsed.daysRemaining = calculateDaysRemaining(parsed.expiresAt);
    parsed.isValid = parsed.daysRemaining > 0;
    return parsed;
  } catch {
    return {
      isValid: true,
      key: "APEX-30D-AZMT-9900-V1",
      plan: "30-Day Signal Pass",
      activatedAt: new Date().toISOString().split("T")[0],
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      daysRemaining: 30,
    };
  }
}

export function activateLicenseKey(keyToActivate: string): { success: boolean; message: string; license?: ActiveLicense } {
  const cleanKey = keyToActivate.trim().toUpperCase();

  // Validate format (e.g. XXXX-30D-XXXX-XXXX or APEX-30D-XXXX-XXXX)
  if (!cleanKey.includes("30D") && cleanKey.length < 10) {
    return {
      success: false,
      message: "Invalid license format. License must be a valid 30-Day APEX key (e.g. APEX-30D-XXXX-XXXX).",
    };
  }

  const now = new Date();
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 30);

  const newLicense: ActiveLicense = {
    isValid: true,
    key: cleanKey,
    plan: "30-Day Signal Pass",
    activatedAt: now.toISOString().split("T")[0],
    expiresAt: expiry.toISOString().split("T")[0],
    daysRemaining: 30,
  };

  if (typeof window !== "undefined") {
    localStorage.setItem("apex_active_license", JSON.stringify(newLicense));
    window.dispatchEvent(new Event("apex_license_updated"));
  }

  return {
    success: true,
    message: "License key successfully activated for 30 days of full terminal access.",
    license: newLicense,
  };
}

