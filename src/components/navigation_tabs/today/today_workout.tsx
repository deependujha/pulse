"use client";

import { DAYS, TRAINING_PLAN } from "../training/data";

export const TodayWorkout = () => {
    const todayIndex = new Date().getDay();
    const today = DAYS[ todayIndex ];
    const exercises = TRAINING_PLAN[ today ];

    return (
        <div className="w-full max-w-md mx-auto px-4 py-6">
            <h2 className="text-lg font-semibold">{ today }</h2>
            <p className="text-sm text-gray-500 mb-4">
                Today’s workout: { exercises.type }
            </p>

            { exercises.exercises.length === 0 ? (
                <div className="text-sm text-gray-400">
                    Rest day. Recover well.
                </div>
            ) : (
                <ul className="space-y-3">
                    { exercises.exercises.map( ( exercise, index ) => (
                        <li
                            key={ index }
                            className="flex items-center justify-between rounded-xl border border-neutral-200 px-4 py-3"
                        >
                            <div className="font-medium">
                                { exercise.name }
                            </div>
                            <div className="text-sm text-neutral-500">
                                { exercise.sets } × { exercise.reps }
                            </div>
                        </li>
                    ) ) }
                </ul>
            ) }
        </div>
    );
};
