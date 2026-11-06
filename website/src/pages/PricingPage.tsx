import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { BillingCycle } from "../types";
import { PRICING_PLANS } from "../data/product";
import { SectionHeading, StartSection } from "../components/Marketing";

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
          with our Free Plan, or unlock shared scheduling, file version history,
          live collaborative documents, and full AI assistance for your
          organization.
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
              isYearly && plan.yearlyPeriodLabel
                ? plan.yearlyPeriodLabel
                : plan.periodLabel;
            const checkoutHref = `#/checkout?plan=${plan.id}&billing=${billing}`;

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

                  <a
                    href={checkoutHref}
                    className={`button ${
                      plan.popular ? "button-primary" : "button-secondary"
                    } w-full`}
                  >
                    {plan.ctaLabel}
                    <ArrowRight size={16} aria-hidden="true" />
                  </a>
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
              What is included in the ₱0 Free Plan?
              <span aria-hidden="true">+</span>
            </summary>
            <p>
              The Free Plan is ₱0 / team and includes private team workspace
              chat, file sharing, team task boards and shared calendar views,
              your personal daily planner (My Plan), standard cloud file
              storage, and basic AI assistant help.
            </p>
          </details>
          <details>
            <summary>
              What is the difference between Starter and Pro?
              <span aria-hidden="true">+</span>
            </summary>
            <p>
              Starter (₱599 / team / month or ₱5,990 / year) is designed for
              organizations and active project teams needing shared team
              availability, 1-click automatic meeting scheduling, file version
              history with trash recovery, live collaborative documents, and AI
              meeting summaries. Pro (₱1,199 / team / month or ₱11,990 / year)
              adds expanded cloud storage space, unlimited AI voice and text
              assistance with task difficulty and workload insights, and custom
              member roles and editing permissions.
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
