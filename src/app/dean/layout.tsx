// app/dean/layout.tsx
import { redirect } from "next/navigation";
import { SidebarDean } from "@/components/layout/SidebarDean";

export default async function DeanLayout({ children }: { children: React.ReactNode }) {


    return (
        <div className="min-h-screen flex bg-gray-50 text-gray-900">
            <SidebarDean />
            <main className="flex-1 p-6">{children}</main>
        </div>
    );
}
