// app/login/page.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, getSession } from "next-auth/react";

export default function HRLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);

    try {
      console.log('Attempting login with NextAuth...');
      
      const result = await signIn('credentials', {
        email: username,
        password: password,
        redirect: false,
      });

      console.log('Login result:', result);

      if (result?.error) {
        setErr('Invalid username or password');
        setBusy(false);
        return;
      }

      if (result?.ok) {
        console.log('Login successful!');
        
        // Give NextAuth time to set the cookie
        await new Promise(resolve => setTimeout(resolve, 200));
        
        // Use getSession() instead of manual fetch
        const session = await getSession();
        
        console.log('Session data:', session);
        
        if (!session || !session.user) {
          setErr('Failed to retrieve session. Please try again.');
          setBusy(false);
          return;
        }
        
        // Store user in localStorage for your custom auth checks
        const userData = {
          id: session.user.id,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
        };
        
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('Stored in localStorage:', userData);
        
        // Role-based redirect
        const role = session.user.role?.toUpperCase();
        console.log('User role (uppercase):', role);
        console.log('Raw role from session:', session.user.role);
        
        let redirectTo = "/hr/dashboard";

        if (role === "HR") {
          redirectTo = "/hr/dashboard";
        } else if (role === "DEAN") {
          redirectTo = "/dean/dashboard";
        } else {
          // Fallback for unknown roles
          console.warn('Unknown role, using default redirect');
          redirectTo = "/hr/dashboard";
        }

        console.log('Redirecting to:', redirectTo);
        console.log('About to redirect with window.location.href');
        
        // Use window.location for hard redirect (ensures cookies are sent)
        window.location.href = redirectTo;
      } else {
        // If result is not ok and no error, something went wrong
        setErr('Login failed. Please try again.');
        setBusy(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      setErr("An error occurred. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      <div
        className="absolute inset-0 bg-center bg-cover"
        style={{ backgroundImage: "url('/bg-udm.jpg')" }}
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/30" aria-hidden />

      <div className="relative z-10 flex min-h-screen items-center justify-center">
        <div className="w-[520px] max-w-[92vw] rounded-2xl bg-white/65 backdrop-blur-md shadow-2xl border border-black/10">
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

          <form onSubmit={handleSubmit} className="px-10 pb-8 pt-4">
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