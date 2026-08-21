<script lang="ts">
  import type { ScheduleEntry } from "../../types/fsp";
  import dotIcon from "../../assets/icons/dot.svg?raw";

  let { entry }: { entry: ScheduleEntry } = $props();

  const isEdunext = $derived(Boolean(entry.eduNextUrl));

  function open() {
    if (isEdunext && entry.eduNextUrl) {
      window.open(entry.eduNextUrl, "_blank", "noopener");
    }
  }

  function onKeydown(e: KeyboardEvent) {
    if (isEdunext && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      open();
    }
  }
</script>

{#snippet LessonBody({ entry }: { entry: ScheduleEntry })}
  <p class="lesson-subject">{entry.subjectName}</p>
  <div class="lesson-meta">
    <span>{entry.roomNo}</span>
    <span class="dot">{@html dotIcon}</span>
    <span>{entry.lecturerName}</span>
  </div>
{/snippet}

{#if isEdunext}
  <div
    class="lesson edunext clickable"
    role="button"
    tabindex={0}
    aria-label={`${entry.subjectName} - open in Edunext`}
    onclick={open}
    onkeydown={onKeydown}
  >
    {@render LessonBody({ entry })}
  </div>
{:else}
  <div class="lesson normal">
    {@render LessonBody({ entry })}
  </div>
{/if}
