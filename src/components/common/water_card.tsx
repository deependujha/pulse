"use client";

import { FiDroplet } from "react-icons/fi";
import { toast } from "sonner";
import { api, refreshAll } from "@/lib/api";

/** One tap is one glass. */
const GLASS_ML = 250;

type Props = {
	date: string;
	/** The `/api/metrics?date=…` key to refresh after a change. */
	metricsKey: string;
	waterMl: number;
	targetMl: number;
};

/** Water against its target, with the two buttons that move it. */
export const WaterCard = ({ date, metricsKey, waterMl, targetMl }: Props) => {
	const add = async (delta: number) => {
		const next = Math.max(0, waterMl + delta);
		try {
			await api.put("/api/metrics", { date, waterMl: next });
			await refreshAll(metricsKey);
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "Could not save that");
		}
	};

	return (
		<div className="rounded-2xl border border-border bg-card p-3.5">
			<div className="flex items-center justify-between gap-2">
				<div className="flex items-center gap-1.5 text-[11px] tracking-wide text-muted-foreground uppercase">
					<FiDroplet size={12} />
					Water
				</div>
				<div className="text-sm tabular-nums">
					<span className="font-semibold">{litres(waterMl)}</span>
					<span className="text-muted-foreground"> / {litres(targetMl)} L</span>
				</div>
			</div>

			<div
				className="mt-2 h-2 overflow-hidden rounded-full bg-secondary"
				role="progressbar"
				aria-valuenow={waterMl}
				aria-valuemin={0}
				aria-valuemax={targetMl}
				aria-label="Water against target"
			>
				<div
					className="h-full rounded-full transition-[width]"
					style={{
						width: `${Math.min(100, targetMl > 0 ? (waterMl / targetMl) * 100 : 0)}%`,
						backgroundColor: "var(--viz-1)",
					}}
				/>
			</div>

			<div className="mt-2.5 flex gap-1.5">
				<button
					type="button"
					onClick={() => add(-GLASS_ML)}
					disabled={waterMl === 0}
					aria-label="Remove a glass of water"
					className="h-9 flex-1 rounded-lg border border-border text-sm active:scale-95 disabled:opacity-40"
				>
					−
				</button>
				<button
					type="button"
					onClick={() => add(GLASS_ML)}
					aria-label="Add a glass of water"
					className="h-9 flex-1 rounded-lg border border-border text-sm active:scale-95"
				>
					+
				</button>
			</div>
		</div>
	);
};

/** Litres, trimmed: 2 L rather than 2.00 L, 1.75 L rather than 1.8 L. */
const litres = (ml: number) => (ml / 1000).toFixed(2).replace(/\.?0+$/, "");
