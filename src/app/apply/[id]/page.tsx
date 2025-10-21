"use client";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

export default function ApplyPage() {
  const { id: vacancyId } = useParams<{ id: string }>();
  const router = useRouter();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    resumeUrl: "",
    coverLetter: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(s => ({ ...s, [e.target.name]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vacancyId, ...form }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || "Submit failed");
      }
      setOk(true);
      setTimeout(() => router.push("/jobs"), 1200);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto max-w-lg p-6">
      <h1 className="text-2xl font-bold mb-4">Apply</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <input name="fullName" placeholder="Full name *" className="w-full rounded-xl border p-3" value={form.fullName} onChange={onChange} required />
        <input name="email" type="email" placeholder="Email *" className="w-full rounded-xl border p-3" value={form.email} onChange={onChange} required />
        <input name="phone" placeholder="Phone *" className="w-full rounded-xl border p-3" value={form.phone} onChange={onChange} required />
        <input name="resumeUrl" placeholder="Resume URL *" className="w-full rounded-xl border p-3" value={form.resumeUrl} onChange={onChange} required />
        <textarea name="coverLetter" placeholder="Cover letter *" className="w-full rounded-xl border p-3 h-40" value={form.coverLetter} onChange={onChange} required />
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {ok && <div className="text-green-600 text-sm">Submitted! Redirecting…</div>}
        <button disabled={busy} className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50">
          {busy ? "Submitting…" : "Submit Application"}
        </button>
      </form>
    </main>
  );
}
