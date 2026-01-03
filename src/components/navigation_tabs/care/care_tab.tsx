"use client";

import { useEffect, useState } from "react";
import { SKIN_CARE_DATA, CareMode } from "./care_data";

export const CareTab = () => {
    const [ pmDay, setPmDay ] = useState<CareMode>( "PM_ODD" );
    const [ mode, setMode ] = useState<CareMode | null>( null );

    useEffect( () => {
        const date = new Date();
        const dayIndex = date.getDay();
        const PM_DAY = dayIndex % 2 === 0 ? "PM_EVEN" : "PM_ODD";
        setPmDay( PM_DAY );

        const hour = date.getHours();
        setMode( hour < 12 ? "AM" : PM_DAY );
    }, [] );

    if ( !mode ) {
        return (
            <div className="flex items-center justify-center h-full text-sm text-neutral-400">
                Loading routine…
            </div>
        );
    }

    const steps = SKIN_CARE_DATA[ mode ];

    return (
        <div className="h-full flex flex-col overflow-hidden">
            {/* Header + Toggle (fixed) */ }
            <div className="shrink-0 px-4 py-6">
                <h2 className="text-lg font-semibold">Skincare</h2>
                <p className="text-sm text-pink-500 font-semibold mb-4">
                    { mode === "AM" ? "Morning routine ☀️" : "Night routine 🌙" }
                </p>

                <div className="flex gap-2">
                    <ModeButton
                        label="AM"
                        active={ mode === "AM" }
                        onClick={ () => setMode( "AM" ) }
                    />
                    <ModeButton
                        label="PM"
                        active={ mode.startsWith( "PM" ) }
                        onClick={ () => setMode( pmDay ) }
                    />
                </div>
            </div>

            {/* Scrollable Steps */ }
            <div className="flex-1 overflow-y-auto px-4 pb-6">
                <ul className="space-y-4">
                    { steps.map( ( step, index ) => (
                        <li
                            key={ index }
                            className="rounded-xl border border-neutral-200 px-4 py-3"
                        >
                            <div className="font-medium">{ step.name }</div>
                            { step.note && (
                                <div className="text-sm text-neutral-500 mt-1">
                                    { step.note }
                                </div>
                            ) }
                        </li>
                    ) ) }
                </ul>
            </div>
        </div>
    );
};

/* ---------- UI primitive ---------- */

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
            className={ `flex-1 rounded-lg px-4 py-2 text-sm font-medium transition
        ${active
                    ? "bg-black text-white"
                    : "bg-neutral-100 text-neutral-600"
                }` }
        >
            { label }
        </button>
    );
};
