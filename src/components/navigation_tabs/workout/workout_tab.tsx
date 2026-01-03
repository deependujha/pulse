"use client";

import { useState, useEffect } from "react";
import { DAYS, TRAINING_PLAN, Exercise } from "../workout/data";
import { WeekDayScroller } from "@/components/custom-components/weekday-scroller";

type Props = {
    showScroller?: boolean;
};

export const WorkoutTab = ( { showScroller = true }: Props ) => {
    const [ selectedWeekDayIndex, setSelectedWeekDayIndex ] = useState<number>( -1 );
    const [ workout, setWorkout ] = useState<{
        type: string;
        exercises: Exercise[];
    } | null>( null );
    const [ activeDay, setActiveDay ] = useState<string>( "" );

    const updateSelectedWeekDayIndex = ( index: number ) => {
        setSelectedWeekDayIndex( index );
        const day = DAYS[ index ];
        setActiveDay( day );
        setWorkout( TRAINING_PLAN[ day ] );
    };

    useEffect( () => {
        const todayIndex = new Date().getDay();
        updateSelectedWeekDayIndex( todayIndex );
    }, [] );

    if ( selectedWeekDayIndex === -1 || !workout ) {
        return (
            <div className="flex items-center justify-center h-full text-sm text-neutral-400">
                Loading…
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col overflow-hidden max-w-md mx-auto">
            {/* Header (fixed) */ }
            <div className="shrink-0 px-4 my-6">
                <div className="text-lg">
                    <span className="font-semibold">Workout</span>
                    <span className="font-light text-neutral-500">{ !showScroller ? `: ${activeDay.toLowerCase()}` : "" }</span>
                </div>
                { showScroller && (
                    <div className="my-4">
                        <WeekDayScroller
                            selectedWeekDayIndex={ selectedWeekDayIndex }
                            updateSelectedWeekDayIndex={ updateSelectedWeekDayIndex }
                        />
                    </div>
                ) }

                { showScroller && (
                    <h3 className="text-md font-semibold">{ activeDay }</h3>
                ) }
                <p className="text-sm text-neutral-500">
                    { workout.type }
                </p>
            </div>

            {/* Scrollable exercises */ }
            <div className="flex-1 overflow-y-auto px-4 pb-6">
                { workout.exercises.length === 0 ? (
                    <div className="text-sm text-neutral-400 text-center flex items-center justify-center h-full">
                        Rest day. Recover well.
                    </div>
                ) : (
                    <ul className="space-y-4">
                        { workout.exercises.map( ( exercise, index ) => (
                            <li
                                key={ index }
                                className="rounded-xl border border-neutral-200 px-4 py-3"
                            >
                                <div className="font-medium">
                                    { exercise.name }
                                </div>
                                <div className="text-sm text-neutral-500 mt-1">
                                    { exercise.sets } × { exercise.reps }
                                </div>
                            </li>
                        ) ) }
                    </ul>
                ) }
            </div>
        </div>
    );
};
