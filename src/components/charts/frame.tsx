"use client";

import { useState } from "react";
import { FiList } from "react-icons/fi";
import { cn } from "@/lib/utils";

/** `line: true` draws a dashed rule instead of a swatch, for reference lines. */
export type LegendItem = { label: string; color: string; line?: boolean };

type Props = {
	title: string;
	caption?: string;
	/** A legend is shown whenever there are two or more series. */
	legend?: LegendItem[];
	/** The WCAG-clean twin: every charted value, readable as text. */
	table: { columns: string[]; rows: (string | number)[][] };
	children: React.ReactNode;
};

/**
 * Shared chart card. Owns the title, the legend, and the table-view twin so
 * no value is reachable only by hovering a mark.
 */
export const ChartFrame = ({ title, caption, legend, table, children }: Props) => {
	const [showTable, setShowTable] = useState(false);

	return (
		<section className="rounded-2xl border border-border bg-card p-4">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0">
					<h3 className="truncate text-sm font-semibold">{title}</h3>
					{caption && <p className="mt-0.5 text-xs text-muted-foreground">{caption}</p>}
				</div>
				<button
					type="button"
					onClick={() => setShowTable((v) => !v)}
					aria-pressed={showTable}
					aria-label={showTable ? "Show chart" : "Show values as a table"}
					className={cn(
						"grid size-8 shrink-0 place-items-center rounded-lg border border-border transition active:scale-95",
						showTable ? "bg-foreground text-background" : "bg-background text-muted-foreground",
					)}
				>
					<FiList size={15} />
				</button>
			</div>

			{legend && legend.length > 1 && (
				<ul className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
					{legend.map((item) => (
						<li key={item.label} className="flex items-center gap-1.5 text-xs text-muted-foreground">
							{item.line ? (
								<span
									aria-hidden="true"
									className="h-0 w-4 border-t-2 border-dashed"
									style={{ borderColor: item.color }}
								/>
							) : (
								<span
									aria-hidden="true"
									className="size-2.5 rounded-[3px]"
									style={{ backgroundColor: item.color }}
								/>
							)}
							{item.label}
						</li>
					))}
				</ul>
			)}

			<div className="mt-3">
				{showTable ? (
					<div className="scroll-y max-h-72">
						<table className="w-full text-sm tabular-nums">
							<thead className="sticky top-0 bg-card">
								<tr className="text-left text-xs text-muted-foreground">
									{table.columns.map((c) => (
										<th key={c} className="py-1.5 pr-3 font-medium">
											{c}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{table.rows.map((row, i) => (
									<tr key={i} className="border-t border-border">
										{row.map((cell, j) => (
											<td key={j} className="py-1.5 pr-3">
												{cell}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
						{table.rows.length === 0 && (
							<p className="py-6 text-center text-sm text-muted-foreground">Nothing logged yet.</p>
						)}
					</div>
				) : (
					children
				)}
			</div>
		</section>
	);
};

/** Shared Recharts tooltip body — same look everywhere, theme-aware. */
export const TooltipCard = ({
	title,
	rows,
}: {
	title: string;
	rows: { label: string; value: string; color?: string }[];
}) => (
	<div className="rounded-xl border border-border bg-popover px-3 py-2 text-xs shadow-lg">
		<div className="font-medium text-popover-foreground">{title}</div>
		<ul className="mt-1 space-y-0.5">
			{rows.map((row) => (
				<li key={row.label} className="flex items-center gap-2 text-muted-foreground">
					{row.color && (
						<span
							aria-hidden="true"
							className="size-2 rounded-full"
							style={{ backgroundColor: row.color }}
						/>
					)}
					<span>{row.label}</span>
					<span className="ml-auto font-medium text-popover-foreground tabular-nums">
						{row.value}
					</span>
				</li>
			))}
		</ul>
	</div>
);

export const AXIS_TICK = { fontSize: 10, fill: "var(--viz-axis)" } as const;
export const GRID_STROKE = "var(--viz-grid)";
