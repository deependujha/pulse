"use client";

import { useEffect, useId, useRef } from "react";
import { FiChevronLeft } from "react-icons/fi";
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
 * A full-screen modal on phones, a centred dialog from `sm` up.
 *
 * It replaced a bottom sheet, which on an installed iOS app had three problems
 * a phone can't work around:
 *
 *  - A sheet is anchored to the bottom of the *layout* viewport, which iOS does
 *    not shrink for the keyboard. Typing hid the fields and the save button
 *    behind the keyboard.
 *  - At 92vh there was barely any backdrop left to tap, and the close button at
 *    the top could sit above the visible area — hence "seems stuck".
 *  - A standalone PWA has no browser chrome, so there was no Back to fall back
 *    on, and iOS has no system back gesture for web views.
 *
 * So: the close affordance is a back arrow in the top-left where a thumb
 * expects it, the panel is sized from `visualViewport` so the keyboard can
 * never cover it, and opening pushes a history entry so Back — hardware,
 * gesture or browser — closes the screen instead of leaving the app.
 */
export const Screen = ({ open, onClose, title, subtitle, children, footer }: Props) => {
	const frameRef = useRef<HTMLDivElement>(null);
	const id = useId();

	// Call sites pass an inline arrow, so onClose is a new function every
	// render. Holding it in a ref keeps the effects below keyed on `open` alone.
	// The ref is written in an effect, not during render, and the listeners that
	// read it only ever fire in response to user input — long after paint.
	const onCloseRef = useRef(onClose);
	useEffect(() => {
		onCloseRef.current = onClose;
	});

	/* Back button / gesture closes the screen rather than leaving the app. */
	useEffect(() => {
		if (!open) return;

		// Next's App Router keeps its own routing data in history.state and reads
		// it back on popstate. Replacing that wholesale makes Back look like a
		// route change and remounts the page under the screen, so the marker is
		// added alongside it and the URL is kept exactly as it is.
		window.history.pushState(
			{ ...window.history.state, overlay: id },
			"",
			window.location.href,
		);

		// A popstate reaches every open screen, and screens nest (the library
		// manager opens an item editor). Whichever entry we landed on is the one
		// still standing, so a screen closes only when the new state isn't its
		// own — otherwise one Back would dismiss the whole stack at once.
		const onPop = () => {
			if (window.history.state?.overlay === id) return;
			onCloseRef.current();
		};
		window.addEventListener("popstate", onPop);

		return () => {
			window.removeEventListener("popstate", onPop);
			// Closed from the UI rather than by Back? Then our entry is still on
			// the stack and has to come off, or Back would replay this screen.
			if (window.history.state?.overlay === id) window.history.back();
		};
	}, [open, id]);

	/* Escape, and no scrolling the page behind the screen. */
	useEffect(() => {
		if (!open) return;

		const onKey = (e: KeyboardEvent) => {
			if (e.key === "Escape") onCloseRef.current();
		};
		document.addEventListener("keydown", onKey);

		const previous = document.body.style.overflow;
		document.body.style.overflow = "hidden";

		return () => {
			document.removeEventListener("keydown", onKey);
			document.body.style.overflow = previous;
		};
	}, [open]);

	/*
	 * Track the visual viewport, which is the part of the page the keyboard is
	 * not covering. On a desktop this matches the window and the whole thing is
	 * a no-op.
	 */
	useEffect(() => {
		if (!open) return;
		const vv = window.visualViewport;
		const frame = frameRef.current;
		if (!vv || !frame) return;

		const apply = () => {
			// The frame keeps covering the whole screen, so the page behind never
			// shows in the band beside the keyboard. Only the *content* is inset,
			// by however much of the screen the keyboard is sitting over.
			const covered = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
			frame.style.paddingTop = vv.offsetTop ? `${vv.offsetTop}px` : "";
			frame.style.paddingBottom = covered ? `${covered}px` : "";
		};

		apply();
		vv.addEventListener("resize", apply);
		vv.addEventListener("scroll", apply);
		return () => {
			vv.removeEventListener("resize", apply);
			vv.removeEventListener("scroll", apply);
			frame.style.paddingTop = "";
			frame.style.paddingBottom = "";
		};
	}, [open]);

	if (!open) return null;

	return (
		<div
			ref={frameRef}
			className={cn(
				"fixed inset-0 z-50 flex flex-col bg-background",
				"sm:items-center sm:justify-center sm:bg-transparent sm:p-6",
			)}
		>
			{/* Only reachable on desktop, where the dialog doesn't fill the frame. */}
			<button
				type="button"
				aria-label="Close"
				tabIndex={-1}
				onClick={onClose}
				className="absolute inset-0 hidden animate-fade-in bg-black/50 sm:block"
			/>

			<div
				role="dialog"
				aria-modal="true"
				aria-label={title}
				className={cn(
					"animate-screen-in relative flex min-h-0 w-full flex-1 flex-col bg-background",
					"sm:max-h-[85vh] sm:max-w-lg sm:flex-none sm:rounded-3xl sm:border sm:border-border sm:shadow-2xl",
				)}
			>
				<div className="safe-top flex shrink-0 items-center gap-2 border-b border-border px-2 py-2 sm:rounded-t-3xl sm:px-3">
					<button
						type="button"
						onClick={onClose}
						aria-label="Go back"
						className="-ml-0.5 flex min-h-11 shrink-0 items-center gap-0.5 rounded-xl pr-2 pl-1 text-muted-foreground active:scale-95"
					>
						<FiChevronLeft size={24} />
						<span className="text-sm font-medium sm:hidden">Back</span>
					</button>

					<div className="min-w-0 flex-1 text-center sm:text-left">
						<h2 className="truncate text-base font-semibold">{title}</h2>
						{subtitle && (
							<p className="truncate text-xs text-muted-foreground">{subtitle}</p>
						)}
					</div>

					{/* Balances the back button so the title stays optically centred. */}
					<span aria-hidden="true" className="w-12 shrink-0 sm:hidden" />
				</div>

				{/* The action scrolls with the content and sits right after it. Pinned
				    to its own row it landed under the keyboard, or level with the tab
				    bar, where it was hard to see and harder to hit. */}
				<div className="scroll-y min-h-0 flex-1 px-4 pt-3 sm:px-5">
					{children}
					{footer && <div className="mt-5">{footer}</div>}
					{/* Run-off past the last element, plus the home-indicator inset. */}
					<div className="safe-bottom pb-10" />
				</div>
			</div>
		</div>
	);
};
