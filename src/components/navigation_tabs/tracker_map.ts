import { IconType } from "react-icons";
import { FiActivity, FiBarChart2, FiDroplet, FiHome, FiPieChart } from "react-icons/fi";

import { TodayTab } from "@/components/navigation_tabs/today/today_tab";
import { CareTab } from "./care/care_tab";
import { InsightsTab } from "./insights/insights_tab";
import { NutritionTab } from "./nutrition/nutrition_tab";
import { WorkoutTab } from "./workout/workout_tab";

export type TabProps = {
	date: string;
	onDateChange: (date: string) => void;
	/** Lets the Today summary jump straight to the tab that owns a thing. */
	onNavigate: (tab: TabId) => void;
};

type TrackerTabConfig = {
	component: React.FC<TabProps>;
	icon: IconType;
	label: string;
	/** Drives the tab's accent colour token. */
	accent: string;
};

/** The five bottom-bar destinations. Profile hangs off the header avatar. */
export const TrackerTabMap = {
	today: { component: TodayTab, icon: FiHome, label: "Today", accent: "var(--foreground)" },
	workout: {
		component: WorkoutTab,
		icon: FiActivity,
		label: "Workout",
		accent: "var(--accent-workout)",
	},
	nutrition: {
		component: NutritionTab,
		icon: FiPieChart,
		label: "Food",
		accent: "var(--accent-food)",
	},
	care: { component: CareTab, icon: FiDroplet, label: "Care", accent: "var(--accent-care)" },
	insight: {
		component: InsightsTab,
		icon: FiBarChart2,
		label: "Insights",
		accent: "var(--accent-insight)",
	},
} satisfies Record<string, TrackerTabConfig>;

export type TabId = keyof typeof TrackerTabMap;
