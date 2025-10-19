export default function StatCard({ title, value, sub }: {
    title: string; value: React.ReactNode; sub?: string;
}) {
    return (
        <div className="rounded-xl border bg-white p-4">
            <div className="text-sm text-gray-600">{title}</div>
            <div className="text-3xl font-bold mt-1">{value}</div>
            {sub && <div className="text-xs text-gray-500 mt-1">{sub}</div>}
        </div>
    );
}
