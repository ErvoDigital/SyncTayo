import { useState } from "react";
import { Check, Layers, Sparkles, ShieldCheck } from "lucide-react";
import {
  GetStartedLink,
  SectionHeading,
  StartSection,
} from "../components/Marketing";

type BillingCycle = "monthly" | "yearly";

const PRICING_PLANS = [
  {
    id: "free",
    name: "Free Plan",
    badge: "Free during Open Beta",
    Icon: Layers,
    monthlyPrice: "₱0",
    yearlyPrice: "₱0",
    periodLabel: "/ team",
    subPriceLabel: "Free during Open Beta",
    description:
      "Essential multi-workspace coordination, chat, tasks, and personal cross-team planning for everyday teams.",
    ctaLabel: "Start for Free",
    popular: false,
    inclusionsHeader: "Inclusions:",
    inclusions: [
      "Complete private team workspace chat and file sharing",
      "Basic team task board and calendar view",
      "Personal My Plan and Smart Priority cross-team view",
      "Starter cloud storage quota and basic Kas AI assistant interaction",
    ],
  },
  {
    id: "starter",
    name: "Starter Plan",
    badge: "Most Popular",
    Icon: Sparkles,
    monthlyPrice: "₱599",
    yearlyPrice: "₱5,990",
    periodLabel: "/ team / month",
    yearlyPeriodLabel: "/ team / year",
    subPriceLabel: "₱599 / team / month (or ₱5,990 / year — save 2 months)",
    description:
      "Built for growing organizations and active project teams that need shared availability, live docs, and versioned storage.",
    ctaLabel: "Choose Starter",
    popular: true,
    inclusionsHeader: "Everything in Free, plus:",
    inclusions: [
      "Shared Team Availability Grid and Auto-Schedule Best Slot",
      "Multi-version file storage (V1, V2+) with non-destructive restore and Trash recovery",
      "Live collaborative Yjs document editing and 1-click Markdown (.md) export",
      "Kas AI meeting summaries and leader-reviewed action items",
    ],
  },
  {
    id: "pro",
    name: "Pro Plan",
    badge: "For Larger Orgs & SMEs",
    Icon: ShieldCheck,
    monthlyPrice: "₱1,199",
    yearlyPrice: "₱11,990",
    periodLabel: "/ team / month",
    yearlyPeriodLabel: "/ team / year",
    subPriceLabel: "₱1,199 / team / month (or ₱11,990 / year — save 2 months)",
    description:
      "Full-scale governance, custom RBAC permissions, unlimited Kas AI voice & difficulty scoring, and expanded cloud storage.",
    ctaLabel: "Upgrade to Pro",
    popular: false,
    inclusionsHeader: "Everything in Starter, plus:",
    inclusions: [
      "Expanded cloud storage quotas and priority asset processing",
      "Unlimited Kas AI voice/text interactions and advanced batch task-difficulty scoring (assess_task_difficulty)",
      "Advanced Custom Role-Based Access Control (tasks.manage, storage.manage, roles.manage)",
      "Priority multi-team administrative governance and support",
    ],
  },
] as const;

export function PricingPage() {
  const [billing, setBilling] = useState<BillingCycle>("monthly");

  return (
    <>
      <section className="container page-hero">
        <p className="eyebrow">Freemium Subscription Pricing</p>
        <h1>
          Flexible plans for every team.
          <br />
          <span className="text-brand">Start free, scale as you grow.</span>
        </h1>
        <p className="hero-description">
          Transparent team-based pricing in Philippine Pesos (₱). Start at ₱0
          during Open Beta, or unlock advanced scheduling, versioning, live Yjs
          documents, and full Kas AI automation for your organization.
        </p>

        <div
          className="pricing-billing-toggle"
          role="group"
          aria-label="Billing cycle toggle"
        >
          <button
            type="button"
            className={`billing-toggle-btn ${billing === "monthly" ? "active" : ""}`}
            onClick={() => setBilling("monthly")}
            aria-pressed={billing === "monthly"}
          >
            Monthly Billing
          </button>
          <button
            type="button"
            className={`billing-toggle-btn ${billing === "yearly" ? "active" : ""}`}
            onClick={() => setBilling("yearly")}
            aria-pressed={billing === "yearly"}
          >
            Annual Billing
            <span className="billing-save-pill">2 months free</span>
          </button>
        </div>
      </section>

      <section className="container pricing-tiers-section">
        <div className="pricing-tiers-grid">
          {PRICING_PLANS.map((plan) => {
            const { Icon } = plan;
            const isYearly = billing === "yearly" && plan.id !== "free";
            const displayedPrice = isYearly ? plan.yearlyPrice : plan.monthlyPrice;
            const displayedPeriod =
              isYearly && "yearlyPeriodLabel" in plan
                ? plan.yearlyPeriodLabel
                : plan.periodLabel;

            return (
              <article
                key={plan.id}
                className={`pricing-tier-card ${plan.popular ? "popular" : ""}`}
              >
                <div className="pricing-tier-header">
                  <div className="pricing-tier-top">
                    <span className="feature-icon">
                      <Icon size={22} aria-hidden="true" />
                    </span>
                    <span
                      className={`pricing-tier-badge ${plan.popular ? "popular" : ""}`}
                    >
                      {plan.badge}
                    </span>
                  </div>

                  <h2>{plan.name}</h2>

                  <div className="pricing-tier-price">
                    <span className="price-amount">{displayedPrice}</span>
                    <span className="price-period">{displayedPeriod}</span>
                  </div>

                  <p className="pricing-tier-subprice">{plan.subPriceLabel}</p>
                  <p className="pricing-tier-description">{plan.description}</p>

                  <GetStartedLink
                    className={
                      plan.popular ? "w-full" : "button-secondary w-full"
                    }
                  >
                    {plan.ctaLabel}
                  </GetStartedLink>
                </div>

                <div className="pricing-tier-inclusions">
                  <h3>{plan.inclusionsHeader}</h3>
                  <ul>
                    {plan.inclusions.map((item) => (
                      <li key={item}>
                        <Check size={17} aria-hidden="true" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="container section pricing-faq">
        <SectionHeading
          eyebrow="Freemium & subscription FAQ"
          title="Clear, predictable team pricing."
        />
        <div className="faq-list">
          <details>
            <summary>
              How does per-team pricing work?<span aria-hidden="true">+</span>
            </summary>
            <p>
              SyncTayo charges per team workspace rather than per individual seat,
              making it affordable for organizations, project groups, and
              growing SMEs to invite all their members without per-user surprise
              costs.
            </p>
          </details>
          <details>
            <summary>
              Is the Free Plan really ₱0 during Open Beta?
              <span aria-hidden="true">+</span>
            </summary>
            <p>
              Yes! The Free Plan is ₱0 / team (Free during Open Beta) and
              includes complete private team workspace chat, file sharing, basic
              task boards and calendar views, personal My Plan + Smart Priority,
              starter cloud storage, and basic Kas AI assistant interaction.
            </p>
          </details>
          <details>
            <summary>
              What is the difference between Starter and Pro?
              <span aria-hidden="true">+</span>
            </summary>
            <p>
              Starter (₱599 / team / month or ₱5,990 / year) is tailored for
              organizations and active project teams needing the Shared
              Team Availability Grid, Auto-Schedule Best Slot, multi-version
              storage (V1, V2+) with Trash recovery, live collaborative Yjs
              docs, and Kas AI meeting summaries. Pro (₱1,199 / team / month or
              ₱11,990 / year) adds expanded cloud storage quotas, unlimited Kas
              AI voice/text with batch task-difficulty scoring
              (assess_task_difficulty), and custom Role-Based Access Control
              (tasks.manage, storage.manage, roles.manage).
            </p>
          </details>
          <details>
            <summary>
              Can we switch between monthly and yearly billing?
              <span aria-hidden="true">+</span>
            </summary>
            <p>
              Yes. Teams can start on monthly billing (₱599/mo for Starter or
              ₱1,199/mo for Pro) and switch to annual billing (₱5,990/yr for
              Starter or ₱11,990/yr for Pro) at any time to save the equivalent
              of two months per year.
            </p>
          </details>
        </div>
      </section>
      <StartSection />
    </>
  );
}
