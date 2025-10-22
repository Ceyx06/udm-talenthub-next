// components/layout/Shell.tsx
export default function Shell({
    sidebar,
    children,
}: { sidebar: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="flex min-h-dvh">
            <aside className="w-64 shrink-0">{sidebar}</aside>

            <main className="flex-1 min-w-0 p-6">
                {/* center content and give the canvas a subtle rounded container look */}
                <div className="mx-auto w-full max-w-[1400px] px-4 md:px-6 py-6 space-y-6">
                    {children}
                </div>
            </main>
        </div>
    );
}
