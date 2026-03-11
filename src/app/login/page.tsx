"use client";

import { signIn, useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

type AuthMode = "none" | "sso" | "manual";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const { data: session, update: updateSession } = useSession();

  const [authMode, setAuthMode] = useState<AuthMode | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);

  // Set-password state
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setPasswordError, setSetPasswordError] = useState("");
  const [settingPassword, setSettingPassword] = useState(false);

  // Fetch auth mode on mount
  useEffect(() => {
    fetch("/api/auth-mode")
      .then((r) => r.json())
      .then((d) => setAuthMode(d.mode))
      .catch(() => setAuthMode("sso"));
  }, []);

  // Check if user needs to set password (mustResetPassword)
  const mustReset = session?.user?.mustResetPassword === true;

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);

    const result = await signIn("credentials", {
      redirect: false,
      email: email.toLowerCase().trim(),
      password,
    });

    setLoading(false);

    if (result?.error) {
      setLoginError("Invalid email or password.");
    } else if (result?.ok) {
      // Session will update via useSession — if mustResetPassword, the set-password form shows
      await updateSession();
      // Small delay to let session propagate
      setTimeout(() => {
        // If no mustResetPassword, redirect to app
        if (!session?.user?.mustResetPassword) {
          window.location.href = "/";
        }
      }, 500);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetPasswordError("");

    if (newPassword.length < 8) {
      setSetPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setSetPasswordError("Passwords do not match.");
      return;
    }

    setSettingPassword(true);

    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });

      if (res.ok) {
        // Password set — redirect to app
        window.location.href = "/";
      } else {
        const data = await res.json();
        setSetPasswordError(data.error || "Failed to set password.");
      }
    } catch {
      setSetPasswordError("Network error. Please try again.");
    } finally {
      setSettingPassword(false);
    }
  };

  // Loading state while fetching auth mode
  if (authMode === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Subtle grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white tracking-wider mb-2">
            Z.E.U.S.
          </h1>
          <p className="text-slate-400 text-sm tracking-widest uppercase">
            Field Service Management
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/10">
          {/* Error Message */}
          {(error || loginError) && (
            <div className="mb-6 p-3 bg-red-500/20 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-200 text-sm">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error === "AccessDenied"
                ? "Your account is not authorized. Contact your administrator."
                : loginError || "An error occurred. Please try again."}
            </div>
          )}

          {/* ===== SET PASSWORD FORM (mustResetPassword) ===== */}
          {mustReset && (
            <form onSubmit={handleSetPassword}>
              <div className="mb-4 text-center">
                <div className="text-white text-lg font-semibold mb-1">Set Your Password</div>
                <div className="text-slate-400 text-sm">Welcome! Please set your permanent password.</div>
              </div>

              {setPasswordError && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm">
                  {setPasswordError}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-1">New Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full py-2.5 px-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                    placeholder="At least 8 characters"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-1">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full py-2.5 px-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                    placeholder="Re-enter your password"
                  />
                </div>
                <button
                  type="submit"
                  disabled={settingPassword}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {settingPassword ? "Setting Password..." : "Set Password"}
                </button>
              </div>
            </form>
          )}

          {/* ===== SSO LOGIN ===== */}
          {!mustReset && authMode === "sso" && (
            <button
              type="button"
              onClick={() => signIn("google", { callbackUrl: "/" })}
              className="w-full py-3 px-4 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-lg border border-gray-200 shadow-sm transition-all duration-200 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </button>
          )}

          {/* ===== MANUAL LOGIN ===== */}
          {!mustReset && authMode === "manual" && (
            <form onSubmit={handleManualLogin}>
              <div className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full py-2.5 px-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                    placeholder="you@nouveauelevator.com"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm mb-1">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full py-2.5 px-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                    placeholder="Enter your password"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {loading ? "Signing in..." : "Sign In"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-xs">
            Nouveau Elevator Industries, Inc.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
