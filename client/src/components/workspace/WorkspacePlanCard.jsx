import { useEffect, useState } from "react";
import { Check, CreditCard, Layers, Lock, Shield, Sparkles, X } from "lucide-react";

const WORKSPACE_PLANS = [
  {
    id: "free",
    name: "Free Plan",
    badge: "Free Forever",
    Icon: Layers,
    monthlyAmount: 0,
    yearlyAmount: 0,
    monthlyLabel: "₱0",
    yearlyLabel: "₱0",
    period: "/ team",
    yearlyPeriod: "/ team",
    subtext: "₱0 / team — Free Forever",
    description:
      "Essential workspace tools for everyday team communication, task tracking, and personal daily planning.",
    inclusionsHeader: "Inclusions:",
    inclusions: [
      "Private team workspace chat and file sharing",
      "Team task boards and shared calendar view",
      "Personal daily planner (My Plan) and cross-team priority view",
      "Standard cloud file storage and basic AI assistant help",
    ],
  },
  {
    id: "starter",
    name: "Starter Plan",
    badge: "Most Popular",
    Icon: Sparkles,
    monthlyAmount: 599,
    yearlyAmount: 5990,
    monthlyLabel: "₱599",
    yearlyLabel: "₱5,990",
    period: "/ team / month",
    yearlyPeriod: "/ team / year",
    subtext: "₱599 / team / month (or ₱5,990 / year)",
    description:
      "Built for growing organizations and active project teams that need shared scheduling, live document collaboration, and file history.",
    popular: true,
    inclusionsHeader: "Everything in Free, plus:",
    inclusions: [
      "Shared team availability view and 1-click automatic meeting scheduling",
      "File version history with easy restore and trash recovery for deleted items",
      "Live collaborative document editing and 1-click document download",
      "AI-generated meeting summaries and action item suggestions",
    ],
  },
  {
    id: "pro",
    name: "Pro Plan",
    badge: "For Larger Orgs & SMEs",
    Icon: Shield,
    monthlyAmount: 1199,
    yearlyAmount: 11990,
    monthlyLabel: "₱1,199",
    yearlyLabel: "₱11,990",
    period: "/ team / month",
    yearlyPeriod: "/ team / year",
    subtext: "₱1,199 / team / month (or ₱11,990 / year)",
    description:
      "Full team control, custom member permissions, unlimited AI voice and workload insights, and expanded storage for larger organizations.",
    inclusionsHeader: "Everything in Starter, plus:",
    inclusions: [
      "Expanded cloud storage space and faster file handling",
      "Unlimited AI voice and text assistance with smart task difficulty and workload insights",
      "Custom member roles and editing permissions for tasks, files, and team access",
      "Priority multi-team management and dedicated support",
    ],
  },
];

function storageKeyFor(workspaceId) {
  return `synctayo_workspace_plan_${workspaceId}`;
}

function loadSavedPlan(workspaceId) {
  try {
    const raw = window.localStorage.getItem(storageKeyFor(workspaceId));
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.planId) return parsed;
    }
  } catch {
    // ignore storage errors
  }
  return {
    planId: "free",
    billing: "monthly",
    updatedAt: null,
    receiptNo: null,
    paymentMethod: null,
  };
}

function formatPeso(amount) {
  return `₱${Number(amount || 0).toLocaleString("en-PH")}`;
}

export default function WorkspacePlanCard({ workspace, currentUser, isAdmin }) {
  const [subscription, setSubscription] = useState(() => loadSavedPlan(workspace.id));
  const [billing, setBilling] = useState(subscription.billing || "monthly");
  const [checkoutPlanId, setCheckoutPlanId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("gcash");
  const [walletMobile, setWalletMobile] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [processing, setProcessing] = useState(false);
  const [bannerMessage, setBannerMessage] = useState("");

  useEffect(() => {
    const loaded = loadSavedPlan(workspace.id);
    setSubscription(loaded);
    setBilling(loaded.billing || "monthly");
  }, [workspace.id]);

  const activePlan =
    WORKSPACE_PLANS.find((p) => p.id === subscription.planId) || WORKSPACE_PLANS[0];
  const targetPlan =
    WORKSPACE_PLANS.find((p) => p.id === checkoutPlanId) || null;

  function openCheckout(planId) {
    setCheckoutError("");
    setCheckoutPlanId(planId);
  }

  function closeCheckout() {
    if (processing) return;
    setCheckoutPlanId(null);
    setCheckoutError("");
  }

  function handleConfirmUpgrade(e) {
    e.preventDefault();
    if (!targetPlan) return;
    setCheckoutError("");

    const isFree = targetPlan.id === "free";
    if (!isFree) {
      if (
        (paymentMethod === "gcash" || paymentMethod === "maya") &&
        walletMobile.replace(/\D/g, "").length < 10
      ) {
        setCheckoutError(
          `Please enter a valid 11-digit ${paymentMethod === "gcash" ? "GCash" : "Maya"} mobile number.`
        );
        return;
      }
      if (paymentMethod === "card") {
        if (cardNumber.replace(/\D/g, "").length < 15) {
          setCheckoutError("Please enter a valid 16-digit card number.");
          return;
        }
        if (!cardExpiry.includes("/") || cardCvc.length < 3) {
          setCheckoutError("Please enter a valid card expiry (MM/YY) and CVC.");
          return;
        }
      }
    }

    setProcessing(true);
    setTimeout(() => {
      const receiptNo = isFree
        ? null
        : `OR-ST-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      const nextSub = {
        planId: targetPlan.id,
        billing,
        updatedAt: new Date().toISOString(),
        receiptNo,
        paymentMethod: isFree ? "Free Plan" : paymentMethod.toUpperCase(),
      };
      try {
        window.localStorage.setItem(
          storageKeyFor(workspace.id),
          JSON.stringify(nextSub)
        );
      } catch {
        // ignore storage errors
      }
      setSubscription(nextSub);
      setProcessing(false);
      setCheckoutPlanId(null);
      setBannerMessage(
        isFree
          ? `${workspace.name} is now on the Free Plan (₱0 / team).`
          : `${workspace.name} has been upgraded to the ${targetPlan.name} (${billing === "yearly" ? "Annual" : "Monthly"} billing · Receipt ${receiptNo}).`
      );
    }, 600);
  }

  const targetAmount = targetPlan
    ? targetPlan.id === "free"
      ? 0
      : billing === "yearly"
        ? targetPlan.yearlyAmount
        : targetPlan.monthlyAmount
    : 0;

  return (
    <section className="card p-5 sm:p-6">
      {/* Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink-100 pb-5 dark:border-white/[0.06]">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <p className="section-label">Workspace Subscription Plan</p>
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/15 px-2.5 py-0.5 text-xs font-semibold text-brand-700 dark:text-brand-300">
              <Sparkles className="h-3 w-3" />
              Current: {activePlan.name}
            </span>
            {subscription.receiptNo && (
              <span className="chip !py-0.5 text-[11px]">
                Receipt: {subscription.receiptNo}
              </span>
            )}
          </div>
          <h2 className="mt-1.5 text-lg font-semibold text-ink-900 dark:text-ink-50">
            Upgrade {workspace.name} Plan
          </h2>
          <p className="mt-0.5 text-sm text-ink-500 dark:text-ink-400">
            Per-team subscription pricing in Philippine Pesos (₱). Unlock shared team availability, file version history, live collaborative documents, and advanced AI tools.
          </p>
        </div>

        {/* Billing Cycle Toggle */}
        <div className="flex flex-col items-end gap-2">
          <div
            role="group"
            aria-label="Billing cycle"
            className="inline-flex items-center rounded-xl border border-ink-200 bg-ink-50 p-1 dark:border-white/[0.08] dark:bg-ink-900/70"
          >
            <button
              type="button"
              onClick={() => setBilling("monthly")}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                billing === "monthly"
                  ? "bg-white text-ink-900 shadow-sm dark:bg-ink-800 dark:text-ink-50"
                  : "text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling("yearly")}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                billing === "yearly"
                  ? "bg-white text-ink-900 shadow-sm dark:bg-ink-800 dark:text-ink-50"
                  : "text-ink-500 hover:text-ink-800 dark:text-ink-400 dark:hover:text-ink-100"
              }`}
            >
              Yearly
              <span className="rounded-full bg-brand-500/20 px-1.5 py-px text-[10px] font-bold text-brand-700 dark:text-brand-300">
                Save 2 mos
              </span>
            </button>
          </div>
          {!isAdmin && (
            <span className="inline-flex items-center gap-1 text-xs text-ink-400">
              <Lock className="h-3 w-3" /> Only workspace admins can change the billing plan
            </span>
          )}
        </div>
      </div>

      {bannerMessage && (
        <div
          role="status"
          className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-brand-500/40 bg-brand-500/10 px-4 py-3 text-sm text-brand-800 dark:text-brand-200"
        >
          <span className="flex items-center gap-2 font-medium">
            <Check className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
            {bannerMessage}
          </span>
          <button
            type="button"
            onClick={() => setBannerMessage("")}
            className="rounded-lg p-1 text-ink-400 hover:text-ink-700 dark:hover:text-ink-100"
            aria-label="Dismiss notification"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* 3-Tier Plan Cards */}
      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        {WORKSPACE_PLANS.map((plan) => {
          const Icon = plan.Icon;
          const isCurrent = subscription.planId === plan.id;
          const isYearly = billing === "yearly" && plan.id !== "free";
          const priceLabel = isYearly ? plan.yearlyLabel : plan.monthlyLabel;
          const periodLabel = isYearly ? plan.yearlyPeriod : plan.period;

          return (
            <div
              key={plan.id}
              className={`flex flex-col justify-between rounded-2xl border p-5 transition-all ${
                plan.popular
                  ? "border-brand-500/70 bg-brand-500/[0.04] shadow-sm dark:border-brand-400/50 dark:bg-brand-500/[0.06]"
                  : "border-ink-200/80 bg-white/50 dark:border-white/[0.08] dark:bg-ink-900/40"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-500/15 text-brand-600 dark:text-brand-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      plan.popular
                        ? "bg-brand-600 text-white dark:bg-brand-400 dark:text-ink-950"
                        : "bg-ink-100 text-ink-600 dark:bg-white/[0.07] dark:text-ink-300"
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>

                <h3 className="mt-3 text-base font-semibold text-ink-900 dark:text-ink-50">
                  {plan.name}
                </h3>

                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-2xl font-bold tracking-tight text-ink-900 dark:text-ink-50">
                    {priceLabel}
                  </span>
                  <span className="text-xs font-medium text-ink-500 dark:text-ink-400">
                    {periodLabel}
                  </span>
                </div>
                <p className="mt-1 text-xs font-medium text-brand-600 dark:text-brand-400">
                  {plan.subtext}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-ink-500 dark:text-ink-400">
                  {plan.description}
                </p>

                <div className="mt-4 border-t border-ink-100 pt-3 dark:border-white/[0.06]">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-300">
                    {plan.inclusionsHeader}
                  </p>
                  <ul className="mt-2.5 space-y-2">
                    {plan.inclusions.map((item) => (
                      <li
                        key={item}
                        className="flex items-start gap-2 text-xs leading-relaxed text-ink-600 dark:text-ink-300"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-brand-600 dark:text-brand-400" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-5 pt-2">
                {isCurrent ? (
                  <button
                    type="button"
                    disabled
                    className="btn-secondary w-full cursor-default opacity-75"
                  >
                    <Check className="h-4 w-4 text-brand-600 dark:text-brand-400" />
                    Current Workspace Plan
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={!isAdmin}
                    onClick={() => openCheckout(plan.id)}
                    title={
                      isAdmin
                        ? `Switch ${workspace.name} to ${plan.name}`
                        : "Only workspace admins can upgrade the workspace plan"
                    }
                    className={`w-full ${
                      plan.popular ? "btn-primary" : "btn-secondary"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {plan.id === "free"
                      ? "Switch to Free Plan"
                      : `Upgrade to ${plan.name}`}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Templated In-App Checkout & Payment Modal */}
      {targetPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upgrade-workspace-modal-title"
        >
          <div className="card max-h-[90vh] w-full max-w-xl overflow-y-auto p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-ink-100 pb-4 dark:border-white/[0.08]">
              <div>
                <p className="section-label">Workspace Plan Checkout</p>
                <h3
                  id="upgrade-workspace-modal-title"
                  className="mt-1 text-lg font-semibold text-ink-900 dark:text-ink-50"
                >
                  {targetPlan.id === "free"
                    ? `Switch ${workspace.name} to Free Plan`
                    : `Upgrade ${workspace.name} to ${targetPlan.name}`}
                </h3>
                <p className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                  Signed in as <strong>{currentUser?.name}</strong> ({currentUser?.email})
                </p>
              </div>
              <button
                type="button"
                onClick={closeCheckout}
                className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700 dark:hover:bg-white/[0.08] dark:hover:text-ink-100"
                aria-label="Close checkout modal"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmUpgrade} className="mt-4 space-y-4">
              {/* Billing Summary Box */}
              <div className="rounded-xl border border-ink-200/80 bg-ink-50/70 p-4 dark:border-white/[0.08] dark:bg-ink-900/60">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                      {targetPlan.badge}
                    </span>
                    <h4 className="text-base font-semibold text-ink-900 dark:text-ink-50">
                      {targetPlan.name} ({workspace.name})
                    </h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-bold text-ink-900 dark:text-ink-50">
                      {formatPeso(targetAmount)}
                    </span>
                    <span className="block text-[11px] text-ink-500 dark:text-ink-400">
                      {targetPlan.id === "free"
                        ? "Free Forever"
                        : billing === "yearly"
                          ? "Billed annually (2 months free)"
                          : "Billed monthly"}
                    </span>
                  </div>
                </div>

                {targetPlan.id !== "free" && (
                  <div className="mt-3 flex items-center justify-between border-t border-ink-200/70 pt-3 text-xs text-ink-500 dark:border-white/[0.06] dark:text-ink-400">
                    <span>Billing Frequency</span>
                    <div className="inline-flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setBilling("monthly")}
                        className={`rounded-md px-2.5 py-1 font-medium ${
                          billing === "monthly"
                            ? "bg-brand-600 text-white"
                            : "bg-ink-200/60 text-ink-700 dark:bg-white/[0.07] dark:text-ink-300"
                        }`}
                      >
                        Monthly ({targetPlan.monthlyLabel}/mo)
                      </button>
                      <button
                        type="button"
                        onClick={() => setBilling("yearly")}
                        className={`rounded-md px-2.5 py-1 font-medium ${
                          billing === "yearly"
                            ? "bg-brand-600 text-white"
                            : "bg-ink-200/60 text-ink-700 dark:bg-white/[0.07] dark:text-ink-300"
                        }`}
                      >
                        Yearly ({targetPlan.yearlyLabel}/yr)
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Method Selector for Starter & Pro */}
              {targetPlan.id !== "free" && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-ink-500 dark:text-ink-300">
                    Select Payment Method
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: "gcash", label: "GCash", sub: "e-Wallet" },
                      { id: "maya", label: "Maya", sub: "e-Wallet" },
                      { id: "card", label: "Card", sub: "Visa / MC" },
                    ].map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setPaymentMethod(method.id)}
                        className={`flex flex-col items-start rounded-xl border p-3 text-left transition-colors ${
                          paymentMethod === method.id
                            ? "border-brand-500 bg-brand-500/10 text-ink-900 dark:text-ink-50"
                            : "border-ink-200 text-ink-600 hover:border-ink-300 dark:border-white/[0.08] dark:text-ink-300"
                        }`}
                      >
                        <span className="text-xs font-semibold">{method.label}</span>
                        <span className="text-[11px] text-ink-400">{method.sub}</span>
                      </button>
                    ))}
                  </div>

                  {(paymentMethod === "gcash" || paymentMethod === "maya") && (
                    <div>
                      <label className="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-200">
                        {paymentMethod === "gcash" ? "GCash" : "Maya"} Mobile Number *
                      </label>
                      <input
                        type="tel"
                        className="input"
                        placeholder="0917 123 4567"
                        value={walletMobile}
                        onChange={(e) => setWalletMobile(e.target.value)}
                      />
                    </div>
                  )}

                  {paymentMethod === "card" && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-200">
                          Card Number *
                        </label>
                        <div className="relative flex items-center">
                          <CreditCard className="pointer-events-none absolute left-3 h-4 w-4 text-ink-400" />
                          <input
                            type="text"
                            inputMode="numeric"
                            className="input !pl-9"
                            placeholder="4532 •••• •••• 8891"
                            value={cardNumber}
                            onChange={(e) =>
                              setCardNumber(
                                e.target.value
                                  .replace(/\D/g, "")
                                  .slice(0, 16)
                                  .replace(/(\d{4})(?=\d)/g, "$1 ")
                              )
                            }
                          />
                        </div>
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-200">
                          Expiry (MM/YY) *
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          className="input"
                          placeholder="08/29"
                          value={cardExpiry}
                          onChange={(e) => {
                            const digits = e.target.value.replace(/\D/g, "").slice(0, 4);
                            setCardExpiry(
                              digits.length >= 3
                                ? `${digits.slice(0, 2)}/${digits.slice(2)}`
                                : digits
                            );
                          }}
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-xs font-medium text-ink-600 dark:text-ink-200">
                          CVC *
                        </label>
                        <input
                          type="password"
                          inputMode="numeric"
                          maxLength={4}
                          className="input"
                          placeholder="•••"
                          value={cardCvc}
                          onChange={(e) =>
                            setCardCvc(e.target.value.replace(/\D/g, "").slice(0, 4))
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {checkoutError && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  {checkoutError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2 border-t border-ink-100 pt-4 dark:border-white/[0.08]">
                <button
                  type="button"
                  onClick={closeCheckout}
                  disabled={processing}
                  className="btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processing}
                  className="btn-primary"
                >
                  {processing
                    ? "Processing…"
                    : targetPlan.id === "free"
                      ? "Confirm Switch to Free Plan"
                      : `Pay ${formatPeso(targetAmount)} & Upgrade`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
