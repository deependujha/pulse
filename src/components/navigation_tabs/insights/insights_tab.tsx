"use client";

import { useState } from "react";
import { Chip, EmptyState, SectionTitle, Spinner, Stat } from "@/components/common/bits";
import { ConsistencyGrid } from "@/components/charts/consistency";
import {
	CaloriesChart,
	DeficitChart,
	MacroChart,
	TopItemsChart,
	VolumeChart,
	WeightChart,
} from "@/components/charts/insight-charts";
import { useResource } from "@/lib/api";
import type { Insights } from "@/lib/types";

const RANGES = [
	{ days: 7, label: "7 days" },
	{ days: 30, label: "30 days" },
	{ days: 90, label: "90 days" },
];

export const InsightsTab = () => {
	const [days, setDays] = useState(30);
	const insights = useResource<Insights>(`/api/insights?days=${days}`);
	const data = insights.data;

	return (
		<div className="space-y-4">
			{/* One filter row, above everything it scopes. */}
			<div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
				{RANGES.map((range) => (
					<Chip
						key={range.days}
						active={days === range.days}
						onClick={() => setDays(range.days)}
					>
						{range.label}
					</Chip>
				))}
			</div>

			{!data ? (
				<Spinner label="Crunching your numbers" />
			) : data.summary.loggedDays === 0 && data.summary.totalSets === 0 ? (
				<EmptyState
					emoji="📊"
					title="Not enough history yet"
					body="Log a few days of meals and training and the charts will fill in."
				/>
			) : (
				<div className="space-y-4" style={{ opacity: insights.loading ? 0.6 : 1 }}>
					<section className="grid grid-cols-2 gap-2">
						<Stat
							label="Avg calories"
							value={data.summary.avgCalories.toLocaleString()}
							sub={`over ${data.summary.loggedDays} logged days`}
							tone={
								data.summary.avgCalories === 0
									? "default"
									: data.summary.avgCalories <= data.calorieTarget
										? "good"
										: "critical"
							}
						/>
						<Stat
							label="Avg protein"
							value={`${data.summary.avgProtein} g`}
							sub={`target ${data.proteinTarget} g`}
							tone={data.summary.avgProtein >= data.proteinTarget ? "good" : "default"}
						/>
						<Stat
							label="Total deficit"
							value={`${data.summary.cumulativeDeficit.toLocaleString()}`}
							sub={`≈ ${data.summary.estimatedFatKg} kg of fat`}
							tone={data.summary.cumulativeDeficit >= 0 ? "good" : "critical"}
						/>
						<Stat
							label="Trained"
							value={`${data.summary.workoutDays} days`}
							sub={`${data.summary.totalSets} sets logged`}
						/>
						<Stat
							label="Care adherence"
							value={`${data.summary.careAdherence}%`}
							sub={`${data.summary.careStreak} day streak`}
							tone={data.summary.careAdherence >= 80 ? "good" : "default"}
						/>
						<Stat
							label="Weight change"
							value={weightDelta(data)}
							sub={
								data.summary.currentWeightKg
									? `now ${data.summary.currentWeightKg} kg`
									: "no weigh-ins yet"
							}
							tone={weightTone(data)}
						/>
					</section>

					<SectionTitle title="Macros" caption="Where the deficit actually comes from" />
					<CaloriesChart series={data.series} target={data.calorieTarget} />
					<DeficitChart data={data.deficitSeries} />
					<MacroChart series={data.series} />
					<TopItemsChart items={data.topItems} />

					<SectionTitle title="Body & training" />
					<WeightChart series={data.series} goalWeightKg={data.goalWeightKg} />
					<VolumeChart series={data.series} />

					{data.topExercises.length > 0 && (
						<section className="rounded-2xl border border-border bg-card p-4">
							<h3 className="text-sm font-semibold">Most-trained movements</h3>
							<ul className="mt-2 space-y-1.5">
								{data.topExercises.map((exercise) => (
									<li
										key={exercise.name}
										className="flex items-center justify-between gap-3 text-sm"
									>
										<span className="truncate">{exercise.name}</span>
										<span className="shrink-0 text-xs text-muted-foreground tabular-nums">
											{exercise.sets} sets
										</span>
									</li>
								))}
							</ul>
						</section>
					)}

					<SectionTitle title="Habits" />
					<ConsistencyGrid series={data.series} />
				</div>
			)}
		</div>
	);
};

const weightDelta = (data: Insights): string => {
	const { startWeightKg, currentWeightKg } = data.summary;
	if (startWeightKg === null || currentWeightKg === null) return "—";
	const delta = Math.round((currentWeightKg - startWeightKg) * 10) / 10;
	return `${delta > 0 ? "+" : ""}${delta} kg`;
};

const weightTone = (data: Insights): "default" | "good" | "critical" => {
	const { startWeightKg, currentWeightKg } = data.summary;
	if (startWeightKg === null || currentWeightKg === null || data.goalWeightKg === null) {
		return "default";
	}
	const movingTowardsGoal =
		Math.abs(currentWeightKg - data.goalWeightKg) < Math.abs(startWeightKg - data.goalWeightKg);
	return movingTowardsGoal ? "good" : "default";
};
