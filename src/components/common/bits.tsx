"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export const SectionTitle = ({
	title,
	caption,
	action,
}: {
	title: string;
	caption?: string;
	action?: React.ReactNode;
}) => (
	<div className="mb-3 flex items-end justify-between gap-3">
		<div className="min-w-0">
			<h2 className="truncate text-base font-semibold">{title}</h2>
			{caption && <p className="truncate text-xs text-muted-foreground">{caption}</p>}
		</div>
		{action}
	</div>
);

export const Chip = ({
	active,
	children,
	className,
	...props
}: React.ComponentProps<"button"> & { active?: boolean }) => (
	<button
		type="button"
		className={cn(
			"shrink-0 rounded-full border px-3.5 py-2 text-sm font-medium whitespace-nowrap transition active:scale-95",
			active
				? "border-foreground bg-foreground text-background"
				: "border-border bg-card text-muted-foreground",
			className,
		)}
		{...props}
	>
		{children}
	</button>
);

export const SegmentedControl = <T extends string>({
	options,
	value,
	onChange,
}: {
	options: { id: T; label: string }[];
	value: T;
	onChange: (id: T) => void;
}) => (
	<div
		role="tablist"
		className="flex gap-1 rounded-xl bg-secondary p-1"
	>
		{options.map((option) => {
			const active = option.id === value;
			return (
				<button
					key={option.id}
					role="tab"
					type="button"
					aria-selected={active}
					onClick={() => onChange(option.id)}
					className={cn(
						"flex-1 rounded-lg px-3 py-2 text-sm font-medium transition",
						active
							? "bg-background text-foreground shadow-sm"
							: "text-muted-foreground",
					)}
				>
					{option.label}
				</button>
			);
		})}
	</div>
);

export const EmptyState = ({
	emoji,
	title,
	body,
	action,
}: {
	emoji: string;
	title: string;
	body?: string;
	action?: React.ReactNode;
}) => (
	<div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border px-6 py-10 text-center">
		<span className="text-3xl" aria-hidden="true">
			{emoji}
		</span>
		<p className="mt-3 font-medium">{title}</p>
		{body && <p className="mt-1 max-w-xs text-sm text-muted-foreground">{body}</p>}
		{action && <div className="mt-4">{action}</div>}
	</div>
);

/** A single headline number. The number *is* the chart — no plot needed. */
export const Stat = ({
	label,
	value,
	sub,
	tone = "default",
}: {
	label: string;
	value: string;
	sub?: string;
	tone?: "default" | "good" | "warning" | "critical";
}) => (
	<div className="rounded-2xl border border-border bg-card px-3 py-3">
		<div className="text-[11px] tracking-wide text-muted-foreground uppercase">{label}</div>
		<div
			className={cn(
				"mt-1 text-xl leading-tight font-semibold",
				tone === "good" && "text-[var(--good)]",
				tone === "warning" && "text-[var(--warning)]",
				tone === "critical" && "text-[var(--critical)]",
			)}
		>
			{value}
		</div>
		{sub && <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div>}
	</div>
);

export const Spinner = ({ label = "Loading" }: { label?: string }) => (
	<div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
		<span className="size-4 animate-spin rounded-full border-2 border-border border-t-foreground" />
		{label}
	</div>
);

export const Labelled = ({
	label,
	hint,
	children,
}: {
	label: string;
	hint?: string;
	children: React.ReactNode;
}) => (
	<label className="block">
		<span className="mb-1.5 block text-sm font-medium">{label}</span>
		{children}
		{hint && <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>}
	</label>
);

/**
 * iOS decides whether to offer "AutoFill Contact" from the field's name and id
 * and the label text around it — a field called `name` next to the word "Name"
 * looks exactly like a person's name. These are all app data, never the user's
 * own details, so every input gets a meaningless generated name and id and opts
 * out of autofill, autocorrect and the password managers.
 */
const noAutofill = (id: string) => ({
	autoComplete: "off",
	autoCorrect: "off",
	name: id,
	id,
	"data-1p-ignore": true,
	"data-lpignore": "true",
	"data-form-type": "other",
});

export const TextInput = ({ className, ...props }: React.ComponentProps<"input">) => {
	const generated = useId();
	return (
		<input
			{...noAutofill(generated)}
			className={cn(
				"h-11 w-full rounded-xl border border-border bg-background px-3 text-base",
				"outline-none placeholder:text-muted-foreground focus:border-foreground",
				className,
			)}
			{...props}
		/>
	);
};

export const TextArea = ({ className, ...props }: React.ComponentProps<"textarea">) => {
	const generated = useId();
	return (
		<textarea
			{...noAutofill(generated)}
			className={cn(
				"w-full rounded-xl border border-border bg-background px-3 py-2.5 text-base",
				"outline-none placeholder:text-muted-foreground focus:border-foreground",
				className,
			)}
			{...props}
		/>
	);
};

export const Select = ({ className, children, ...props }: React.ComponentProps<"select">) => (
	<select
		className={cn(
			"h-11 w-full appearance-none rounded-xl border border-border bg-background px-3 text-base",
			"outline-none focus:border-foreground",
			className,
		)}
		{...props}
	>
		{children}
	</select>
);

export const PrimaryButton = ({
	className,
	children,
	...props
}: React.ComponentProps<"button">) => (
	<button
		type="button"
		className={cn(
			"h-12 w-full rounded-xl bg-foreground text-base font-medium text-background",
			"transition active:scale-[0.99] disabled:opacity-50",
			className,
		)}
		{...props}
	>
		{children}
	</button>
);

export const GhostButton = ({
	className,
	children,
	...props
}: React.ComponentProps<"button">) => (
	<button
		type="button"
		className={cn(
			"h-11 rounded-xl border border-border bg-card px-4 text-sm font-medium",
			"transition active:scale-[0.99] disabled:opacity-50",
			className,
		)}
		{...props}
	>
		{children}
	</button>
);
