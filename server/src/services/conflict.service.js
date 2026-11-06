// Detects cross-workspace scheduling conflicts for a user — SyncTayo's core
// differentiator: surfacing collisions that only exist because a person
// belongs to several independent workspaces that can't see each other.

import { dayInZone } from "../utils/time.js";

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd;
}

function isRangeBusy(start, end, events = [], ignoreId = null) {
  return events.some((ev) => {
    if (ignoreId && ev.id === ignoreId) return false;
    return overlaps(start, end, new Date(ev.startTime), new Date(ev.endTime));
  });
}

function findNextFreeWindow(fromTime, durationMs, events = [], ignoreId = null) {
  let cursor = new Date(fromTime.getTime());
  for (let step = 0; step < 8; step++) {
    const candidateEnd = new Date(cursor.getTime() + durationMs);
    const blocking = events.find((ev) => {
      if (ignoreId && ev.id === ignoreId) return false;
      return overlaps(cursor, candidateEnd, new Date(ev.startTime), new Date(ev.endTime));
    });
    if (!blocking) return { start: cursor, end: candidateEnd };
    cursor = new Date(new Date(blocking.endTime).getTime());
  }
  return { start: cursor, end: new Date(cursor.getTime() + durationMs) };
}

function generateEventOverlapSuggestions(a, b, allEvents = []) {
  const aStart = new Date(a.startTime);
  const aEnd = new Date(a.endTime);
  const bStart = new Date(b.startTime);
  const bEnd = new Date(b.endTime);

  // Meeting priority recommendation: Keep the one starting earlier or broader scope
  const keepFirst = aStart <= bStart;
  const keepItem = keepFirst ? a : b;
  const rescheduleItem = keepFirst ? b : a;
  const durationReschedule = Math.max(
    30 * 60 * 1000,
    new Date(rescheduleItem.endTime).getTime() - new Date(rescheduleItem.startTime).getTime()
  );

  // Alternative slot 1: next genuinely free window after the kept meeting ends
  const afterWindow = findNextFreeWindow(new Date(keepItem.endTime), durationReschedule, allEvents, rescheduleItem.id);

  // Alternative slot 2: before the kept meeting starts (if within waking hours >= 8am and free)
  const slotBefore = new Date(new Date(keepItem.startTime).getTime() - durationReschedule);
  const slotBeforeEnd = new Date(new Date(keepItem.startTime).getTime());

  // Alternative slot 3: next business day at the same time (verified free)
  const nextDayBase = new Date(new Date(rescheduleItem.startTime).getTime() + 24 * 60 * 60 * 1000);
  const nextDayWindow = findNextFreeWindow(nextDayBase, durationReschedule, allEvents, rescheduleItem.id);

  const alternativeSlots = [
    {
      label: `After "${keepItem.title}"`,
      startTime: afterWindow.start.toISOString(),
      endTime: afterWindow.end.toISOString(),
      recommendation: "Verified conflict-free slot on the same day",
    },
    {
      label: `Next day open slot`,
      startTime: nextDayWindow.start.toISOString(),
      endTime: nextDayWindow.end.toISOString(),
      recommendation: "Verified conflict-free window on the following day",
    },
  ];

  if (slotBefore.getHours() >= 8 && !isRangeBusy(slotBefore, slotBeforeEnd, allEvents, rescheduleItem.id)) {
    alternativeSlots.unshift({
      label: `Before "${keepItem.title}"`,
      startTime: slotBefore.toISOString(),
      endTime: slotBeforeEnd.toISOString(),
      recommendation: "Earlier conflict-free slot before the meeting",
    });
  }

  return {
    meetingPriority: {
      keepId: keepItem.id,
      keepTitle: keepItem.title,
      keepWorkspaceId: keepItem.workspaceId,
      rescheduleId: rescheduleItem.id,
      rescheduleTitle: rescheduleItem.title,
      rescheduleWorkspaceId: rescheduleItem.workspaceId,
      reason: `Keep "${keepItem.title}" (${keepItem.workspaceName}) and reschedule "${rescheduleItem.title}" (${rescheduleItem.workspaceName}) to an open window.`,
    },
    alternativeSlots,
  };
}

const TIER_WEIGHT = { TIER_1: 4, TIER_2: 3, TIER_3: 2, TIER_4: 1 };
const TIER_HUMAN = { TIER_1: "Urgent", TIER_2: "High", TIER_3: "Medium", TIER_4: "Low" };

function generateDeadlineClashSuggestions(a, b) {
  const weightA = TIER_WEIGHT[a.tier] || 2;
  const weightB = TIER_WEIGHT[b.tier] || 2;
  const first = weightA >= weightB ? a : b;
  const second = weightA >= weightB ? b : a;

  const nextDay = new Date(new Date(second.dueDate).getTime() + 24 * 60 * 60 * 1000);

  return {
    recommendedTaskOrder: {
      firstTaskId: first.id,
      firstTaskTitle: first.title,
      firstTaskWorkspaceId: first.workspaceId,
      secondTaskId: second.id,
      secondTaskTitle: second.title,
      secondTaskWorkspaceId: second.workspaceId,
      reason: `Tackle "${first.title}" first (${TIER_HUMAN[first.tier] || "Medium"} priority), then proceed with "${second.title}" (${TIER_HUMAN[second.tier] || "Medium"} priority).`,
      suggestedReschedule: {
        taskId: second.id,
        workspaceId: second.workspaceId,
        taskTitle: second.title,
        suggestedDueDate: nextDay.toISOString(),
        action: `Shift "${second.title}" by 1 day to balance your daily workload.`,
      },
    },
  };
}

function generateTaskEventSuggestions(task, event, allEvents = []) {
  const eventStart = new Date(event.startTime);
  const eventEnd = new Date(event.endTime);
  const taskDurationMs = Math.max(30, task.estimatedMinutes || 45) * 60 * 1000;
  const focusAfter = findNextFreeWindow(eventEnd, taskDurationMs, allEvents);
  const nextDay = new Date(new Date(task.dueDate).getTime() + 24 * 60 * 60 * 1000);

  return {
    recommendedTaskOrder: {
      firstTaskId: task.id,
      firstTaskTitle: task.title,
      reason:
        task.tier === "TIER_1" || task.tier === "TIER_2"
          ? `Prioritize finishing "${task.title}" (${TIER_HUMAN[task.tier]}) before "${event.title}" begins, or block ${focusAfter.start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} right after.`
          : `Attend "${event.title}" first, then complete "${task.title}" in the free block starting at ${focusAfter.start.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}.`,
      taskPriority: `${TIER_HUMAN[task.tier] || "Medium"} priority`,
      suggestedReschedule:
        task.tier !== "TIER_1"
          ? {
              taskId: task.id,
              workspaceId: task.workspaceId,
              taskTitle: task.title,
              suggestedDueDate: nextDay.toISOString(),
              action: `Move "${task.title}" due date to tomorrow if "${event.title}" runs long.`,
            }
          : null,
    },
  };
}

// events: [{ id, title, workspaceId, workspaceName, startTime, endTime }]
// tasks:  [{ id, title, workspaceId, workspaceName, dueDate, tier }] — callers
// are expected to have already excluded tasks in a "done" status.
export function detectConflicts({ events, tasks, timeZone = "Asia/Manila", dailyCapacityHours = 6 }) {
  const sameDay = (a, b) => dayInZone(a, timeZone) === dayInZone(b, timeZone);
  const conflicts = [];

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i];
      const b = events[j];
      if (a.workspaceId === b.workspaceId) continue;
      if (overlaps(new Date(a.startTime), new Date(a.endTime), new Date(b.startTime), new Date(b.endTime))) {
        const suggestions = generateEventOverlapSuggestions(a, b, events);
        conflicts.push({
          type: "EVENT_OVERLAP",
          severity: "high",
          message: `"${a.title}" (${a.workspaceName}) overlaps "${b.title}" (${b.workspaceName})`,
          items: [
            { kind: "event", id: a.id, title: a.title, workspaceId: a.workspaceId, workspaceName: a.workspaceName, time: a.startTime },
            { kind: "event", id: b.id, title: b.title, workspaceId: b.workspaceId, workspaceName: b.workspaceName, time: b.startTime },
          ],
          suggestions,
        });
      }
    }
  }

  const datedTasks = tasks.filter((t) => t.dueDate);
  for (let i = 0; i < datedTasks.length; i++) {
    for (let j = i + 1; j < datedTasks.length; j++) {
      const a = datedTasks[i];
      const b = datedTasks[j];
      if (a.workspaceId === b.workspaceId) continue;
      if (sameDay(new Date(a.dueDate), new Date(b.dueDate))) {
        const suggestions = generateDeadlineClashSuggestions(a, b);
        conflicts.push({
          type: "DEADLINE_CLASH",
          severity: a.tier === "TIER_1" || b.tier === "TIER_1" ? "high" : (a.estimatedMinutes ?? 30) + (b.estimatedMinutes ?? 30) > dailyCapacityHours * 60 ? "medium" : "low",
          workload: { estimatedHours: ((a.estimatedMinutes ?? 30) + (b.estimatedMinutes ?? 30)) / 60, capacityHours: dailyCapacityHours },
          message: `"${a.title}" (${a.workspaceName}) and "${b.title}" (${b.workspaceName}) are both due ${dayInZone(a.dueDate, timeZone)}`,
          items: [
            { kind: "task", id: a.id, title: a.title, workspaceId: a.workspaceId, workspaceName: a.workspaceName, time: a.dueDate },
            { kind: "task", id: b.id, title: b.title, workspaceId: b.workspaceId, workspaceName: b.workspaceName, time: b.dueDate },
          ],
          suggestions,
        });
      }
    }
  }

  for (const task of datedTasks) {
    for (const event of events) {
      if (task.workspaceId === event.workspaceId) continue;
      if (sameDay(new Date(task.dueDate), new Date(event.startTime))) {
        const suggestions = generateTaskEventSuggestions(task, event, events);
        conflicts.push({
          type: "TASK_EVENT_SAME_DAY",
          severity: "low",
          message: `Task "${task.title}" (${task.workspaceName}) is due the same day as "${event.title}" (${event.workspaceName})`,
          items: [
            { kind: "task", id: task.id, title: task.title, workspaceId: task.workspaceId, workspaceName: task.workspaceName, time: task.dueDate },
            { kind: "event", id: event.id, title: event.title, workspaceId: event.workspaceId, workspaceName: event.workspaceName, time: event.startTime },
          ],
          suggestions,
        });
      }
    }
  }

  const rank = { high: 0, medium: 1, low: 2 };
  return conflicts.sort((a, b) => rank[a.severity] - rank[b.severity]);
}
