// src/app/hr/layout.tsx
import { SidebarHR } from "@/components/layout/SidebarHR";

export default function HRLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <SidebarHR />
      <main className="flex-1 min-w-0">
        {/* max width + inner spacing, no white */}
        <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
