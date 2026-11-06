import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Printer,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCheck,
  UserPlus,
} from "lucide-react";
import type { BillingCycle, PlanId } from "../types";
import { PRICING_PLANS } from "../data/product";
import { LOGIN_URL, REGISTER_URL } from "../config";

type PaymentMethod = "gcash" | "maya" | "card" | "qrph";
type AuthMode = "login" | "register";

interface AuthenticatedAccount {
  name: string;
  email: string;
  method: "password" | "google";
  existingWorkspaces: string[];
}

const AUTH_STORAGE_KEY = "synctayo_checkout_account";

function parseHashQuery(): { plan: PlanId; billing: BillingCycle } {
  const hash = window.location.hash;
  const queryIndex = hash.indexOf("?");
  if (queryIndex === -1) {
    return { plan: "starter", billing: "monthly" };
  }
  const params = new URLSearchParams(hash.slice(queryIndex + 1));
  const rawPlan = params.get("plan");
  const rawBilling = params.get("billing");

  const plan: PlanId =
    rawPlan === "free" || rawPlan === "starter" || rawPlan === "pro"
      ? rawPlan
      : "starter";
  const billing: BillingCycle =
    rawBilling === "yearly" ? "yearly" : "monthly";

  return { plan, billing };
}

function loadSavedAccount(): AuthenticatedAccount | null {
  try {
    const raw = window.sessionStorage.getItem(AUTH_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as AuthenticatedAccount) : null;
  } catch {
    return null;
  }
}

function deriveNameFromEmail(email: string): string {
  const prefix = email.split("@")[0] || "SyncTayo User";
  return prefix
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatPeso(amount: number): string {
  return `₱${amount.toLocaleString("en-PH", {
    minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length >= 3) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  }
  return digits;
}

export function CheckoutPage() {
  const initial = useMemo(() => parseHashQuery(), []);
  const [selectedPlanId, setSelectedPlanId] = useState<PlanId>(initial.plan);
  const [billing, setBilling] = useState<BillingCycle>(initial.billing);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("gcash");

  // Step 1: Account authentication state (must sign in before checkout)
  const [account, setAccount] = useState<AuthenticatedAccount | null>(() =>
    loadSavedAccount(),
  );
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Step 2: Team & billing contact state (auto-populated from signed-in account)
  const [workspaceMode, setWorkspaceMode] = useState<"existing" | "new">(
    "existing",
  );
  const [workspaceName, setWorkspaceName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [orgType, setOrgType] = useState("Growing Organization");
  const [billingAddress, setBillingAddress] = useState(
    "Metro Manila, Philippines",
  );

  // Step 3: Payment method fields
  const [walletMobile, setWalletMobile] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [qrReference, setQrReference] = useState("");

  // Promo code & submission state
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [promoError, setPromoError] = useState("");
  const [agreedTerms, setAgreedTerms] = useState(true);
  const [formError, setFormError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [receipt, setReceipt] = useState<{
    receiptNo: string;
    subscriptionId: string;
    issuedAt: string;
    nextBillingDate: string;
    totalPaid: number;
    paymentLabel: string;
  } | null>(null);

  useEffect(() => {
    const syncFromHash = () => {
      const parsed = parseHashQuery();
      setSelectedPlanId(parsed.plan);
      setBilling(parsed.billing);
    };
    window.addEventListener("hashchange", syncFromHash);
    return () => window.removeEventListener("hashchange", syncFromHash);
  }, []);

  // Sync account fields into checkout form whenever account signs in
  useEffect(() => {
    if (account) {
      setFullName(account.name);
      setEmail(account.email);
      setCardName(account.name.toUpperCase());
      if (!workspaceName && account.existingWorkspaces.length > 0) {
        setWorkspaceName(account.existingWorkspaces[0]);
      }
    }
  }, [account, workspaceName]);

  const selectedPlan = useMemo(
    () =>
      PRICING_PLANS.find((p) => p.id === selectedPlanId) ?? PRICING_PLANS[1],
    [selectedPlanId],
  );

  const isFree = selectedPlan.id === "free";

  // Price calculations
  const baseAmount = isFree
    ? 0
    : billing === "yearly"
      ? selectedPlan.yearlyAmount
      : selectedPlan.monthlyAmount;

  const annualizedMonthlyCost = isFree ? 0 : selectedPlan.monthlyAmount * 12;
  const annualSavings =
    !isFree && billing === "yearly"
      ? annualizedMonthlyCost - selectedPlan.yearlyAmount
      : 0;

  const promoDiscount = appliedPromo ? Math.round(baseAmount * 0.1) : 0;
  const totalDue = Math.max(0, baseAmount - promoDiscount);
  const vatIncluded = isFree ? 0 : Math.round((totalDue / 1.12) * 0.12);

  const completeSignIn = (authenticated: AuthenticatedAccount) => {
    try {
      window.sessionStorage.setItem(
        AUTH_STORAGE_KEY,
        JSON.stringify(authenticated),
      );
    } catch {
      // Ignore sessionStorage errors
    }
    setAccount(authenticated);
    setFullName(authenticated.name);
    setEmail(authenticated.email);
    setCardName(authenticated.name.toUpperCase());
    if (authenticated.existingWorkspaces.length > 0) {
      setWorkspaceMode("existing");
      setWorkspaceName(authenticated.existingWorkspaces[0]);
    } else {
      setWorkspaceMode("new");
      setWorkspaceName("");
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAuthSubmit = (event: FormEvent) => {
    event.preventDefault();
    setAuthError("");

    const trimmedEmail = authEmail.trim();
    if (!trimmedEmail || !trimmedEmail.includes("@")) {
      setAuthError("Please enter a valid SyncTayo account email address.");
      return;
    }
    if (authMode === "register" && !authName.trim()) {
      setAuthError("Please enter your full name to create your account.");
      return;
    }
    if (authPassword.length < 6) {
      setAuthError("Please enter your password (at least 6 characters).");
      return;
    }

    setIsAuthenticating(true);
    window.setTimeout(() => {
      setIsAuthenticating(false);
      const displayName =
        authMode === "register"
          ? authName.trim()
          : deriveNameFromEmail(trimmedEmail);
      const defaultWorkspace = `${displayName.split(" ")[0]}'s Team Workspace`;

      completeSignIn({
        name: displayName,
        email: trimmedEmail,
        method: "password",
        existingWorkspaces:
          authMode === "login"
            ? [defaultWorkspace, "Product & Operations Team"]
            : [defaultWorkspace],
      });
    }, 500);
  };

  const handleGoogleSignIn = () => {
    setAuthError("");
    setIsAuthenticating(true);
    window.setTimeout(() => {
      setIsAuthenticating(false);
      const fallbackEmail = authEmail.trim() || "team.lead@synctayo.online";
      const displayName =
        authName.trim() || deriveNameFromEmail(fallbackEmail);
      completeSignIn({
        name: displayName,
        email: fallbackEmail,
        method: "google",
        existingWorkspaces: [
          `${displayName.split(" ")[0]}'s Team Workspace`,
          "Product & Operations Team",
        ],
      });
    }, 450);
  };

  const handleSignOut = () => {
    try {
      window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch {
      // Ignore sessionStorage errors
    }
    setAccount(null);
    setAuthPassword("");
  };

  const handleApplyPromo = () => {
    setPromoError("");
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    if (code === "SYNCTAYO10" || code === "EARLYBIRD") {
      setAppliedPromo(code);
    } else {
      setPromoError("Invalid promo code. Try SYNCTAYO10 for 10% off.");
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethod): string => {
    if (isFree) return "No Payment Required (Free Plan)";
    switch (method) {
      case "gcash":
        return `GCash e-Wallet (${walletMobile || "0917 ••• ••••"})`;
      case "maya":
        return `Maya Checkout (${walletMobile || "0918 ••• ••••"})`;
      case "card": {
        const last4 = cardNumber.replace(/\D/g, "").slice(-4) || "4242";
        return `Credit / Debit Card (•••• ${last4})`;
      }
      case "qrph":
        return `QR Ph / InstaPay Transfer (Ref: ${qrReference || "INSTAPAY-PH"})`;
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setFormError("");

    if (!account) {
      setFormError("Please sign in to your SyncTayo account first.");
      return;
    }
    if (!workspaceName.trim()) {
      setFormError("Please select or enter your Team Workspace name.");
      return;
    }
    if (!fullName.trim() || !email.trim()) {
      setFormError("Please provide your full name and billing email address.");
      return;
    }
    if (!isFree) {
      if (
        (paymentMethod === "gcash" || paymentMethod === "maya") &&
        walletMobile.replace(/\D/g, "").length < 10
      ) {
        setFormError(
          `Please enter a valid 11-digit ${paymentMethod === "gcash" ? "GCash" : "Maya"} mobile number (e.g., 09171234567).`,
        );
        return;
      }
      if (paymentMethod === "card") {
        if (cardNumber.replace(/\D/g, "").length < 15) {
          setFormError("Please enter a valid 16-digit card number.");
          return;
        }
        if (!cardExpiry.includes("/") || cardCvc.length < 3) {
          setFormError("Please enter a valid card expiry date (MM/YY) and CVC.");
          return;
        }
      }
    }
    if (!agreedTerms) {
      setFormError("Please agree to the subscription terms to continue.");
      return;
    }

    setIsProcessing(true);
    window.setTimeout(() => {
      const now = new Date();
      const nextDate = new Date(now);
      if (billing === "yearly") {
        nextDate.setFullYear(nextDate.getFullYear() + 1);
      } else {
        nextDate.setMonth(nextDate.getMonth() + 1);
      }

      const randomDigits = Math.floor(100000 + Math.random() * 900000);
      setIsProcessing(false);
      setReceipt({
        receiptNo: `OR-ST-${now.getFullYear()}-${randomDigits}`,
        subscriptionId: `SUB-${selectedPlan.id.toUpperCase()}-${randomDigits}`,
        issuedAt: now.toLocaleDateString("en-PH", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        nextBillingDate: isFree
          ? "Free Forever"
          : nextDate.toLocaleDateString("en-PH", {
              year: "numeric",
              month: "long",
              day: "numeric",
            }),
        totalPaid: totalDue,
        paymentLabel: getPaymentMethodLabel(paymentMethod),
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 900);
  };

  // Step 4: Official Receipt Screen
  if (receipt) {
    return (
      <section className="container checkout-section">
        <div className="checkout-receipt-card">
          <div className="receipt-badge-row">
            <span className="receipt-status-icon">
              <CheckCircle2 size={28} aria-hidden="true" />
            </span>
            <div>
              <p className="eyebrow">Subscription Activated</p>
              <h1>Thank you, {fullName}!</h1>
            </div>
          </div>

          <p className="receipt-subtitle">
            Your team workspace <strong>{workspaceName}</strong> (linked to
            account <strong>{account?.email || email}</strong>) is now active on
            the <strong>{selectedPlan.name}</strong>.
          </p>

          <div className="receipt-grid">
            <div>
              <span>Official Receipt No.</span>
              <strong>{receipt.receiptNo}</strong>
            </div>
            <div>
              <span>Subscription ID</span>
              <strong>{receipt.subscriptionId}</strong>
            </div>
            <div>
              <span>SyncTayo Account</span>
              <strong>{account?.email || email}</strong>
            </div>
            <div>
              <span>Workspace / Team</span>
              <strong>{workspaceName}</strong>
            </div>
            <div>
              <span>Plan & Billing Cycle</span>
              <strong>
                {selectedPlan.name} (
                {isFree
                  ? "Free Plan"
                  : billing === "yearly"
                    ? "Annual"
                    : "Monthly"}
                )
              </strong>
            </div>
            <div>
              <span>Payment Method</span>
              <strong>{receipt.paymentLabel}</strong>
            </div>
            <div>
              <span>Issued Date</span>
              <strong>{receipt.issuedAt}</strong>
            </div>
            <div>
              <span>Next Renewal Date</span>
              <strong>{receipt.nextBillingDate}</strong>
            </div>
          </div>

          <div className="receipt-total-bar">
            <span>Total Amount Paid</span>
            <strong>{formatPeso(receipt.totalPaid)}</strong>
          </div>

          <div className="receipt-inclusions">
            <h3>Unlocked Features for {workspaceName}</h3>
            <ul>
              {selectedPlan.inclusions.map((item) => (
                <li key={item}>
                  <Check size={16} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="receipt-actions">
            <a href={LOGIN_URL} className="button button-primary">
              Open SyncTayo Workspace
              <ArrowRight size={16} aria-hidden="true" />
            </a>
            <button
              type="button"
              className="button button-secondary"
              onClick={() => window.print()}
            >
              <Printer size={16} aria-hidden="true" />
              Print / Save Receipt
            </button>
            <a href="#/pricing" className="button button-secondary">
              Back to Pricing
            </a>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container checkout-section">
      <div className="checkout-top-bar">
        <a href="#/pricing" className="checkout-back-link">
          <ArrowLeft size={16} aria-hidden="true" />
          Back to Plans & Pricing
        </a>
        <div className="checkout-security-pill">
          <Lock size={14} aria-hidden="true" />
          <span>256-Bit TLS Encrypted Checkout</span>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="checkout-stepper" aria-label="Subscription steps">
        <div className={`stepper-item ${!account ? "active" : "completed"}`}>
          <span className="stepper-circle">
            {account ? <Check size={14} aria-hidden="true" /> : "1"}
          </span>
          <div>
            <strong>1. Account Sign-In</strong>
            <span>{account ? account.email : "Verify your SyncTayo account"}</span>
          </div>
        </div>
        <div className="stepper-divider" aria-hidden="true" />
        <div className={`stepper-item ${account ? "active" : ""}`}>
          <span className="stepper-circle">2</span>
          <div>
            <strong>2. Workspace & Plan</strong>
            <span>{selectedPlan.name}</span>
          </div>
        </div>
        <div className="stepper-divider" aria-hidden="true" />
        <div className={`stepper-item ${account ? "active" : ""}`}>
          <span className="stepper-circle">3</span>
          <div>
            <strong>3. Checkout & Payment</strong>
            <span>{isFree ? "Instant activation" : "GCash, Maya, Card, QR Ph"}</span>
          </div>
        </div>
      </div>

      {/* STEP 1 GATE: Require Account Login / Registration Before Checkout */}
      {!account ? (
        <div className="checkout-layout">
          <div className="checkout-auth-card">
            <div className="checkout-panel-head">
              <span className="checkout-step-badge">1</span>
              <div>
                <p className="eyebrow">Step 1 of 3 · Account Required</p>
                <h2>
                  {authMode === "login"
                    ? "Sign in to your SyncTayo account first"
                    : "Create your SyncTayo account first"}
                </h2>
                <p>
                  Before proceeding to checkout for the{" "}
                  <strong>{selectedPlan.name}</strong>, please sign in so we can
                  link your subscription and official receipt to your account
                  and workspace.
                </p>
              </div>
            </div>

            <div className="checkout-auth-tabs" role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={authMode === "login"}
                className={`checkout-auth-tab ${authMode === "login" ? "active" : ""}`}
                onClick={() => {
                  setAuthMode("login");
                  setAuthError("");
                }}
              >
                <UserCheck size={16} aria-hidden="true" />
                Sign In to Existing Account
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={authMode === "register"}
                className={`checkout-auth-tab ${authMode === "register" ? "active" : ""}`}
                onClick={() => {
                  setAuthMode("register");
                  setAuthError("");
                }}
              >
                <UserPlus size={16} aria-hidden="true" />
                Create New Account
              </button>
            </div>

            <form
              onSubmit={handleAuthSubmit}
              className="checkout-auth-form"
              noValidate
            >
              {authMode === "register" && (
                <label className="checkout-field">
                  <span>Full Name *</span>
                  <input
                    type="text"
                    required
                    placeholder="Juan Dela Cruz"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                  />
                </label>
              )}

              <label className="checkout-field">
                <span>SyncTayo Email Address *</span>
                <div className="checkout-input-wrap">
                  <Mail size={16} aria-hidden="true" />
                  <input
                    type="email"
                    required
                    placeholder="you@organization.ph"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                  />
                </div>
              </label>

              <label className="checkout-field">
                <span>Password *</span>
                <div className="checkout-input-wrap">
                  <KeyRound size={16} aria-hidden="true" />
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                  />
                </div>
              </label>

              {authError && (
                <div className="checkout-error" role="alert">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthenticating}
                className="button button-primary w-full"
              >
                {isAuthenticating
                  ? "Verifying Account..."
                  : authMode === "login"
                    ? "Sign In & Continue to Checkout"
                    : "Create Account & Continue to Checkout"}
                <ArrowRight size={16} aria-hidden="true" />
              </button>

              <div className="checkout-auth-divider">
                <span>or continue with</span>
              </div>

              <button
                type="button"
                disabled={isAuthenticating}
                className="button button-secondary w-full"
                onClick={handleGoogleSignIn}
              >
                <Sparkles size={16} aria-hidden="true" />
                Continue with Google Account
              </button>

              <p className="checkout-auth-footer">
                Want to sign in directly inside the SyncTayo web app instead?{" "}
                <a href={ authMode === "login" ? LOGIN_URL : REGISTER_URL }>
                  Open SyncTayo App {authMode === "login" ? "Login" : "Registration"}
                </a>
              </p>
            </form>
          </div>

          {/* Right Column Preview while on Sign-In Gate */}
          <aside className="checkout-summary-card" aria-label="Selected plan">
            <div className="summary-head">
              <span className="eyebrow">Selected Plan</span>
              <h2>{selectedPlan.name}</h2>
              <span className="summary-plan-badge">{selectedPlan.badge}</span>
            </div>

            <div className="summary-lines mt-5">
              <div className="summary-line">
                <span>Billing Cycle</span>
                <strong>
                  {isFree
                    ? "Free Forever"
                    : billing === "yearly"
                      ? "Annual (2 months free)"
                      : "Monthly"}
                </strong>
              </div>
              <div className="summary-total">
                <div>
                  <span>Total Due at Checkout</span>
                  <small>After account sign-in</small>
                </div>
                <strong>{formatPeso(totalDue)}</strong>
              </div>
            </div>

            <ul className="summary-feature-list">
              {selectedPlan.inclusions.map((item) => (
                <li key={item}>
                  <Check size={15} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <p className="checkout-guarantee">
              <ShieldCheck size={15} aria-hidden="true" />
              <span>
                Sign in on the left to unlock workspace selection and payment.
              </span>
            </p>
          </aside>
        </div>
      ) : (
        /* STEPS 2 & 3: Authenticated Checkout & Payment Form */
        <>
          <div className="checkout-header">
            <p className="eyebrow">Step 2 & 3 · Authenticated Checkout</p>
            <h1>Complete your SyncTayo subscription</h1>
            <p className="muted">
              Signed in as <strong>{account.name}</strong> ({account.email}).
              Confirm your workspace plan and complete payment below.
            </p>
          </div>

          {/* Signed-In Account Bar */}
          <div className="checkout-account-banner">
            <div className="checkout-account-info">
              <span className="account-avatar">
                {account.name.charAt(0).toUpperCase()}
              </span>
              <div>
                <strong>
                  Signed in as {account.name}
                  <span className="account-verified-pill">Verified Account</span>
                </strong>
                <span>{account.email}</span>
              </div>
            </div>
            <button
              type="button"
              className="button button-secondary account-switch-btn"
              onClick={handleSignOut}
            >
              <LogOut size={14} aria-hidden="true" />
              Switch Account
            </button>
          </div>

          <form className="checkout-layout" onSubmit={handleSubmit} noValidate>
            {/* Left Column: Steps */}
            <div className="checkout-steps">
              {/* Step 1: Plan & Billing Cycle */}
              <div className="checkout-panel">
                <div className="checkout-panel-head">
                  <span className="checkout-step-badge">1</span>
                  <div>
                    <h2>Confirm Plan & Billing Cycle</h2>
                    <p>
                      Switch plans or choose annual billing to get 2 months
                      free.
                    </p>
                  </div>
                </div>

                <div className="checkout-billing-row">
                  <span>Billing Frequency</span>
                  <div
                    className="pricing-billing-toggle"
                    role="group"
                    aria-label="Billing cycle"
                  >
                    <button
                      type="button"
                      className={`billing-toggle-btn ${billing === "monthly" ? "active" : ""}`}
                      onClick={() => setBilling("monthly")}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      className={`billing-toggle-btn ${billing === "yearly" ? "active" : ""}`}
                      onClick={() => setBilling("yearly")}
                    >
                      Annual
                      <span className="billing-save-pill">Save 2 months</span>
                    </button>
                  </div>
                </div>

                <div className="checkout-plan-selector">
                  {PRICING_PLANS.map((plan) => {
                    const active = plan.id === selectedPlanId;
                    const price =
                      billing === "yearly" && plan.id !== "free"
                        ? plan.yearlyPrice
                        : plan.monthlyPrice;
                    const period =
                      billing === "yearly" && plan.yearlyPeriodLabel
                        ? plan.yearlyPeriodLabel
                        : plan.periodLabel;

                    return (
                      <button
                        key={plan.id}
                        type="button"
                        className={`checkout-plan-option ${active ? "selected" : ""}`}
                        onClick={() => setSelectedPlanId(plan.id)}
                        aria-pressed={active}
                      >
                        <div className="checkout-plan-option-top">
                          <strong>{plan.name}</strong>
                          <span className="checkout-plan-tag">{plan.badge}</span>
                        </div>
                        <div className="checkout-plan-option-price">
                          <span>{price}</span>
                          <small>{period}</small>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Team Workspace & Billing Details */}
              <div className="checkout-panel">
                <div className="checkout-panel-head">
                  <span className="checkout-step-badge">2</span>
                  <div>
                    <h2>Select Team Workspace & Billing Details</h2>
                    <p>
                      Choose an existing workspace from your account or create a
                      new team workspace for this subscription.
                    </p>
                  </div>
                </div>

                {account.existingWorkspaces.length > 0 && (
                  <div className="workspace-mode-bar">
                    <button
                      type="button"
                      className={`workspace-mode-btn ${workspaceMode === "existing" ? "active" : ""}`}
                      onClick={() => {
                        setWorkspaceMode("existing");
                        setWorkspaceName(account.existingWorkspaces[0]);
                      }}
                    >
                      Existing Workspace ({account.existingWorkspaces.length})
                    </button>
                    <button
                      type="button"
                      className={`workspace-mode-btn ${workspaceMode === "new" ? "active" : ""}`}
                      onClick={() => {
                        setWorkspaceMode("new");
                        setWorkspaceName("");
                      }}
                    >
                      + Create New Workspace
                    </button>
                  </div>
                )}

                <div className="checkout-fields-grid">
                  {workspaceMode === "existing" &&
                  account.existingWorkspaces.length > 0 ? (
                    <label className="checkout-field full">
                      <span>Select Existing Workspace *</span>
                      <select
                        value={workspaceName}
                        onChange={(e) => setWorkspaceName(e.target.value)}
                      >
                        {account.existingWorkspaces.map((ws) => (
                          <option key={ws} value={ws}>
                            {ws}
                          </option>
                        ))}
                      </select>
                    </label>
                  ) : (
                    <label className="checkout-field full">
                      <span>New Workspace / Team Name *</span>
                      <div className="checkout-input-wrap">
                        <Building2 size={16} aria-hidden="true" />
                        <input
                          type="text"
                          required
                          placeholder="e.g., Apex Product Team or Horizon Org"
                          value={workspaceName}
                          onChange={(e) => setWorkspaceName(e.target.value)}
                        />
                      </div>
                    </label>
                  )}

                  <label className="checkout-field">
                    <span>Billing Contact Full Name *</span>
                    <input
                      type="text"
                      required
                      placeholder="Juan Dela Cruz"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </label>

                  <label className="checkout-field">
                    <span>Account & Billing Email *</span>
                    <input
                      type="email"
                      required
                      placeholder="juan@organization.ph"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </label>

                  <label className="checkout-field">
                    <span>Organization Type</span>
                    <select
                      value={orgType}
                      onChange={(e) => setOrgType(e.target.value)}
                    >
                      <option value="Growing Organization">
                        Growing Organization
                      </option>
                      <option value="Project / Cross-Functional Team">
                        Project / Cross-Functional Team
                      </option>
                      <option value="Small / Medium Enterprise (SME)">
                        Small / Medium Enterprise (SME)
                      </option>
                      <option value="Community / Non-Profit">
                        Community / Non-Profit
                      </option>
                    </select>
                  </label>

                  <label className="checkout-field">
                    <span>Billing City / Location</span>
                    <input
                      type="text"
                      placeholder="Metro Manila, Philippines"
                      value={billingAddress}
                      onChange={(e) => setBillingAddress(e.target.value)}
                    />
                  </label>
                </div>
              </div>

              {/* Step 3: Payment Method */}
              <div className="checkout-panel">
                <div className="checkout-panel-head">
                  <span className="checkout-step-badge">3</span>
                  <div>
                    <h2>Payment Method</h2>
                    <p>
                      {isFree
                        ? "No credit card or e-wallet required for the Free Plan."
                        : "Pay securely in Philippine Pesos (₱) via GCash, Maya, Card, or QR Ph."}
                    </p>
                  </div>
                </div>

                {isFree ? (
                  <div className="checkout-free-notice">
                    <Sparkles size={20} aria-hidden="true" />
                    <div>
                      <strong>₱0 Due Today — Free Forever</strong>
                      <p>
                        Your team gets instant access to private workspace chat,
                        file sharing, task boards, My Plan, and basic Kas AI
                        interaction with zero upfront charges.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div
                      className="checkout-payment-tabs"
                      role="tablist"
                      aria-label="Payment methods"
                    >
                      {[
                        {
                          id: "gcash" as PaymentMethod,
                          label: "GCash",
                          sub: "Instant e-Wallet",
                          Icon: Smartphone,
                        },
                        {
                          id: "maya" as PaymentMethod,
                          label: "Maya",
                          sub: "e-Wallet Checkout",
                          Icon: Smartphone,
                        },
                        {
                          id: "card" as PaymentMethod,
                          label: "Credit / Debit Card",
                          sub: "Visa / Mastercard",
                          Icon: CreditCard,
                        },
                        {
                          id: "qrph" as PaymentMethod,
                          label: "QR Ph / Bank",
                          sub: "BPI, BDO, UnionBank",
                          Icon: QrCode,
                        },
                      ].map(({ id, label, sub, Icon }) => (
                        <button
                          key={id}
                          type="button"
                          role="tab"
                          aria-selected={paymentMethod === id}
                          className={`checkout-payment-tab ${paymentMethod === id ? "active" : ""}`}
                          onClick={() => setPaymentMethod(id)}
                        >
                          <Icon size={18} aria-hidden="true" />
                          <div>
                            <strong>{label}</strong>
                            <span>{sub}</span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {(paymentMethod === "gcash" ||
                      paymentMethod === "maya") && (
                      <div className="checkout-payment-body">
                        <label className="checkout-field full">
                          <span>
                            {paymentMethod === "gcash" ? "GCash" : "Maya"}{" "}
                            Registered Mobile Number *
                          </span>
                          <input
                            type="tel"
                            placeholder="0917 123 4567"
                            value={walletMobile}
                            onChange={(e) => setWalletMobile(e.target.value)}
                          />
                        </label>
                        <p className="checkout-payment-hint">
                          You will authorize the {formatPeso(totalDue)}{" "}
                          {billing === "yearly" ? "annual" : "monthly"} team
                          subscription directly with your{" "}
                          {paymentMethod === "gcash" ? "GCash" : "Maya"}{" "}
                          MPIN/OTP.
                        </p>
                      </div>
                    )}

                    {paymentMethod === "card" && (
                      <div className="checkout-payment-body checkout-fields-grid">
                        <label className="checkout-field full">
                          <span>Name on Card *</span>
                          <input
                            type="text"
                            placeholder="JUAN DELA CRUZ"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                          />
                        </label>
                        <label className="checkout-field full">
                          <span>Card Number *</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="4532 •••• •••• 8891"
                            value={cardNumber}
                            onChange={(e) =>
                              setCardNumber(formatCardNumber(e.target.value))
                            }
                          />
                        </label>
                        <label className="checkout-field">
                          <span>Expiry Date (MM/YY) *</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="08/29"
                            value={cardExpiry}
                            onChange={(e) =>
                              setCardExpiry(formatExpiry(e.target.value))
                            }
                          />
                        </label>
                        <label className="checkout-field">
                          <span>CVC / CVV *</span>
                          <input
                            type="password"
                            inputMode="numeric"
                            maxLength={4}
                            placeholder="•••"
                            value={cardCvc}
                            onChange={(e) =>
                              setCardCvc(
                                e.target.value.replace(/\D/g, "").slice(0, 4),
                              )
                            }
                          />
                        </label>
                      </div>
                    )}

                    {paymentMethod === "qrph" && (
                      <div className="checkout-payment-body qrph-box">
                        <div className="qrph-visual" aria-hidden="true">
                          <QrCode size={68} />
                          <span>QR Ph Standard</span>
                        </div>
                        <div className="qrph-details">
                          <strong>
                            Scan with any QR Ph / InstaPay Banking App
                          </strong>
                          <p>
                            Supported by BPI, BDO, UnionBank, Metrobank,
                            LandBank, GCash, and Maya. Merchant:{" "}
                            <strong>SYNCTAYO LABS PH</strong>
                          </p>
                          <label className="checkout-field">
                            <span>InstaPay Reference No. (Optional)</span>
                            <input
                              type="text"
                              placeholder="e.g., IP-94820184"
                              value={qrReference}
                              onChange={(e) => setQrReference(e.target.value)}
                            />
                          </label>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Right Column: Order Summary */}
            <aside className="checkout-summary-card" aria-label="Order summary">
              <div className="summary-head">
                <span className="eyebrow">Order Summary</span>
                <h2>{selectedPlan.name}</h2>
                <span className="summary-plan-badge">{selectedPlan.badge}</span>
              </div>

              <ul className="summary-feature-list">
                {selectedPlan.inclusions.map((item) => (
                  <li key={item}>
                    <Check size={15} aria-hidden="true" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              {!isFree && (
                <div className="summary-promo-box">
                  <label htmlFor="promo-code-input">
                    Promo or Organization Code
                  </label>
                  <div className="summary-promo-row">
                    <input
                      id="promo-code-input"
                      type="text"
                      placeholder="Try SYNCTAYO10"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="button button-secondary"
                      onClick={handleApplyPromo}
                    >
                      Apply
                    </button>
                  </div>
                  {appliedPromo && (
                    <p className="promo-success">
                      Code <strong>{appliedPromo}</strong> applied (10%
                      discount)!
                    </p>
                  )}
                  {promoError && <p className="promo-error">{promoError}</p>}
                </div>
              )}

              <div className="summary-lines">
                <div className="summary-line">
                  <span>
                    {selectedPlan.name} (
                    {isFree
                      ? "Free Forever"
                      : billing === "yearly"
                        ? "Annual billing"
                        : "Monthly billing"}
                    )
                  </span>
                  <strong>{formatPeso(baseAmount)}</strong>
                </div>

                {annualSavings > 0 && (
                  <div className="summary-line savings">
                    <span>Annual discount (2 months free)</span>
                    <strong>Saved {formatPeso(annualSavings)}/yr</strong>
                  </div>
                )}

                {promoDiscount > 0 && (
                  <div className="summary-line savings">
                    <span>Promo discount ({appliedPromo})</span>
                    <strong>-{formatPeso(promoDiscount)}</strong>
                  </div>
                )}

                <div className="summary-line muted-line">
                  <span>12% Philippine VAT (Inclusive)</span>
                  <span>{formatPeso(vatIncluded)}</span>
                </div>

                <div className="summary-total">
                  <div>
                    <span>Total Due Today</span>
                    <small>
                      {isFree
                        ? "Free Forever per team"
                        : billing === "yearly"
                          ? "Billed annually per team"
                          : "Billed monthly per team"}
                    </small>
                  </div>
                  <strong>{formatPeso(totalDue)}</strong>
                </div>
              </div>

              <label className="checkout-terms">
                <input
                  type="checkbox"
                  checked={agreedTerms}
                  onChange={(e) => setAgreedTerms(e.target.checked)}
                />
                <span>
                  I agree to the SyncTayo Subscription Terms and authorize
                  recurring {isFree ? "free plan access" : `${billing} billing`}{" "}
                  until canceled.
                </span>
              </label>

              {formError && (
                <div className="checkout-error" role="alert">
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={isProcessing}
                className="button button-primary w-full checkout-submit-btn"
              >
                {isProcessing
                  ? "Processing Subscription..."
                  : isFree
                    ? "Activate Free Team Plan"
                    : `Pay ${formatPeso(totalDue)} & Activate ${selectedPlan.name}`}
                <ArrowRight size={16} aria-hidden="true" />
              </button>

              <p className="checkout-guarantee">
                <ShieldCheck size={15} aria-hidden="true" />
                <span>
                  Cancel or switch plans anytime from Workspace Settings.
                </span>
              </p>
            </aside>
          </form>
        </>
      )}
    </section>
  );
}
