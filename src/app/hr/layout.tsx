// src/app/hr/layout.tsx
import { SidebarHR } from "@/components/layout/SidebarHR";

export default function HRLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <SidebarHR />
      <main className="flex-1 min-w-0">
        <div className="w-full px-4 py-4">
          <div className="bg-[var(--teal-100)]/70 border border-[rgba(15,110,116,0.06)] rounded-2xl shadow-sm">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}