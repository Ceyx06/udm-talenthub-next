// Server component
export const revalidate = 30; // revalidate every 30s (or use fetch no-store)

type Vacancy = {
  id: string; title: string; college: string;
  requirements: string; postedDate: string;
};

async function getVacancies(): Promise<Vacancy[]> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/vacancies`, {
    // during dev without NEXT_PUBLIC_BASE_URL, Next will prefix with same origin
    cache: "no-store",
  });
  const j = await res.json();
  if (!res.ok) throw new Error(j?.error || `HTTP ${res.status}`);
  return j.data ?? [];
}

export default async function JobsPage() {
  const rows = await getVacancies();
  return (
    <main className="max-w-4xl mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Open Vacancies</h1>
      {rows.length === 0 ? (
        <div className="rounded-xl border p-6 text-gray-600">No open vacancies right now.</div>
      ) : (
        <ul className="space-y-3">
          {rows.map(v => (
            <li key={v.id} className="rounded-xl border p-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="font-semibold text-lg">{v.title}</h2>
                <div className="text-sm text-gray-500">{v.college}</div>
                <p className="text-sm mt-2">{v.requirements}</p>
              </div>
              <a
                href={`/jobs/${v.id}`}
                className="px-3 py-2 rounded-md border border-blue-600 text-blue-600 hover:bg-blue-50"
              >
                View & Apply
              </a>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
