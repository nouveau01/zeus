"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Lock, User, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid email or password");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (err) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{
        background: "linear-gradient(135deg, #0a246a 0%, #245edc 50%, #0a246a 100%)",
        fontFamily: "Segoe UI, Tahoma, sans-serif",
      }}
    >
      {/* Login Dialog Window */}
      <div className="w-[380px] shadow-2xl">
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#0a246a] to-[#a6caf0] text-white px-3 py-1.5 flex items-center justify-between rounded-t-lg">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span className="font-semibold text-[13px]">ZEUS Login</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="w-5 h-5 bg-[#c0c0c0] hover:bg-[#d0d0d0] rounded-sm text-[10px] text-black flex items-center justify-center">_</button>
            <button className="w-5 h-5 bg-[#c0c0c0] hover:bg-red-500 hover:text-white rounded-sm text-[10px] text-black flex items-center justify-center">×</button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-[#f0f0f0] p-6 rounded-b-lg border border-[#808080]">
          {/* Logo/Header */}
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-[#0a246a] mb-1">ZEUS</div>
            <div className="text-[11px] text-gray-600">Field Service Management</div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 rounded flex items-center gap-2 text-red-700 text-[11px]">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className="mb-4">
              <label className="block text-[11px] text-gray-700 mb-1">
                Email Address
              </label>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-[#808080] bg-white text-[12px] focus:outline-none focus:border-[#0078d4]"
                  placeholder="user@company.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-6">
              <label className="block text-[11px] text-gray-700 mb-1">
                Password
              </label>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex-1 px-2 py-1.5 border border-[#808080] bg-white text-[12px] focus:outline-none focus:border-[#0078d4]"
                  placeholder="Enter password"
                  required
                />
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-2">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-1.5 bg-[#f0f0f0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] text-[12px] font-medium hover:bg-[#e0e0e0] active:border-t-[#808080] active:border-l-[#808080] active:border-b-white active:border-r-white disabled:opacity-50"
              >
                {loading ? "Signing in..." : "OK"}
              </button>
              <button
                type="button"
                className="px-4 py-1.5 bg-[#f0f0f0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] text-[12px] font-medium hover:bg-[#e0e0e0] active:border-t-[#808080] active:border-l-[#808080] active:border-b-white active:border-r-white"
              >
                Cancel
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-[#c0c0c0] text-center text-[10px] text-gray-500">
            Nouveau Elevator Industries, Inc.
          </div>
        </div>
      </div>
    </div>
  );
}
