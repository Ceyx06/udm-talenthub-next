// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function HRLoginPage() {
  const router = useRouter();
  const search = useSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="relative min-h-screen">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: "url('/bg-udm.jpg')" }} // ensure this exists in /public
        aria-hidden
      />
      {/* Dark overlay for contrast */}
      <div className="absolute inset-0 bg-black/30" aria-hidden />

      {/* Centered glass card */}
      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="w-[520px] max-w-[92vw] rounded-2xl bg-white/65 backdrop-blur-md shadow-2xl border border-black/10">
          {/* Header row: seal + centered titles */}
          <div className="flex items-center gap-3 px-8 pt-6">
            <img
              src="/logo-udm.png"
              alt="UDM Seal"
              className="h-12 w-12 rounded-full object-contain"
            />
            <div className="flex-1 text-center pr-12">
              <h1 className="text-[24px] font-semibold tracking-wide">
                UNIVERSIDAD DE MANILA
              </h1>
              <p className="-mt-1 text-[18px] font-semibold tracking-wide">
                LOGIN
              </p>
            </div>
          </div>

          {/* Form */}
          <form className="px-10 pb-8 pt-4">
            {/* Username */}
            <div className="mb-3">
              <div className="inline-block rounded-md bg-black/10 px-3 py-1 text-sm">
                Username
              </div>
              <input
                type="text"
                placeholder="enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-2 block w-full rounded-full bg-white/90 px-4 py-2 outline-none ring-0 border border-black/10 focus:border-green-600"
              />
            </div>

            {/* Password */}
            <div className="mb-3">
              <div className="inline-block rounded-md bg-black/10 px-3 py-1 text-sm">
                Password
              </div>
              <input
                type="password"
                placeholder="enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 block w-full rounded-full bg-white/90 px-4 py-2 outline-none ring-0 border border-black/10 focus:border-green-600"
              />
            </div>

            {err && (
              <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {err}
              </div>
            )}

            {/* Slim centered green button */}
            <div className="flex justify-center">
              <button
                type="submit"
                disabled={busy}
                className="rounded-full bg-green-600 px-8 py-2 text-white font-semibold shadow hover:bg-green-700 disabled:opacity-60"
              >
                {busy ? "Signing in..." : "LOGIN"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
