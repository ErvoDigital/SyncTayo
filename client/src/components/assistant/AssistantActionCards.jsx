import { Link } from "react-router-dom";
import { priorityLabel } from "../../lib/priorities.js";

function formatChange(field, value) { if (value == null) return "None"; if (field === "tier") return priorityLabel(value); if (["dueDate", "startTime", "endTime"].includes(field)) return new Date(value).toLocaleString(); return Array.isArray(value) ? value.join(", ") : String(value); }

export default function AssistantActionCards({ actions = [], workspaces = [], userId, confirming, disabled, onConfirm, onDismiss }) {
  return actions.map((action) => (
    <section key={action.id} aria-label={`${action.kind.startsWith("task") ? "Task" : "Meeting"} confirmation`} className="min-w-0 rounded-xl border border-ink-200 bg-white p-3 text-left text-sm [overflow-wrap:anywhere] dark:border-ink-700 dark:bg-ink-800">
      <p className="font-semibold">{action.kind.endsWith("_update") ? `Update ${action.kind.startsWith("task") ? "task" : "meeting"}` : action.kind.startsWith("task") ? "Create task" : action.kind === "event_draft" ? "Save meeting draft" : "Create meeting"}: {action.data.title || action.preview?.title}</p>
      <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">Workspace: {action.preview?.workspaceName || workspaces.find((w) => w.id === action.data.workspaceId)?.name || action.data.workspaceId}</p>
      {action.data.description && <p className="mt-1 whitespace-pre-wrap">{action.data.description}</p>}
      {action.data.location && <p className="mt-1 text-xs">Location: {action.data.location}</p>}
      {action.kind.endsWith("_update") ? <dl className="mt-3 space-y-2">{Object.entries(action.data.changes).map(([field, value]) => <div key={field}><dt className="text-xs font-medium">{field}</dt><dd className="text-xs text-ink-500">{formatChange(field, action.data.before[field])} → {formatChange(field, value)}</dd></div>)}</dl> : action.kind.startsWith("task") ? <>
        <p className="mt-1 text-xs">Priority: {priorityLabel(action.data.tier)}{action.data.deferredFields?.includes("tier") ? " (default until you edit it)" : ""} · {action.data.assigneeId ? `Assigned to ${action.data.assigneeId === userId ? "you" : action.preview?.people?.[0]?.name || action.data.assigneeId}` : "Unassigned"}</p>
        {action.data.dueDate && <p className="mt-1 text-xs">Due: {new Date(action.data.dueDate).toLocaleString()}</p>}
      </> : <>
        <p className="mt-1 text-xs">{action.kind === "event_draft" ? "Unscheduled draft — finish the details in your workspace calendar." : `${new Date(action.data.startTime).toLocaleString()} – ${new Date(action.data.endTime).toLocaleString()}`}</p>
        {action.kind === "event_draft" && action.data.startTime && <p className="mt-1 text-xs">Proposed start: {new Date(action.data.startTime).toLocaleString()}</p>}
        {action.kind === "event_draft" && action.data.endTime && <p className="mt-1 text-xs">Proposed end: {new Date(action.data.endTime).toLocaleString()}</p>}
        <p className="mt-1 text-xs">Attendees: {action.preview?.people?.map((person) => person.name).join(", ") || action.data.attendeeIds?.join(", ") || "To add later"}</p>
      </>}
      {action.data.deferredFields?.length > 0 && <p className="mt-1 text-xs text-ink-500 dark:text-ink-400">You can add the remaining details later.</p>}
      {action.dismissed ? (
        <p className="mt-2 text-xs text-ink-400">Dismissed</p>
      ) : action.result ? (
        <div className="mt-3 rounded-lg bg-emerald-50 p-2.5 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20">
          <p role="status" className="font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 text-xs">
            <span>✅</span> {action.kind.startsWith("task") ? "Task saved successfully!" : action.kind === "event_draft" ? "Meeting draft saved!" : "Meeting scheduled successfully!"}
          </p>
          <Link className="mt-1.5 inline-block text-xs font-medium text-emerald-700 underline dark:text-emerald-400" to={`/workspaces/${action.result.workspaceId}/${action.kind.startsWith("task") ? "tasks" : "calendar"}`}>
            Open in {action.kind.startsWith("task") ? "task board" : "workspace calendar"} →
          </Link>
        </div>
      ) : action.error ? (
        <div className="mt-3 rounded-lg bg-red-50 p-2.5 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
          <p role="alert" className="text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-1.5">
            <span>⚠️</span> Action Failed: {action.error}
          </p>
          <div className="mt-2 flex gap-2">
            <button type="button" className="btn-secondary !py-1 !px-2.5 text-xs" onClick={() => onConfirm(action)} disabled={Boolean(confirming) || disabled}>
              {confirming === action.id ? "Retrying…" : "Retry"}
            </button>
            <button type="button" className="btn-ghost !py-1 !px-2.5 text-xs" onClick={() => onDismiss(action.id)}>
              Dismiss
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn-primary min-h-11" onClick={() => onConfirm(action)} disabled={Boolean(confirming) || disabled}>{confirming === action.id ? "Saving…" : "Confirm"}</button>
          <button type="button" className="btn-secondary min-h-11" onClick={() => onDismiss(action.id)} disabled={Boolean(confirming) || disabled}>Dismiss</button>
        </div>
      )}
    </section>
  ));
}
