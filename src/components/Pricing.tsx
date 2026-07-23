"use client";

import { Check, Star, Download, MessageCircle } from "lucide-react";

export default function Pricing() {
  return (
    <section className="py-20 bg-slate-950 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Judul Section (Dark Theme Glow & Pill Badge) */}
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Skema Harga Transparan
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Pilih Paket Sesuai <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Skala Usaha Anda
            </span>
          </h2>
        </div>

        {/* Grid 2 Kartu Harga */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          
          {/* Kartu 1: Fitur Operasional Utama (Gratis) */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 transition-all duration-300 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/10 flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-block px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                  GRATIS SELAMANYA
                </span>
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-500/20">
                  90% Toko
                </span>
              </div>

              <h3 className="text-2xl font-extrabold text-white">
                Fitur Operasional Utama
              </h3>

              <div className="flex items-baseline gap-1">
                <span className="text-4xl font-black text-blue-400">Rp 0</span>
                <span className="text-slate-400 text-sm font-medium">/ selamanya</span>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed">
                Sangat pas untuk Toko Mandiri / Solo Owner.
              </p>

              <hr className="border-slate-800/80 my-4" />

              {/* Daftar Fitur Gratis */}
              <ul className="space-y-3.5 text-sm text-slate-300 font-medium">
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Transaksi Kasir Offline (Internet Mati)</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Scan Barcode HP & Cetak Struk 58mm</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Manajemen Stok & Laporan Profit</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Catat Piutang & Pelunasan</span>
                </li>
                <li className="flex items-center gap-3">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Poin Pelanggan, Ongkir & Admin</span>
                </li>
              </ul>
            </div>

            {/* Tombol CTA 1: Persis gaya Hero (Play Store) */}
            <a
              href="https://play.google.com/store/apps/details?id=com.cuncun.cskasir"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-200 font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-300 hover:border-blue-500 hover:bg-blue-600/15 hover:text-white hover:shadow-xl hover:shadow-blue-500/25 active:scale-95 group"
            >
              <Download className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
              <span>Pakai Gratis Sekarang</span>
            </a>
          </div>

          {/* Kartu 2: Fitur Lanjutan Multi-Kasir */}
          <div className="p-8 rounded-3xl bg-slate-900/60 border border-slate-800/80 transition-all duration-300 hover:border-emerald-500/40 hover:shadow-2xl hover:shadow-emerald-500/10 flex flex-col justify-between space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  OPSIONAL
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                  10% Toko
                </span>
              </div>

              <h3 className="text-2xl font-extrabold text-white">
                Fitur Lanjutan Multi-Kasir
              </h3>

              <div className="flex items-baseline gap-1">
                <span className="text-xl font-extrabold text-emerald-400">
                  Saat Toko Makin Besar
                </span>
              </div>

              <p className="text-sm text-slate-400 leading-relaxed">
                Hanya bayar jika Anda menambah pegawai atau butuh fitur khusus.
              </p>

              <hr className="border-slate-800/80 my-4" />

              {/* Daftar Fitur Multi-Kasir */}
              <ul className="space-y-3.5 text-sm text-slate-300 font-medium">
                <li className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                  <span>Menambah Akun Pegawai / Kasir Lain</span>
                </li>
                <li className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                  <span>Pengaturan Hak Akses Setiap Pegawai</span>
                </li>
                <li className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                  <span>Fitur TOKO ONLINE Integrasi</span>
                </li>
                <li className="flex items-center gap-3">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400 shrink-0" />
                  <span>Notifikasi Realtime Orderan & Status Pelanggan</span>
                </li>
              </ul>
            </div>

            {/* Tombol CTA 2: Persis gaya Hero (WhatsApp) */}
            <a
              href="https://wa.me/628562673311"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-200 font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-300 hover:border-emerald-500 hover:bg-emerald-600/15 hover:text-white hover:shadow-xl hover:shadow-emerald-500/25 active:scale-95 group"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
              <span>Hubungi WA untuk Akses 10%</span>
            </a>
          </div>

        </div>
      </div>
    </section>
  );
}