"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { FiUser } from "react-icons/fi";
import { ProfileTab } from "@/components/navigation_tabs/profile/profile_tab";
import { TrackerTabMap, type TabId } from "@/components/navigation_tabs/tracker_map";
import { formatRelative, formatShort, todayKey } from "@/lib/dates";
import { cn } from "@/lib/utils";

const TAB_IDS = Object.keys(TrackerTabMap) as TabId[];

export const TrackerPage = () => {
	const { data: session } = useSession();
	const [activeTab, setActiveTab] = useState<TabId>("today");
	const [showProfile, setShowProfile] = useState(false);

	// One selected day for the whole app: switch to yesterday in Food and Care
	// stays on yesterday too.
	const [date, setDate] = useState(todayKey());

	const { component: ActiveComponent, label } = TrackerTabMap[activeTab];
	const isToday = date === todayKey();

	return (
		<div
			className="fixed inset-x-0 top-0 flex flex-col bg-background text-foreground"
			style={{ height: "100dvh" }}
		>
			<header className="glass safe-top z-30 shrink-0 border-b border-border">
				<div className="mx-auto flex h-14 w-full max-w-lg items-center gap-3 px-4">
					<img src="/logo.svg" alt="" className="size-7" aria-hidden="true" />
					<div className="min-w-0 flex-1">
						<div className="truncate text-sm font-semibold">
							{showProfile ? "Profile" : label}
						</div>
						{!showProfile && (
							<div
								className={cn(
									"truncate text-xs",
									isToday ? "text-muted-foreground" : "font-medium text-warning",
								)}
							>
								{isToday ? formatShort(date) : formatRelative(date)}
							</div>
						)}
					</div>

					<button
						type="button"
						onClick={() => setShowProfile((v) => !v)}
						aria-label={showProfile ? "Close profile" : "Open profile"}
						className={cn(
							"size-9 shrink-0 overflow-hidden rounded-full border transition active:scale-95",
							showProfile ? "border-foreground" : "border-border",
						)}
					>
						{session?.user?.image ? (
							<img
								src={session.user.image}
								alt=""
								className="size-full object-cover"
								referrerPolicy="no-referrer"
							/>
						) : (
							<span className="grid size-full place-items-center bg-secondary">
								<FiUser size={16} />
							</span>
						)}
					</button>
				</div>
			</header>

			<main className="scroll-y flex-1">
				<div className="mx-auto w-full max-w-lg px-4 pt-4 pb-6">
					{showProfile ? (
						<ProfileTab />
					) : (
						<ActiveComponent date={date} onDateChange={setDate} onNavigate={setActiveTab} />
					)}
				</div>
			</main>

			<nav
				aria-label="Sections"
				className="glass z-30 shrink-0 border-t border-border"
			>
				<div className="mx-auto flex w-full max-w-lg items-stretch justify-around px-2 pt-1.5">
					{TAB_IDS.map((tab) => {
						const { icon: Icon, label: tabLabel, accent } = TrackerTabMap[tab];
						const isActive = !showProfile && activeTab === tab;

						return (
							<button
								key={tab}
								type="button"
								aria-current={isActive ? "page" : undefined}
								onClick={() => {
									setShowProfile(false);
									setActiveTab(tab);
								}}
								className="flex min-h-12 flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1 transition active:scale-95"
							>
								<Icon
									size={20}
									style={{ color: isActive ? accent : undefined }}
									className={isActive ? undefined : "text-muted-foreground"}
								/>
								<span
									style={{ color: isActive ? accent : undefined }}
									className={cn(
										"text-[10px]",
										isActive ? "font-semibold" : "text-muted-foreground",
									)}
								>
									{tabLabel}
								</span>
							</button>
						);
					})}
				</div>
			</nav>
		</div>
	);
};
