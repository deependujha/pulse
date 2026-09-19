"use client";

import { useState } from "react";
import { ChartFrame } from "./frame";
import { fromDayKey, WEEKDAY_SHORT } from "@/lib/dates";
import type { InsightDay } from "@/lib/types";

type Row = {
	key: string;
	label: string;
	/** 0 = nothing, 1 = done. Fractions shade in between. */
	ratio: (day: InsightDay) => number;
	detail: (day: InsightDay) => string;
};

const ROWS: Row[] = [
	{
		key: "macros",
		label: "Macros",
		ratio: (d) => (d.meals > 0 ? 1 : 0),
		detail: (d) => (d.meals > 0 ? `${d.meals} items · ${d.calories} kcal` : "Nothing logged"),
	},
	{
		key: "training",
		label: "Training",
		ratio: (d) => (d.sets > 0 ? 1 : 0),
		detail: (d) => (d.sets > 0 ? `${d.sets} sets` : "Rest / missed"),
	},
	{
		key: "care",
		label: "Care",
		ratio: (d) => (d.careTotal === 0 ? 0 : d.careDone / d.careTotal),
		detail: (d) => (d.careTotal === 0 ? "No steps due" : `${d.careDone}/${d.careTotal} steps`),
	},
];

const shade = (ratio: number): string => {
	if (ratio <= 0) return "var(--secondary)";
	if (ratio < 0.5) return "var(--heat-1)";
	if (ratio < 1) return "var(--heat-2)";
	return "var(--heat-3)";
};

/**
 * A three-row consistency grid. Tapping a cell pins its detail below, so the
 * values are reachable without a hover you can't do on a phone.
 */
export const ConsistencyGrid = ({ series }: { series: InsightDay[] }) => {
	const [selected, setSelected] = useState<string | null>(null);
	const selectedDay = series.find((d) => d.date === selected) ?? null;

	return (
		<ChartFrame
			title="Consistency"
			caption="Tap any square for that day"
			legend={[
				{ label: "Missed", color: "var(--secondary)" },
				{ label: "Partial", color: "var(--heat-2)" },
				{ label: "Complete", color: "var(--heat-3)" },
			]}
			table={{
				columns: ["Date", "Macros", "Training", "Care"],
				rows: series.map((d) => [
					`${fromDayKey(d.date).getDate()}/${fromDayKey(d.date).getMonth() + 1}`,
					d.meals > 0 ? "yes" : "no",
					d.sets > 0 ? "yes" : "no",
					d.careTotal === 0 ? "—" : `${d.careDone}/${d.careTotal}`,
				]),
			}}
		>
			<div className="no-scrollbar -mx-1 overflow-x-auto px-1">
				<div className="min-w-max">
					{ROWS.map((row) => (
						<div key={row.key} className="mb-1.5 flex items-center gap-2">
							<span className="w-14 shrink-0 text-[11px] text-muted-foreground">{row.label}</span>
							<div className="flex gap-[3px]">
								{series.map((day) => {
									const ratio = row.ratio(day);
									const isSelected = day.date === selected;
									return (
										<button
											key={day.date}
											type="button"
											onClick={() => setSelected(isSelected ? null : day.date)}
											aria-label={`${row.label} on ${day.date}: ${row.detail(day)}`}
											className="size-[13px] rounded-[3px] transition"
											style={{
												backgroundColor: shade(ratio),
												outline: isSelected ? "2px solid var(--foreground)" : "none",
												outlineOffset: "1px",
											}}
										/>
									);
								})}
							</div>
						</div>
					))}

					<div className="mt-1 flex items-center gap-2">
						<span className="w-14 shrink-0" />
						<div className="flex gap-[3px]">
							{series.map((day, i) => {
								const d = fromDayKey(day.date);
								const showLabel = i === 0 || i === series.length - 1 || d.getDate() === 1;
								return (
									<span
										key={day.date}
										className="w-[13px] text-center text-[8px] text-muted-foreground"
									>
										{showLabel ? d.getDate() : ""}
									</span>
								);
							})}
						</div>
					</div>
				</div>
			</div>

			<div className="mt-3 min-h-14 rounded-xl bg-secondary px-3 py-2">
				{selectedDay ? (
					<>
						<div className="text-xs font-medium">
							{WEEKDAY_SHORT[fromDayKey(selectedDay.date).getDay()]},{" "}
							{fromDayKey(selectedDay.date).toLocaleDateString(undefined, {
								day: "numeric",
								month: "short",
							})}
						</div>
						<ul className="mt-1 space-y-0.5 text-xs text-muted-foreground">
							{ROWS.map((row) => (
								<li key={row.key}>
									<span className="inline-block w-16">{row.label}</span>
									{row.detail(selectedDay)}
								</li>
							))}
						</ul>
					</>
				) : (
					<p className="text-xs text-muted-foreground">
						Tap a square to see what happened that day.
					</p>
				)}
			</div>
		</ChartFrame>
	);
};
