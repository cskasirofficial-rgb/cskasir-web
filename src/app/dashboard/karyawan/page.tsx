"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { database } from "@/lib/firebase/firebase";
import { ref, onValue, push, set, remove } from "firebase/database";

interface Pegawai {
  id: string;
  nama: string;
  password?: string;
  role: "MANAGER" | "SUPERVISOR" | "KASIR" | "CUSTOMER";
  metodePembayaran: "TUNAI_QRIS_FISIK" | "QRIS_DIGITAL";
  status?: string;
  createdAt?: number;
}

export default function KaryawanPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Form State Selaras Aplikasi HP
  const [nama, setNama] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"MANAGER" | "SUPERVISOR" | "KASIR" | "CUSTOMER">("KASIR");
  const [metodePembayaran, setMetodePembayaran] = useState<"TUNAI_QRIS_FISIK" | "QRIS_DIGITAL">("TUNAI_QRIS_FISIK");

  // Data Realtime Firebase
  const [daftarPegawai, setDaftarPegawai] = useState<Pegawai[]>([]);

  // Proteksi Login
  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Sinkronisasi Realtime Firebase Toko
  useEffect(() => {
    if (!profile?.groupId) return;

    const pegawaiRef = ref(database, `pegawai/${profile.groupId}`);
    const unsubscribe = onValue(pegawaiRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: Pegawai[] = Object.keys(data).map((key) => ({
          id: key,
          nama: data[key].nama || data[key].namaPanggilan || "Tanpa Nama",
          password: data[key].password || "********",
          role: data[key].role || "KASIR",
          metodePembayaran: data[key].metodePembayaran || (data[key].isQrisDigital ? "QRIS_DIGITAL" : "TUNAI_QRIS_FISIK"),
          status: data[key].status || "Aktif",
          createdAt: data[key].createdAt,
        }));
        setDaftarPegawai(list);
      } else {
        setDaftarPegawai([]);
      }
      setLoadingData(false);
    });

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

  // Simpan Pegawai Baru
  const handleTambahPegawai = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama || password.length < 8 || !profile?.groupId) {
      if (password.length < 8) alert("Password minimal harus 8 karakter!");
      return;
    }

    try {
      const pegawaiRef = ref(database, `pegawai/${profile.groupId}`);
      const newPegawaiRef = push(pegawaiRef);

      await set(newPegawaiRef, {
        nama,
        password,
        role,
        metodePembayaran,
        status: "Aktif",
        createdAt: Date.now(),
      });

      // Reset Form & Tutup Modal
      setNama("");
      setPassword("");
      setRole("KASIR");
      setMetodePembayaran("TUNAI_QRIS_FISIK");
      setIsModalOpen(false);
    } catch (error) {
      console.error("Gagal menambah pegawai:", error);
      alert("Terjadi kesalahan saat menyimpan ke server Firebase.");
    }
  };

  // Hapus Pegawai
  const handleHapusPegawai = async (id: string, namaPegawai: string) => {
    if (!profile?.groupId) return;
    if (confirm(`Apakah Anda yakin ingin menghapus pegawai "${namaPegawai}"?`)) {
      try {
        const itemRef = ref(database, `pegawai/${profile.groupId}/${id}`);
        await remove(itemRef);
      } catch (error) {
        console.error("Gagal menghapus:", error);
      }
    }
  };

  const filteredPegawai = daftarPegawai.filter((k) =>
    k.nama?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-emerald-500 selection:text-white">
      {/* Sidebar Navigasi */}
      <Sidebar />

      {/* Area Utama */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Navbar Header */}
        <Navbar />

        {/* Konten Halaman */}
        <main className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
          {/* Header & Tombol Tambah */}
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
                Kelola hak akses & akun kasir untuk Group ID:{" "}
                <span className="font-mono text-blue-400">{profile?.groupId || "-"}</span>
              </p>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              Tambah Pegawai
            </button>
          </div>

          {/* Kotak Pencarian */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
            <svg className="w-5 h-5 text-slate-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari nama pegawai kasir..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 w-full"
            />
          </div>

          {/* Tabel Daftar Pegawai */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/60 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6">Nama Pegawai</th>
                    <th className="py-4 px-6">Jabatan / Role</th>
                    <th className="py-4 px-6">Metode Pembayaran Kasir</th>
                    <th className="py-4 px-6">Status</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loadingData ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500">
                        Menyinkronkan data dengan Firebase...
                      </td>
                    </tr>
                  ) : filteredPegawai.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-500">
                        Belum ada pegawai terdaftar pada toko ini.
                      </td>
                    </tr>
                  ) : (
                    filteredPegawai.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-semibold text-white">{item.nama}</p>
                          <p className="text-[11px] font-mono text-slate-500">ID: {item.id}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 text-xs font-semibold uppercase rounded-md border ${
                            item.role === "MANAGER"
                              ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                              : item.role === "SUPERVISOR"
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : item.role === "CUSTOMER"
                              ? "bg-slate-500/10 text-slate-400 border-slate-500/20"
                              : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                          }`}>
                            {item.role}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-1 text-xs font-medium rounded-md border ${
                            item.metodePembayaran === "QRIS_DIGITAL"
                              ? "bg-blue-950/60 text-blue-300 border-blue-800/50"
                              : "bg-emerald-950/60 text-emerald-300 border-emerald-800/50"
                          }`}>
                            {item.metodePembayaran === "QRIS_DIGITAL"
                              ? "QRIS Digital (Layar HP)"
                              : "Tunai / QRIS Fisik (Meja)"}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            {item.status || "Aktif"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => handleHapusPegawai(item.id, item.nama)}
                            className="text-xs text-red-400 hover:text-red-300 px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 transition-colors"
                          >
                            Hapus
                          </button>
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

      {/* Modal Dialog Tambah Pegawai (100% Sesuai Screenshot Android) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 sm:p-7 shadow-2xl space-y-5 animate-in fade-in duration-200">
            <h3 className="text-xl font-bold text-white tracking-tight">Tambah Pegawai</h3>

            <form onSubmit={handleTambahPegawai} className="space-y-5">
              {/* Input Nama Panggilan */}
              <div>
                <input
                  type="text"
                  required
                  placeholder="Nama Panggilan saja(Contoh: tasya)"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Input Password */}
              <div>
                <input
                  type="password"
                  required
                  minLength={8}
                  placeholder="Password (Min. 8 Karakter)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-800/80 border border-slate-700 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Pilihan Jabatan / Role */}
              <div className="space-y-2.5">
                <p className="text-sm font-semibold text-slate-300">Pilih Jabatan / Role:</p>
                <div className="space-y-2">
                  {(["MANAGER", "SUPERVISOR", "KASIR", "CUSTOMER"] as const).map((r) => (
                    <label key={r} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name="roleSelection"
                        value={r}
                        checked={role === r}
                        onChange={() => setRole(r)}
                        className="w-4 h-4 text-emerald-500 bg-slate-800 border-slate-600 focus:ring-0 focus:ring-offset-0"
                      />
                      <span className={`text-sm tracking-wide ${role === r ? "text-white font-medium" : "text-slate-400 group-hover:text-slate-200"}`}>
                        {r}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 space-y-2.5">
                <p className="text-sm font-semibold text-slate-300">Metode Pembayaran Kasir Ini:</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="metodeBayarSelection"
                      value="TUNAI_QRIS_FISIK"
                      checked={metodePembayaran === "TUNAI_QRIS_FISIK"}
                      onChange={() => setMetodePembayaran("TUNAI_QRIS_FISIK")}
                      className="w-4 h-4 text-emerald-500 bg-slate-800 border-slate-600 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className={`text-sm ${metodePembayaran === "TUNAI_QRIS_FISIK" ? "text-white font-medium" : "text-slate-400 group-hover:text-slate-200"}`}>
                      Tunai / QRIS Fisik (Akrilik di meja)
                    </span>
                  </label>

                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="metodeBayarSelection"
                      value="QRIS_DIGITAL"
                      checked={metodePembayaran === "QRIS_DIGITAL"}
                      onChange={() => setMetodePembayaran("QRIS_DIGITAL")}
                      className="w-4 h-4 text-emerald-500 bg-slate-800 border-slate-600 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className={`text-sm ${metodePembayaran === "QRIS_DIGITAL" ? "text-white font-medium" : "text-slate-400 group-hover:text-slate-200"}`}>
                      QRIS Digital (Muncul di layar HP)
                    </span>
                  </label>
                </div>
              </div>

              {/* Tombol Aksi Batal & Simpan */}
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 text-sm font-semibold text-slate-400 hover:text-white uppercase transition-colors"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-full text-sm uppercase transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                  SIMPAN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}