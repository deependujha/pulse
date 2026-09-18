/**
 * Starter content copied into a user's own library on first login.
 * After that it is fully theirs — every row is editable or deletable.
 */

export type SeedExercise = {
	name: string;
	muscleGroup: string;
	defaultSets: number;
	defaultReps: string;
	notes?: string;
};

/**
 * Demo links point at a YouTube search rather than a specific video id:
 * searches never rot, and the user can paste an exact video whenever they
 * find one they like.
 */
export const youtubeSearchUrl = (name: string): string =>
	`https://www.youtube.com/results?search_query=${encodeURIComponent(`${name} proper form`)}`;

export const SEED_EXERCISES: SeedExercise[] = [
	// Back
	{ name: "Deadlift", muscleGroup: "Back", defaultSets: 3, defaultReps: "5" },
	{ name: "Lat Pulldown", muscleGroup: "Back", defaultSets: 3, defaultReps: "8-12" },
	{ name: "Chest-Supported Dumbbell Row", muscleGroup: "Back", defaultSets: 3, defaultReps: "10-12" },
	{ name: "Straight Arm Pulldown", muscleGroup: "Back", defaultSets: 2, defaultReps: "12-15" },
	{ name: "Face Pull", muscleGroup: "Back", defaultSets: 3, defaultReps: "15-20" },
	{ name: "Dead Hang", muscleGroup: "Mobility", defaultSets: 3, defaultReps: "30-60 sec", notes: "Decompresses the spine. Relax the shoulders." },
	{ name: "Barbell Shrugs", muscleGroup: "Back", defaultSets: 3, defaultReps: "10-15" },

	// Chest
	{ name: "Incline Bench Press", muscleGroup: "Chest", defaultSets: 3, defaultReps: "6-8" },
	{ name: "Dumbbell Press", muscleGroup: "Chest", defaultSets: 3, defaultReps: "8-12" },
	{ name: "Machine Fly", muscleGroup: "Chest", defaultSets: 3, defaultReps: "12-15" },
	{ name: "Push-ups", muscleGroup: "Chest", defaultSets: 2, defaultReps: "To failure" },

	// Legs
	{ name: "Barbell Back Squat", muscleGroup: "Legs", defaultSets: 4, defaultReps: "5" },
	{ name: "Romanian Deadlift", muscleGroup: "Legs", defaultSets: 3, defaultReps: "8-10" },
	{ name: "Leg Press", muscleGroup: "Legs", defaultSets: 3, defaultReps: "10-15" },
	{ name: "Leg Curl", muscleGroup: "Legs", defaultSets: 3, defaultReps: "12-15" },
	{ name: "Standing Calf Raise", muscleGroup: "Legs", defaultSets: 4, defaultReps: "12-20" },

	// Shoulders
	{ name: "Overhead Press", muscleGroup: "Shoulders", defaultSets: 3, defaultReps: "5-8" },
	{ name: "Lateral Raise", muscleGroup: "Shoulders", defaultSets: 4, defaultReps: "12-15" },
	{ name: "Rear Delt Fly", muscleGroup: "Shoulders", defaultSets: 4, defaultReps: "12-15" },

	// Arms
	{ name: "EZ Bar Curl", muscleGroup: "Arms", defaultSets: 3, defaultReps: "8-12" },
	{ name: "Incline Dumbbell Curl", muscleGroup: "Arms", defaultSets: 3, defaultReps: "10-12" },
	{ name: "Tricep Pushdown", muscleGroup: "Arms", defaultSets: 3, defaultReps: "8-12" },
	{ name: "Overhead Tricep Extension", muscleGroup: "Arms", defaultSets: 3, defaultReps: "10-12" },

	// Core
	{ name: "Hanging Leg Raise", muscleGroup: "Core", defaultSets: 3, defaultReps: "10-15" },
	{ name: "Plank", muscleGroup: "Core", defaultSets: 3, defaultReps: "45-60 sec" },
	{ name: "Cable Crunch", muscleGroup: "Core", defaultSets: 3, defaultReps: "10-15" },

	// Cardio + mobility
	{ name: "Incline Walk", muscleGroup: "Cardio", defaultSets: 1, defaultReps: "15-20 min" },
	{ name: "Brisk Walk / Treadmill", muscleGroup: "Cardio", defaultSets: 1, defaultReps: "30-40 min" },
	{ name: "Cat-Cow", muscleGroup: "Mobility", defaultSets: 2, defaultReps: "8-10" },
	{ name: "Doorway Chest Stretch", muscleGroup: "Mobility", defaultSets: 2, defaultReps: "30-45 sec" },
	{ name: "Kneeling Hip Flexor Stretch", muscleGroup: "Mobility", defaultSets: 2, defaultReps: "30 sec / side" },
	{ name: "Seated Hamstring Stretch", muscleGroup: "Mobility", defaultSets: 2, defaultReps: "30 sec / side" },
	{ name: "Chin Tucks", muscleGroup: "Mobility", defaultSets: 2, defaultReps: "10 slow" },
];

export type SeedRoutine = {
	name: string;
	focus: string;
	color: string;
	emoji: string;
	/** weekday indices this routine is scheduled on (0 = Sunday) */
	weekdays: number[];
	exercises: string[];
};

export const SEED_ROUTINES: SeedRoutine[] = [
	{
		name: "Pull Day",
		focus: "Back + Posture",
		color: "#6366f1",
		emoji: "🎣",
		weekdays: [1],
		exercises: [
			"Deadlift",
			"Lat Pulldown",
			"Chest-Supported Dumbbell Row",
			"Incline Dumbbell Curl",
			"Straight Arm Pulldown",
			"Face Pull",
			"Dead Hang",
		],
	},
	{
		name: "Push Day",
		focus: "Chest + Core",
		color: "#ef4444",
		emoji: "💥",
		weekdays: [2],
		exercises: [
			"Incline Bench Press",
			"Dumbbell Press",
			"Machine Fly",
			"Push-ups",
			"Hanging Leg Raise",
			"Plank",
		],
	},
	{
		name: "Leg Day",
		focus: "Quads, hamstrings, calves",
		color: "#f59e0b",
		emoji: "🦵",
		weekdays: [3],
		exercises: [
			"Barbell Back Squat",
			"Romanian Deadlift",
			"Leg Press",
			"Leg Curl",
			"Standing Calf Raise",
		],
	},
	{
		name: "Shoulders",
		focus: "Shoulders + Upper Back",
		color: "#06b6d4",
		emoji: "🏔️",
		weekdays: [4],
		exercises: [
			"Overhead Press",
			"Lateral Raise",
			"Rear Delt Fly",
			"Barbell Shrugs",
			"Cable Crunch",
		],
	},
	{
		name: "Arms",
		focus: "Arms + Light Conditioning",
		color: "#a855f7",
		emoji: "💪",
		weekdays: [5],
		exercises: [
			"EZ Bar Curl",
			"Tricep Pushdown",
			"Incline Dumbbell Curl",
			"Overhead Tricep Extension",
			"Incline Walk",
		],
	},
	{
		name: "Recovery",
		focus: "Cardio + Mobility",
		color: "#22c55e",
		emoji: "🧘",
		weekdays: [6],
		exercises: [
			"Brisk Walk / Treadmill",
			"Cat-Cow",
			"Doorway Chest Stretch",
			"Kneeling Hip Flexor Stretch",
			"Seated Hamstring Stretch",
			"Chin Tucks",
			"Dead Hang",
		],
	},
];

export type SeedFood = {
	name: string;
	emoji: string;
	servingLabel: string;
	calories: number;
	proteinG: number;
	carbsG: number;
	fatG: number;
	category: string;
	favorite?: boolean;
};

/**
 * Approximate values for common everyday foods — good enough to steer a
 * deficit, not a lab measurement. Every number is editable in the app.
 */
export const SEED_FOODS: SeedFood[] = [
	{ name: "Roti (whole wheat)", emoji: "🫓", servingLabel: "1 roti", calories: 105, proteinG: 3, carbsG: 20, fatG: 2, category: "Lunch", favorite: true },
	{ name: "Cooked Rice", emoji: "🍚", servingLabel: "1 katori (150g)", calories: 200, proteinG: 4, carbsG: 44, fatG: 0.5, category: "Lunch", favorite: true },
	{ name: "Dal (cooked)", emoji: "🍲", servingLabel: "1 katori", calories: 150, proteinG: 9, carbsG: 20, fatG: 4, category: "Lunch", favorite: true },
	{ name: "Rajma / Chole", emoji: "🫘", servingLabel: "1 katori", calories: 210, proteinG: 11, carbsG: 30, fatG: 5, category: "Lunch" },
	{ name: "Mixed Vegetable Sabzi", emoji: "🥘", servingLabel: "1 katori", calories: 120, proteinG: 3, carbsG: 12, fatG: 7, category: "Lunch" },
	{ name: "Paneer (100g)", emoji: "🧀", servingLabel: "100 g", calories: 265, proteinG: 18, carbsG: 3, fatG: 20, category: "Protein", favorite: true },
	{ name: "Boiled Egg", emoji: "🥚", servingLabel: "1 egg", calories: 78, proteinG: 6, carbsG: 0.6, fatG: 5, category: "Protein", favorite: true },
	{ name: "Chicken Breast (100g)", emoji: "🍗", servingLabel: "100 g", calories: 165, proteinG: 31, carbsG: 0, fatG: 3.6, category: "Protein", favorite: true },
	{ name: "Whey Protein Scoop", emoji: "🥤", servingLabel: "1 scoop", calories: 120, proteinG: 24, carbsG: 3, fatG: 1.5, category: "Protein", favorite: true },
	{ name: "Curd / Dahi", emoji: "🥛", servingLabel: "1 katori", calories: 100, proteinG: 5, carbsG: 8, fatG: 5, category: "Snack" },
	{ name: "Milk (full fat)", emoji: "🥛", servingLabel: "1 glass (250ml)", calories: 150, proteinG: 8, carbsG: 12, fatG: 8, category: "Drink" },
	{ name: "Poha", emoji: "🍛", servingLabel: "1 plate", calories: 250, proteinG: 5, carbsG: 45, fatG: 6, category: "Breakfast" },
	{ name: "Idli", emoji: "⚪", servingLabel: "2 pieces", calories: 120, proteinG: 4, carbsG: 25, fatG: 0.5, category: "Breakfast" },
	{ name: "Dosa (plain)", emoji: "🥞", servingLabel: "1 dosa", calories: 165, proteinG: 4, carbsG: 28, fatG: 4, category: "Breakfast" },
	{ name: "Oats (dry 40g)", emoji: "🥣", servingLabel: "40 g dry", calories: 150, proteinG: 5, carbsG: 27, fatG: 3, category: "Breakfast", favorite: true },
	{ name: "Banana", emoji: "🍌", servingLabel: "1 medium", calories: 105, proteinG: 1.3, carbsG: 27, fatG: 0.4, category: "Snack", favorite: true },
	{ name: "Apple", emoji: "🍎", servingLabel: "1 medium", calories: 95, proteinG: 0.5, carbsG: 25, fatG: 0.3, category: "Snack" },
	{ name: "Almonds", emoji: "🌰", servingLabel: "10 pieces", calories: 70, proteinG: 2.6, carbsG: 2.5, fatG: 6, category: "Snack" },
	{ name: "Peanut Butter", emoji: "🥜", servingLabel: "1 tbsp", calories: 95, proteinG: 4, carbsG: 3, fatG: 8, category: "Snack" },
	{ name: "Tea with Milk & Sugar", emoji: "☕", servingLabel: "1 cup", calories: 90, proteinG: 2, carbsG: 12, fatG: 3, category: "Drink" },
	{ name: "Black Coffee", emoji: "☕", servingLabel: "1 cup", calories: 5, proteinG: 0.3, carbsG: 0, fatG: 0, category: "Drink" },
	{ name: "Samosa", emoji: "🥟", servingLabel: "1 piece", calories: 260, proteinG: 4, carbsG: 30, fatG: 14, category: "Snack" },
	{ name: "Ghee", emoji: "🧈", servingLabel: "1 tsp", calories: 45, proteinG: 0, carbsG: 0, fatG: 5, category: "Other" },
	{ name: "Cooking Oil", emoji: "🫒", servingLabel: "1 tbsp", calories: 120, proteinG: 0, carbsG: 0, fatG: 14, category: "Other" },
];

export type SeedCareStep = {
	name: string;
	emoji: string;
	note?: string;
	phase: "AM" | "PM";
	frequency: "EVERY_DAY" | "ALTERNATE" | "WEEKDAYS";
	weekdays?: number[];
};

export const SEED_CARE_STEPS: SeedCareStep[] = [
	{ name: "Cleanser", emoji: "🫧", phase: "AM", frequency: "EVERY_DAY" },
	{ name: "Vitamin C", emoji: "🍊", note: "Antioxidant — before sunscreen", phase: "AM", frequency: "EVERY_DAY" },
	{ name: "Moisturizer", emoji: "💧", phase: "AM", frequency: "EVERY_DAY" },
	{ name: "Sunscreen", emoji: "☀️", note: "SPF 50. Reapply if outdoors.", phase: "AM", frequency: "EVERY_DAY" },
	{ name: "Cleanser", emoji: "🫧", phase: "PM", frequency: "EVERY_DAY" },
	{ name: "Moisturizer (buffer)", emoji: "💧", note: "Before retinol — the sandwich method", phase: "PM", frequency: "WEEKDAYS", weekdays: [1, 3, 5] },
	{ name: "Retinol", emoji: "🌙", note: "3x per week. Pea-sized amount.", phase: "PM", frequency: "WEEKDAYS", weekdays: [1, 3, 5] },
	{ name: "Moisturizer", emoji: "💧", note: "Seals everything in", phase: "PM", frequency: "EVERY_DAY" },
];
