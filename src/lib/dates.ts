/**
 * Everything in pulse keys off a local "YYYY-MM-DD" day key.
 * Never build these from `toISOString()` — that silently shifts the day
 * for anyone east or west of UTC.
 */

export const WEEKDAY_LONG = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
] as const;

export const WEEKDAY_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export const toDayKey = (date: Date): string => {
	const y = date.getFullYear();
	const m = `${date.getMonth() + 1}`.padStart(2, "0");
	const d = `${date.getDate()}`.padStart(2, "0");
	return `${y}-${m}-${d}`;
};

export const fromDayKey = (key: string): Date => {
	const [y, m, d] = key.split("-").map(Number);
	return new Date(y, m - 1, d);
};

export const todayKey = (): string => toDayKey(new Date());

export const isValidDayKey = (key: unknown): key is string =>
	typeof key === "string" && /^\d{4}-\d{2}-\d{2}$/.test(key);

export const addDays = (key: string, delta: number): string => {
	const d = fromDayKey(key);
	d.setDate(d.getDate() + delta);
	return toDayKey(d);
};

export const weekdayOf = (key: string): number => fromDayKey(key).getDay();

/** Day-of-month, used by the ALTERNATE care frequency. */
export const dayOfMonth = (key: string): number => Number(key.slice(8, 10));

/** The last `count` day keys, oldest first, ending today. */
export const lastNDays = (count: number, end = todayKey()): string[] =>
	Array.from({ length: count }, (_, i) => addDays(end, i - count + 1));

/** "Thu, 18 Sep" — compact enough for a phone header. */
export const formatShort = (key: string): string =>
	fromDayKey(key).toLocaleDateString(undefined, {
		weekday: "short",
		day: "numeric",
		month: "short",
	});

export const formatRelative = (key: string): string => {
	const today = todayKey();
	if (key === today) return "Today";
	if (key === addDays(today, -1)) return "Yesterday";
	if (key === addDays(today, 1)) return "Tomorrow";
	return formatShort(key);
};
