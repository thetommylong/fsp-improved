<script lang="ts">
  import { getEventsByTerm, getDefaultTerm, getTokenPayload, toggleEventRegistration } from "../../api";
  import type { EventStudent } from "../../types/fsp";
  import { notify } from "../../notifications";

  let { studentId }: { studentId: string } = $props();

  let items = $state<EventStudent[]>([]);
  let loading = $state(false);
  let togglingId = $state<string | null>(null);
  let gridWidth = $state(0);

  async function load(): Promise<void> {
    loading = true;
    try {
      const payload = getTokenPayload();
      const campusId = String(payload?.campusId ?? payload?.campusID ?? "");
      const term = await getDefaultTerm(campusId);
      items = await getEventsByTerm(term.termId, studentId);
    } catch {
      notify("Failed to load events", "error");
    } finally {
      loading = false;
    }
  }

  let pending = $derived(items.filter((ev) => !ev.event.hasAttendance));
  let done = $derived(items.filter((ev) => ev.event.hasAttendance));

  const colCount = $derived(
    Math.max(1, Math.floor((gridWidth - 40 + 12) / 312)),
  );

  function columnsOf(list: EventStudent[]): EventStudent[][] {
    const cols: EventStudent[][] = Array.from({ length: colCount }, () => []);
    list.forEach((ev, i) => cols[i % colCount]!.push(ev));
    return cols;
  }

  async function handleToggle(ev: EventStudent): Promise<void> {
    togglingId = ev.event.eventId;
    try {
      await toggleEventRegistration(
        ev.event.eventId,
        studentId,
        ev.event as Record<string, unknown>,
      );
      await load();
      notify(
        ev.event.hasAttendance ? "Unregistered from event" : "Registered for event",
        "success",
      );
    } catch {
      notify("Failed to update registration", "error");
    } finally {
      togglingId = null;
    }
  }

  export function refresh(): void {
    void load();
  }

  void load();
</script>

{#snippet eventCard(ev: EventStudent)}
  <article class="fb-card" class:fb-card-muted={!ev.event.hasAttendance} role="listitem">
    <header class="fb-card-head">
      <div class="fb-card-titlewrap">
        <h3 class="fb-card-title">{ev.event.eventNameEnglish}</h3>
        <p class="fb-card-sub">{ev.event.eventTypeId || "—"}</p>
      </div>
      {#if ev.event.hasAttendance}
        <span class="fb-badge fb-badge-done">Đã tham gia</span>
      {:else}
        <span class="fb-badge fb-badge-pending">Chưa tham gia</span>
      {/if}
    </header>
    <section class="mark-section">
      <span class="mark-label">Hạn</span>
      <span class="fb-text">{new Date(ev.event.startDate).toLocaleDateString("vi-VN")} - {new Date(ev.event.endDate).toLocaleDateString("vi-VN")}</span>
    </section>
    <section class="mark-section">
      <span class="mark-label">Địa điểm</span>
      <span class="fb-text">{ev.event.location || "—"}</span>
    </section>
    {#if ev.event.numberOfSlots > 0}
      <section class="mark-section">
        <span class="mark-label">Slots</span>
        <span class="fb-text">{ev.event.numberOfSlots} vé</span>
      </section>
    {/if}
    {#if ev.event.hasIssuingCertificate}
      <section class="mark-section">
        <span class="mark-label">Certificate</span>
        <span class="fb-badge fb-badge-done">Có</span>
      </section>
    {/if}
    {#if ev.event.hasAttendance}
      <section class="mark-section">
        <span class="mark-label">Attendance</span>
        <span class="fb-badge fb-badge-done">Đã có</span>
      </section>
    {/if}
    <footer class="event-actions">
      <button
        class={ev.event.hasAttendance ? "btn-unregister" : "btn-register"}
        disabled={togglingId === ev.event.eventId}
        onclick={() => handleToggle(ev)}
        aria-label={ev.event.hasAttendance ? "Unregister from this event" : "Register for this event"}
      >
        {togglingId === ev.event.eventId
          ? (ev.event.hasAttendance ? "Unregistering…" : "Registering…")
          : (ev.event.hasAttendance ? "Unregister" : "Register")}
      </button>
    </footer>
  </article>
{/snippet}

<div class="homeworks">
  <div class="feedback-body" bind:clientWidth={gridWidth}>
    {#if loading}
      <p class="feedback-empty" role="status">Loading…</p>
    {:else if items.length === 0}
      <p class="feedback-empty">No events published yet</p>
    {:else}
      {#if pending.length > 0}
        <h2 class="feedback-group-title" id="ev-pending">Chưa tham gia ({pending.length})</h2>
        <div class="events-grid" role="list" aria-labelledby="ev-pending">
          {#each columnsOf(pending) as col, ci (ci)}
            <div class="events-col">
              {#each col as ev (ev.event.eventId)}
                {@render eventCard(ev)}
              {/each}
            </div>
          {/each}
        </div>
      {/if}
      {#if done.length > 0}
        <h2 class="feedback-group-title" id="ev-done">Đã tham gia ({done.length})</h2>
        <div class="events-grid" role="list" aria-labelledby="ev-done">
          {#each columnsOf(done) as col, ci (ci)}
            <div class="events-col">
              {#each col as ev (ev.event.eventId)}
                {@render eventCard(ev)}
              {/each}
            </div>
          {/each}
        </div>
      {/if}
    {/if}
  </div>
</div>
