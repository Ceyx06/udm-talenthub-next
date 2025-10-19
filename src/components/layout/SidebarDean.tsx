// components/layout/SidebarDean.tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { signOut } from "@/lib/auth";

type Item = { href: string; label: string; icon: React.ReactNode };

const NAV: Item[] = [
    { href: "/dean/dashboard", label: "Dashboard", icon: <span>📊</span> },
    { href: "/dean/applicants", label: "View Applicants", icon: <span>👥</span> },
    { href: "/dean/interviews", label: "Interview & Demo", icon: <span>🗓️</span> },
    { href: "/dean/renewals", label: "Renewals", icon: <span>♻️</span> },
    { href: "/dean/vacancy-request", label: "Vacancy Request", icon: <span>📝</span> },
];

export function SidebarDean() {
    const pathname = usePathname();
    const router = useRouter();

    async function handleLogout() {
        try {
            await signOut(); // calls client signOut
        } catch (e) {
            // ignore signOut errors and still redirect
        }
        router.replace("/login"); // go back to login form
    }

    return (
        <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col bg-amber-50 border-r border-amber-100">
            {/* Brand */}
            <div className="px-4 pt-4 pb-3 border-b border-amber-100">
                <div className="flex items-center gap-3">
                    <Image src="/logo-udm.png" alt="UDM" width={36} height={36} />
                    <div className="leading-tight">
                        <div className="font-semibold">Universidad De Manila</div>
                        <div className="text-xs text-amber-700/80">Dean Portal</div>
                    </div>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-1">
                {NAV.map((item) => {
                    const active = pathname.startsWith(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[15px] transition ${active ? "bg-emerald-600 text-white" : "text-amber-900 hover:bg-amber-100"
                                }`}
                        >
                            <span className="text-base">{item.icon}</span>
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Logout */}
            <div className="px-4 py-3 border-t border-amber-100 text-sm">
                <div className="flex items-center gap-2 text-amber-800">
                    <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
                    <span>Dean User</span>
                    <span className="ml-auto text-emerald-700">Active</span>
                </div>
                <div className="mt-3">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex items-center gap-2 text-amber-900 hover:underline"
                    >
                        <span>🚪</span>
                        <span>Log-out</span>
                    </button>
                </div>
            </div>
        </aside>
    );
}
