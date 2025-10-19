"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

type Props = {
    /** If user navigated directly to /hr/login or /dean/login,
     *  we can prefer that dashboard after sign-in (still role-checked). */
    preferredRole?: "hr" | "dean";
};

export default function UDMLogin({ preferredRole }: Props) {
    const router = useRouter();
    const search = useSearchParams();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);
    const [debug, setDebug] = useState<any>(null);

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();
        setErr(null);
        setBusy(true);

        // Supabase uses email; your UI text says "Username" but you can type email here
        const email = username;
        const supabase = supabaseBrowser();

        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
            setErr(error.message);
            setBusy(false);
            setDebug({ signIn: { error: error.message } });
            return;
        }

        // read role
        const { data: profile, error: profileErr } = await supabase
            .from("profiles")
            .select("role")
            .eq("id", data.user.id)
            .maybeSingle();

        if (profileErr) {
            setErr("Signed in but unable to read profile. Try again or contact admin.");
            setBusy(false);
            setDebug({ signIn: { user: data?.user?.id }, profileErr });
            return;
        }

    // respect ?redirectedFrom=...
        const back = search.get("redirectedFrom");
        if (back) return router.replace(back);

        // Prefer server-side redirect to ensure session cookie context is used
        if (profile?.role === 'hr' || profile?.role === 'dean') {
            try {
                setDebug({ signIn: { user: data?.user?.id }, profile });
                // navigate the browser so redirect is followed
                window.location.href = '/api/redirect-to-dashboard';
                return;
            } catch (e) {
                // fallback to client routing
                if (profile?.role === 'hr') return router.replace('/hr/dashboard');
                if (profile?.role === 'dean') return router.replace('/dean/dashboard');
            }
        }

        // missing or unexpected role
        setErr("Your account does not have an expected role. Contact admin if this seems wrong.");
        setBusy(false);
    }

    return (
        <div className="relative min-h-screen">
            {/* Background image */}
            <div
                className="absolute inset-0 bg-center bg-cover"
                style={{ backgroundImage: "url('/login-bg.jpg')" }}
                aria-hidden
            />
            {/* subtle dark overlay */}
            <div className="absolute inset-0 bg-black/30" aria-hidden />

            {/* Centered glass card */}
            <div className="relative z-10 flex min-h-screen items-center justify-center">
                <div className="w-[520px] max-w-[92vw] rounded-2xl bg-white/65 backdrop-blur-md shadow-2xl border border-black/10">
                    {/* Header bar exactly like your screenshot */}
                    <div className="flex items-center gap-3 px-8 pt-6">
                        <img src="/logo-udm.png" alt="UDM Seal" className="h-12 w-12 rounded-full object-contain" />
                        <div className="flex-1 text-center pr-12">
                            <h1 className="text-[24px] font-semibold tracking-wide">UNIVERSIDAD DE MANILA</h1>
                            <p className="-mt-1 text-[18px] font-semibold tracking-wide">LOGIN</p>
                        </div>
                    </div>

                    {/* Form area */}
                    <form onSubmit={onSubmit} className="px-10 pb-8 pt-4">
                        {/* Label chip + pill input (Username) */}
                        <div className="mb-3">
                            <div className="inline-block rounded-md bg-black/10 px-3 py-1 text-sm">Username</div>
                            <input
                                type="text"
                                placeholder="enter username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="mt-2 block w-full rounded-full bg-white/90 px-4 py-2 outline-none ring-0 border border-black/10 focus:border-green-600"
                            />
                        </div>

                        {debug && (
                            <pre className="mt-4 rounded bg-gray-100 p-3 text-xs">{JSON.stringify(debug, null, 2)}</pre>
                        )}

                        {/* Label chip + pill input (Password) */}
                        <div className="mb-3">
                            <div className="inline-block rounded-md bg-black/10 px-3 py-1 text-sm">Password</div>
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

                        {/* Slim green button like screenshot */}
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
