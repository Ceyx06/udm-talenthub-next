import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";

export default function Page() {
    return (
        <div className="space-y-6">
            <PageHeader title="Dashboard" subtitle="Overview of all colleges" />

            <div className="grid grid-cols-4 gap-4">
                <StatCard title="Total Applicants" value={149} sub="+12% from last month" />
                <StatCard title="Open Vacancies" value={33} sub="Active for 15 days" />
                <StatCard title="Active Contracts" value={253} sub="Across all colleges" />
                <StatCard title="Pending Renewals" value={51} sub="Requires attention" />
            </div>

            <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                {[
                    { code: "CAS", applicants: 23, vacancies: 5, contracts: 45, renewals: 8, color: "border-blue-500" },
                    { code: "CHS", applicants: 18, vacancies: 3, contracts: 38, renewals: 6, color: "border-green-500" },
                    { code: "CBPM", applicants: 31, vacancies: 7, contracts: 52, renewals: 12, color: "border-violet-500" },
                    { code: "CCJ", applicants: 15, vacancies: 4, contracts: 29, renewals: 5, color: "border-red-500" },
                    { code: "CED", applicants: 27, vacancies: 6, contracts: 41, renewals: 9, color: "border-emerald-500" },
                    { code: "CCS", applicants: 35, vacancies: 8, contracts: 48, renewals: 11, color: "border-pink-500" },
                ].map((c) => (
                    <div key={c.code} className={`rounded-xl border ${c.color} bg-white p-4`}>
                        <div className="text-sm font-medium">{c.code} <span className="text-gray-400">College</span></div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-3 mt-3 text-sm">
                            <div><div className="text-gray-500">Applicants</div><div className="font-semibold">{c.applicants}</div></div>
                            <div><div className="text-gray-500">Vacancies</div><div className="font-semibold">{c.vacancies}</div></div>
                            <div><div className="text-gray-500">Contracts</div><div className="font-semibold">{c.contracts}</div></div>
                            <div><div className="text-gray-500">Renewals</div><div className="font-semibold">{c.renewals}</div></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
