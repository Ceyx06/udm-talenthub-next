// components/layout/Shell.tsx
export default function Shell({
    sidebar,
    children,
}: { sidebar: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen">
            <aside className="w-60">{sidebar}</aside>
            <main className="flex-1 p-6">{children}</main>
        </div>
    );
}
