<script lang="ts">
  import { Temporal } from "@js-temporal/polyfill";
  import type { ScheduleEntry } from "../../types/fsp";
  import { getEdunextLaunchUrl } from "../../api";
  import closeIcon from "../../assets/icons/close.svg?raw";

  let {
    entry,
    checking,
    onclose,
  }: {
    entry: ScheduleEntry;
    checking: boolean;
    onclose: () => void;
  } = $props();

  const dateLabel = $derived.by(() => {
    const d = Temporal.PlainDateTime.from(entry.startDateTime);
    const e = Temporal.PlainDateTime.from(entry.endDateTime);
    const day = d.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${day} · ${pad(d.hour)}:${pad(d.minute)}–${pad(e.hour)}:${pad(e.minute)}`;
  });

  let dialogEl = $state<HTMLDivElement>();

  $effect(() => {
    dialogEl?.focus();
  });

  function onKeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      onclose();
    }
  }

  async function onEdunextClick(e: MouseEvent) {
    if (!entry.eduNextUrl) return;
    e.preventDefault();
    try {
      const url = await getEdunextLaunchUrl(entry.eduNextUrl);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      window.open(entry.eduNextUrl, "_blank", "noopener,noreferrer");
    }
  }
</script>

<svelte:window onkeydown={onKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<div class="popup-backdrop" role="presentation" onclick={onclose}>
  <div
    class="popup"
    role="dialog"
    aria-modal="true"
    aria-label={entry.subjectName}
    tabindex="-1"
    bind:this={dialogEl}
    onclick={(e) => e.stopPropagation()}
  >
    <div class="popup-header">
      <div class="popup-title">
        <p class="popup-subject">{entry.subjectName}</p>
        <p class="popup-meta">{entry.roomNo} · {entry.lecturerName}</p>
      </div>
      <div class="popup-when">
        <button
          type="button"
          class="popup-close"
          aria-label="Close"
          onclick={onclose}
        >
          {@html closeIcon}
        </button>
        <p class="popup-date">{dateLabel}</p>
      </div>
    </div>

    <div class="popup-body">
      {#if entry.schedulePlanContent}
        <section>
          <h3>Plan</h3>
          <p>{entry.schedulePlanContent}</p>
        </section>
      {/if}

      <section>
        <h3>
          Teacher's comment
          {#if checking}<span class="popup-checking">checking…</span>{/if}
        </h3>
        <p class:empty={!entry.comment}>
          {entry.comment ?? "—"}
        </p>
      </section>

      {#if entry.proctorComment}
        <section>
          <h3>Proctor</h3>
          <p>{entry.proctorComment}</p>
        </section>
      {/if}

      <section>
        <h3>
          Absence request
          {#if checking}<span class="popup-checking">checking…</span>{/if}
        </h3>
        <p class:empty={!entry.hasAbsenceRequest}>
          {entry.hasAbsenceRequest
            ? (entry.absenceRequestReason ?? "Requested")
            : "None"}
        </p>
      </section>

      <div class="popup-footer">
        <span class="popup-class">{entry.className}</span>
        {#if entry.eduNextUrl}
          <a
            class="popup-link"
            href={entry.eduNextUrl}
            target="_blank"
            rel="noopener noreferrer"
            onclick={onEdunextClick}
          >
            Open in Edunext
          </a>
        {/if}
      </div>
    </div>
  </div>
</div>
