<script lang="ts">
  import { Temporal } from "@js-temporal/polyfill";
  import { getCalendarByStudentAndDateRange } from "../../api";
  import type { ScheduleEntry } from "../../types/fsp";
  import { getWeek } from "./src/dateHelper";
  import LessonCard from "./LessonCard.svelte";

  let {
    studentId,
    refreshKey = 0,
  }: {
    studentId: string;
    refreshKey?: number;
  } = $props();

  const HOUR_PX = 64;
  const DEFAULT_START_HOUR = 7;
  const DEFAULT_END_HOUR = 19;

  let selectedDate = $state(Temporal.Now.plainDateISO());
  let entries = $state<ScheduleEntry[]>([]);
  let loading = $state(false);
  let nowMinutes = $state(minutesNow());
  let scroller: HTMLDivElement | undefined = $state();

  const cache = new Map<string, ScheduleEntry[]>();

  function minutesNow(): number {
    const now = Temporal.Now.plainTimeISO();
    return now.hour * 60 + now.minute;
  }

  async function load(date: Temporal.PlainDate): Promise<void> {
    const [monday] = getWeek(date);
    const key = monday.toString();
    const cached = cache.get(key);
    if (cached) {
      entries = cached;
      return;
    }

    loading = true;
    try {
      const sunday = monday.add({ days: 6 });
      const data = await getCalendarByStudentAndDateRange(
        studentId,
        monday.toString(),
        sunday.toString(),
      );
      cache.set(key, data);
      if (getWeek(selectedDate)[0].toString() === key) {
        entries = data;
      }
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    void refreshKey;
    const date = selectedDate;
    void load(date);
  });

  $effect(() => {
    const timer = setInterval(() => {
      nowMinutes = minutesNow();
    }, 30_000);
    return () => clearInterval(timer);
  });

  const dayEntries = $derived(
    entries.filter((e) => e.date.slice(0, 10) === selectedDate.toString()),
  );

  const range = $derived.by(() => {
    let startMin = DEFAULT_START_HOUR * 60;
    let endMin = DEFAULT_END_HOUR * 60;
    for (const e of entries) {
      const s = Temporal.PlainDateTime.from(e.startDateTime);
      const en = Temporal.PlainDateTime.from(e.endDateTime);
      startMin = Math.min(startMin, s.hour * 60);
      endMin = Math.max(endMin, en.hour * 60 + en.minute);
    }
    return {
      startMin,
      endMin: Math.max(endMin, startMin + 60),
    };
  });

  const gridHeight = $derived(
    ((range.endMin - range.startMin) / 60) * HOUR_PX,
  );

  const hours = $derived.by(() => {
    const list: number[] = [];
    for (let m = range.startMin; m < range.endMin; m += 60) {
      list.push(m / 60);
    }
    return list;
  });

  const isToday = $derived(
    selectedDate.toString() === Temporal.Now.plainDateISO().toString(),
  );

  const dateLabel = $derived(
    selectedDate.toLocaleString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }),
  );

  function goTo(delta: number) {
    selectedDate = selectedDate.add({ days: delta });
  }

  function goToday() {
    selectedDate = Temporal.Now.plainDateISO();
  }

  function eventTop(entry: ScheduleEntry): number {
    const s = Temporal.PlainDateTime.from(entry.startDateTime);
    return ((s.hour * 60 + s.minute - range.startMin) / 60) * HOUR_PX;
  }

  function eventHeight(entry: ScheduleEntry): number {
    const s = Temporal.PlainDateTime.from(entry.startDateTime);
    const e = Temporal.PlainDateTime.from(entry.endDateTime);
    const duration =
      e.hour * 60 + e.minute - (s.hour * 60 + s.minute);
    return Math.max((duration / 60) * HOUR_PX, 40);
  }

  function formatHour(hour: number): string {
    return `${String(hour).padStart(2, "0")}:00`;
  }

  $effect(() => {
    if (!scroller) return;
    const anchor = isToday ? nowMinutes : range.startMin + 60;
    const target =
      ((anchor - range.startMin) / 60) * HOUR_PX - HOUR_PX * 1.5;
    scroller.scrollTop = Math.max(0, target);
  });
</script>

<div class="schedule" class:schedule-loading={loading}>
  <div class="schedule-toolbar">
    <button class="toolbar-btn" onclick={goToday}>Today</button>
    <button class="toolbar-btn toolbar-nav" aria-label="Previous day" onclick={() => goTo(-1)}>
      ‹
    </button>
    <button class="toolbar-btn toolbar-nav" aria-label="Next day" onclick={() => goTo(1)}>
      ›
    </button>
    <span class="schedule-date">{dateLabel}</span>
  </div>

  <div class="schedule-body" bind:this={scroller}>
    <div class="schedule-inner" style="height: {gridHeight}px">
      <div class="time-gutter">
        {#each hours as hour (hour)}
          <span
            class="time-label"
            style="top: {((hour * 60 - range.startMin) / 60) * HOUR_PX}px"
          >
            {formatHour(hour)}
          </span>
        {/each}
      </div>

      <div class="day-grid">
        <div class="events">
          {#each dayEntries as entry (entry.id)}
            <div
              class="event"
              style="top: {eventTop(entry)}px; height: {eventHeight(entry)}px"
            >
              <LessonCard {entry} />
            </div>
          {/each}
        </div>

        {#if isToday}
          <div
            class="now-line"
            style="top: {((nowMinutes - range.startMin) / 60) * HOUR_PX}px"
          >
          </div>
        {/if}

        {#if !loading && dayEntries.length === 0}
          <div class="schedule-empty">No classes this day</div>
        {/if}
      </div>
    </div>
  </div>
</div>
