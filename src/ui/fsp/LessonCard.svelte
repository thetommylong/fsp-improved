<script lang="ts">
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 thetommylong

  import type { ScheduleEntry } from "../../types/fsp";

  let {
    entry,
    height,
    onneed,
    onopen,
  }: {
    entry: ScheduleEntry;
    height: number;
    onneed?: (id: string, px: number) => void;
    onopen?: () => void;
  } = $props();

  const isEdunext = $derived(Boolean(entry.eduNextUrl));

  const statusClass = $derived.by(() => {
    switch (entry.status) {
      case "ABSENT":
        return "absent";
      case "LATE":
        return "late";
      case "STUDY_LEAVE":
        return "study-leave";
      default:
        return null;
    }
  });

  const lessonLabel = $derived.by(() => {
    const start = new Date(entry.startDateTime);
    const end = new Date(entry.endDateTime);
    const fmt = (d: Date) =>
      d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    return `${entry.subjectName} at ${fmt(start)}–${fmt(end)} taught by ${entry.lecturerName} in ${entry.roomNo}`;
  });

  let metaEl = $state<HTMLDivElement>();
  let contentEl = $state<HTMLDivElement>();
  let mode = $state<"row" | "stack">("row");
  let compact = $state(false);

  $effect(() => {
    const el = metaEl;
    if (!el || el.clientWidth === 0) return;
    if (mode === "stack") return;
    const clipped = [
      ...el.querySelectorAll(".lesson-room, .lesson-lecturer"),
    ].some((s) => s.scrollWidth > s.clientWidth + 1);
    if (clipped) {
      mode = "stack";
    }
  });

  $effect(() => {
    const el = contentEl;
    if (!el || !onneed) return;
    void height;
    void mode;
    const raf = requestAnimationFrame(() => {
      const subj = el.querySelector(".lesson-subject");
      const natural =
        (subj?.scrollHeight ?? 0) + (metaEl?.offsetHeight ?? 0) + 20;
      if (natural > height) {
        onneed(entry.id, natural);
      }
      if (natural > height && !compact) {
        compact = true;
      }
    });
    return () => cancelAnimationFrame(raf);
  });

  function open() {
    onopen?.();
  }

  function onKeydown(e: KeyboardEvent) {
    if (isEdunext && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      open();
    }
  }
</script>

{#snippet LessonBody({ entry }: { entry: ScheduleEntry })}
  <span class="lesson-accent" aria-hidden="true"></span>
  <div class="lesson-content" class:compact bind:this={contentEl}>
    <p class="lesson-subject">{entry.subjectName}</p>
    <div
      class="lesson-meta"
      class:stack={mode !== "row"}
      bind:this={metaEl}
    >
      <span class="lesson-room">{entry.roomNo}</span>
      {#if mode === "row"}
        <span class="dot"></span>
      {/if}
      <span class="lesson-lecturer">{entry.lecturerName}</span>
    </div>
  </div>
{/snippet}

<button
  type="button"
  class="lesson clickable"
  class:edunext={isEdunext}
  class:absent={statusClass === "absent"}
  class:late={statusClass === "late"}
  class:study-leave={statusClass === "study-leave"}
  aria-label={lessonLabel}
  onclick={open}
  onkeydown={onKeydown}
>
  {@render LessonBody({ entry })}
</button>
