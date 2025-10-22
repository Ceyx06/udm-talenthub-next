// src/components/common/StatCard.tsx
import * as React from "react";

type Variant = "primary" | "success" | "warning" | "danger" | "info";
type Tint = "teal" | "blue" | "green" | "amber" | "red";

interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    variant?: Variant;
    tint?: Tint;
    icon?: React.ReactNode;
    trend?: { value: number; direction: "up" | "down" };
    className?: string;
}

const surface: Record<Variant, Record<Tint, string>> = {
    primary: {
        teal: "from-teal-50 to-teal-100 border-teal-200 text-teal-900",
        blue: "from-blue-50 to-blue-100 border-blue-200 text-blue-900",
        green: "from-green-50 to-green-100 border-green-200 text-green-900",
        amber: "from-amber-50 to-amber-100 border-amber-200 text-amber-900",
        red: "from-red-50 to-rose-100 border-red-200 text-red-900",
    },
    success: {
        teal: "from-emerald-50 to-teal-100 border-emerald-200 text-emerald-900",
        blue: "from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-900",
        green: "from-green-50 to-green-100 border-green-200 text-green-900",
        amber: "from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-900",
        red: "from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-900",
    },
    warning: {
        teal: "from-amber-50 to-orange-100 border-amber-200 text-amber-900",
        blue: "from-amber-50 to-orange-100 border-amber-200 text-amber-900",
        green: "from-amber-50 to-orange-100 border-amber-200 text-amber-900",
        amber: "from-amber-50 to-orange-100 border-amber-200 text-amber-900",
        red: "from-amber-50 to-orange-100 border-amber-200 text-amber-900",
    },
    danger: {
        teal: "from-red-50 to-rose-100 border-red-200 text-red-900",
        blue: "from-red-50 to-rose-100 border-red-200 text-red-900",
        green: "from-red-50 to-rose-100 border-red-200 text-red-900",
        amber: "from-red-50 to-rose-100 border-red-200 text-red-900",
        red: "from-red-50 to-rose-100 border-red-200 text-red-900",
    },
    info: {
        teal: "from-cyan-50 to-teal-100 border-cyan-200 text-cyan-900",
        blue: "from-blue-50 to-cyan-100 border-blue-200 text-blue-900",
        green: "from-cyan-50 to-cyan-100 border-cyan-200 text-cyan-900",
        amber: "from-cyan-50 to-cyan-100 border-cyan-200 text-cyan-900",
        red: "from-cyan-50 to-cyan-100 border-cyan-200 text-cyan-900",
    },
};

const iconChip: Record<Variant, Record<Tint, string>> = {
    primary: {
        teal: "bg-teal-500 text-white",
        blue: "bg-blue-500 text-white",
        green: "bg-green-500 text-white",
        amber: "bg-amber-500 text-white",
        red: "bg-red-500 text-white",
    },
    success: {
        teal: "bg-emerald-500 text-white",
        blue: "bg-emerald-500 text-white",
        green: "bg-green-500 text-white",
        amber: "bg-emerald-500 text-white",
        red: "bg-emerald-500 text-white",
    },
    warning: {
        teal: "bg-amber-500 text-white",
        blue: "bg-amber-500 text-white",
        green: "bg-amber-500 text-white",
        amber: "bg-amber-500 text-white",
        red: "bg-amber-500 text-white",
    },
    danger: {
        teal: "bg-red-500 text-white",
        blue: "bg-red-500 text-white",
        green: "bg-red-500 text-white",
        amber: "bg-red-500 text-white",
        red: "bg-red-500 text-white",
    },
    info: {
        teal: "bg-cyan-500 text-white",
        blue: "bg-blue-500 text-white",
        green: "bg-cyan-500 text-white",
        amber: "bg-cyan-500 text-white",
        red: "bg-cyan-500 text-white",
    },
};

export default function StatCard({
    title,
    value,
    subtitle,
    variant = "primary",
    tint = "teal",
    icon,
    trend,
    className,
}: StatCardProps) {
    const cardTone = surface[variant][tint];
    const chipTone = iconChip[variant][tint];

    return (
        <div
            className={[
                "rounded-xl border p-5 shadow-md",
                "bg-gradient-to-br backdrop-blur",
                "transition-all duration-200 hover:shadow-lg",
                cardTone,
                className ?? "",
            ].join(" ")}
            role="region"
            aria-label={title}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-xs font-medium uppercase tracking-wide/loose opacity-75">
                        {title}
                    </p>
                    <div className="mt-1.5 flex items-baseline gap-2">
                        <span className="text-3xl md:text-4xl font-extrabold leading-none">
                            {value}
                        </span>
                        {trend && (
                            <span
                                className={[
                                    "text-sm font-semibold",
                                    trend.direction === "up" ? "text-emerald-700" : "text-red-600",
                                ].join(" ")}
                                aria-label={`trend ${trend.direction} ${trend.value}%`}
                                title={`Trend ${trend.direction} ${trend.value}%`}
                            >
                                {trend.direction === "up" ? "↑" : "↓"} {trend.value}%
                            </span>
                        )}
                    </div>
                    {subtitle && (
                        <p className="mt-1 text-[12px] leading-tight opacity-80">
                            {subtitle}
                        </p>
                    )}
                </div>

                {icon && (
                    <div
                        className={[
                            "shrink-0 rounded-full p-3 md:p-3.5 shadow",
                            "grid place-items-center",
                            chipTone,
                        ].join(" ")}
                        aria-hidden
                    >
                        {icon}
                    </div>
                )}
            </div>
        </div>
    );
}
