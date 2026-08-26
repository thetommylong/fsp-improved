<script lang="ts">
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 thetommylong

  import { getFeedbackStatus, getUnfinishedFeedbacks, updateFeedbackAnswer, updateFeedbackComment, updateFeedbackStatus } from "../../api";
  import type {
    StudentFeedbackLecturerResult,
    FeedbackQuestionResponse,
    FeedbackAnswerUpdate,
    FeedbackCommentUpdate,
    FeedbackStatusUpdate,
  } from "../../types/fsp";
  import { notify } from "../../notifications";

  let { studentId }: { studentId: string } = $props();

  // List state
  let pending = $state<StudentFeedbackLecturerResult[]>([]);
  let submitted = $state<StudentFeedbackLecturerResult[]>([]);
  let loading = $state(false);

  // Form state
  let active: StudentFeedbackLecturerResult | null = $state(null);
  let formRow: StudentFeedbackLecturerResult | null = $state(null);
  let answers = $state<Record<number, string>>({});
  let comment1 = $state<string>("");
  let comment2 = $state<string>("");
  let submitting = $state(false);

  let dialogEl = $state<HTMLDialogElement>();
  let lastTrigger = $state<HTMLElement>();

  $effect(() => {
    const el = dialogEl;
    if (!el) return;
    if (active && !el.open) el.showModal();
    else if (!active && el.open) el.close();
  });

  // Derived
  const sortedPending = $derived(
    [...pending].sort(
      (a, b) =>
        a.subjectName.localeCompare(b.subjectName) || a.description.localeCompare(b.description),
    ),
  );

  const sortedSubmitted = $derived(
    [...submitted].sort(
      (a, b) =>
        a.subjectName.localeCompare(b.subjectName) || a.description.localeCompare(b.description),
    ),
  );

  

  async function load(): Promise<void> {
    loading = true;
    try {
      const data = await getFeedbackStatus(studentId);
      pending = data.unDoneFeedbacks;
      submitted = data.feedbacks;
    } catch {
      notify("Failed to load feedback", "error");
    } finally {
      loading = false;
    }
  }

  export function refresh(): void {
    void load();
  }

  void load();

  async function openForm(row: StudentFeedbackLecturerResult): Promise<void> {
    lastTrigger = document.activeElement as HTMLElement;
    active = row;
    try {
      if (row.termId === "FAKE") {
        formRow = row;
      } else {
        const rows = await getUnfinishedFeedbacks(row.termId, studentId);
        const found = rows.find((r) => r.feedbackLecturerId === row.feedbackLecturerId);
        if (!found) throw new Error("Row not found");
        formRow = found;
      }
      answers = {};
      for (const [key, val] of Object.entries(formRow.chosenAnswers ?? {})) {
        answers[Number(key)] = val;
      }
      comment1 = formRow.comment1 ?? "";
      comment2 = formRow.comment2 ?? "";
    } catch {
      notify("Failed to open feedback form", "error");
      active = null;
    }
  }

  function pickAnswer(qOrder: number, feedbackAnswerId: string): void {
    answers = { ...answers, [qOrder]: feedbackAnswerId };
    notify("Cập nhật câu trả lời", "success");
  }

  async function saveComment(slot: 1 | 2, value: string): Promise<void> {
    if (slot === 1) comment1 = value;
    else comment2 = value;
    if (active?.termId === "FAKE") return;
    try {
      await updateFeedbackComment(slot, { feedbackLecturerId: active?.feedbackLecturerId ?? "", studentId: studentId ?? "", comment: value });
    } catch {
      notify("Lưu nhận xét thất bại", "error");
    }
  }

  const canFinish = $derived.by(() => {
    if (!formRow?.questions?.length) return false;
    const allAnswered = Object.keys(answers).length >= formRow.questions.length;
    return allAnswered && (comment1.trim().length > 0 || comment2.trim().length > 0);
  });

  function discardForm(): void {
    active = null;
    formRow = null;
    answers = {};
    comment1 = "";
    comment2 = "";
  }

  async function finish(): Promise<void> {
    if (!canFinish || submitting || !formRow) return;
    submitting = true;
    try {
      await updateFeedbackStatus({ feedbackLecturerId: formRow.feedbackLecturerId, studentId: studentId ?? "", status: true });
      notify("Phản hồi đã gửi", "success");
      discardForm();
      requestAnimationFrame(() => lastTrigger?.focus());
      await load();
    } catch {
      notify("Gửi phản hồi thất bại", "error");
    } finally {
      submitting = false;
    }
  }

  function closeForm(): void {
    discardForm();
    requestAnimationFrame(() => lastTrigger?.focus());
    void load();
  }

  function onDialogClose(): void {
    if (active) closeForm();
  }
</script>

<div class="feedback">
  <div class="feedback-body">
    {#if loading}
      <p class="feedback-empty" role="status">Loading…</p>
    {:else if pending.length === 0 && submitted.length === 0}
      <p class="feedback-empty">No feedback published yet</p>
    {:else}
      {#if pending.length > 0}
        <h2 class="feedback-group-title" id="fb-pending">Chưa gửi ({pending.length})</h2>
        <ul class="feedback-list" aria-labelledby="fb-pending">
          {#each sortedPending as f (f.feedbackLecturerId)}
            <li class="fb-card-wrapper">
              <button
                class="fb-card fb-card-muted fb-card-button"
                onclick={() => openForm(f)}
                aria-label={`Phản hồi cho ${f.subjectName} (Chưa gửi)`}
              >
              <header class="fb-card-head">
                <div class="fb-card-titlewrap">
                  <h3 class="fb-card-title">{f.subjectName}</h3>
                  <p class="fb-card-sub">{f.description || f.className}</p>
                </div>
                <span class="fb-badge fb-badge-pending">Chưa gửi</span>
              </header>
              <section class="mark-section">
                <span class="mark-label">GV</span>
                <span class="fb-text">{f.lecturerName || "—"}</span>
              </section>
              </button>
            </li>
          {/each}
        </ul>
      {/if}
      {#if submitted.length > 0}
        <h2 class="feedback-group-title" id="fb-done">Đã gửi ({submitted.length})</h2>
        <ul class="feedback-list" aria-labelledby="fb-done">
          {#each sortedSubmitted as f}
            <li class="fb-card">
              <header class="fb-card-head">
                <div class="fb-card-titlewrap">
                  <h3 class="fb-card-title">{f.subjectName}</h3>
                  <p class="fb-card-sub">{f.description || f.className}</p>
                </div>
                <span class="fb-badge fb-badge-done">Đã gửi</span>
              </header>
              <section class="mark-section">
                <span class="mark-label">GV</span>
                <span class="fb-text">{f.lecturerName || "—"}</span>
              </section>
              {#if f.comment1}
                <section class="mark-section">
                  <span class="mark-label">GK1</span>
                  <span class="fb-text">{f.comment1}</span>
                </section>
              {/if}
              {#if f.comment2}
                <section class="mark-section">
                  <span class="mark-label">GK2</span>
                  <span class="fb-text">{f.comment2}</span>
                </section>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    {/if}
  </div>
</div>

<dialog
  class="fb-dialog"
  bind:this={dialogEl}
  onclose={onDialogClose}
  aria-label="Biểu mẫu phản hồi"
>
  {#if active && formRow}
    <header class="fb-card-head fb-dialog-head">
      <div class="fb-card-titlewrap">
        <h3 class="fb-card-title">{active.subjectName}</h3>
        <p class="fb-card-sub">{active.description || active.className}</p>
      </div>
      <button class="fb-close-btn" aria-label="Đóng" onclick={closeForm} disabled={submitting}>&times;</button>
    </header>

    <div class="fb-dialog-body">
      <section class="fb-q-list">
        {#each formRow.questions ?? [] as q (q.feedbackQuestion.feedbackQuestionId)}
          <div class="fb-q-card">
            <h4 class="fb-q-title">{q.feedbackQuestion.content || `Câu ${q.feedbackQuestion.order}`}</h4>
            <div class="fb-answers">
              {#each q.feedbackAnswers ?? [] as a (a.feedbackAnswerId)}
                <button
                  class={`fb-opt ${answers[q.feedbackQuestion.order ?? 0] === a.feedbackAnswerId ? "fb-opt-selected" : ""} fb-opt-${a.order ?? 0}`}
                  onclick={() => pickAnswer(q.feedbackQuestion.order ?? 0, a.feedbackAnswerId)}
                  aria-pressed={answers[q.feedbackQuestion.order ?? 0] === a.feedbackAnswerId}
                  aria-label={`Câu ${q.feedbackQuestion.order}: ${a.content || String(a.order)}`}
                >
                  {a.content || String(a.order)}
                </button>
              {/each}
            </div>
          </div>
        {/each}
      </section>

      <section class="fb-comments">
        <label class="fb-label" for="fb-comment1">GK1</label>
        <textarea
          id="fb-comment1"
          class="fb-textarea"
          rows="2"
          placeholder="Ghi nhận nhận xét về giảng viên"
          bind:value={comment1}
          onblur={() => saveComment(1, comment1)}
        ></textarea>
        <label class="fb-label" for="fb-comment2">GK2</label>
        <textarea
          id="fb-comment2"
          class="fb-textarea"
          rows="2"
          placeholder="Ghi nhận nhận xét khác"
          bind:value={comment2}
          onblur={() => saveComment(2, comment2)}
        ></textarea>
      </section>
    </div>

    <footer class="fb-actions">
      {#if canFinish}
        <button class="btn-primary" onclick={finish} disabled={submitting}>{submitting ? "Đang gửi…" : "Gửi phản hồi"}</button>
      {:else}
        <span class="fb-disabled">Vui lòng trả lời tất cả câu hỏi và ghi nhận ít nhất một nhận xét</span>
      {/if}
      <button class="btn-secondary" onclick={closeForm} disabled={submitting}>{submitting ? "Đang đóng…" : "Huỷ"}</button>
    </footer>
  {/if}
</dialog>
