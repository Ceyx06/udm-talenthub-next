import PageHeader from "@/components/common/PageHeader";
import Badge from "@/components/common/Badge";

const rows = [
    { name: "Dr. Ana Lopez", college: "CAS", position: "Professor", type: "Full-time", status: "Active" },
    { name: "Prof. Carlos Reyes", college: "CHS", position: "Associate Professor", type: "Part-time", status: "Active" },
    { name: "Ms. Elena Cruz", college: "CBPM", position: "Instructor", type: "Full-time", status: "Inactive" },
    { name: "Dr. Roberto Tan", college: "CCJ", position: "Professor", type: "Full-time", status: "Active" },
    { name: "Prof. Isabel Mendoza", college: "CED", position: "Assistant Professor", type: "Part-time", status: "Active" },
    { name: "Dr. Miguel Santos", college: "CCS", position: "Professor", type: "Full-time", status: "Active" },
];

export default function Page() {
    return (
        <div className="space-y-4">
            <PageHeader title="Faculty" subtitle="View all faculty members" />
            <div className="rounded-xl border bg-white overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-left">
                        <tr><th className="p-3">Faculty Name</th><th>College</th><th>Position</th><th>Type</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                        {rows.map(r => (
                            <tr key={r.name} className="border-t">
                                <td className="p-3">{r.name}</td>
                                <td><Badge tone="gray">{r.college}</Badge></td>
                                <td>{r.position}</td>
                                <td>{r.type}</td>
                                <td>{r.status === "Active" ? <Badge tone="green">Active</Badge> : <Badge tone="gray">Inactive</Badge>}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="flex justify-end"><button className="rounded-md bg-blue-900 text-white px-3 py-2">Export CSV</button></div>
        </div>
    );
}
