import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  CreditCard,
  Lock,
  Printer,
  QrCode,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import type { BillingCycle, PlanId } from "../types";
import { PRICING_PLANS } from "../data/product";
import { REGISTER_URL } from "../config";

type PaymentMethod = "gcash" | "maya" | "card" | "qrph";

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

  // Team & billing contact state
  const [workspaceName, setWorkspaceName] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [orgType, setOrgType] = useState("Growing Organization");
  const [billingAddress, setBillingAddress] = useState("Metro Manila, Philippines");

  // Payment method fields
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

    if (!workspaceName.trim()) {
      setFormError("Please enter your Team or Workspace name.");
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
            Your team workspace <strong>{workspaceName}</strong> is now set up on
            the <strong>{selectedPlan.name}</strong>. A copy of this official
            confirmation has been prepared for <strong>{email}</strong>.
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
              <span>Workspace / Team</span>
              <strong>{workspaceName}</strong>
            </div>
            <div>
              <span>Plan & Billing Cycle</span>
              <strong>
                {selectedPlan.name} ({isFree ? "Free Plan" : billing === "yearly" ? "Annual" : "Monthly"})
              </strong>
            </div>
            <div>
              <span>Payment Method</span>
              <strong>{receipt.paymentLabel}</strong>
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
            <a href={REGISTER_URL} className="button button-primary">
              Continue to SyncTayo Workspace
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

      <div className="checkout-header">
        <p className="eyebrow">Team Subscription Checkout</p>
        <h1>Complete your SyncTayo subscription</h1>
        <p className="muted">
          Choose your plan, enter your team workspace details, and select your
          preferred payment method.
        </p>
      </div>

      <form className="checkout-layout" onSubmit={handleSubmit} noValidate>
        {/* Left Column: Steps */}
        <div className="checkout-steps">
          {/* Step 1: Plan & Billing Cycle */}
          <div className="checkout-panel">
            <div className="checkout-panel-head">
              <span className="checkout-step-badge">1</span>
              <div>
                <h2>Select Plan & Billing Cycle</h2>
                <p>Switch plans or choose annual billing to get 2 months free.</p>
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

          {/* Step 2: Team & Billing Details */}
          <div className="checkout-panel">
            <div className="checkout-panel-head">
              <span className="checkout-step-badge">2</span>
              <div>
                <h2>Team Workspace & Billing Details</h2>
                <p>
                  We’ll link your subscription and official receipt to this team
                  workspace.
                </p>
              </div>
            </div>

            <div className="checkout-fields-grid">
              <label className="checkout-field full">
                <span>Workspace / Team Name *</span>
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
                <span>Work or Organization Email *</span>
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
                    Your team gets instant access to private workspace chat, file
                    sharing, task boards, My Plan, and basic Kas AI interaction
                    with zero upfront charges.
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

                {(paymentMethod === "gcash" || paymentMethod === "maya") && (
                  <div className="checkout-payment-body">
                    <label className="checkout-field full">
                      <span>
                        {paymentMethod === "gcash" ? "GCash" : "Maya"} Registered
                        Mobile Number *
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
                      {paymentMethod === "gcash" ? "GCash" : "Maya"} MPIN/OTP.
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
                          setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
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
                      <strong>Scan with any QR Ph / InstaPay Banking App</strong>
                      <p>
                        Supported by BPI, BDO, UnionBank, Metrobank, LandBank,
                        GCash, and Maya. Merchant: <strong>SYNCTAYO LABS PH</strong>
                      </p>
                      <label className="checkout-field">
                        <span>InstaPay Reference No. (Optional for demo)</span>
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
              <label htmlFor="promo-code-input">Promo or Organization Code</label>
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
                  Code <strong>{appliedPromo}</strong> applied (10% discount)!
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
              I agree to the SyncTayo Subscription Terms and authorize recurring{" "}
              {isFree ? "free plan access" : `${billing} billing`} until
              canceled.
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
            <span>Cancel or switch plans anytime from Workspace Settings.</span>
          </p>
        </aside>
      </form>
    </section>
  );
}
