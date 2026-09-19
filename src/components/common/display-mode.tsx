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
 *
 * It also keeps `--app-height` in sync with `visualViewport.height`. On a cold
 * launch from the home screen, WebKit briefly reports `100dvh`/`inset:0` (and
 * `env(safe-area-inset-bottom)`) as if the home indicator strip weren't there,
 * which is what left the bottom bar floating above it — the value only
 * self-corrects after a later resize, e.g. from rotating the device. Reading
 * `visualViewport.height` instead, and re-reading it a beat after mount, gets
 * the real number without waiting on the user to trigger a resize.
 */
const setAppHeight = () => {
	const height = window.visualViewport?.height ?? window.innerHeight;
	document.documentElement.style.setProperty("--app-height", `${height}px`);
};

export const DisplayModeSync = () => {
	useEffect(() => {
		const apply = () => {
			const info = readDisplayInfo();
			const root = document.documentElement;
			root.dataset.standalone = String(info.standalone);

			// Deliberately NOT gated on `info.standalone`: iOS does not reliably
			// report that an app was launched from the home screen, and gating on
			// it means a bad detection silently disables the correction. The
			// measurement stands on its own in every case:
			//   installed, inset by iOS  -> reserved ~93, env() would double  -> drop ours
			//   installed, full screen   -> reserved 0,  env() is ours to add -> keep
			//   browser, toolbars shown  -> reserved big, but env() reports 0  -> no-op
			//   browser, toolbars hidden -> reserved ~0, env() is ours to add -> keep
			root.dataset.osReserved = String(info.reserved > 8);
		};

		apply();
		setAppHeight();
		// WebKit's initial figure is sometimes stale; a follow-up read after the
		// first paint catches the corrected value without needing user input.
		const retry = window.setTimeout(setAppHeight, 300);

		window.addEventListener("orientationchange", apply);
		window.addEventListener("resize", setAppHeight);
		window.visualViewport?.addEventListener("resize", setAppHeight);

		return () => {
			window.clearTimeout(retry);
			window.removeEventListener("orientationchange", apply);
			window.removeEventListener("resize", setAppHeight);
			window.visualViewport?.removeEventListener("resize", setAppHeight);
		};
	}, []);

	return null;
};
