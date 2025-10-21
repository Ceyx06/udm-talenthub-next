"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/axios";

type Props = {
  preferredRole?: "hr" | "dean";
};

type LoginResponse =
  | { ok: true; user: { id: string; role: "hr" | "dean" | string } }
  | { ok: false; message: string };

export default function UDMLogin({ preferredRole }: Props) {
  const router = useRouter();
  const search = useSearchParams();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [debug, setDebug] = useState<any>(null); // keep for diagnostics

  function safeRedirectPath(url: string | null): string | null {
    if (!url) return null;
    try {
      const u = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost");
      if (u.origin === window.location.origin) return u.pathname + u.search + u.hash;
      return null;
    } catch {
      return null;
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);

    try {
      // Axios version (cookies enabled via withCredentials on the instance)
      const { data: payload, status } = await api.post<LoginResponse>(
        "/api/auth/login",
        { username, password }
      );

      if (!("ok" in payload) || !payload.ok) {
        const message = "message" in payload && payload.message ? payload.message : "Invalid username or password.";
        setErr(message);
        setBusy(false);
        setDebug({ login: { status, payload } });
        return;
      }

      const role = payload.user.role;

      const redirectedFrom = safeRedirectPath(search.get("redirectedFrom"));
      if (redirectedFrom) {
        router.replace(redirectedFrom);
        return;
      }

      if (preferredRole && role === preferredRole) {
        router.replace(preferredRole === "hr" ? "/hr/dashboard" : "/dean/dashboard");
        return;
      }

      if (role === "hr") {
        router.replace("/hr/dashboard");
        return;
      }
      if (role === "dean") {
        router.replace("/dean/dashboard");
        return;
      }

      setErr("Your account does not have an expected role. Contact admin if this seems wrong.");
      setBusy(false);
    } catch (error: any) {
      // Axios error handling
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Something went wrong. Please try again.";
      setErr(message);
      setBusy(false);
      setDebug({
        axios: {
          status: error?.response?.status,
          data: error?.response?.data,
        },
      });
    }
  }

  return (
    <div className="relative min-h-screen">
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: "url('/login-bg.jpg')" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/30" aria-hidden />

      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="w-[520px] max-w-[92vw] rounded-2xl bg-white/65 backdrop-blur-md shadow-2xl border border-black/10">
          <div className="flex items-center gap-3 px-8 pt-6">
            <img src="/logo-udm.png" alt="UDM Seal" className="h-12 w-12 rounded-full object-contain" />
            <div className="flex-1 text-center pr-12">
              <h1 className="text-[24px] font-semibold tracking-wide">UNIVERSIDAD DE MANILA</h1>
              <p className="-mt-1 text-[18px] font-semibold tracking-wide">LOGIN</p>
            </div>
          </div>

          <form onSubmit={onSubmit} className="px-10 pb-8 pt-4">
            <div className="mb-3">
              <div className="inline-block rounded-md bg-black/10 px-3 py-1 text-sm">Username</div>
              <input
                type="text"
                placeholder="enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="mt-2 block w-full rounded-full bg-white/90 px-4 py-2 outline-none ring-0 border border-black/10 focus:border-green-600"
                autoComplete="username"
              />
            </div>

            <div className="mb-3">
              <div className="inline-block rounded-md bg-black/10 px-3 py-1 text-sm">Password</div>
              <input
                type="password"
                placeholder="enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-2 block w-full rounded-full bg-white/90 px-4 py-2 outline-none ring-0 border border-black/10 focus:border-green-600"
                autoComplete="current-password"
              />
            </div>

            {err && (
              <div className="mb-3 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                {err}
              </div>
            )}

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={busy}
                className="rounded-full bg-green-600 px-8 py-2 text-white font-semibold shadow hover:bg-green-700 disabled:opacity-60"
              >
                {busy ? "Signing in..." : "LOGIN"}
              </button>
            </div>

            {debug && (
              <pre className="mt-4 rounded bg-gray-100 p-3 text-xs whitespace-pre-wrap break-all">
                {JSON.stringify(debug, null, 2)}
              </pre>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}