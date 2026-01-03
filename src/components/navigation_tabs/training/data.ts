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
		type: "Rest",
		exercises: [],
	},

	Monday: {
		type: "Back + Posture",
		exercises: [
			{ name: "Deadlift", sets: 3, reps: 5 },
			{ name: "Lat Pulldown", sets: 3, reps: "8–12" },
			{ name: "Chest-Supported Dumbbell Row", sets: 3, reps: "10–12" },
			{ name: "Incline Dumbbell Curl", sets: 2, reps: "10–12" },
			{ name: "Straight Arm Pulldown", sets: 2, reps: "12–15" },
			{ name: "Face Pull", sets: 3, reps: "15–20" },
			{ name: "Dead Hang", sets: 3, reps: "30–60 sec" },
		],
	},

	Tuesday: {
		type: "Chest + Core",
		exercises: [
			{ name: "Incline Bench Press", sets: 3, reps: "6–8" },
			{ name: "Machine or Dumbbell Press", sets: 3, reps: "8–12" },
			{ name: "Machine Fly", sets: 3, reps: "12–15" },
			{ name: "Push-ups", sets: 2, reps: "Near failure" },
			{ name: "Hanging Leg Raise", sets: 3, reps: "10–15" },
			{ name: "Plank", sets: 3, reps: "45–60 sec" },
		],
	},

	Wednesday: {
		type: "Legs",
		exercises: [
			{ name: "Barbell Back Squat", sets: 4, reps: 5 },
			{ name: "Romanian Deadlift", sets: 3, reps: "8–10" },
			{ name: "Leg Press", sets: 3, reps: "10–15" },
			{ name: "Leg Curl", sets: 3, reps: "12–15" },
			{ name: "Standing Calf Raise", sets: 4, reps: "12–20" },
		],
	},

	Thursday: {
		type: "Shoulders + Upper Back",
		exercises: [
			{ name: "Overhead Press", sets: 3, reps: "5–8" },
			{ name: "Lateral Raise", sets: 4, reps: "12–15" },
			{ name: "Reverse Pec Deck / Rear Delt Fly", sets: 4, reps: "12–15" },
			{ name: "Barbell Shrugs", sets: 3, reps: "10–15" },
			{ name: "Cable Crunch or Ab Wheel", sets: 3, reps: "10–15" },
		],
	},

	Friday: {
		type: "Arms + Light Conditioning",
		exercises: [
			{ name: "EZ Bar Curl", sets: 3, reps: "8–12" },
			{ name: "Tricep Dips or Pushdown", sets: 3, reps: "8–12" },
			{ name: "Incline Dumbbell Curl", sets: 3, reps: "10–12" },
			{ name: "Overhead Tricep Extension", sets: 3, reps: "10–12" },
			{ name: "Incline Walk", sets: 1, reps: "15–20 min" },
		],
	},

	Saturday: {
		type: "Cardio + Mobility & Recovery",
		exercises: [
			{ name: "Brisk Walking / Incline Treadmill", sets: 1, reps: "30–40 min" },
			{ name: "Cat–Cow (Thoracic Spine)", sets: 2, reps: "8–10 reps" },
			{ name: "Doorway Chest Stretch", sets: 2, reps: "30–45 sec" },
			{ name: "Kneeling Hip Flexor Stretch", sets: 2, reps: "30 sec each side" },
			{ name: "Seated Hamstring Stretch", sets: 2, reps: "30 sec each side" },
			{ name: "Chin Tucks", sets: 2, reps: "10 slow reps" },
			{ name: "Dead Hang", sets: 1, reps: "30–60 sec" },
		],
	},
};
