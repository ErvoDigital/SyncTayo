# Minimum Lovable Product (MLP) — User-Driven Improvements Report

Based on combined quantitative and qualitative user testing of the SyncTayo MVP (28 combined testing participants and 18 form respondents), 8 core areas of user friction and workflow gaps were identified. This document details each user finding, the corresponding MLP recommendation, and the technical implementation applied across the frontend and backend.

---

## Executive Summary Matrix

| # | MVP User Finding | Evidence / User Need | MLP Recommendation | Key Files Updated |
|---|---|---|---|---|
| **1** | Users found the dashboard and overall UI a bit overwhelming. | 16/28 participants raised dashboard/UI information-density concerns; customization preferred over removing data. | Simplify the default dashboard with fewer widgets, more graphical summaries, and customizable layout. | `client/src/components/dashboard/dashboardLayout.js`<br>`client/src/components/dashboard/PendingTasksPanel.jsx` |
| **2** | Users wanted different views for tasks. | 15/28 participants requested alternative task views, filters, or clearer task organization. | Add multiple task views (list, board, filter) and keep the To Do / In Progress / Completed cards first. | `client/src/pages/WorkspaceTasks.jsx`<br>`client/src/components/tasks/TaskViewToolbar.jsx` |
| **3** | Users found My Plan overwhelming and wanted more control over it. | 12/28 participants raised My Plan information-density or editability concerns. | Declutter My Plan and let users add or edit appropriate items. | `client/src/pages/MyPlan.jsx`<br>`client/src/components/plan/PlanTaskRow.jsx` |
| **4** | Users wanted help after a conflict warning, not only the alert. | 15/18 form respondents rated both warning types 5/5 and requested actionable resolution suggestions. | Suggest alternative time slots, meeting priority, and a recommended task priority order. | `server/src/services/conflict.service.js`<br>`client/src/components/dashboard/ConflictsPanel.jsx` |
| **5** | Some users were unsure about file versioning. | At least 3 earlier form respondents did not clearly understand file versioning until exploring. | Add short in-app tooltips or a Help Center / guide. | `client/src/components/storage/AssetCard.jsx`<br>`client/src/pages/WorkspaceStorage.jsx` |
| **6** | Teams could not see each other's availability. | Requested independently by 3 form respondents to coordinate team meetings. | Add a shared team availability view and automatic scheduling. | `client/src/components/calendar/TeamAvailabilityView.jsx`<br>`client/src/pages/WorkspaceCalendar.jsx` |
| **7** | The AI assistant did not always perform requested workspace actions. | Respondents expected task creation, summaries, task-difficulty assessment, and prioritization with clear feedback. | Improve AI reliability and speed for supported actions and show clear success/failure feedback. | `server/src/services/assistant.service.js`<br>`server/src/services/openclaw.service.js`<br>`client/src/components/assistant/AssistantActionCards.jsx` |
| **8** | Users need stronger collaboration controls and recovery features. | Testers identified concrete workflow gaps in task permissions, deleted item recovery, live doc editing, downloads, and chat read status. | Add task-editing permission controls, a bin/trash for deleted tasks/files, live collaborative document editing, direct document download, and message seen/read status. | `server/src/services/permissions.js`<br>`server/src/controllers/tasks.controller.js`<br>`server/src/controllers/documents.controller.js`<br>`server/src/controllers/messages.controller.js`<br>`client/src/components/tasks/TaskTrashModal.jsx`<br>`client/src/pages/DocumentEditor.jsx`<br>`client/src/components/chat/ChatThread.jsx` |

---

## Detailed Breakdown of Changes by User Need

### 1. Dashboard Simplification & Graphical Summaries
- **User Problem:** 16 out of 28 testers felt the initial dashboard presented too many simultaneous text lists, creating visual overload on first login, while still wanting access to those widgets when needed.
- **What Changed:**
  - **Reduced Default Widget Density (`dashboardLayout.js`):** Updated `defaultLayout()` so secondary panels (`activity` and `files`) are hidden by default. New users land on a clean, focused dashboard showing only their Overview Skyline, Key Metrics, Clashes, Today's Agenda, Pending Tasks, and Workspaces. Full customization remains a single click away via **Customize** (`WidgetPicker`), where users can toggle, reorder, or resize any widget.
  - **Graphical Priority & Urgency Summary (`PendingTasksPanel.jsx`):** Added a multi-segment horizontal distribution bar at the top of the Pending Tasks widget that visually charts open tasks across **Urgent**, **High**, **Medium**, and **Low** priorities alongside an **Overdue vs. On-track** status badge.

---

### 2. Multiple Task Views & Upfront Core Status Cards
- **User Problem:** 15 out of 28 participants wanted flexible ways to inspect tasks (Board, List, Table, Calendar), faster filtering, and immediate visibility into the three primary workflow stages (**To Do**, **In Progress**, **Completed**).
- **What Changed:**
  - **Upfront Status Summary Strip (`WorkspaceTasks.jsx`):** Added a 3-card interactive summary strip (**To Do**, **In Progress**, **Completed**) at the top of the workspace Tasks page. Each card displays the live task count and a visual completion progress bar; clicking any card filters the active view to that status.
  - **One-Click Filter Shortcut Pills (`TaskViewToolbar.jsx`):** Added quick-filter pills (*"All Cards"*, *"To do"*, *"In progress"*, *"Completed"*, and *"Assigned to me"*) above the task views so users can filter by core status or ownership in a single click without opening secondary dropdowns.
  - **Multi-View Persistence (`WorkspaceTasks.jsx`):** Preserved seamless switching across **Board**, **List**, **Table**, and **Calendar** views with per-user, per-workspace view persistence.

---

### 3. My Plan Decluttering & Direct Task Creation/Editing
- **User Problem:** 12 out of 28 testers found the cross-workspace **My Plan** page dense due to stacked advisory/availability panels and wanted direct control to add or edit tasks from their plan.
- **What Changed:**
  - **Declutter Mode Toggle (`MyPlan.jsx`):** Added a **Declutter** / **Detailed guidance** toggle button in the My Plan header. Activating Declutter mode collapses the availability configuration banner, AI recommendation cards, and focus hero banner so users can focus purely on their prioritized task list.
  - **Direct Task Creation (`+ New task` in `MyPlan.jsx`):** Added a **`+ New task`** button in the My Plan header that loads the workspace's statuses and member list and opens `TaskModal`, allowing users to create and assign tasks directly from My Plan.
  - **Direct Task Editing & Reordering (`PlanTaskRow.jsx`):** Maintained inline status changes, pin/snooze toggles, manual rank reordering (`Move up` / `Move down`), planned date scheduling, and full task editing via `TaskModal`.

---

### 4. Actionable Conflict Warnings & 1-Click Resolution
- **User Problem:** 15 out of 18 form respondents rated SyncTayo's cross-workspace conflict warnings 5/5 in usefulness, but wanted **actionable help** after seeing a warning—specifically alternative time slots, meeting priority guidance, and a recommended task order.
- **What Changed:**
  - **Verified Conflict-Free Slot Engine (`conflict.service.js`):**
    - For `EVENT_OVERLAP` clashes: Computes `meetingPriority` (identifying which meeting to keep vs. reschedule with a clear rationale) and `alternativeSlots` (Before, After, and Next-day windows). Each suggested slot is verified against the user's full event list (`findNextFreeWindow` / `isRangeBusy`) so suggested times never collide with another existing meeting.
    - For `DEADLINE_CLASH` and `TASK_EVENT_SAME_DAY` clashes: Computes `recommendedTaskOrder` (ranking tasks by urgency tier and effort) and a `suggestedReschedule` payload (+1 day deadline shift) or focus-block recommendation.
  - **Interactive 1-Click Resolution Cards (`ConflictsPanel.jsx`):**
    - Expanded each clash row with an **Actionable Resolution Suggestions** card.
    - Clicking any suggested alternative time slot (**Apply**) immediately reschedules the conflicting meeting via `eventsApi.updateEvent`.
    - Clicking **Shift due date (+1d)** on a deadline clash immediately moves the lower-priority task's due date via `tasksApi.updateTask`, displaying inline confirmation feedback.

---

### 5. File Versioning In-App Tooltips & Help Guide
- **User Problem:** Several early testers were unsure how file versioning worked or how to create/restore versions without trial and error.
- **What Changed:**
  - **Always-Visible Version Badges & Tooltips (`AssetCard.jsx`):** Every file card now displays its version badge (`V1` on initial upload, `V2+` on multi-version files) with an informative hover tooltip explaining how to add a new version (dragging a revised file onto the card or uploading a file with the same name). Added a tooltip on the **Restore** action clarifying that restoring promotes an older version non-destructively.
  - **In-App Versioning Guide Modal (`WorkspaceStorage.jsx`):** Added a **"Versioning Guide"** button in the Workspace Storage header that opens a dedicated help modal explaining version creation, side-by-side history inspection, non-destructive restoration, and individual version downloads.

---

### 6. Shared Team Availability & Automatic Scheduling
- **User Problem:** Teams could not easily see when fellow workspace members were busy or free across the workday to schedule meetings.
- **What Changed:**
  - **Shared Team Availability Grid (`TeamAvailabilityView.jsx` & `WorkspaceCalendar.jsx`):**
    - Added a **"Team"** view tab to the Workspace Calendar view switcher.
    - Built a side-by-side hourly timeline grid (8:00 AM – 6:00 PM) displaying each selected member's busy blocks and highlighting **Mutually Available Slots** across the team.
    - Added member filter pills so organizers can check availability for specific subsets of attendees.
  - **1-Click Auto-Scheduling:** Clicking any mutually free time pill in the **"Auto-Schedule"** banner opens `ScheduleMeetingModal` pre-populated with that exact start/end time and all selected team members as attendees.

---

### 7. AI Assistant (Kas) Reliability, Task Difficulty Assessment & Action Feedback
- **User Problem:** Testers expected Kas to reliably handle task creation, workspace summaries, task-difficulty assessment, and prioritization, and wanted unmistakable visual confirmation when an action succeeded or failed.
- **What Changed:**
  - **Task Difficulty & Effort Assessment Tool (`assistant.service.js` & `openclaw.service.js`):**
    - Added the `assess_task_difficulty` tool to `assistantTools` and `READ_TOOLS`.
    - Supports both **single-task evaluation** (analyzing title, description, and urgency to return `difficulty`, `estimatedMinutes`, `recommendedPriority`, and `rationale`) and **batch evaluation** of all unfinished tasks when `title` is omitted.
    - Updated Kas's system prompt instructions so it reliably invokes `assess_task_difficulty` for complexity/effort questions, `get_my_plan` for prioritization, and `read_document` / `read_conversation` for cited summaries.
  - **Clear Success & Failure Feedback Cards (`AssistantActionCards.jsx`):**
    - Upgraded confirmation cards to show a prominent green success banner (*"✅ Task saved successfully!"* / *"✅ Meeting scheduled successfully!"*) with a direct navigation link to the task board or calendar.
    - Added a clear red alert banner on failure (*"⚠️ Action Failed: [reason]"*) with one-click **Retry** and **Dismiss** buttons.

---

### 8. Collaboration Controls & Recovery Features
- **User Problem:** Testers identified five concrete collaboration workflow needs: (a) task-editing permission controls, (b) a trash bin for deleted tasks/files, (c) live collaborative document editing visibility, (d) direct document download, and (e) chat message seen/read status.
- **What Changed:**
  - **Task-Editing Permission Controls (`permissions.js`, `access.js`, `tasks.controller.js`, `TaskDetailsPanel.jsx`):**
    - Added the granular `tasks.manage` permission (*"Edit and manage all tasks"*).
    - Enforced server-side checks in `updateTask` and `deleteTask` so only the task creator, the assigned member, or a member with `tasks.manage` (including workspace Owners/Admins) can edit or delete a task.
    - Updated `TaskDetailsPanel.jsx` to disable the edit button with an explanatory tooltip when a member views a task they do not have permission to modify.
  - **Trash Bin & Recovery for Deleted Tasks & Files (`tasks.controller.js`, `TaskTrashModal.jsx`, `RecycleBin.jsx`):**
    - Added workspace task soft-deletion, trash listing (`GET /tasks/trash`), task restoration (`POST /tasks/:taskId/restore`), and permanent purging (`DELETE /tasks/:taskId/purge`), alongside the Storage Recycle Bin.
    - Added a **Trash** button and `TaskTrashModal` in `WorkspaceTasks.jsx` so users can inspect and restore deleted tasks in one click.
  - **Live Collaborative Document Editing Visibility (`DocumentEditor.jsx`):**
    - Added a live presence pill (*"Live editing"*) with pulsing status indicator and collaborator avatar stack in the document editor header whenever teammates are actively editing the same Yjs document.
  - **Direct Document Download (`documents.controller.js`, `WorkspaceDocuments.jsx`, `DocumentEditor.jsx`):**
    - Added `GET /api/workspaces/:workspaceId/documents/:documentId/download?format=markdown|html` to export Yjs collaborative documents directly as `.md` or `.html` files.
    - Added direct download buttons on document cards in `WorkspaceDocuments.jsx` and in the `DocumentEditor.jsx` toolbar.
  - **Chat Message Seen / Read Status (`messages.controller.js`, `chat.socket.js`, `ChatThread.jsx`):**
    - Updated `getMessages` to return participant `readReceipts` and added `POST /api/conversations/:conversationId/read` plus real-time `conversation:read` WebSocket broadcasts.
    - Rendered single-check (*Delivered*) and double-check (*Seen*) icons on sent messages in `ChatThread.jsx`, along with a *"Seen by [Name]"* caption underneath the sender's latest message.

---

## Verification & Automated Test Coverage

All existing and new MLP functionality was verified against the automated test suites and production bundler:

- **Server Test Suite:** **182 / 182 tests passing** across 18 test suites (`node --test server/test/*.test.js`), including dedicated MLP unit tests in `server/test/feature-improvements.test.js` covering task permissions, task trash/restore/purge, direct document downloads (`.md` & `.html`), message read receipts, and conflict-free slot suggestions.
- **Client Test Suite:** **237 / 237 tests passing** across 24 test suites (`npm run test -w client`), covering task views, My Plan interactions, real-time chat, file previews/downloads, and Kas voice/text assistant flows.
- **Production Build:** `npm run build -w client` (Vite production bundle) completed with **0 errors**.

