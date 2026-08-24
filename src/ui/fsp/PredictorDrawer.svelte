<script lang="ts">
  import {
    getTokenPayload,
    getMarkCommonByStudent,
  } from "../../api";
  import type { Term, MarkCommon } from "../../types/fsp";
  import {
    parseScore,
    getGKValue,
    getCKValue,
    getTXNumbers,
    getTXEntries,
    semesterAverage,
    requiredFinal,
    yearlyAverage,
  } from "./marksHelpers";
  import { notify } from "../../notifications";

  let { marks, terms, selectedTermId, onclose }: {
    marks: MarkCommon[];
    terms: Term[];
    selectedTermId: string;
    onclose: () => void;
  } = $props();

  let target = $state(8);
  let projections = $state<Record<string, number>>({});
  let siblingLoading = $state(false);
  let siblingTerm = $state<Term | null>(null);
  let siblingMarks = $state<MarkCommon[]>([]);
  let siblingFetchedFor = $state<string | null>(null);

  // detail view state
  let detailSubject = $state<MarkCommon | null>(null);
  let detailTXSlots = $state<(number | null)[]>([null, null, null, null]);
  let detailGK = $state<number | null>(null);
  let detailCK = $state<number | null>(null);
  let detailTarget = $state(8);

  // parse milestones from markDTO
  function parseMilestones(dto: Record<string, unknown>): [string, string][] {
    const milestones: [string, string][] = [];
    if (!dto) return milestones;
    for (const [key, raw] of Object.entries(dto)) {
      if (raw === undefined || raw === null || raw === "") continue;
      const value = String(raw);
      if (/giữa\s*k[ìiỳ]|cuối\s*k[ìiỳ]/i.test(key)) {
        milestones.push([key, value]);
      }
    }
    return milestones;
  }

  const selectedTerm = $derived(
    terms.find((t) => t.termId === selectedTermId),
  );

  const predRows = $derived(
    marks.map((m) => {
      const dto = m.markDTO ?? {};
      const milestones = parseMilestones(dto);
      const gk = getGKValue(milestones);
      const ck = getCKValue(milestones);
      const tx = getTXNumbers(dto);
      const { value: required, status } = requiredFinal(tx, gk, clampedTarget);
      const tbVal = semesterAverage(tx, gk, ck);
      const tb = tbVal !== null && Number.isFinite(tbVal) ? tbVal.toFixed(2) : "—";
      const sib = siblingMarks.find((s) => s.subjectName === m.subjectName);
      const cnVal = sib?.averageMark ? yearlyAverage(Number(sib.averageMark), tbVal ?? 0) : null;
      const cn = cnVal !== null && Number.isFinite(cnVal) ? cnVal.toFixed(2) : "—";
      return {
        courseId: m.courseId,
        subjectName: m.subjectName,
        gk,
        ck,
        tb,
        cn,
        status,
        required,
        proj: projections[m.courseId] ?? required,
      };
    }),
  );

  const clampedTarget = $derived(
    Math.min(10, Math.max(0, Number(target) || 0)),
  );

  $effect(() => {
    if (!selectedTerm) return;
    const order = selectedTerm.termOrder;
    const yearStart = selectedTerm.academicStartYear;
    const yearEnd = selectedTerm.academicEndYear;
    const opposite = order === 1 ? 2 : 1;
    const sib = terms.find(
      (t) =>
        t.termOrder === opposite &&
        t.academicStartYear === yearStart &&
        t.academicEndYear === yearEnd,
    );
    siblingTerm = sib ?? null;
    if (sib && siblingFetchedFor !== sib.termId) {
      siblingFetchedFor = sib.termId;
      void fetchSibling(sib);
    }
  });

  async function fetchSibling(sib: Term) {
    siblingLoading = true;
    try {
      const studentId = getTokenPayload()?.studentId as string;
      if (!studentId) return;
      const year = `${sib.academicStartYear}-${sib.academicEndYear}`;
      siblingMarks = await getMarkCommonByStudent(
        year,
        sib.termOrder,
        studentId,
      );
    } catch {
      notify("Couldn't load other semester — predicting without CN", "info");
      siblingMarks = [];
    } finally {
      siblingLoading = false;
    }
  }

  // open detail view for a subject
  function openDetail(m: MarkCommon) {
    detailSubject = m;
    const dto = m.markDTO ?? {};
    const milestones = parseMilestones(dto);
    detailGK = getGKValue(milestones);
    detailCK = getCKValue(milestones);
    const txEntries = getTXEntries(dto);
    // always show exactly 4 ĐGTX slots; fill from sorted entries, ignore 5th+
    detailTXSlots = [null, null, null, null];
    let i = 0;
    for (const [key, val] of txEntries) {
      if (i < 4) detailTXSlots[i] = val;
      i++;
    }
  }

  function closeDetail() {
    detailSubject = null;
    detailTXSlots = [null, null, null, null];
    detailGK = null;
    detailCK = null;
  }

  // detail view computed values
  const hasLetterGrades = $derived(
    detailSubject &&
      detailSubject.averageMark !== "" &&
      parseScore(detailSubject.averageMark) === null
  );
  const detailTB = $derived.by(() => {
    if (!detailSubject) return "—";
    const txVals = detailTXSlots.filter(
      (v): v is number => typeof v === "number" && Number.isFinite(v),
    );
    const gk = detailGK;
    const ck =
      detailCK !== null
        ? detailCK
        : (projections[detailSubject.courseId] ?? 0);
    const avg = semesterAverage(txVals, gk, ck);
    return avg !== null && Number.isFinite(avg) ? avg.toFixed(2) : "—";
  });

  const detailCN = $derived.by(() => {
    if (!detailSubject || siblingMarks.length === 0) return "—";
    const sib = siblingMarks.find(
      (s) => s.subjectName === detailSubject!.subjectName,
    );
    if (!sib || sib.averageMark == null) return "—";
    const tb = Number(detailTB);
    if (!Number.isFinite(tb)) return "—";
    return yearlyAverage(Number(sib.averageMark), tb)?.toFixed(2) ?? "—";
  });

  const detailRequired = $derived.by(() => {
    if (!detailSubject) return null;
    const txVals = detailTXSlots.filter(
      (v): v is number => typeof v === "number" && Number.isFinite(v),
    );
    const gk = detailGK;
    return requiredFinal(txVals, gk, detailTarget);
  });

  // re-seed slider positions when target changes
  $effect(() => {
    void clampedTarget;
    const newProjs: Record<string, number> = {};
    for (const m of marks) {
      if (
        !m.averageMark &&
        !(m.markDTO && Object.keys(m.markDTO).length > 0)
      ) {
        continue;
      }
      const dto = m.markDTO ?? {};
      const milestones = parseMilestones(dto);
      const gk = getGKValue(milestones);
      const ck = getCKValue(milestones);
      if (ck !== null) continue;
      const tx = getTXNumbers(dto);
      const { value: required } = requiredFinal(tx, gk, clampedTarget);
      if (required !== null && Number.isFinite(required)) {
        newProjs[m.courseId] = Math.max(0, Math.min(10, required));
      }
    }
    projections = newProjs;
  });
</script>

<div class="drawer-backdrop" role="presentation" onclick={onclose}>
  <div
    class="drawer"
    role="dialog"
    aria-modal="true"
    aria-label="Final Grade Predictor"
  >
    <div class="drawer-header">
      <h2 class="drawer-title">Final Grade Predictor</h2>
      <button
        type="button"
        class="drawer-close"
        aria-label="Close"
        onclick={onclose}
      >
        X
      </button>
    </div>

    <div class="drawer-body">
      {#if detailSubject}
        <!-- Detail View -->
        <div class="detail-view" onclick={(e) => e.stopPropagation()}>
          <div class="detail-header">
            <button
              type="button"
              class="detail-back"
              onclick={closeDetail}
              aria-label="Back to list"
            >
              ← Back
            </button>
            <h3 class="detail-title">{detailSubject.subjectName}</h3>
          </div>

          <div class="detail-table-wrap">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Score</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>ĐGTX 1</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      bind:value={detailTXSlots[0]}
                      class="detail-input"
                      aria-label="ĐGTX 1"
                      disabled={hasLetterGrades}
                    />
                  </td>
                </tr>
                <tr>
                  <td>ĐGTX 2</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      bind:value={detailTXSlots[1]}
                      class="detail-input"
                      aria-label="ĐGTX 2"
                      disabled={hasLetterGrades}
                    />
                  </td>
                </tr>
                <tr>
                  <td>ĐGTX 3</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      bind:value={detailTXSlots[2]}
                      class="detail-input"
                      aria-label="ĐGTX 3"
                      disabled={hasLetterGrades}
                    />
                  </td>
                </tr>
                <tr>
                  <td>ĐGTX 4</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      bind:value={detailTXSlots[3]}
                      class="detail-input"
                      aria-label="ĐGTX 4"
                      disabled={hasLetterGrades}
                    />
                  </td>
                </tr>
                <tr class="detail-separator">
                  <td>Giữa Kỳ (×2)</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      bind:value={detailGK}
                      class="detail-input"
                      aria-label="Giữa Kỳ"
                      placeholder={detailGK !== null ? String(detailGK) : "—"}
                      disabled={hasLetterGrades}
                    />
                  </td>
                </tr>
                <tr class="detail-separator">
                  <td>Cuối Kỳ (×3)</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.1"
                      bind:value={detailCK}
                      class="detail-input"
                      aria-label="Cuối Kỳ"
                      placeholder={detailCK !== null ? String(detailCK) : "—"}
                      disabled={hasLetterGrades}
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div class="detail-results" onclick={(e) => e.stopPropagation()}>
            <div class="detail-result">
              <span class="detail-result-label">TB (Semester Avg)</span>
              <span class="detail-result-value">{detailTB}</span>
            </div>
            <div class="detail-result">
              <span class="detail-result-label">Target Avg</span>
              <input
                type="number"
                min="0"
                max="10"
                step="0.1"
                bind:value={detailTarget}
                class="detail-input"
                placeholder="e.g. 8.0"
              />
            </div>
            <div class="detail-result">
              <span class="detail-result-label">CN (Year Avg)</span>
              <span class="detail-result-value">{detailCN}</span>
            </div>
            {#if detailRequired}
              <div class="detail-result detail-target">
                <span class="detail-result-label">Need on Final for {detailTarget}</span>
                <span class="detail-result-value">
                  {#if detailRequired.status === "impossible"}
                    <span class="detail-impossible">Impossible</span>
                  {:else if detailRequired.status === "secured"}
                    <span class="detail-secured">Secured</span>
                  {:else if detailRequired.status === "unknown"}
                    <span class="detail-unknown">Need GK</span>
                  {:else}
                    <span class="detail-need">{Math.max(0, Math.min(10, detailRequired.value)).toFixed(2)}</span>
                  {/if}
                </span>
              </div>
            {/if}
          </div>
        </div>
      {:else}
        <!-- List View -->
        <div class="drawer-section">
          <p class="drawer-instruction">Target average:</p>
          <div class="drawer-presets">
            <button type="button" class="drawer-preset-btn" onclick={() => (target = 8)}>8.0</button>
            <button type="button" class="drawer-preset-btn" onclick={() => (target = 9)}>9.0</button>
            <button type="button" class="drawer-preset-btn" onclick={() => (target = 9.5)}>9.5</button>
          </div>
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            bind:value={target}
            class="drawer-input"
            placeholder="e.g. 8.0"
          />
        </div>

        {#if siblingLoading}
          <p class="drawer-loading">Loading other semester…</p>
        {:else if siblingMarks.length > 0}
          <p class="drawer-note">
            Year averages include {siblingTerm?.semesterName}.
          </p>
        {:else}
          <p class="drawer-note">Year averages need your other semester's grades.</p>
        {/if}

        <div class="drawer-subjects">
          {#each predRows as row (row.courseId)}
            <div
              class="drawer-row"
              role="listitem"
              onclick={(e) => {
                e.stopPropagation();
                openDetail(marks.find(m => m.courseId === row.courseId)!);
              }}
              tabindex="0"
              onkeydown={(e) =>
                e.key === "Enter" && openDetail(marks.find(m => m.courseId === row.courseId)!)
              }
            >
              <div class="drawer-row-head">
                <span class="drawer-subject-name">{row.subjectName}</span>
                <span class="drawer-gk">GK: {row.gk !== null ? row.gk : "—"}</span>
              </div>

              <div class="drawer-projection">
                {#if row.ck === null}
                  <label
                    class="drawer-slider-label"
                    onclick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="range"
                      min="0"
                      max="10"
                      step="0.05"
                      bind:value={projections[row.courseId]}
                      class="drawer-slider"
                      aria-label="Projected Cuối Kỳ for {row.subjectName}"
                    />
                  </label>
                  <span class="drawer-ck-value">CK {row.proj.toFixed(2)}</span>
                  <span class="drawer-tb-badge">TB {row.tb}</span>
                  {#if siblingMarks.length > 0}
                    <span class="drawer-cn-badge">CN {row.cn}</span>
                  {/if}
                  {#if row.status === "impossible"}
                    <span class="drawer-status impossible">Impossible</span>
                  {:else if row.status === "secured"}
                    <span class="drawer-status secured">Secured</span>
                  {:else if row.status === "unknown"}
                    <span class="drawer-status unknown">Need GK</span>
                  {:else}
                    <span class="drawer-status on-track">Need {Math.max(0, Math.min(10, row.required)).toFixed(2)} on final</span>
                  {/if}
                {:else}
                  <span class="drawer-finalized">
                    Final done · TB {row.tb}{#if row.cn !== "—"} · CN {row.cn}{/if}
                  </span>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>

    {#if !detailSubject}
      <div class="drawer-footer">
        <button type="button" class="drawer-apply" onclick={onclose}>Apply</button>
        <button type="button" class="drawer-cancel" onclick={onclose}>Cancel</button>
      </div>
    {/if}
  </div>
</div>