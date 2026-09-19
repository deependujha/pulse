"use client";

import { useEffect, useSyncExternalStore } from "react";

export type DisplayInfo = {
	standalone: boolean;
	navigatorStandalone: boolean | null;
	matchesStandaloneQuery: boolean;
	innerHeight: number;
	screenHeight: number;
	/** Height the OS reserves outside the layout viewport (status bar + home indicator). */
	reserved: number;
	safeTop: number;
	safeBottom: number;
};

/** Renders a throwaway probe to read what `env()` actually resolves to. */
const measureEnv = (side: "top" | "bottom"): number => {
	const probe = document.createElement("div");
	probe.style.cssText = `position:fixed;left:0;width:0;visibility:hidden;height:env(safe-area-inset-${side})`;
	document.body.appendChild(probe);
	const value = probe.getBoundingClientRect().height;
	probe.remove();
	return Math.round(value);
};

export const readDisplayInfo = (): DisplayInfo => {
	const navigatorStandalone =
		typeof navigator !== "undefined" && "standalone" in navigator
			? ((navigator as Navigator & { standalone?: boolean }).standalone ?? null)
			: null;

	const matchesStandaloneQuery = window.matchMedia("(display-mode: standalone)").matches;

	return {
		standalone: navigatorStandalone === true || matchesStandaloneQuery,
		navigatorStandalone,
		matchesStandaloneQuery,
		innerHeight: window.innerHeight,
		screenHeight: window.screen.height,
		reserved: Math.max(0, Math.round(window.screen.height - window.innerHeight)),
		safeTop: measureEnv("top"),
		safeBottom: measureEnv("bottom"),
	};
};

/*
 * Cached because `readDisplayInfo` touches the DOM to measure `env()`, and a
 * `useSyncExternalStore` snapshot must be cheap and referentially stable.
 */
let snapshot: string | null = null;

const subscribe = (onChange: () => void) => {
	const invalidate = () => {
		snapshot = null;
		onChange();
	};
	window.addEventListener("orientationchange", invalidate);
	return () => window.removeEventListener("orientationchange", invalidate);
};

const getSnapshot = () => {
	if (snapshot === null) snapshot = JSON.stringify(readDisplayInfo());
	return snapshot;
};

/** Diagnostics for the Profile tab — what the device actually reports. */
export const useDisplayInfo = (): DisplayInfo | null => {
	const serialised = useSyncExternalStore(subscribe, getSnapshot, () => null);
	return serialised ? (JSON.parse(serialised) as DisplayInfo) : null;
};

/**
 * Marks the document when the app is running from the home screen.
 *
 * iOS reserves the home-indicator strip for an installed app but still reports
 * it through `env(safe-area-inset-bottom)`, so honouring the inset there lands
 * it on screen twice. `@media (display-mode: standalone)` is the obvious hook
 * but doesn't reliably match on iOS — `navigator.standalone` is the signal that
 * does, hence doing this from script rather than CSS alone.
 */
export const DisplayModeSync = () => {
	useEffect(() => {
		const apply = () => {
			const info = readDisplayInfo();
			const root = document.documentElement;
			root.dataset.standalone = String(info.standalone);
			// The OS having reserved space of its own is the thing that makes our
			// own inset a duplicate, so record that separately.
			root.dataset.osReserved = String(info.reserved > 8);
		};

		apply();
		window.addEventListener("orientationchange", apply);
		return () => window.removeEventListener("orientationchange", apply);
	}, []);

	return null;
};
