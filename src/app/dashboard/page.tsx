"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Link from "next/link";

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-slate-400">Memuat Sesi CSKasir...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-emerald-500 selection:text-white">
      {/* Sidebar Navigasi */}
      <Sidebar />

      {/* Area Utama */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar Atas */}
        <Navbar />

        {/* Konten Dashboard */}
        <main className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
          {/* Banner Selamat Datang */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/80 p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                {profile?.role || "OWNER"}
              </div>
              <h1 className="text-2xl font-bold text-white mt-2 tracking-tight">
                Selamat Datang di CSKasir Dashboard
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Akun Aktif: <span className="text-slate-200 font-mono">{user.email}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700/50">
                Mode: Online POS Portal
              </span>
            </div>
          </div>

          {/* Kartu Statistik Cepat */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-emerald-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Transaksi</span>
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs">Hari Ini</span>
              </div>
              <p className="text-2xl font-bold text-white mt-3">0 Transaksi</p>
              <p className="text-xs text-slate-500 mt-1">Sinkronisasi Cloud Aktif</p>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-blue-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Katalog Produk</span>
                <span className="p-2 rounded-xl bg-blue-500/10 text-blue-400 text-xs">Inventori</span>
              </div>
              <p className="text-2xl font-bold text-white mt-3">0 Produk</p>
              <Link href="/dashboard/produk" className="text-xs text-blue-400 hover:underline mt-1 inline-block">
                Kelola Produk &rarr;
              </Link>
            </div>

            <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 hover:border-purple-500/30 transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Tim Kasir</span>
                <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 text-xs">Karyawan</span>
              </div>
              <p className="text-2xl font-bold text-white mt-3">Aktif</p>
              <Link href="/dashboard/karyawan" className="text-xs text-purple-400 hover:underline mt-1 inline-block">
                Kelola Karyawan &rarr;
              </Link>
            </div>
          </div>

          {/* Status Koneksi Firebase & Group ID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800/80">
              <h3 className="text-xs uppercase font-semibold text-slate-500 mb-2">Group ID Toko</h3>
              <p className="text-lg font-mono text-blue-400 tracking-wide">{profile?.groupId || "Belum Terhubung"}</p>
            </div>
            <div className="bg-slate-900/50 p-5 rounded-xl border border-slate-800/80">
              <h3 className="text-xs uppercase font-semibold text-slate-500 mb-2">Status Server Firebase</h3>
              <p className="text-lg font-medium text-emerald-400 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Terhubung (Active)
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}