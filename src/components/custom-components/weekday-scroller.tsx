"use client";

import { useEffect, useRef } from "react";
import { WEEKDAYS } from "@/constants/weekdays";

type Props = {
    selectedWeekDayIndex: number;
    updateSelectedWeekDayIndex: ( value: number ) => void;
};

export const WeekDayScroller = ( {
    selectedWeekDayIndex,
    updateSelectedWeekDayIndex,
}: Props ) => {
    const containerRef = useRef<HTMLDivElement | null>( null );
    const activeRef = useRef<HTMLButtonElement | null>( null );

    useEffect( () => {
        if ( activeRef.current ) {
            activeRef.current.scrollIntoView( {
                behavior: "smooth",
                inline: "center",
                block: "nearest",
            } );
        }
    }, [ selectedWeekDayIndex ] );

    return (
        <div ref={ containerRef } className="overflow-x-auto no-scrollbar">
            <div className="flex gap-2 px-1 min-w-max">
                { WEEKDAYS.map( ( day, index ) => {
                    const isActive = index === selectedWeekDayIndex;

                    return (
                        <button
                            key={ day }
                            ref={ isActive ? activeRef : null }
                            onClick={ () => updateSelectedWeekDayIndex( index ) }
                            className={ `px-3 py-1.5 rounded-full text-sm whitespace-nowrap border cursor-pointer
                ${isActive
                                    ? "bg-black text-white border-black"
                                    : "bg-white text-neutral-600 border-neutral-300"
                                }
              `}
                        >
                            { day }
                        </button>
                    );
                } ) }
            </div>
        </div>
    );
};
