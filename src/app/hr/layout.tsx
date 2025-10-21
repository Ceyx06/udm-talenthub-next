// src/app/hr/layout.tsx
import { SidebarHR } from "@/components/layout/SidebarHR";

export default function HRLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <SidebarHR />
      <main className="flex-1 min-w-0">
        {/* max width + inner spacing, teal canvas behind widgets */}
        <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 py-6">
          <div className="bg-[var(--teal-100)]/70 border border-[rgba(15,110,116,0.06)] rounded-2xl p-6 shadow-sm">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
