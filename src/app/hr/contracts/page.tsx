import PageHeader from "@/components/common/PageHeader";
import StatCard from "@/components/common/StatCard";
import Badge from "@/components/common/Badge";

const rows = [
    { no: "C-2024-001", name: "Dr. Ana Lopez", college: "CAS", job: "Professor", type: "Full-time", start: "2024-01-01", end: "2024-12-31", rate: "₱500", status: "Active" },
    { no: "C-2024-002", name: "Prof. Carlos Reyes", college: "CHS", job: "Associate Professor", type: "Part-time", start: "2024-02-01", end: "2024-07-31", rate: "₱450", status: "Active" },
    { no: "C-2023-045", name: "Ms. Elena Cruz", college: "CBPM", job: "Instructor", type: "Full-time", start: "2023-06-01", end: "2024-01-15", rate: "₱400", status: "Expired" },
    { no: "C-2024-003", name: "Dr. Roberto Tan", college: "CCJ", job: "Professor", type: "Full-time", start: "2024-01-01", end: "2024-03-31", rate: "₱550", status: "Pending Renewal" },
];

export default function Page() {
    return (
        <div className="space-y-4">
            <PageHeader title="Contracts" subtitle="Manage faculty contracts" />
            <div className="grid grid-cols-3 gap-4">
                <StatCard title="Active Contracts" value={2} sub="Currently active" />
                <StatCard title="Expired Contracts" value={1} sub="Requires attention" />
                <StatCard title="Pending Renewals" value={1} sub="Up for renewal" />
            </div>

            <div className="rounded-xl border bg-white overflow-hidden mt-2">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-left">
                        <tr>
                            <th className="p-3">Contract No</th><th>Faculty Name</th><th>College</th><th>Job Title</th>
                            <th>Type</th><th>Start Date</th><th>End Date</th><th>Rate/hr</th><th>Status</th><th className="w-24">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map(r => (
                            <tr key={r.no} className="border-t">
                                <td className="p-3">{r.no}</td>
                                <td>{r.name}</td>
                                <td><Badge tone="gray">{r.college}</Badge></td>
                                <td>{r.job}</td>
                                <td>{r.type}</td>
                                <td>{r.start}</td>
                                <td>{r.end}</td>
                                <td>{r.rate}</td>
                                <td>
                                    {r.status === "Active" && <Badge tone="green">Active</Badge>}
                                    {r.status === "Expired" && <Badge tone="red">Expired</Badge>}
                                    {r.status === "Pending Renewal" && <Badge tone="yellow">Pending Renewal</Badge>}
                                </td>
                                <td className="pr-3 text-right space-x-2">
                                    <button className="rounded-md border px-2 py-1">✏️</button>
                                    <button className="rounded-md border px-2 py-1">🗑️</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
