import PageHeader from "@/components/common/PageHeader";
import Badge from "@/components/common/Badge";

const rows = [
    { college: "CAS", title: "Assistant Professor - Mathematics", status: "Active", desc: "Master’s degree in Mathematics, 3+ years teaching experience", posted: "10/1/2025" },
    { college: "CHS", title: "Instructor - Nursing", status: "Active", desc: "RN license, 2+ years clinical experience", posted: "10/3/2025" },
    { college: "CBPM", title: "Associate Professor - Business Management", status: "Active", desc: "PhD in Business Administration, 5+ years experience", posted: "9/28/2025" },
];

export default function Page() {
    return (
        <div className="space-y-4">
            <PageHeader title="Vacancies" subtitle="Manage job postings and openings" />
            <div className="flex justify-end"><button className="rounded-lg bg-blue-900 text-white px-3 py-2">+ Post New Vacancy</button></div>

            <div className="space-y-3">
                {rows.map((v) => (
                    <div key={v.title} className="rounded-xl border bg-white p-4">
                        <div className="flex items-center justify-between">
                            <div className="font-semibold">{v.title}</div>
                            <div className="space-x-2">
                                <button className="rounded-md border px-3 py-1">QR Code</button>
                                <button className="rounded-md border px-3 py-1">Edit</button>
                                <button className="rounded-md border px-3 py-1 text-red-600">Delete</button>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge tone="gray">{v.college}</Badge>
                            <Badge tone="green">{v.status}</Badge>
                        </div>
                        <p className="text-sm text-gray-700 mt-2">{v.desc}</p>
                        <div className="text-xs text-gray-500 mt-1">Posted: {v.posted}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}
