"use client";

import { useEffect, useSyncExternalStore } from "react";

export type DisplayInfo = {
	standalone: boolean;
	navigatorStandalone: boolean | null;
	matchesStandaloneQuery: boolean;
	innerHeight: number;
	screenHeight: number;
	screenY: number;
	/** Space the OS reserved above the layout viewport. */
	reservedTop: number;
	/** Space the OS reserved below it. */
	reservedBottom: number;
	safeTop: number;
	safeBottom: number;
	/** What the shell actually measures, to catch it disagreeing with the screen. */
	shellHeight: number;
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

	// Where the web view sits on the screen tells us which edge the OS took.
	// Reading it per-edge matters: an installed iOS app can have the status bar
	// handled for it while still extending under the home indicator, and a
	// single "something was reserved" flag then wrongly drops both insets.
	const screenY = Math.max(0, Math.round(window.screenY || 0));
	const innerHeight = window.innerHeight;
	const screenHeight = window.screen.height;

	return {
		standalone: navigatorStandalone === true || matchesStandaloneQuery,
		navigatorStandalone,
		matchesStandaloneQuery,
		innerHeight,
		screenHeight,
		screenY,
		reservedTop: screenY,
		reservedBottom: Math.max(0, Math.round(screenHeight - screenY - innerHeight)),
		safeTop: measureEnv("top"),
		safeBottom: measureEnv("bottom"),
		shellHeight: Math.round(
			document.querySelector(".app-shell")?.getBoundingClientRect().height ?? 0,
		),
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
 * Reports viewport geometry for the temporary on-screen readout.
 *
 * This used to also correct the layout - measuring which edges the OS had
 * reserved and overriding the safe-area insets. None of that is needed now the
 * status bar style no longer asks for a full-screen viewport that iOS sizes
 * wrong; plain `env()` and `100dvh` are correct again. Delete this component
 * along with the readout.
 */
export const DisplayModeSync = () => {
	useEffect(() => {
		const invalidateOnRotate = () => {
			snapshot = null;
		};
		window.addEventListener("orientationchange", invalidateOnRotate);
		return () => window.removeEventListener("orientationchange", invalidateOnRotate);
	}, []);

	return null;
};
