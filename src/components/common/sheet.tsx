"use client";

import { useEffect, useRef } from "react";
import { FiX } from "react-icons/fi";
import { cn } from "@/lib/utils";

type Props = {
	open: boolean;
	onClose: () => void;
	title: string;
	subtitle?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
};

/**
 * A bottom sheet — the shape iOS users expect for "add / edit one thing".
 * Capped at 92vh so the grabber and title never scroll out of reach.
 */
export const Sheet = ({ open, onClose, title, subtitle, children, footer }: Props) => {
	const panelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;

		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		document.addEventListener("keydown", onKey);

		// Stop the page behind the sheet from scrolling with it.
		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = previous;
		};
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div className="fixed inset-0 z-50 flex items-end justify-center">
			<button
				type="button"
				aria-label="Close"
				onClick={onClose}
				className="absolute inset-0 animate-fade-in bg-black/40"
			/>

			<div
				ref={panelRef}
				role="dialog"
				aria-modal="true"
				aria-label={title}
				className={cn(
					"animate-sheet-in relative flex max-h-[92vh] w-full max-w-lg flex-col",
					"rounded-t-3xl border border-b-0 border-border bg-background shadow-2xl",
				)}
			>
				<div className="flex justify-center pt-2.5 pb-1">
					<span className="h-1 w-10 rounded-full bg-muted-foreground/30" />
				</div>

				<div className="flex items-start gap-3 px-5 pb-3">
					<div className="min-w-0 flex-1">
						<h2 className="truncate text-lg font-semibold">{title}</h2>
						{subtitle && (
							<p className="mt-0.5 truncate text-sm text-muted-foreground">{subtitle}</p>
						)}
					</div>
					<button
						type="button"
						onClick={onClose}
						aria-label="Close"
						className="grid size-9 shrink-0 place-items-center rounded-full bg-secondary text-secondary-foreground active:scale-95"
					>
						<FiX size={18} />
					</button>
				</div>

				<div className="scroll-y flex-1 px-5 pb-2">{children}</div>

				{footer && (
					<div className="safe-bottom border-t border-border px-5 pt-3 pb-3">{footer}</div>
				)}
				{!footer && <div className="safe-bottom pb-2" />}
			</div>
		</div>
	);
};
