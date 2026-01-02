import { IconType } from "react-icons";
import {
    FiHome,
    FiActivity,
    FiCoffee,
    FiDroplet,
    FiUser,
    FiBarChart2,
} from "react-icons/fi";

import { TodayTab } from "@/components/navigation_tabs/today/today_tab";
import { NutritionTab } from "./nutrition/nutrition_tab";
import { TrainingTab } from "./training/training_tab";
import { CareTab } from "./care/care_tab";
import { ProfileTab } from "./profile/profile_tab";
import { InsightsTab } from "./insights/insights_tab";

type TrackerTabConfig = {
    component: React.FC;
    icon: IconType;
    label: string;
};

export const TrackerTabMap: Record<string, TrackerTabConfig> = {
    today: {
        component: TodayTab,
        icon: FiHome,
        label: "Today",
    },
    training: {
        component: TrainingTab,
        icon: FiActivity, // movement, exercise, effort
        label: "Training",
    },
    nutrition: {
        component: NutritionTab,
        icon: FiCoffee, // intake / consumption (best available in Fi)
        label: "Nutrition",
    },
    care: {
        component: CareTab,
        icon: FiDroplet, // skincare / care / liquids
        label: "Care",
    },
    insight: {
        component: InsightsTab,
        icon: FiBarChart2, // skincare / care / liquids
        label: "Insights",
    },
    profile: {
        component: ProfileTab,
        icon: FiUser, // identity, settings-adjacent
        label: "Profile",
    },
};
