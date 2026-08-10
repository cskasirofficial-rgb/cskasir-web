"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/services/auth.service";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // 1. Melakukan Autentikasi ke Firebase Auth
      const user = await AuthService.login(email, password);

      // 2. Verifikasi Data Profil/Role di Realtime Database
      const profile = await AuthService.getUserProfile(user.uid);

      if (!profile) {
        setErrorMsg("Akun terautentikasi, namun data profil CSKasir tidak ditemukan.");
        setLoading(false);
        return;
      }

      // 3. Pengarahan Halaman berdasarkan Role (Perbaikan Huruf Besar/Kecil)
      const rolePengguna = profile.role ? profile.role.toLowerCase() : "";
      
      if (rolePengguna === "owner" || rolePengguna === "enterprise") {
        router.push("/dashboard");
      } else {
        setErrorMsg(`Role Anda (${profile.role}) belum memiliki akses ke Dashboard Web.`);
      }
      
    } catch (err: any) {
      console.error("Login error:", err);
      if (err.code === "auth/invalid-credential" || err.code === "auth/user-not-found" || err.code === "auth/wrong-password") {
        setErrorMsg("Email atau password yang Anda masukkan salah.");
      } else {
        setErrorMsg("Gagal melakukan login. Silakan periksa koneksi internet Anda.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans selection:bg-blue-500 selection:text-white">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
        
        {/* Header Logo & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 font-bold text-xl mb-2">
            CS
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Login CSKasir</h1>
          <p className="text-sm text-slate-400">Masuk untuk mengelola toko dan laporan bisnis Anda</p>
        </div>

        {/* Form Login */}
        <form onSubmit={handleLogin} className="space-y-4">
          {errorMsg && (
            <div className="p-3 text-xs bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              placeholder="nama@tokomu.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500 transition-colors text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:border-blue-500 transition-colors text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-medium rounded-xl transition-all shadow-lg shadow-blue-600/20 text-sm mt-2"
          >
            {loading ? "Memproses..." : "Masuk ke Dashboard"}
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-500">
            CSKasir Web Portal v1.0.0 — Ekosistem Kasir Digital
          </p>
        </div>

      </div>
    </div>
  );
}