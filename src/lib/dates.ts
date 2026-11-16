// Helpers de dates/heures (sans dépendance externe).

/** Heures proposées pour les créneaux de réservation. */
export const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21] as const;

export const WEEKDAYS: Record<'fr' | 'en', string[]> = {
  fr: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
  en: ['M', 'T', 'W', 'T', 'F', 'S', 'S'],
};

export function startOfDay(input: Date | number): Date {
  const d = new Date(input);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function atHour(day: Date | number, hour: number): Date {
  const d = new Date(day);
  d.setHours(hour, 0, 0, 0);
  return d;
}

export function addDays(input: Date | number, n: number): Date {
  const d = new Date(input);
  d.setDate(d.getDate() + n);
  return d;
}

export function addMonths(input: Date | number, n: number): Date {
  const d = new Date(input);
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  return d;
}

export function sameDay(a: Date | number, b: Date | number): boolean {
  const x = new Date(a);
  const y = new Date(b);
  return (
    x.getFullYear() === y.getFullYear() &&
    x.getMonth() === y.getMonth() &&
    x.getDate() === y.getDate()
  );
}

export function isBefore(a: Date | number, b: Date | number): boolean {
  return new Date(a).getTime() < new Date(b).getTime();
}

export function monthMatrix(month: Date): (Date | null)[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  // Semaine commençant lundi.
  const offset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

const locale = (lang: string) => (lang === 'en' ? 'en-GB' : 'fr-FR');

export function monthLabel(month: Date, lang: string): string {
  const label = new Intl.DateTimeFormat(locale(lang), { month: 'long', year: 'numeric' }).format(month);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function dayLabel(day: Date | number, lang: string): string {
  return new Intl.DateTimeFormat(locale(lang), { day: '2-digit', month: 'short' }).format(new Date(day));
}

export function fullDay(day: Date | number, lang: string): string {
  return new Intl.DateTimeFormat(locale(lang), {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(day));
}

export function timeLabel(day: Date | number): string {
  return new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(new Date(day));
}

export function dateTimeLabel(day: Date | number, lang: string): string {
  return `${fullDay(day, lang)} · ${timeLabel(day)}`;
}

export function durationLabel(start: Date | number, end: Date | number, lang: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const hours = Math.max(1, Math.round(ms / 3_600_000));
  if (hours < 24) return lang === 'en' ? `${hours} h` : `${hours} h`;
  const days = Math.round(hours / 24);
  return lang === 'en' ? `${days} day(s)` : `${days} jour(s)`;
}

export function daysBetween(start: Date | number, end: Date | number): number {
  const ms = startOfDay(end).getTime() - startOfDay(start).getTime();
  return Math.max(1, Math.round(ms / 86_400_000));
}
