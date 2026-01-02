export const DAYS = [
	"Sunday",
	"Monday",
	"Tuesday",
	"Wednesday",
	"Thursday",
	"Friday",
	"Saturday",
] as const;

export type Day = (typeof DAYS)[number];

export type Exercise = {
	name: string;
	sets: number;
	reps: number | string;
};

export const TRAINING_PLAN: Record<Day, { type: string; exercises: Exercise[] }> = {
	Sunday: {
		type: "",
		exercises: [],
	},
	Monday: {
		type: "Back Workout",
		exercises: [
			{ name: "Push-ups", sets: 3, reps: 12 },
			{ name: "Incline Push-ups", sets: 3, reps: 10 },
		],
	},
	Tuesday: {
		type: "Chest & Abs Workout",
		exercises: [{ name: "Squats", sets: 3, reps: 15 }],
	},
	Wednesday: {
		type: "Legs Workout",
		exercises: [{ name: "Squats", sets: 3, reps: 15 }],
	},
	Thursday: {
		type: "Shoulders & Abs Workout",
		exercises: [{ name: "Squats", sets: 3, reps: 15 }],
	},
	Friday: {
		type: "Arms Workout",
		exercises: [
			{ name: "EZ Bar Curl", sets: 4, reps: "8-12" },
			{ name: "EZ Bar Skullcrusher", sets: 4, reps: "8-12" },
			{ name: "Spider Curl", sets: 4, reps: "8-12" },
			{ name: "Tricep Dip", sets: 4, reps: "8-12" },
			{ name: "Cable hammer Curl", sets: 4, reps: "8-12" },
			{ name: "Cable Overhead Tricep Ext.", sets: 4, reps: "8-12" },
			{ name: "Running", sets: 1, reps: "15 minutes" },
		],
	},
	Saturday: {
		type: "",
		exercises: [],
	},
};
