import PageHeader from "@/components/common/PageHeader";

export default function Page() {
    return (
        <div className="space-y-4">
            <PageHeader title="Vacancy Request" subtitle="Submit a new position request to HR" />
            <div className="rounded-xl border bg-white p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-gray-600">Job Title</label>
                        <input className="mt-1 w-full rounded-md border p-2" placeholder="e.g., Associate Professor" />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">College</label>
                        <select className="mt-1 w-full rounded-md border p-2">
                            {["CAS", "CHS", "CBPM", "CCJ", "CED", "CCS"].map(c => <option key={c}>{c}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Number of Slots</label>
                        <input className="mt-1 w-full rounded-md border p-2" placeholder="e.g., 2" />
                    </div>
                    <div>
                        <label className="text-sm text-gray-600">Target Start Date</label>
                        <input type="date" className="mt-1 w-full rounded-md border p-2" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-sm text-gray-600">Minimum Qualifications</label>
                        <textarea className="mt-1 w-full rounded-md border p-2" rows={4} placeholder="List required qualifications, education, and experience..." />
                    </div>
                    <div className="md:col-span-2">
                        <label className="text-sm text-gray-600">Justification</label>
                        <textarea className="mt-1 w-full rounded-md border p-2" rows={4} placeholder="Explain why this position is needed..." />
                    </div>
                </div>
                <div className="mt-4 flex gap-2">
                    <button className="rounded-md bg-blue-900 text-white px-4 py-2">Submit Request</button>
                    <button className="rounded-md border px-4 py-2">Save Draft</button>
                </div>
            </div>

            {/* Previous Requests */}
            <div className="rounded-xl border bg-white p-4">
                <div className="font-medium mb-3">Previous Requests</div>
                <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                            <div className="font-medium">Assistant Professor – Mathematics</div>
                            <div className="text-xs text-gray-500">Submitted on Jan 15, 2024</div>
                        </div>
                        <span className="rounded-full bg-yellow-100 text-yellow-800 px-2.5 py-0.5 text-xs font-medium">Pending</span>
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-3">
                        <div>
                            <div className="font-medium">Instructor – Chemistry</div>
                            <div className="text-xs text-gray-500">Submitted on Jan 10, 2024</div>
                        </div>
                        <span className="rounded-full bg-green-100 text-green-700 px-2.5 py-0.5 text-xs font-medium">Approved</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
