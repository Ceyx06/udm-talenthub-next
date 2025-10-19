import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";

export default function Page() {
    return (
        <div className="space-y-6">
            <PageHeader title="Dean Dashboard" subtitle="College Overview" />
            <div className="grid grid-cols-4 gap-4">
                <StatCard title="Total Applicants" value={23} sub="12 pending review" />
                <StatCard title="Open Vacancies" value={5} sub="2 recently posted" />
                <StatCard title="Active Faculty" value={45} sub="Full-time and Part-time" />
                <StatCard title="Pending Renewals" value={8} sub="Requires recommendation" />
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="rounded-xl border bg-white p-4">
                    <div className="font-semibold mb-2">Applicant Stage Breakdown</div>
                    <ul className="space-y-2 text-sm">
                        {[
                            ["Pending", 8],
                            ["Scheduled", 5],
                            ["Conducted", 6],
                            ["Evaluating", 3],
                            ["Approved", 1],
                        ].map(([k, v]) => (
                            <li key={k as string} className="flex justify-between">
                                <span>{k as string}</span><span className="font-semibold">{v as number}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="rounded-xl border bg-white p-4">
                    <div className="font-semibold mb-2">Faculty Contract Status</div>
                    <ul className="space-y-2 text-sm">
                        <li className="flex justify-between"><span>Active Contracts</span><span className="font-semibold text-green-600">45</span></li>
                        <li className="flex justify-between"><span>Expiring Soon (30 days)</span><span className="font-semibold text-yellow-600">8</span></li>
                        <li className="flex justify-between"><span>Expired</span><span className="font-semibold text-red-600">2</span></li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
