"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading, logout } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400">Memuat Sesi CSKasir...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-6 selection:bg-blue-500 selection:text-white">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Header Dashboard */}
        <div className="flex items-center justify-between bg-slate-900 p-6 rounded-2xl border border-slate-800">
          <div>
            <span className="px-2.5 py-1 text-xs font-semibold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
              {profile?.role || "OWNER"}
            </span>
            <h1 className="text-2xl font-bold text-white mt-2">
              Selamat Datang di CSKasir Dashboard
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Email Login: <span className="text-slate-200">{user.email}</span>
            </p>
          </div>

          <button
            onClick={logout}
            className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded-xl text-sm font-medium transition-colors"
          >
            Keluar (Logout)
          </button>
        </div>

        {/* Informasi Status Sesi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800/80">
            <h3 className="text-xs uppercase font-semibold text-slate-500 mb-2">Group ID Toko</h3>
            <p className="text-lg font-mono text-blue-400">{profile?.groupId || "Belum Terhubung"}</p>
          </div>
          <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800/80">
            <h3 className="text-xs uppercase font-semibold text-slate-500 mb-2">Status Server Firebase</h3>
            <p className="text-lg font-medium text-emerald-400 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Terhubung (Active)
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}