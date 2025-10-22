// src/components/layout/SidebarHR.tsx
"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

type Item = { href: string; label: string; icon: React.ReactNode };

const NAV: Item[] = [
  { href: "/hr/dashboard", label: "Dashboard", icon: <span>📊</span> },
  { href: "/hr/vacancies", label: "Vacancies", icon: <span>🧾</span> },
  { href: "/hr/applicants", label: "Applicants", icon: <span>👥</span> },
  { href: "/hr/evaluation", label: "Evaluation", icon: <span>🧪</span> },
  { href: "/hr/contracts", label: "Contract", icon: <span>📄</span> },
  { href: "/hr/renewals", label: "Renewals", icon: <span>⏳</span> },
  { href: "/hr/faculty", label: "Faculty", icon: <span>🎓</span> },
];

export function SidebarHR() {
  const pathname = usePathname();
  const [logoOk, setLogoOk] = useState(true);

  return (
    <aside
      className={[
        "w-64 shrink-0 h-screen sticky top-0",
        "flex flex-col",
        "bg-[var(--teal-300)]/55 backdrop-blur-sm",
        "border-r border-[rgba(15,110,116,0.08)]",
      ].join(" ")}
    >
      {/* Brand */}
  <div className="px-4 pt-3 pb-2 border-b border-[rgba(15,110,116,0.08)]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl overflow-hidden ring-1 ring-white/40 bg-[var(--teal-800)] grid place-items-center">
            {logoOk ? (
              <Image
                src="/logo-udm.png"           // ensure /public/logo-udm.png exists
                alt="UDM"
                width={36}
                height={36}
                priority
                className="object-contain rounded-xl"
                onError={() => setLogoOk(false)}
              />
            ) : (
              <span className="text-white font-bold leading-none">UDM</span>
            )}
          </div>
          <div className="leading-tight">
            <div className="font-semibold text-slate-800">Universidad De Manila</div>
            <div className="text-[11px] text-slate-600">HR Portal</div>
          </div>
        </div>
      </div>

      {/* Scrollable nav area */}
      <nav className="flex-1 overflow-y-auto px-3 pt-4 pb-24 space-y-3">
        {NAV.map((item) => {
          const active = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={[
                "flex items-center gap-3 rounded-2xl px-3 py-2 text-[15px] transition",
                "border",
                active
                  ? "bg-[var(--teal-700)]/10 border-[rgba(15,110,116,0.18)] text-[var(--teal-700)] shadow-sm"
                  : "bg-[var(--card-bg)] border-[rgba(255,255,255,0.6)] text-slate-700 hover:bg-white/80 hover:shadow-sm",
              ].join(" ")}
            >
              <span className="text-base">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer pinned to bottom */}
      <div className="sticky bottom-0 px-3 py-3 bg-[var(--teal-300)]/65 backdrop-blur-sm border-t border-[rgba(15,110,116,0.06)]">
        <div className="rounded-xl border bg-[var(--card-bg)] px-3 py-2 text-xs text-slate-600 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            <span>HR User</span>
          </div>
          <span className="text-emerald-700 font-medium">Active</span>
        </div>

        <Link
          href="/login"
          className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-[rgba(255,255,255,0.6)] bg-[var(--card-bg)] px-3 py-2 text-sm text-slate-700 hover:bg-white/80 hover:shadow-sm transition"
        >
          <span>🚪</span>
          <span>Log-out</span>
        </Link>
      </div>
    </aside>
  );
}
