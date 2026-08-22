import type { MarkCommon, Term } from "./types/fsp";

const MARKS_PREFIX = "fsp:marks:";
const TERMS_PREFIX = "fsp:terms:";
const MAX_TERMS_CACHED = 8;

export interface TermMarksCache {
  savedAt: number;
  marks: MarkCommon[];
}

export function readTermMarks(
  studentId: string,
  termId: string,
): TermMarksCache | null {
  return GM_getValue<TermMarksCache | null>(
    `${MARKS_PREFIX}${studentId}:${termId}`,
    null,
  );
}

export function writeTermMarks(
  studentId: string,
  termId: string,
  marks: MarkCommon[],
): void {
  GM_setValue(`${MARKS_PREFIX}${studentId}:${termId}`, {
    savedAt: Date.now(),
    marks,
  } satisfies TermMarksCache);

  const indexKey = `${MARKS_PREFIX}${studentId}:index`;
  const index: string[] = GM_getValue<string[]>(indexKey, []);
  if (!index.includes(termId)) {
    index.push(termId);
  }
  while (index.length > MAX_TERMS_CACHED) {
    const oldest = index.shift();
    if (oldest) {
      GM_deleteValue(`${MARKS_PREFIX}${studentId}:${oldest}`);
    }
  }
  GM_setValue(indexKey, index);
}

export interface TermsCache {
  savedAt: number;
  terms: Term[];
  defaultTermId: string;
}

export function readTerms(campusId: string): TermsCache | null {
  return GM_getValue<TermsCache | null>(`${TERMS_PREFIX}${campusId}`, null);
}

export function writeTerms(
  campusId: string,
  terms: Term[],
  defaultTermId: string,
): void {
  GM_setValue(`${TERMS_PREFIX}${campusId}`, {
    savedAt: Date.now(),
    terms,
    defaultTermId,
  } satisfies TermsCache);
}
