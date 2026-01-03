export type SkinCareStep = {
    name: string;
    note?: string;
};

export type CareMode = "AM" | "PM_ODD" | "PM_EVEN";
export type SkinCareDataType = {
    [ key in CareMode ]: SkinCareStep[];
};

const NightRoutine_with_Retinol = [
    { name: "Cleanser" },
    { name: "Moisturizer", note: "before retinol" },
    { name: "Retinol", note: "3x per week" },
    { name: "Moisturizer", note: "after retinol. (retinol sandwich method)" },
];

const NightRoutine_without_Retinol = [
    { name: "Cleanser" },
    { name: "Moisturizer" },
]

export const SKIN_CARE_DATA: SkinCareDataType = {
    AM: [
        { name: "Cleanser" },
        { name: "Vitamin C" },
        { name: "Moisturizer" },
        { name: "Sunscreen" },
    ],
    PM_ODD: NightRoutine_with_Retinol,
    PM_EVEN: NightRoutine_without_Retinol,
};
