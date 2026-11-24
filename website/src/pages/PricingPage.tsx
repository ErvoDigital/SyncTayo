import { Check, Layers } from "lucide-react";
import {
  GetStartedLink,
  SectionHeading,
  StartSection,
} from "../components/Marketing";

const included = [
  "Shared workspaces and member roles",
  "Personal dashboard and cross-workspace conflict alerts",
  "Lofty, our AI assistant (text & voice support)",
  "Task boards, Smart Priority, and My Plan",
  "Shared calendars and event reminders",
  "Workspace channels and direct messages",
  "Video meetings, screen sharing, and annotations",
  "Collaborative rich-text documents",
  "File storage, nested folders, and version history",
  "In-app notifications and appearance customization",
  "Folder, document, and member access controls",
];

export function PricingPage() {
  return (
    <>
      <section className="container page-hero">
        <p className="eyebrow">Open Beta Access</p>
        <h1>
          Make space for your teams.
          <br />
          <span className="text-brand">Free during open beta.</span>
        </h1>
        <p className="hero-description">
          SyncTayo is currently in open beta with all workspace features, conflict
          detection, and Lofty, our AI assistant, available at no cost.
        </p>
      </section>
      <section className="container pricing-section">
        <div className="pricing-card">
          <div className="pricing-intro">
            <span className="feature-icon">
              <Layers size={24} aria-hidden="true" />
            </span>
            <p className="eyebrow mt-6">Current access</p>
            <h2>SyncTayo</h2>
            <p className="price-label">Open Beta</p>
            <div className="pricing-beta-tag">
              <span>All features unlocked during open beta</span>
            </div>
            <p>
              Explore all features without cost while SyncTayo is in open beta.
              Create workspaces, invite your teams, and coordinate your day in
              one place.
            </p>
            <GetStartedLink>Try the open beta</GetStartedLink>
            <p className="text-sm muted">
              Already have an account? Sign in and pick up where you left off.
            </p>
          </div>
          <div className="pricing-included">
            <h3>Included during open beta</h3>
            <ul>
              {included.map((item) => (
                <li key={item}>
                  <Check size={18} aria-hidden="true" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="pricing-note">
              Lofty, our AI assistant, and voice features are available when enabled for
              your SyncTayo deployment. All beta users receive full access during this preview period.
            </p>
          </div>
        </div>
      </section>
      <section className="container section pricing-faq">
        <SectionHeading
          eyebrow="Open beta details"
          title="Clear, transparent access."
        />
        <div className="faq-list">
          <details>
            <summary>
              What is SyncTayo’s current project status?<span aria-hidden="true">+</span>
            </summary>
            <p>
              SyncTayo is a student-developed academic project currently in beta
              testing. The platform is available in open beta for educational
              and testing purposes.
            </p>
          </details>
          <details>
            <summary>
              Is SyncTayo free to use?<span aria-hidden="true">+</span>
            </summary>
            <p>
              Yes! SyncTayo is currently in open beta. You can explore all
              features — including multi-workspace collaboration and Lofty,
              our AI assistant — completely free of charge.
            </p>
          </details>
          <details>
            <summary>
              How do I create an account?<span aria-hidden="true">+</span>
            </summary>
            <p>
              Choose “Try the open beta” to open the SyncTayo registration page and
              create your account. You can sign in with a password or Google and
              complete email verification.
            </p>
          </details>
          <details>
            <summary>
              Can I create or join a team?<span aria-hidden="true">+</span>
            </summary>
            <p>
              Yes. Once signed in, create a workspace and invite your people, or
              join a workspace you’ve been invited to. Your dashboard brings
              work from your memberships into one personal view.
            </p>
          </details>
        </div>
      </section>
      <StartSection />
    </>
  );
}
