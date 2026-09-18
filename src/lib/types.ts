/** Shapes returned by the pulse API, mirrored on the client. */

export type Profile = {
	id: string;
	name: string | null;
	email: string;
	image: string | null;
	calorieTarget: number;
	proteinTarget: number;
	heightCm: number | null;
	goalWeightKg: number | null;
	createdAt: string;
};

export type Exercise = {
	id: string;
	name: string;
	muscleGroup: string;
	youtubeUrl: string | null;
	imageUrl: string | null;
	gifUrl: string | null;
	notes: string | null;
	defaultSets: number;
	defaultReps: string;
};

export type RoutineItem = {
	id: string;
	exerciseId: string;
	position: number;
	sets: number;
	reps: string;
	note: string | null;
	exercise: Exercise;
};

export type Routine = {
	id: string;
	name: string;
	focus: string | null;
	color: string;
	emoji: string;
	notes: string | null;
	items: RoutineItem[];
};

export type ScheduleSlot = { weekday: number; routineId: string | null };

export type SetLog = {
	id: string;
	date: string;
	routineId: string | null;
	exerciseId: string | null;
	exerciseName: string;
	setIndex: number;
	reps: number | null;
	weightKg: number | null;
};

export type Food = {
	id: string;
	name: string;
	emoji: string;
	servingLabel: string;
	calories: number;
	proteinG: number;
	carbsG: number;
	fatG: number;
	category: string;
	favorite: boolean;
};

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export type MealEntry = {
	id: string;
	date: string;
	foodId: string | null;
	name: string;
	emoji: string;
	meal: MealType;
	servings: number;
	calories: number;
	proteinG: number;
	carbsG: number;
	fatG: number;
	createdAt: string;
};

export type CareStep = {
	id: string;
	name: string;
	note: string | null;
	product: string | null;
	phase: "AM" | "PM";
	emoji: string;
	frequency: "EVERY_DAY" | "ALTERNATE" | "WEEKDAYS";
	weekdays: number[];
	position: number;
};

export type DailyMetric = {
	date: string;
	weightKg: number | null;
	waterMl: number;
	sleepHours: number | null;
	note: string | null;
};

export type Bootstrap = {
	profile: Profile;
	exercises: Exercise[];
	routines: Routine[];
	schedule: ScheduleSlot[];
	foods: Food[];
	careSteps: CareStep[];
};

export type WorkoutDay = {
	date: string;
	routine: Routine | null;
	scheduledRoutineId: string | null;
	logs: SetLog[];
	lastPerformance: Record<string, { date: string; reps: number | null; weightKg: number | null }>;
};

export type InsightDay = {
	date: string;
	calories: number;
	proteinG: number;
	carbsG: number;
	fatG: number;
	meals: number;
	sets: number;
	volumeKg: number;
	careDone: number;
	careTotal: number;
	weightKg: number | null;
};

export type Insights = {
	days: number;
	calorieTarget: number;
	proteinTarget: number;
	goalWeightKg: number | null;
	series: InsightDay[];
	deficitSeries: { date: string; cumulativeDeficit: number; dailyDeficit: number }[];
	summary: {
		avgCalories: number;
		avgProtein: number;
		totalCalories: number;
		loggedDays: number;
		workoutDays: number;
		totalSets: number;
		totalVolumeKg: number;
		cumulativeDeficit: number;
		estimatedFatKg: number;
		careAdherence: number;
		startWeightKg: number | null;
		currentWeightKg: number | null;
		workoutStreak: number;
		careStreak: number;
		logStreak: number;
	};
	topFoods: { name: string; count: number; calories: number }[];
	topExercises: { name: string; sets: number }[];
};

export const MUSCLE_GROUPS = [
	"Chest",
	"Back",
	"Legs",
	"Shoulders",
	"Arms",
	"Core",
	"Cardio",
	"Mobility",
	"Other",
] as const;

export const FOOD_CATEGORIES = [
	"Breakfast",
	"Lunch",
	"Dinner",
	"Snack",
	"Drink",
	"Protein",
	"Other",
] as const;

export const MEAL_TYPES: { id: MealType; label: string; emoji: string }[] = [
	{ id: "breakfast", label: "Breakfast", emoji: "🌅" },
	{ id: "lunch", label: "Lunch", emoji: "🍲" },
	{ id: "dinner", label: "Dinner", emoji: "🌙" },
	{ id: "snack", label: "Snack", emoji: "🍿" },
];
