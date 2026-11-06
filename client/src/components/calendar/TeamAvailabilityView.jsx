import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Sparkles, UserCheck, Users } from "lucide-react";
import Avatar from "../common/Avatar.jsx";
import { sameDay, startOfDay } from "./calendarDates.js";

function formatTime(d) {
  return new Date(d).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Workday range: 8:00 to 18:00 (10 hours)
const WORK_START_HOUR = 8;
const WORK_END_HOUR = 18;
const HOURS = Array.from({ length: WORK_END_HOUR - WORK_START_HOUR }, (_, i) => WORK_START_HOUR + i);

export default function TeamAvailabilityView({
  events = [],
  members = [],
  currentDate = new Date(),
  onDateChange,
  onSchedule,
}) {
  const [selectedMemberIds, setSelectedMemberIds] = useState(() => members.map((m) => m.user.id));
  const activeMembers = useMemo(() => {
    return members.filter((m) => selectedMemberIds.includes(m.user.id));
  }, [members, selectedMemberIds]);

  // Events occurring on the selected date
  const dayEvents = useMemo(() => {
    return events.filter((e) => sameDay(new Date(e.startTime), currentDate));
  }, [events, currentDate]);

  // Busy intervals per member for this date
  const memberBusySlots = useMemo(() => {
    const map = new Map();
    for (const member of members) {
      const userId = member.user.id;
      const userEvents = dayEvents.filter((e) =>
        e.attendees?.some((a) => a.user?.id === userId && a.response !== "DECLINED")
      );
      map.set(userId, userEvents);
    }
    return map;
  }, [members, dayEvents]);

  // Compute mutually free slots for selected members
  const mutualFreeSlots = useMemo(() => {
    if (!activeMembers.length) return [];
    const freeSlots = [];

    for (const hour of HOURS) {
      const slotStart = new Date(currentDate);
      slotStart.setHours(hour, 0, 0, 0);
      const slotEnd = new Date(currentDate);
      slotEnd.setHours(hour + 1, 0, 0, 0);

      // Check if any selected member has an event overlapping this hour
      const isBusy = activeMembers.some((member) => {
        const userEvents = memberBusySlots.get(member.user.id) || [];
        return userEvents.some((e) => {
          const eStart = new Date(e.startTime);
          const eEnd = new Date(e.endTime);
          return eStart < slotEnd && eEnd > slotStart;
        });
      });

      if (!isBusy) {
        freeSlots.push({
          hour,
          start: slotStart,
          end: slotEnd,
          label: `${formatTime(slotStart)} – ${formatTime(slotEnd)}`,
        });
      }
    }
    return freeSlots;
  }, [activeMembers, memberBusySlots, currentDate]);

  function toggleMember(userId) {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  }

  function selectAllMembers() {
    setSelectedMemberIds(members.map((m) => m.user.id));
  }

  function handleAutoSchedule(slot) {
    if (onSchedule) {
      onSchedule({
        startTime: slot.start.toISOString(),
        endTime: slot.end.toISOString(),
        attendeeIds: activeMembers.map((m) => m.user.id),
      });
    }
  }

  function prevDay() {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    onDateChange?.(d);
  }

  function nextDay() {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    onDateChange?.(d);
  }

  function jumpToToday() {
    onDateChange?.(new Date());
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      {/* Date navigation & Member selection */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ink-100 pb-3 dark:border-white/10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={prevDay}
            className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-white/10"
            aria-label="Previous day"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={jumpToToday}
            className="text-sm font-semibold text-ink-900 hover:text-brand-600 dark:text-ink-50 dark:hover:text-brand-400"
          >
            {currentDate.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}
          </button>
          <button
            type="button"
            onClick={nextDay}
            className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-white/10"
            aria-label="Next day"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Member filter pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-ink-400 mr-1 flex items-center gap-1">
            <Users className="h-3.5 w-3.5" /> Compare:
          </span>
          <button
            type="button"
            onClick={selectAllMembers}
            className={`rounded-full px-2.5 py-0.5 font-medium transition-colors ${
              selectedMemberIds.length === members.length
                ? "bg-brand-500 text-white"
                : "bg-ink-100 text-ink-600 hover:bg-ink-200 dark:bg-ink-800 dark:text-ink-300"
            }`}
          >
            All Members
          </button>
          {members.map((m) => {
            const active = selectedMemberIds.includes(m.user.id);
            return (
              <button
                key={m.user.id}
                type="button"
                onClick={() => toggleMember(m.user.id)}
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 font-medium transition-colors ${
                  active
                    ? "bg-brand-100 text-brand-800 ring-1 ring-inset ring-brand-400/40 dark:bg-brand-500/20 dark:text-brand-200"
                    : "bg-ink-50 text-ink-400 hover:bg-ink-100 dark:bg-white/5 dark:text-ink-400"
                }`}
              >
                <Avatar name={m.user.name} color={m.user.avatarColor} size={14} />
                <span>{m.user.name.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Automatic Scheduling Recommendation Strip */}
      <section className="rounded-xl border border-emerald-300/60 bg-emerald-50/70 p-3 text-xs dark:border-emerald-500/30 dark:bg-emerald-500/10">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-500 text-white shadow-soft">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <div>
              <p className="font-semibold text-emerald-950 dark:text-emerald-100">
                Automatic Smart Scheduling
              </p>
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300">
                {mutualFreeSlots.length
                  ? `Found ${mutualFreeSlots.length} open slot${mutualFreeSlots.length === 1 ? "" : "s"} for ${activeMembers.length} selected member${activeMembers.length === 1 ? "" : "s"}.`
                  : "No overlapping free slots during regular working hours for all selected members."}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {mutualFreeSlots.slice(0, 3).map((slot) => (
              <button
                key={slot.hour}
                type="button"
                onClick={() => handleAutoSchedule(slot)}
                className="inline-flex items-center gap-1 rounded-lg bg-white px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-soft hover:bg-emerald-100/60 dark:bg-ink-800 dark:text-emerald-300 dark:hover:bg-ink-700"
                title="Click to schedule meeting with all selected members"
              >
                <Clock className="h-3 w-3" />
                <span>{slot.label}</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-normal">+ Schedule</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Side-by-side member availability timeline grid */}
      <div className="min-h-0 flex-1 overflow-auto rounded-xl border border-ink-200 bg-white shadow-soft dark:border-white/10 dark:bg-ink-900">
        <div className="min-w-[600px]">
          {/* Header row: time column + members */}
          <div className="sticky top-0 z-10 flex border-b border-ink-100 bg-ink-50/90 backdrop-blur-md dark:border-white/10 dark:bg-ink-800/90 text-xs font-semibold text-ink-600 dark:text-ink-300">
            <div className="w-20 shrink-0 p-2 text-center text-ink-400">Time</div>
            {activeMembers.map((m) => (
              <div key={m.user.id} className="flex-1 p-2 flex items-center justify-center gap-1.5 border-l border-ink-100 dark:border-white/10">
                <Avatar name={m.user.name} color={m.user.avatarColor} size={18} />
                <span className="truncate">{m.user.name}</span>
              </div>
            ))}
          </div>

          {/* Time row blocks */}
          <div className="divide-y divide-ink-100/70 dark:divide-white/[0.06]">
            {HOURS.map((hour) => {
              const slotTime = new Date(currentDate);
              slotTime.setHours(hour, 0, 0, 0);
              const isMutualFree = mutualFreeSlots.some((s) => s.hour === hour);

              return (
                <div
                  key={hour}
                  className={`flex transition-colors ${
                    isMutualFree ? "bg-emerald-500/[0.04]" : ""
                  }`}
                >
                  <div className="w-20 shrink-0 p-2 text-right text-xs tabular-nums text-ink-400 flex items-center justify-end">
                    {formatTime(slotTime)}
                  </div>

                  {activeMembers.map((member) => {
                    const userEvents = memberBusySlots.get(member.user.id) || [];
                    const hourStart = slotTime.getTime();
                    const hourEnd = hourStart + 3600000;
                    const overlapping = userEvents.filter((e) => {
                      const st = new Date(e.startTime).getTime();
                      const et = new Date(e.endTime).getTime();
                      return st < hourEnd && et > hourStart;
                    });

                    return (
                      <div
                        key={member.user.id}
                        className="flex-1 min-h-[44px] p-1 border-l border-ink-100/70 dark:border-white/[0.06] flex flex-col justify-center gap-1"
                      >
                        {overlapping.length > 0 ? (
                          overlapping.map((e) => (
                            <div
                              key={e.id}
                              className="rounded bg-brand-100 px-1.5 py-0.5 text-[11px] font-medium text-brand-800 dark:bg-brand-500/20 dark:text-brand-200 truncate"
                              title={`${e.title} (${new Date(e.startTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })} – ${new Date(e.endTime).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })})`}
                            >
                              🔒 {e.title}
                            </div>
                          ))
                        ) : (
                          <div className="h-full w-full rounded border border-dashed border-transparent hover:border-emerald-300 dark:hover:border-emerald-600/50 flex items-center justify-center text-[10px] text-emerald-600/60">
                            Available
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
