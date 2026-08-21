import type { ScheduleEntry } from "./types/fsp";

const PREFIX = "fsp:cal:";
const MAX_WEEKS = 12;

export interface WeekCache {
  savedAt: number;
  entries: ScheduleEntry[];
}

export function readWeek(
  studentId: string,
  weekKey: string,
): WeekCache | null {
  const raw = GM_getValue<WeekCache | null>(
    `${PREFIX}${studentId}:${weekKey}`,
    null,
  );
  return raw ?? null;
}

export function writeWeek(
  studentId: string,
  weekKey: string,
  entries: ScheduleEntry[],
): void {
  GM_setValue(`${PREFIX}${studentId}:${weekKey}`, {
    savedAt: Date.now(),
    entries,
  } satisfies WeekCache);

  const indexKey = `${PREFIX}${studentId}:index`;
  const index: string[] = GM_getValue<string[]>(indexKey, []);
  if (!index.includes(weekKey)) {
    index.push(weekKey);
  }
  while (index.length > MAX_WEEKS) {
    const oldest = index.shift();
    if (oldest) {
      GM_deleteValue(`${PREFIX}${studentId}:${oldest}`);
    }
  }
  GM_setValue(indexKey, index);
}
