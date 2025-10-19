// app/hr/layout.tsx
import { redirect } from "next/navigation";
import { SidebarHR } from "@/components/layout/SidebarHR";

export default async function HRLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Frame: sidebar + main content
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <SidebarHR />
      <main className="flex-1 min-w-0">
        {/* page content renders here */}
        {children}
      </main>
    </div>
  );
}
