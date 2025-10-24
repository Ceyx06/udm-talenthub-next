'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import PageHeader from "@/components/common/PageHeader";
import Badge from "@/components/common/Badge";
import VacancyModal from "@/components/hr/VacancyModal";
import QRCodeModal from "@/components/hr/QRCodeModal";

interface Vacancy {
  id: string;
  college: string;
  title: string;
  status: 'OPEN' | 'CLOSED' | 'DRAFT';
  description: string;
  requirements: string;
  postedDate: string;
  _count?: { applications: number };
}

export default function Page() {
  const router = useRouter();

  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVacancy, setEditingVacancy] = useState<Vacancy | null>(null);
  const [qrVacancy, setQrVacancy] = useState<Vacancy | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  useEffect(() => { fetchVacancies(); }, []);

  // SAFE fetch that never crashes on non-JSON responses
  const fetchVacancies = async () => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/hr/vacancies', { cache: 'no-store' });

      // Read as text first; then try JSON so HTML/empty bodies won't throw
      const text = await res.text();
      let payload: any = {};
      try { payload = text ? JSON.parse(text) : {}; } catch { /* ignore non-JSON */ }

      if (!res.ok) {
        const msg = payload?.error || text || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      setVacancies(payload.data ?? payload ?? []);
    } catch (err: any) {
      setVacancies([]);
      setError(err?.message || 'Error fetching vacancies');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this vacancy?')) return;
    try {
      const res = await fetch(`/api/hr/vacancies/${id}`, { method: 'DELETE' });
      const text = await res.text();
      let j: any = {};
      try { j = text ? JSON.parse(text) : {}; } catch { }
      if (!res.ok) throw new Error(j?.error || text || `HTTP ${res.status}`);
      setVacancies(vacancies.filter(v => v.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error deleting vacancy');
    }
  };

  const handleEdit = (vacancy: Vacancy) => {
    setEditingVacancy(vacancy);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingVacancy(null);
  };

  const handleModalSuccess = () => {
    fetchVacancies();
    handleModalClose();
  };

  const showQRCode = (vacancy: Vacancy) => setQrVacancy(vacancy);

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { month: '2-digit', day: '2-digit', year: 'numeric' });

  const getDaysRemaining = (postedDate: string) => {
    const posted = new Date(postedDate).getTime();
    const now = Date.now();
    const left = 15 * 24 * 60 * 60 * 1000 - (now - posted);
    return Math.max(0, Math.ceil(left / (1000 * 60 * 60 * 24)));
  };

  const isLinkActive = (postedDate: string) => getDaysRemaining(postedDate) > 0;

  const copyPublicLink = async (vacancyId: string) => {
    const base =
      process.env.NEXT_PUBLIC_BASE_URL ||
      (typeof window !== "undefined" ? window.location.origin : "");

    // Public apply URL (15-day window rule is shown in UI, your API should also enforce)
    const url = `${base}/apply?vacancy=${vacancyId}`;

    try {
      await navigator.clipboard.writeText(url);
      setCopySuccess(vacancyId);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert("Failed to copy link");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader title="Vacancies" subtitle="Manage job postings and openings" />
        <div className="text-center py-8">Loading vacancies...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Vacancies" subtitle="Manage job postings and openings" />
      {error && <div className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="rounded-lg bg-blue-900 text-white px-4 py-2 hover:bg-blue-800 transition-colors"
        >
          + Post New Vacancy
        </button>
      </div>

      {vacancies.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-gray-500">
          No vacancies posted yet. Click "Post New Vacancy" to create one.
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Job Title</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requirements</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posted Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applications</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {vacancies.map(v => {
                  const daysRemaining = getDaysRemaining(v.postedDate);
                  const linkActive = isLinkActive(v.postedDate);
                  const tone = v.status === 'OPEN' ? 'green' : v.status === 'CLOSED' ? 'red' : 'gray';

                  return (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-semibold text-gray-900">{v.title}</div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge tone="gray">{v.college}</Badge>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-700 max-w-xs truncate">{v.requirements}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">{formatDate(v.postedDate)}</div>
                        <div className={`text-xs mt-1 ${linkActive ? 'text-gray-500' : 'text-red-500'}`}>
                          {linkActive ? `Link expires in ${daysRemaining} days` : 'Link expired'}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-col gap-1">
                          <Badge tone={tone}>{v.status}</Badge>
                          <Badge tone={linkActive ? 'blue' : 'red'}>
                            {linkActive ? '15-day link active' : 'Link expired'}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {/* Navigate to Applicants filtered by this vacancy */}
                        <button
                          onClick={() => router.push(`/hr/applicants?vacancyId=${v.id}`)}
                          className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                        >
                          {v._count?.applications || 0} Applications
                        </button>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => showQRCode(v)}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            QR Code
                          </button>
                          <button
                            onClick={() => copyPublicLink(v.id)}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            {copySuccess === v.id ? 'Copied!' : 'Copy Public Link'}
                          </button>
                          <button
                            onClick={() => handleEdit(v)}
                            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(v.id)}
                            className="px-3 py-1 text-sm border border-red-300 text-red-600 rounded-md hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <VacancyModal vacancy={editingVacancy} onClose={handleModalClose} onSuccess={handleModalSuccess} />
      )}
      {qrVacancy && <QRCodeModal vacancy={qrVacancy} onClose={() => setQrVacancy(null)} />}
    </div>
  );
}
