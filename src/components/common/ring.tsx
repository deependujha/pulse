"use client";

/**
 * A single progress ring. The number in the middle is the headline — the ring
 * is the context, which is why the figure uses proportional (not tabular) digits.
 */
type RingProps = {
	value: number;
	max: number;
	size?: number;
	stroke?: number;
	color: string;
	label: string;
	caption?: string;
	/** When the goal is a ceiling (calories), going over should read as a warning. */
	overIsBad?: boolean;
};

export const Ring = ({
	value,
	max,
	size = 132,
	stroke = 11,
	color,
	label,
	caption,
	overIsBad = false,
}: RingProps) => {
	const safeMax = max > 0 ? max : 1;
	const ratio = value / safeMax;
	const clamped = Math.min(1, Math.max(0, ratio));
	const radius = (size - stroke) / 2;
	const circumference = 2 * Math.PI * radius;
	const over = overIsBad && ratio > 1;
	const strokeColor = over ? "var(--critical)" : color;

	return (
		<div className="flex flex-col items-center">
			<div className="relative" style={{ width: size, height: size }}>
				<svg width={size} height={size} className="-rotate-90" aria-hidden="true">
					<circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						fill="none"
						stroke="var(--viz-grid)"
						strokeWidth={stroke}
					/>
					<circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						fill="none"
						stroke={strokeColor}
						strokeWidth={stroke}
						strokeLinecap="round"
						strokeDasharray={circumference}
						strokeDashoffset={circumference * (1 - clamped)}
						style={{ transition: "stroke-dashoffset 500ms cubic-bezier(0.32,0.72,0,1)" }}
					/>
				</svg>

				<div className="absolute inset-0 flex flex-col items-center justify-center">
					<span className="text-2xl leading-none font-semibold">
						{Math.round(value).toLocaleString()}
					</span>
					<span className="mt-1 text-xs text-muted-foreground">
						of {Math.round(max).toLocaleString()}
					</span>
				</div>
			</div>

			<div className="mt-2 text-center">
				<div className="text-sm font-medium">{label}</div>
				{caption && <div className="text-xs text-muted-foreground">{caption}</div>}
			</div>
		</div>
	);
};

/** Compact variant used in rows of three or more. */
export const MiniRing = ({
	value,
	max,
	color,
	label,
	display,
}: {
	value: number;
	max: number;
	color: string;
	label: string;
	display: string;
}) => {
	const size = 62;
	const stroke = 6;
	const radius = (size - stroke) / 2;
	const circumference = 2 * Math.PI * radius;
	const clamped = Math.min(1, Math.max(0, max > 0 ? value / max : 0));

	return (
		<div className="flex flex-col items-center gap-1.5">
			<div className="relative" style={{ width: size, height: size }}>
				<svg width={size} height={size} className="-rotate-90" aria-hidden="true">
					<circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						fill="none"
						stroke="var(--viz-grid)"
						strokeWidth={stroke}
					/>
					<circle
						cx={size / 2}
						cy={size / 2}
						r={radius}
						fill="none"
						stroke={color}
						strokeWidth={stroke}
						strokeLinecap="round"
						strokeDasharray={circumference}
						strokeDashoffset={circumference * (1 - clamped)}
						style={{ transition: "stroke-dashoffset 500ms cubic-bezier(0.32,0.72,0,1)" }}
					/>
				</svg>
				<div className="absolute inset-0 grid place-items-center text-sm font-semibold">
					{display}
				</div>
			</div>
			<span className="text-[11px] text-muted-foreground">{label}</span>
		</div>
	);
};
