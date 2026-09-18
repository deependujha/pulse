"use client";

import { useEffect, useRef } from "react";
import { FiCalendar } from "react-icons/fi";
import { addDays, fromDayKey, todayKey, WEEKDAY_SHORT } from "@/lib/dates";
import { cn } from "@/lib/utils";

type Props = {
	value: string;
	onChange: (date: string) => void;
	/** How many past days to show. Future days beyond today are never offered. */
	past?: number;
};

/**
 * A horizontal day rail anchored on today. Replaces the old weekday picker:
 * you log against a real date, not "some Tuesday".
 */
export const DateStrip = ({ value, onChange, past = 30 }: Props) => {
	const activeRef = useRef<HTMLButtonElement>(null);
	const today = todayKey();
	const days = Array.from({ length: past + 1 }, (_, i) => addDays(today, i - past));

	useEffect(() => {
		activeRef.current?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
	}, [value]);

	return (
		<div className="flex items-center gap-2">
			<div className="no-scrollbar snap-rail -mx-1 flex-1 overflow-x-auto px-1">
				<div className="flex min-w-max gap-1.5 py-1">
					{days.map((day) => {
						const date = fromDayKey(day);
						const isActive = day === value;
						const isToday = day === today;

						return (
							<button
								key={day}
								ref={isActive ? activeRef : null}
								type="button"
								onClick={() => onChange(day)}
								aria-current={isActive ? "date" : undefined}
								className={cn(
									"flex h-14 w-12 shrink-0 flex-col items-center justify-center rounded-2xl border transition active:scale-95",
									isActive
										? "border-foreground bg-foreground text-background"
										: "border-border bg-card text-foreground",
								)}
							>
								<span
									className={cn(
										"text-[10px] tracking-wide uppercase",
										isActive ? "opacity-70" : "text-muted-foreground",
									)}
								>
									{WEEKDAY_SHORT[date.getDay()]}
								</span>
								<span className="text-base leading-tight font-semibold">{date.getDate()}</span>
								{isToday && (
									<span
										className={cn(
											"mt-0.5 size-1 rounded-full",
											isActive ? "bg-background" : "bg-foreground",
										)}
									/>
								)}
							</button>
						);
					})}
				</div>
			</div>

			{value !== today && (
				<button
					type="button"
					onClick={() => onChange(today)}
					className="flex h-14 shrink-0 items-center gap-1.5 rounded-2xl border border-border bg-card px-3 text-xs font-medium active:scale-95"
				>
					<FiCalendar size={14} />
					Today
				</button>
			)}
		</div>
	);
};
