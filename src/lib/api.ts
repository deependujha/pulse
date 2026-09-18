"use client";

import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

/**
 * A deliberately tiny data layer: a module-level cache keyed by URL, plus a
 * subscription so every component showing the same key updates together.
 * Enough for a personal app; no reason to pull in a whole query library.
 */

type Entry = {
	data?: unknown;
	error?: string;
	loading: boolean;
	version: number;
};

const cache = new Map<string, Entry>();
const subscribers = new Map<string, Set<() => void>>();
const inFlight = new Map<string, Promise<void>>();

const EMPTY: Entry = { loading: true, version: 0 };

const notify = (key: string) => {
	subscribers.get(key)?.forEach((fn) => fn());
};

const setEntry = (key: string, patch: Partial<Entry>) => {
	const prev = cache.get(key) ?? EMPTY;
	cache.set(key, { ...prev, ...patch, version: prev.version + 1 });
	notify(key);
};

const request = async (url: string, init?: RequestInit) => {
	const res = await fetch(url, {
		...init,
		headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
	});

	const text = await res.text();
	const payload = text ? safeParse(text) : {};

	if (!res.ok) {
		const message =
			(payload as { error?: string })?.error ?? `Request failed (${res.status})`;
		throw new Error(message);
	}
	return payload;
};

const safeParse = (text: string): unknown => {
	try {
		return JSON.parse(text);
	} catch {
		return {};
	}
};

export const load = async (key: string): Promise<void> => {
	const existing = inFlight.get(key);
	if (existing) return existing;

	const promise = (async () => {
		setEntry(key, { loading: true, error: undefined });
		try {
			const data = await request(key);
			setEntry(key, { data, loading: false, error: undefined });
		} catch (error) {
			setEntry(key, {
				loading: false,
				error: error instanceof Error ? error.message : "Something went wrong",
			});
		} finally {
			inFlight.delete(key);
		}
	})();

	inFlight.set(key, promise);
	return promise;
};

/** Refetch one key. */
export const refresh = (key: string) => load(key);

/** Refetch every cached key whose URL starts with `prefix`. */
export const refreshAll = (...prefixes: string[]) => {
	const keys = [...cache.keys()].filter((key) => prefixes.some((p) => key.startsWith(p)));
	return Promise.all(keys.map((key) => load(key)));
};

/** Replace a key's cached value without a round-trip (optimistic updates). */
export const patchCache = <T>(key: string, updater: (prev: T | undefined) => T) => {
	const prev = cache.get(key)?.data as T | undefined;
	setEntry(key, { data: updater(prev), loading: false });
};

const subscribe = (key: string) => (onChange: () => void) => {
	let set = subscribers.get(key);
	if (!set) {
		set = new Set();
		subscribers.set(key, set);
	}
	set.add(onChange);
	return () => {
		set!.delete(onChange);
		if (set!.size === 0) subscribers.delete(key);
	};
};

const getSnapshot = (key: string) => () => cache.get(key) ?? EMPTY;

export type Resource<T> = {
	data: T | undefined;
	error: string | undefined;
	loading: boolean;
	reload: () => Promise<void>;
};

export const useResource = <T>(key: string | null): Resource<T> => {
	const safeKey = key ?? "__idle__";
	const entry = useSyncExternalStore(
		subscribe(safeKey),
		getSnapshot(safeKey),
		() => EMPTY,
	);

	useEffect(() => {
		if (!key) return;
		if (!cache.has(key)) void load(key);
	}, [key]);

	const reload = useCallback(async () => {
		if (key) await load(key);
	}, [key]);

	return {
		data: entry.data as T | undefined,
		error: entry.error,
		loading: key ? entry.loading && entry.data === undefined : false,
		reload,
	};
};

export const api = {
	get: (url: string) => request(url),
	post: (url: string, body: unknown) =>
		request(url, { method: "POST", body: JSON.stringify(body) }),
	put: (url: string, body: unknown) =>
		request(url, { method: "PUT", body: JSON.stringify(body) }),
	patch: (url: string, body: unknown) =>
		request(url, { method: "PATCH", body: JSON.stringify(body) }),
	del: (url: string) => request(url, { method: "DELETE" }),
};

/** Small helper for buttons that fire a request and need a pending state. */
export const useAction = () => {
	const [pending, setPending] = useState(false);

	const run = useCallback(
		async <T>(fn: () => Promise<T>, onError?: (message: string) => void): Promise<T | null> => {
			setPending(true);
			try {
				return await fn();
			} catch (error) {
				onError?.(error instanceof Error ? error.message : "Something went wrong");
				return null;
			} finally {
				setPending(false);
			}
		},
		[],
	);

	return { pending, run };
};
