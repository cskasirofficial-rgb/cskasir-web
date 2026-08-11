"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { database } from "@/lib/firebase/firebase";
import { ref, onValue, get, child } from "firebase/database";

interface Pegawai {
  id: string;
  nama: string;
  email?: string;
  role: string;
  metodePembayaran?: string;
  status: string;
}

export default function KaryawanPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Data Realtime dari Firebase
  const [daftarPegawai, setDaftarPegawai] = useState<Pegawai[]>([]);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Sinkronisasi data asli dari tenant_members & users
  useEffect(() => {
    if (!profile?.groupId) return;

    setLoadingData(true);
    setErrorMessage(null);

    const tenantRef = ref(database, `tenant_members/${profile.groupId}`);

    const unsubscribe = onValue(
      tenantRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          const tenantData = snapshot.val();
          const memberUids = Object.keys(tenantData);

          try {
            // Ambil detail nama/username dari node users
            const usersSnapshot = await get(ref(database, "users"));
            const allUsers = usersSnapshot.exists() ? usersSnapshot.val() : {};

            const list: Pegawai[] = memberUids.map((uid) => {
              const memberInfo = tenantData[uid] || {};
              const userInfo = allUsers[uid] || {};

              return {
                id: uid,
                nama: userInfo.username || userInfo.nama || memberInfo.nama || "Pegawai (" + uid.substring(0, 5) + ")",
                email: userInfo.email || "-",
                role: (memberInfo.role || userInfo.role || "KASIR").toUpperCase(),
                metodePembayaran: memberInfo.metodePembayaran || "Tunai / QRIS Fisik",
                status: memberInfo.active !== false && userInfo.isActive !== false ? "Aktif" : "Nonaktif",
              };
            });

            setDaftarPegawai(list);
          } catch (err: any) {
            console.error("Gagal mengambil detail user:", err);
            // Fallback jika users tidak terbaca penuh, gunakan data tenant_members
            const fallbackList: Pegawai[] = memberUids.map((uid) => ({
              id: uid,
              nama: tenantData[uid]?.username || "Pegawai (" + uid.substring(0, 5) + ")",
              role: (tenantData[uid]?.role || "KASIR").toUpperCase(),
              status: tenantData[uid]?.active !== false ? "Aktif" : "Nonaktif",
            }));
            setDaftarPegawai(fallbackList);
          }
        } else {
          setDaftarPegawai([]);
        }
        setLoadingData(false);
      },
      (error) => {
        console.error("Firebase Error:", error);
        setErrorMessage(`Gagal memuat data dari Firebase: ${error.message}`);
        setLoadingData(false);
      }
    );

    return () => unsubscribe();
  }, [profile?.groupId]);

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

  const filteredPegawai = daftarPegawai.filter(
    (k) =>
      k.nama?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      k.role?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-emerald-500 selection:text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />

        <main className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Manajemen Pegawai
                </h1>
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                  {filteredPegawai.length} Pegawai
                </span>
              </div>
              <p className="text-sm text-slate-400 mt-1">
                Data pegawai tersinkronisasi dari Group ID:{" "}
                <span className="font-mono text-blue-400">{profile?.groupId || "-"}</span>
              </p>
            </div>
          </div>

          {/* Kotak Pencarian */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
            <svg className="w-5 h-5 text-slate-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari nama atau jabatan pegawai..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 w-full"
            />
          </div>

          {/* Pesan Error Jika Ada */}
          {errorMessage && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-400 text-sm">
              {errorMessage}
            </div>
          )}

          {/* Tabel Daftar Pegawai */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6">Nama Pegawai</th>
                    <th className="py-4 px-6">Jabatan / Role</th>
                    <th className="py-4 px-6">Status Akun</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loadingData ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-slate-500">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                          Menyinkronkan data pegawai dari tenant toko...
                        </div>
                      </td>
                    </tr>
                  ) : filteredPegawai.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-10 text-slate-500">
                        <p className="text-slate-400 font-medium">Tidak ada data pegawai yang terhubung pada tenant ini.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredPegawai.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-semibold text-white">{item.nama}</p>
                          <p className="text-[11px] font-mono text-slate-500">UID: {item.id}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold uppercase rounded-md border ${
                              item.role === "OWNER"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : item.role === "MANAGER"
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                : item.role === "SUPERVISOR"
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                : item.role === "CUSTOMER"
                                ? "bg-slate-500/10 text-slate-400 border-slate-500/20"
                                : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            }`}
                          >
                            {item.role}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border ${
                            item.status === "Aktif"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-red-500/10 text-red-400 border-red-500/20"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${item.status === "Aktif" ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`}></span>
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}