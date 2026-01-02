import { useState } from "react";
import { TodayCare } from "./today_care";
import { TodayNutrition } from "./today_nutrition";
import { TodayWorkout } from "./today_workout";

type TodayMode = "workout" | "nutrition" | "care";

export const TodayTab = () => {
    const [ mode, setMode ] = useState<TodayMode>( "workout" );

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Mode Switch */ }
            <div className="flex gap-2 p-4 shrink-0">
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

            {/* Scrollable Content */ }
            <div className="flex-1 overflow-y-auto px-4 pb-6">
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
