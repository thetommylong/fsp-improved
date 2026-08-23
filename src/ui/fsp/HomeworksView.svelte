<script lang="ts">
  import { getStudentHomeWorks, getDefaultTerm, getTokenPayload } from "../../api";
  import type { StudentHomeWork } from "../../types/fsp";
  import { notify } from "../../notifications";

  let { studentId }: { studentId: string } = $props();

  let items = $state<StudentHomeWork[]>([]);
  let loading = $state(false);

  const byDue = (a: StudentHomeWork, b: StudentHomeWork) =>
    a.expiredDateTime.localeCompare(b.expiredDateTime) ||
    a.subjectName.localeCompare(b.subjectName);

  const pending = $derived(items.filter((i) => !i.isDone).sort(byDue));
  const done = $derived(
    items
      .filter((i) => i.isDone)
      .sort(
        (a, b) =>
          b.completedAt.localeCompare(a.completedAt) ||
          a.subjectName.localeCompare(b.subjectName),
      ),
  );

  function isOverdue(hw: StudentHomeWork): boolean {
    return !hw.isDone && hw.expiredDateTime !== "" && new Date(hw.expiredDateTime).getTime() < Date.now();
  }

  function fmtDate(iso: string): string {
    if (!iso) return "—";
    return new Intl.DateTimeFormat("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  }

  async function load(): Promise<void> {
    loading = true;
    try {
      const payload = getTokenPayload();
      const campusId = (payload?.campusId || payload?.campusID) as string;
      const term = await getDefaultTerm(campusId);
      items = await getStudentHomeWorks(studentId, term.termId);
    } catch {
      notify("Failed to load homeworks", "error");
    } finally {
      loading = false;
    }
  }

  export function refresh(): void {
    void load();
  }
</script>

<div class="homeworks">
  <div class="feedback-body">
    {#if loading}
      <p class="feedback-empty" role="status">Loading…</p>
    {:else if items.length === 0}
      <p class="feedback-empty">No homework published yet</p>
    {:else}
      {#if pending.length > 0}
        <h2 class="feedback-group-title" id="hw-pending">Chưa hoàn thành ({pending.length})</h2>
        <ul class="feedback-list" aria-labelledby="hw-pending">
          {#each pending as hw (hw.homeWorkStudentId)}
            {@render card(hw)}
          {/each}
        </ul>
      {/if}
      {#if done.length > 0}
        <h2 class="feedback-group-title" id="hw-done">Đã hoàn thành ({done.length})</h2>
        <ul class="feedback-list" aria-labelledby="hw-done">
          {#each done as hw (hw.homeWorkStudentId)}
            {@render card(hw)}
          {/each}
        </ul>
      {/if}
    {/if}
  </div>
</div>

{#snippet card(hw: StudentHomeWork)}
  <li class="fb-card" class:fb-card-muted={hw.isDone}>
    <header class="fb-card-head">
      <div class="fb-card-titlewrap">
        <h3 class="fb-card-title">{hw.homeworkTitle}</h3>
        <p class="fb-card-sub">{hw.subjectName} · {hw.className}</p>
      </div>
      {#if hw.isDone}
        <span class="fb-badge fb-badge-done">Đã làm</span>
      {:else if isOverdue(hw)}
        <span class="fb-badge fb-badge-overdue">Quá hạn</span>
      {:else}
        <span class="fb-badge fb-badge-pending">Chưa làm</span>
      {/if}
    </header>
    <section class="mark-section">
      <span class="mark-label">Hạn</span>
      <span class="fb-text">{fmtDate(hw.expiredDateTime)}</span>
    </section>
    <section class="mark-section">
      <span class="mark-label">GV</span>
      <span class="fb-text">{hw.teacherName || "—"}</span>
    </section>
    {#if hw.homeworkFiles.length > 0 || hw.studentFiles.length > 0}
      <section class="mark-section">
        <span class="mark-label">Files</span>
        <span class="fb-text"
          >{#if hw.homeworkFiles.length > 0}{hw.homeworkFiles.length} đề{/if
          }{#if hw.homeworkFiles.length > 0 && hw.studentFiles.length > 0} · {/if
          }{#if hw.studentFiles.length > 0}{hw.studentFiles.length} nộp{/if}</span
        >
      </section>
    {/if}
    {#if hw.mark !== null}
      <section class="mark-section">
        <span class="mark-label">Mark</span>
        <span class="fb-text">{hw.mark}</span>
      </section>
    {/if}
  </li>
{/snippet}