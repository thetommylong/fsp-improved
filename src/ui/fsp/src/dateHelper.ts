import { Temporal } from "@js-temporal/polyfill";

export function getWeek(day: Temporal.PlainDate): Temporal.PlainDate[] {
  const monday = day.subtract({ days: day.dayOfWeek - 1 });

  return Array.from({ length: 7 }, (_, i) => {
    return monday.add({ days: i });
  });
}
:qa
