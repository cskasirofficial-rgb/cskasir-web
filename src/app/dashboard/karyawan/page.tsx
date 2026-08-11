"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

interface Karyawan {
  id: string;
  nama: string;
  email: string;
  role: string;
  status: "Aktif" | "Nonaktif";
}

export default function KaryawanPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  // Data contoh awal kasir toko
  const [daftarKaryawan] = useState<Karyawan[]>([
    {
      id: "KSR-001",
      nama: "Kasir Utama",
      email: "kasir1@cskasir.com",
      role: "KASIR",
      status: "Aktif",
    },
  ]);

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
          <p className="text-sm text-slate-400">Memuat Data Karyawan...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  const filteredKaryawan = daftarKaryawan.filter(
    (k) =>
      k.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-emerald-500 selection:text-white">
      {/* Sidebar Navigasi */}
      <Sidebar />

      {/* Area Utama */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar Header */}
        <Navbar />

        {/* Konten Halaman Karyawan */}
        <main className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
          {/* Header & Tombol Tambah */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Manajemen Karyawan
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                  {filteredKaryawan.length} Kasir
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Kelola hak akses dan akun kasir untuk Group ID:{" "}
                <span className="font-mono text-blue-400">{profile?.groupId || "-"}</span>
              </p>
            </div>

            <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Tambah Karyawan
            </button>
          </div>

          {/* Kotak Pencarian */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
            <svg className="w-5 h-5 text-slate-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari nama atau email kasir..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 w-full"
            />
          </div>

          {/* Tabel Daftar Karyawan */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6">ID Karyawan</th>
                    <th className="py-4 px-6">Nama</th>
                    <th className="py-4 px-6">Email Login</th>
                    <th className="py-4 px-6">Peran (Role)</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredKaryawan.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 font-mono text-xs text-blue-400">{item.id}</td>
                      <td className="py-4 px-6 font-semibold text-white">{item.nama}</td>
                      <td className="py-4 px-6 font-mono text-xs text-slate-400">{item.email}</td>
                      <td className="py-4 px-6">
                        <span className="px-2.5 py-1 text-xs font-semibold uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                          {item.role}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button className="text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 transition-colors">
                          Edit
                        </button>
                        <button className="text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 transition-colors">
                          Hapus
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}