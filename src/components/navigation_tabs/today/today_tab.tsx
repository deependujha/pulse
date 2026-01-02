import { useState } from "react";
import { TodayCare } from "./today_care";
import { TodayNutrition } from "./today_nutrition";
import { TodayWorkout } from "./today_workout";

type TodayMode = "workout" | "nutrition" | "care";

export const TodayTab = () => {
    const [ mode, setMode ] = useState<TodayMode>( "workout" );

    return (
        <div className="min-h-screen flex flex-col">
            {/* Mode Switch */ }
            <div className="flex gap-2 p-4">
                <ModeButton
                    label="Workout"
                    active={ mode === "workout" }
                    onClick={ () => setMode( "workout" ) }
                />
                <ModeButton
                    label="Nutrition"
                    active={ mode === "nutrition" }
                    onClick={ () => setMode( "nutrition" ) }
                />
                <ModeButton
                    label="Care"
                    active={ mode === "care" }
                    onClick={ () => setMode( "care" ) }
                />
            </div>

            {/* Content */ }
            <div className="flex-1 p-4">
                { mode === "workout" && <TodayWorkout /> }
                { mode === "nutrition" && <TodayNutrition /> }
                { mode === "care" && <TodayCare /> }
            </div>
        </div>
    );
};

/* ---------- UI primitives ---------- */

const ModeButton = ( {
    label,
    active,
    onClick,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
} ) => {
    return (
        <button
            onClick={ onClick }
            className={ `flex-1 rounded-lg px-4 py-2 text-sm font-medium transition cursor-pointer
        ${active
                    ? "bg-black text-white"
                    : "bg-gray-100 text-gray-600"}
      `}
        >
            { label }
        </button>
    );
};
