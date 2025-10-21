
import { SidebarDean } from "@/components/layout/SidebarDean";

export default function DeanLayout({ children }: { children: React.ReactNode }) {
    return (
        // Inherit the teal background from app/layout.tsx (no extra bg here)
        <div className="min-h-dvh flex">
            <SidebarDean />

            {/* Content area */}
                <main className="flex-1 min-w-0 p-4 md:p-6">
                    {/* Center the page content and keep consistent spacing */}
                    <div className="mx-auto w-full max-w-[1200px]">
                        <div className="bg-[var(--teal-100)]/70 border border-[rgba(15,110,116,0.06)] rounded-2xl p-6 space-y-5">
                            {children}
                        </div>
                    </div>
                </main>
        </div>
    );
}
