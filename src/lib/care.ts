import { dayOfMonth, weekdayOf } from "./dates";

export type CareFrequency = "EVERY_DAY" | "ALTERNATE" | "WEEKDAYS";

export type CareStepLike = {
	frequency: string;
	weekdays: number[];
};

/**
 * Whether a care step is scheduled for a given day. Shared by the Care tab
 * and the insights aggregation so "done / total" means the same thing in both.
 */
export const isStepDue = (step: CareStepLike, date: string): boolean => {
	switch (step.frequency) {
		case "ALTERNATE":
			return dayOfMonth(date) % 2 === 1;
		case "WEEKDAYS":
			return step.weekdays.includes(weekdayOf(date));
		default:
			return true;
	}
};

export const describeFrequency = (step: CareStepLike): string => {
	if (step.frequency === "ALTERNATE") return "Every other day";
	if (step.frequency === "WEEKDAYS") {
		if (step.weekdays.length === 0) return "No days set";
		const short = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
		return step.weekdays.map((d) => short[d]).join(" · ");
	}
	return "Every day";
};
