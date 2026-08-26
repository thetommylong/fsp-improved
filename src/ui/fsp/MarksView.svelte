<script lang="ts">
// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 thetommylong

  import {
    getDefaultTerm,
    getMarkCommonByStudent,
    getTermsByCampus,
    getTokenPayload,
  } from "../../api";
  import type { MarkCommon, Term } from "../../types/fsp";
  import { notify } from "../../notifications";
  import {
    readTermMarks,
    readTerms,
    writeTermMarks,
    writeTerms,
  } from "../../marksCache";
  import {
    parseScore,
    getGKValue,
    getCKValue,
    semesterAverage,
    requiredFinal,
    yearlyAverage,
  } from "./marksHelpers";
import { exportGradesToCSV } from "./csvExport";
import PredictorDrawer from "./PredictorDrawer.svelte";

  let { studentId }: { studentId: string } = $props();

  interface MarkGroups {
    tx: [string, string][];
    skills: [string, string][];
    milestones: [string, string][];
    other: [string, string][];
  }

  let terms = $state<Term[]>([]);
  let selectedTermId = $state("");
  let marks = $state<MarkCommon[]>([]);
  let loading = $state(false);
  let gridWidth = $state(0);
  let predictorOpen = $state(false);

  const cache = new Map<string, MarkCommon[]>();

  const sortedTerms = $derived(
    [...terms].sort((a, b) => b.startDate.localeCompare(a.startDate)),
  );

  interface TermGroup {
    label: string | null;
    items: Term[];
  }

  const termGroups = $derived.by(() => {
    const main: Term[] = [];
    const extras = new Map<string, Term[]>();
    for (const t of sortedTerms) {
      const match = t.semesterName.match(/^(.*?)\s*\(([^)]*)\)$/);
      if (match && match[1].trim() && match[2]) {
        const list = extras.get(match[2]) ?? [];
        list.push({ ...t, semesterName: match[1].trim() });
        extras.set(match[2], list);
      } else {
        main.push(t);
      }
    }
    return [
      { label: null, items: main },
      ...[...extras].map(([label, items]) => ({ label, items })),
    ];
  });

  const selectedTerm = $derived(
    terms.find((t) => t.termId === selectedTermId),
  );

  const rows = $derived(
    [...marks].sort(
      (a, b) =>
        Number(b.isMain ?? false) - Number(a.isMain ?? false) ||
        a.subjectName.localeCompare(b.subjectName),
    ),
  );

  const colCount = $derived(
    Math.max(1, Math.floor((gridWidth - 40 + 12) / 312)),
  );

  const columns = $derived.by(() => {
    const cols: MarkCommon[][] = Array.from({ length: colCount }, () => []);
    rows.forEach((m, i) => cols[i % colCount]!.push(m));
    return cols;
  });

  function classify(m: MarkCommon): MarkGroups {
    const tx: [string, string][] = [];
    const skills: [string, string][] = [];
    const milestones: [string, string][] = [];
    const other: [string, string][] = [];

    for (const pair of Object.entries(m.markDTO ?? {})) {
      const [key, raw] = pair;
      if (raw === undefined || raw === null || raw === "") continue;
      const value = String(raw);
      if (/^Đánh giá thường xuyên/i.test(key)) tx.push([key, value]);
      else if (key.startsWith("- ")) skills.push([key.slice(2), value]);
      else if (/giữa kỳ|cuối kỳ|cuối kì|TB cuối kỳ/i.test(key))
        milestones.push([key, value]);
      else other.push([key, value]);
    }

    tx.sort(
      (a, b) =>
        (Number(a[0].match(/\d+/)?.[0]) || 0) -
        (Number(b[0].match(/\d+/)?.[0]) || 0),
    );
    return { tx, skills, milestones, other };
  }

  function milestoneLabel(key: string): string {
    return key.replace(/^Đánh giá\s+/i, "").replace(/^TB\s+/i, "TB ");
  }

  function hasGrades(g: MarkGroups, m: MarkCommon): boolean {
    return (
      g.tx.length > 0 ||
      g.skills.length > 0 ||
      g.milestones.length > 0 ||
      g.other.length > 0 ||
      !!m.averageMark ||
      !!m.averageMarkCN
    );
  }

  let termPicked = false;

  async function init() {
    const campusId = getTokenPayload()?.campusId as string;
    const cached = readTerms(campusId);
    if (cached) {
      terms = cached.terms;
      selectedTermId = cached.defaultTermId;
    }
    try {
      const [list, def] = await Promise.all([
        getTermsByCampus(campusId),
        getDefaultTerm(campusId),
      ]);
      terms = list;
      writeTerms(campusId, list, def.termId);
      if (!termPicked && (!selectedTermId || !list.some((t) => t.termId === selectedTermId))) {
        selectedTermId = def.termId;
      }
    } catch {
      if (!cached) notify("Failed to load semesters", "error");
    }
  }

  void init();

  async function load(termId: string, force = false): Promise<void> {
    const term = terms.find((t) => t.termId === termId);
    if (!term) return;

    if (!force) {
      const mem = cache.get(termId);
      if (mem) {
        marks = mem;
        return;
      }
      const stored = readTermMarks(studentId, termId);
      if (stored) {
        cache.set(termId, stored.marks);
        marks = stored.marks;
        // fall through: revalidate in background
      }
    }

    if (!cache.has(termId)) {
      loading = true;
    }
    try {
      const year = `${term.academicStartYear}-${term.academicEndYear}`;
      const data = await getMarkCommonByStudent(year, term.termOrder, studentId);
      cache.set(termId, data);
      writeTermMarks(studentId, termId, data);
      if (selectedTermId === termId) {
        marks = data;
      }
    } catch {
      if (!cache.has(termId)) {
        notify("Failed to load marks", "error");
      } else if (force) {
        notify("Couldn't refresh — showing saved marks", "info");
      }
    } finally {
      loading = false;
    }
  }

  export function refresh(): void {
    void load(selectedTermId, true);
  }

  $effect(() => {
    void load(selectedTermId);
  });
</script>

<div class="marks">
  <div class="marks-toolbar">
    <label class="marks-label" for="marks-term">Học kỳ</label>
    <select
      id="marks-term"
      class="marks-select"
      bind:value={selectedTermId}
      onchange={() => (termPicked = true)}
    >
      {#each termGroups as group, gi (group.label ?? `main-${gi}`)}
        {#if group.label}
          <optgroup label={group.label}>
            {#each group.items as term (term.termId)}
              <option value={term.termId}>{term.semesterName}</option>
            {/each}
          </optgroup>
        {:else}
          {#each group.items as term (term.termId)}
            <option value={term.termId}>{term.semesterName}</option>
          {/each}
        {/if}
      {/each}
</select>
      <div class="marks-toolbar-actions">
        <button
          type="button"
          class="btn-marks"
          onclick={() => exportGradesToCSV(marks, selectedTerm?.semesterName)}
        >
          Export CSV
        </button>
        <button
          type="button"
          class="btn-marks"
          onclick={() => (predictorOpen = true)}
        >
          What do I need on my finals?
        </button>
      </div>
    </div>

  <div class="marks-body">
    {#if loading}
      <p class="marks-empty" role="status">Loading…</p>
    {:else if marks.length === 0}
      <p class="marks-empty">No marks recorded for this semester yet</p>
    {:else}
      <div class="marks-grid" role="group" aria-label="Bảng điểm theo môn học" bind:clientWidth={gridWidth}>
        {#each columns as col, ci (ci)}
          <div class="marks-col">
            {#each col as m (m.courseId)}
              {@const g = classify(m)}
              <article class="mark-card" class:mark-card-muted={!hasGrades(g, m)}>
            <header class="mark-card-head">
              <h3 class="mark-card-title">{m.subjectName}</h3>
              <div class="mark-card-avgs">
                {#if m.averageMark}
                  <span class="avg-badge" aria-label="TB {m.averageMark}">TB {m.averageMark}</span>
                {/if}
                {#if m.averageMarkCN}
                  <span class="avg-badge avg-badge-cn" aria-label="CN {m.averageMarkCN}">CN {m.averageMarkCN}</span>
                {/if}
              </div>
            </header>

            {#if g.tx.length > 0}
              <section class="mark-section" aria-label="Đánh giá thường xuyên">
                <span class="mark-label">TX</span>
                <div class="chips">
                  {#each g.tx as [key, value], i (key)}
                    <span class="chip"><b>{i + 1}</b>{value}</span>
                  {/each}
                </div>
              </section>
            {/if}

            {#if g.skills.length > 0}
              <section class="mark-section" aria-label="Kỹ năng ngôn ngữ">
                <span class="mark-label">Kỹ năng</span>
                <div class="chips">
                  {#each g.skills as [name, value] (name)}
                    <span class="chip"><b>{name}</b>{value}</span>
                  {/each}
                </div>
              </section>
            {/if}

            {#if g.milestones.length > 0}
              <section class="mark-section mark-milestones" aria-label="Điểm định kỳ">
                <span class="mark-label">Định kỳ</span>
                <div class="chips">
                  {#each g.milestones as [key, value] (key)}
                    <span class="chip chip-milestone"
                      ><b>{milestoneLabel(key)}</b>{value}</span
                    >
                  {/each}
                </div>
              </section>
            {/if}

            {#if g.other.length > 0}
              <section class="mark-section" aria-label="Hạng mục khác">
                <span class="mark-label">Khác</span>
                <div class="chips">
                  {#each g.other as [key, value] (key)}
                    <span class="chip"><b>{key}</b>{value}</span>
                  {/each}
                </div>
              </section>
            {/if}

            {#if !hasGrades(g, m)}
              <p class="mark-none">Chưa có điểm</p>
            {/if}
              </article>
            {/each}
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
{#if predictorOpen}
  <PredictorDrawer 
    marks={marks} 
    terms={terms} 
    selectedTermId={selectedTermId} 
    onclose={() => { predictorOpen = false }} 
  />
{/if}
