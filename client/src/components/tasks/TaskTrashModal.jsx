import { useEffect, useState } from "react";
import { Trash2, RotateCcw, X } from "lucide-react";
import * as tasksApi from "../../api/tasks.js";
import { apiErrorMessage } from "../../api/client.js";

export default function TaskTrashModal({ open, onClose, workspaceId, onRestored }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    tasksApi.listTaskTrash(workspaceId)
      .then((items) => { setTasks(items); setError(""); })
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [open, workspaceId]);

  if (!open) return null;

  async function handleRestore(taskId) {
    try {
      await tasksApi.restoreTask(workspaceId, taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      onRestored?.();
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  async function handlePurge(taskId) {
    try {
      await tasksApi.purgeTask(workspaceId, taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      setError(apiErrorMessage(err));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-ink-950/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-5 shadow-panel dark:bg-ink-900 border border-ink-100 dark:border-white/10 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between pb-3 border-b border-ink-100 dark:border-white/10">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <Trash2 className="h-4 w-4" />
            </span>
            <h3 className="font-semibold text-ink-900 dark:text-ink-50">Task Trash &amp; Recovery</h3>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-ink-400 hover:bg-ink-100 dark:hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400">{error}</p>}

        <div className="flex-1 overflow-y-auto py-3 space-y-2 min-h-0">
          {loading ? (
            <p className="py-6 text-center text-xs text-ink-400">Loading deleted tasks…</p>
          ) : tasks.length === 0 ? (
            <p className="py-6 text-center text-xs text-ink-400">Trash is empty. Deleted tasks can be restored here.</p>
          ) : (
            tasks.map((t) => (
              <div key={t.id} className="flex items-center justify-between gap-3 rounded-xl border border-ink-100 p-3 dark:border-white/10">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-800 dark:text-ink-100">{t.title}</p>
                  <p className="text-xs text-ink-400">
                    Deleted {t.deletedAt ? new Date(t.deletedAt).toLocaleString() : "recently"}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleRestore(t.id)}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 hover:bg-brand-100 dark:bg-brand-500/20 dark:text-brand-300"
                  >
                    <RotateCcw className="h-3 w-3" /> Restore
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePurge(t.id)}
                    className="rounded-lg p-1 text-ink-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                    title="Delete permanently"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

