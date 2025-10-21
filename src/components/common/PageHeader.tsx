import * as React from "react";
import clsx from "clsx";

type Props = {
    title: string;
    subtitle?: string;
    /** Small label above the title, e.g., “HR Dashboard” */
    overline?: string;
    /** Right-side actions (buttons, links, etc.) */
    actions?: React.ReactNode;
    /** Layout alignment */
    align?: "left" | "center";
    className?: string;
};

export default function PageHeader({
    title,
    subtitle,
    overline,
    actions,
    align = "left",
    className,
}: Props) {
    const isCenter = align === "center";

    return (
        <header
            className={clsx(
                "mb-3 md:mb-4",
                isCenter ? "text-center" : "",
                className
            )}
        >
            {/* Top row for actions when left-aligned */}
            {!isCenter && (
                <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                        {overline && (
                            <div className="text-[11px] uppercase tracking-wide font-medium text-slate-700/80">
                                {overline}
                            </div>
                        )}
                        <h1 className="text-2xl md:text-[26px] font-semibold leading-tight">
                            {title}
                        </h1>
                        {subtitle && (
                            <p className="mt-0.5 text-[13px] md:text-sm text-slate-700/80">
                                {subtitle}
                            </p>
                        )}
                    </div>
                    {actions && (
                        <div className="shrink-0 flex items-center gap-2">{actions}</div>
                    )}
                </div>
            )}

            {/* Centered layout */}
            {isCenter && (
                <div className="mx-auto max-w-3xl">
                    {overline && (
                        <div className="text-[11px] uppercase tracking-wide font-medium text-slate-700/80">
                            {overline}
                        </div>
                    )}
                    <h1 className="text-2xl md:text-[26px] font-semibold leading-tight">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="mt-0.5 text-[13px] md:text-sm text-slate-700/80">
                            {subtitle}
                        </p>
                    )}
                    {actions && <div className="mt-3 flex justify-center">{actions}</div>}
                </div>
            )}
        </header>
    );
}
