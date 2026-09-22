"use client";

import { useMemo, useState } from "react";
import { FiEdit2, FiPlus, FiSearch, FiStar, FiTrash2 } from "react-icons/fi";
import { toast } from "sonner";
import { Screen } from "@/components/common/screen";
import { GhostButton, TextInput } from "@/components/common/bits";
import { ItemEditor } from "./item_editor";
import { api, refreshAll, useAction } from "@/lib/api";
import type { LibraryItem } from "@/lib/types";

type Props = {
	open: boolean;
	onClose: () => void;
	library: LibraryItem[];
};

/** View, add, edit and remove everything you log by. */
export const LibraryManager = ({ open, onClose, library }: Props) => {
	const [query, setQuery] = useState("");
	const [editing, setEditing] = useState<LibraryItem | null>(null);
	const [editorOpen, setEditorOpen] = useState(false);
	const [confirmId, setConfirmId] = useState<string | null>(null);
	const { run } = useAction();

	const matches = useMemo(() => {
		const q = query.trim().toLowerCase();
		if (!q) return library;
		return library.filter((item) => item.name.toLowerCase().includes(q));
	}, [library, query]);

	const remove = async (item: LibraryItem) => {
		const result = await run(
			() => api.del(`/api/library/${item.id}`),
			(message) => toast.error(message),
		);
		if (!result) return;
		await refreshAll("/api/bootstrap", "/api/library");
		toast.success(`Removed ${item.name}`);
		setConfirmId(null);
	};

	const openEditor = (item: LibraryItem | null) => {
		setEditing(item);
		setEditorOpen(true);
	};

	return (
		<>
			{/* Adding and searching stay put: at the end of a long library you'd
			    otherwise have to scroll the whole list back up to reach either. */}
			<Screen
				open={open}
				onClose={onClose}
				title="Macros library"
				subtitle={`${library.length} ${library.length === 1 ? "item" : "items"}`}
				toolbar={
					<div className="space-y-3">
						<GhostButton
							className="flex w-full items-center justify-center gap-2"
							onClick={() => openEditor(null)}
						>
							<FiPlus size={16} />
							New item
						</GhostButton>

						{library.length > 6 && (
							<div className="relative">
								<FiSearch
									size={16}
									className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted-foreground"
								/>
								<TextInput
									value={query}
									onChange={(e) => setQuery(e.target.value)}
									placeholder="Search"
									className="pl-9"
								/>
							</div>
						)}
					</div>
				}
			>
				{library.length === 0 ? (
					<div className="space-y-3 rounded-2xl border border-dashed border-border px-4 py-10 text-center">
						<div className="text-3xl">📖</div>
						<p className="text-sm font-medium">Nothing here yet</p>
						<p className="mx-auto max-w-xs text-xs text-muted-foreground">
							Add the things you actually eat, in the portions you actually use. Logging is one
							tap after that.
						</p>
					</div>
				) : (
					<div className="space-y-3">
						<ul className="space-y-1.5">
							{matches.map((item) => (
								<li
									key={item.id}
									className="rounded-xl border border-border px-3 py-2.5"
								>
									<div className="flex items-center gap-3">
										<span className="text-lg">{item.emoji}</span>
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-1.5">
												<span className="truncate text-sm font-medium">{item.name}</span>
												{item.favorite && (
													<FiStar
														size={11}
														className="shrink-0 fill-current text-[var(--warning)]"
													/>
												)}
											</div>
											<div className="truncate text-xs text-muted-foreground">
												{item.calories} kcal · {item.servingLabel} · {item.proteinG}p{" "}
												{item.carbsG}c {item.fatG}f {item.fiberG}fib
											</div>
										</div>
										<button
											type="button"
											aria-label={`Edit ${item.name}`}
											onClick={() => openEditor(item)}
											className="grid size-9 shrink-0 place-items-center rounded-lg border border-border text-muted-foreground active:scale-95"
										>
											<FiEdit2 size={14} />
										</button>
										<button
											type="button"
											aria-label={`Remove ${item.name}`}
											onClick={() => setConfirmId(confirmId === item.id ? null : item.id)}
											aria-expanded={confirmId === item.id}
											className="grid size-9 shrink-0 place-items-center rounded-lg border border-border text-[var(--critical)] active:scale-95"
										>
											<FiTrash2 size={14} />
										</button>
									</div>

									{/* Confirm inline: a browser confirm() is easy to fat-finger past
									    on a phone, and this keeps the answer next to the question. */}
									{confirmId === item.id && (
										<div className="mt-2.5 flex items-center gap-2 border-t border-border pt-2.5">
											<p className="flex-1 text-xs text-muted-foreground">
												Remove it? Days you already logged keep their numbers.
											</p>
											<button
												type="button"
												onClick={() => setConfirmId(null)}
												className="h-9 rounded-lg border border-border px-3 text-sm active:scale-95"
											>
												Cancel
											</button>
											<button
												type="button"
												onClick={() => remove(item)}
												className="h-9 rounded-lg bg-[var(--critical)] px-3 text-sm font-medium text-white active:scale-95"
											>
												Remove
											</button>
										</div>
									)}
								</li>
							))}
						</ul>

						{matches.length === 0 && (
							<p className="py-6 text-center text-sm text-muted-foreground">
								Nothing matches &ldquo;{query}&rdquo;.
							</p>
						)}
					</div>
				)}
			</Screen>

			<ItemEditor open={editorOpen} onClose={() => setEditorOpen(false)} item={editing} />
		</>
	);
};
