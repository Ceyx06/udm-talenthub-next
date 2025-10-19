import PageHeader from "@/components/common/PageHeader";
import Badge from "@/components/common/Badge";

const rows = [
    { name: "Juan Dela Cruz", college: "CAS", job: "Associate Professor", files: "Complete", stage: "Conducted" },
    { name: "Maria Santos", college: "CHS", job: "Instructor", files: "Partial", stage: "Evaluating" },
    { name: "Pedro Garcia", college: "CBPM", job: "Assistant Professor", files: "Complete", stage: "Pending" },
];

export default function Page() {
    return (
        <div className="space-y-4">
            <PageHeader title="Evaluation" subtitle="Review and evaluate applicants" />
            <div className="rounded-xl border bg-white overflow-hidden">
                <table className="w-full text-sm">
                    <thead className="bg-gray-100 text-left">
                        <tr><th className="p-3">Applicant Name</th><th>College</th><th>Job Title</th><th>Files</th><th>Stage</th><th className="w-28">Actions</th></tr>
                    </thead>
                    <tbody>
                        {rows.map(r => (
                            <tr key={r.name} className="border-t">
                                <td className="p-3">{r.name}</td>
                                <td><Badge tone="gray">{r.college}</Badge></td>
                                <td>{r.job}</td>
                                <td>{r.files === "Complete" ? <Badge tone="green">Complete</Badge> : <Badge tone="red">Partial</Badge>}</td>
                                <td>
                                    {r.stage === "Conducted" && <Badge tone="blue">Conducted</Badge>}
                                    {r.stage === "Evaluating" && <Badge tone="yellow">Evaluating</Badge>}
                                    {r.stage === "Pending" && <Badge tone="gray">Pending</Badge>}
                                </td>
                                <td className="pr-3 text-right"><button className="rounded-md bg-blue-900 text-white px-3 py-1">Evaluate</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
