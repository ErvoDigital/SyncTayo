import {
  Bell,
  CalendarDays,
  CalendarRange,
  CheckSquare,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Layers,
  MessageSquare,
  Palette,
  ShieldCheck,
  Sparkles,
  Video,
} from "lucide-react";
import type { PageType, PlanId } from "../types";

export const PAGES: {
  id: PageType;
  label: string;
  title: string;
  description: string;
}[] = [
  {
    id: "home",
    label: "Home",
    title: "SyncTayo — One home for all your teams",
    description:
      "Bring your teams, tasks, calendars, chat, meetings, documents, and files into SyncTayo. See your whole workload and catch conflicts across workspaces.",
  },
  {
    id: "features",
    label: "Features",
    title: "SyncTayo features — Plan, collaborate, and stay organized",
    description:
      "Explore SyncTayo’s shared workspaces, My Plan, task boards, conflict alerts, real-time chat, video meetings, collaborative documents, storage, and Lofty, our AI assistant.",
  },
  {
    id: "pricing",
    label: "Pricing",
    title: "SyncTayo pricing — Freemium & Team Subscription Plans",
    description:
      "Flexible per-team pricing starting at ₱0 / team, with Starter (₱599/team/mo) for growing teams and Pro (₱1,199/team/mo) for larger organizations and SMEs.",
  },
  {
    id: "about",
    label: "About",
    title: "About SyncTayo — Built for life across teams",
    description:
      "SyncTayo helps people coordinate school, work, organizations, and community commitments in one place, with a personal view across independent teams.",
  },
];

export const CHECKOUT_PAGE_META = {
  id: "checkout" as PageType,
  label: "Subscribe",
  title: "SyncTayo Checkout — Complete Your Team Subscription",
  description:
    "Set up your SyncTayo team subscription and complete checkout with GCash, Maya, Credit/Debit Card, or QR Ph bank transfer.",
};

export const PRICING_PLANS: {
  id: PlanId;
  name: string;
  badge: string;
  Icon: typeof Layers;
  monthlyAmount: number;
  yearlyAmount: number;
  monthlyPrice: string;
  yearlyPrice: string;
  periodLabel: string;
  yearlyPeriodLabel?: string;
  subPriceLabel: string;
  description: string;
  ctaLabel: string;
  popular: boolean;
  inclusionsHeader: string;
  inclusions: string[];
}[] = [
  {
    id: "free",
    name: "Free Plan",
    badge: "Free Forever",
    Icon: Layers,
    monthlyAmount: 0,
    yearlyAmount: 0,
    monthlyPrice: "₱0",
    yearlyPrice: "₱0",
    periodLabel: "/ team",
    subPriceLabel: "₱0 / team — Free Forever",
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
    monthlyAmount: 599,
    yearlyAmount: 5990,
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
    monthlyAmount: 1199,
    yearlyAmount: 11990,
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
];

export const FEATURES = [
  {
    id: "workspaces",
    group: "plan",
    Icon: Layers,
    title: "A space for every team",
    description:
      "Create separate workspaces for school, work, organizations, and community groups. Invite members and switch teams from one account.",
    details: [
      "Workspace overview and member management",
      "Email invitations and invite codes",
      "Admin, Manager, and Member roles",
    ],
  },
  {
    id: "dashboard",
    group: "plan",
    Icon: LayoutDashboard,
    title: "Your whole workload, together",
    description:
      "See upcoming events, pending tasks, recent activity, and files across the workspaces you belong to. Arrange dashboard widgets around what you need.",
    details: [
      "A personal dashboard across teams",
      "A two-week view of meetings and deadlines",
      "Customizable dashboard widgets",
    ],
  },
  {
    id: "conflicts",
    group: "plan",
    Icon: CalendarRange,
    title: "Catch conflicts across teams",
    description:
      "SyncTayo flags overlapping events, same-day task deadlines, and tasks due on meeting days across different workspaces, with links to the items involved.",
    details: [
      "Cross-workspace meeting overlaps",
      "Deadline clashes between independent teams",
      "Links to review the colliding tasks and events",
    ],
  },
  {
    id: "tasks",
    group: "plan",
    Icon: CheckSquare,
    title: "Tasks with a clear next step",
    description:
      "Organize work on drag-and-drop boards with configurable statuses, assignees, Urgent, High, Medium, or Low priorities, due dates, difficulty, effort estimates, and attachments.",
    details: [
      "Boards with customizable task statuses",
      "Assignments, deadlines, and attachments",
      "Smart Priority based on task and deadline signals",
    ],
  },
  {
    id: "my-plan",
    group: "plan",
    Icon: CalendarDays,
    title: "A plan that fits your day",
    description:
      "My Plan brings tasks and meetings together. Choose your daily work capacity, switch between day, week, and calendar views, and see work at risk.",
    details: [
      "Day-by-day, week, and calendar views",
      "Daily capacity and estimated effort",
      "At-risk tasks and a suggested focus",
    ],
  },
  {
    id: "calendar",
    group: "plan",
    Icon: CalendarDays,
    title: "Keep the team’s calendar close",
    description:
      "Create and update workspace events, add attendees, and browse month or week views. Your personal dashboard brings your teams’ schedules together.",
    details: [
      "Shared workspace calendars",
      "Event details, attendees, and meeting drafts",
      "Upcoming events across your workspaces",
    ],
  },
  {
    id: "chat",
    group: "collaborate",
    Icon: MessageSquare,
    title: "Conversations in context",
    description:
      "Keep discussions in workspace channels or direct messages, with typing indicators, mentions, attachments, and message reactions.",
    details: [
      "Workspace channels and direct messages",
      "Mentions, reactions, and file attachments",
      "Live messages and typing indicators",
    ],
  },
  {
    id: "meetings",
    group: "collaborate",
    Icon: Video,
    title: "Meet without leaving SyncTayo",
    description:
      "Start a workspace video call, share your screen, and annotate together. A floating mini-player keeps the call close while you visit other pages.",
    details: [
      "Camera and microphone controls",
      "Screen sharing and live annotations",
      "A persistent mini-player while you browse",
    ],
  },
  {
    id: "documents",
    group: "collaborate",
    Icon: FileText,
    title: "Write and edit together",
    description:
      "Collaborate on rich-text documents in real time. Format content, add tables and images, and export your work as PDF, Markdown, or HTML.",
    details: [
      "Shared rich-text editing",
      "Tables, images, and document organization",
      "Workspace-wide or assigned-member access",
    ],
  },
  {
    id: "storage",
    group: "collaborate",
    Icon: FolderOpen,
    title: "Files with their history intact",
    description:
      "Upload and organize files in nested folders. Add a new version to an existing entry and keep earlier versions available for review and download.",
    details: [
      "Drag-and-drop uploads and file previews",
      "Version history and authenticated downloads",
      "Nested folders with member access controls",
    ],
  },
  {
    id: "personalization",
    group: "access",
    Icon: Palette,
    title: "Make SyncTayo feel like yours",
    description:
      "Update your profile and avatar, choose light or dark mode, and personalize your accent colors. Appearance preferences are saved on your device.",
    details: [
      "Editable profile and avatar",
      "Light and dark appearance modes",
      "Preset and custom accent colors",
    ],
  },
  {
    id: "notifications",
    group: "access",
    Icon: Bell,
    title: "Stay in the loop",
    description:
      "Receive in-app notifications for assignments, events, invitations, meeting activity, and upcoming deadlines so updates stay close to the work.",
    details: [
      "Live in-app notifications",
      "Meeting and deadline reminders",
      "Updates linked to workspace activity",
    ],
  },
  {
    id: "permissions",
    group: "access",
    Icon: ShieldCheck,
    title: "Share with the right people",
    description:
      "Manage roles and feature access within each workspace, restrict folders and documents, and verify sign-in with an emailed code.",
    details: [
      "Workspace roles and member feature access",
      "Restricted folders and assigned documents",
      "Password or Google sign-in with email verification",
    ],
  },
  {
    id: "assistant",
    group: "access",
    Icon: Sparkles,
    title: "Meet Lofty, your AI assistant",
    description:
      "When Lofty, our AI assistant, is enabled, ask about tasks, events, priorities, and conflicts using text or voice. Review task and meeting proposals before confirming them.",
    details: [
      "Questions answered by Lofty about permitted tasks and events",
      "Text and voice interaction with speech services configured",
      "Task, meeting, and meeting-draft proposals you confirm",
    ],
  },
] as const;

export const FAQS = [
  {
    question: "Who is SyncTayo for?",
    answer:
      "SyncTayo is for people who belong to more than one team: students, professionals, project groups, organizations, and community groups. Each team gets its own workspace, while you get a personal view across your memberships.",
  },
  {
    question: "How does SyncTayo’s freemium pricing work?",
    answer:
      "SyncTayo offers a Free Plan at ₱0 / team with private workspace chat, file sharing, basic task boards, My Plan, and basic Kas AI interaction. Teams can upgrade to the Starter Plan (₱599 / team / month or ₱5,990 / year) for Shared Team Availability, Auto-Schedule Best Slot, multi-version file storage, and live Yjs docs, or the Pro Plan (₱1,199 / team / month or ₱11,990 / year) for expanded storage, unlimited Kas AI voice/text with batch task-difficulty scoring, and custom Role-Based Access Control.",
  },
  {
    question: "What does “Try for free” open?",
    answer:
      "It opens the SyncTayo registration page to create an account and set up your workspace. If you already have an account, use Log in in the navigation bar. SyncTayo verifies sign-in with an emailed code.",
  },
  {
    question: "Do my teams see each other’s work?",
    answer:
      "Workspace access is based on membership, roles, and feature permissions. Your personal dashboard combines work you can access; it does not grant one team access to another team’s workspace. Folders and documents can have additional member restrictions.",
  },
  {
    question: "How does SyncTayo spot schedule conflicts?",
    answer:
      "SyncTayo compares events and unfinished tasks across your workspaces. It flags overlapping events, tasks from different teams due on the same day, and tasks due on days with another team’s meeting. You can review the linked items and decide what to change.",
  },
  {
    question: "Does SyncTayo connect to other collaboration tools?",
    answer:
      "SyncTayo provides its own tasks, calendars, chat, meetings, documents, and storage. Google sign-in is supported; syncing Slack, Notion, Jira, or other external workspaces is not currently part of the service.",
  },
  {
    question: "What can Lofty, our AI assistant, do?",
    answer:
      "When enabled, Lofty can read permitted tasks and events, explain priorities and conflicts, and propose tasks, meetings, or meeting drafts. You review and confirm proposals before they are saved. Automatic scheduling and live meeting transcription are not currently available.",
  },
];
