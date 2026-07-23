"use client";

import { Download, MessageCircle, Star } from "lucide-react";
import PhoneMockup from "./PhoneMockup";

export default function Hero() {
  return (
    <section className="relative pt-32 pb-20 overflow-hidden bg-slate-950 text-white">
      {/* Background Glow Effect */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Sisi Kiri: Teks Utama & Tombol CTA */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              Aplikasi Kasir Android Offline-First
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white">
              Kelola Toko UMKM <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Lebih Rapi & Praktis
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Solusi kasir digital lengkap tanpa ketergantungan internet. Kelola stok, pelanggan, laporan keuntungan, piutang, hingga toko online dalam satu aplikasi yang sederhana.
            </p>

            {/* Fitur Unggulan Ringkas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-300 font-medium max-w-lg mx-auto lg:mx-0">
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Offline First
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                Scan Barcode
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                Bluetooth Printer
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Laporan Profit
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                Point Pelanggan
              </div>
              <div className="flex items-center gap-2 justify-center lg:justify-start">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Toko Online
              </div>
            </div>

            {/* Tombol CTA Interaktif (Hover berpendar) */}
            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
              {/* Tombol 1: Download Gratis (Play Store) */}
              <a
                href="https://play.google.com/store/apps/details?id=com.cuncun.cskasir"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-200 font-bold text-sm flex items-center gap-2.5 transition-all duration-300 hover:border-blue-500 hover:bg-blue-600/15 hover:text-white hover:shadow-xl hover:shadow-blue-500/25 active:scale-95"
              >
                <Download className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                <span>Download Gratis</span>
              </a>

              {/* Tombol 2: Hubungi Kami (WhatsApp) */}
              <a
                href="https://wa.me/628562673311"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-200 font-bold text-sm flex items-center gap-2.5 transition-all duration-300 hover:border-emerald-500 hover:bg-emerald-600/15 hover:text-white hover:shadow-xl hover:shadow-emerald-500/25 active:scale-95"
              >
                <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                <span>Hubungi Kami</span>
              </a>
            </div>

            {/* Statistik Ringkas */}
            <div className="pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 max-w-md mx-auto lg:mx-0">
              <div>
                <div className="flex items-center gap-1 text-amber-400 text-xs mb-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                </div>
                <p className="text-xs text-slate-400">Mudah Digunakan</p>
              </div>
              <div>
                <p className="text-sm font-extrabold text-emerald-400">90% GRATIS</p>
                <p className="text-xs text-slate-400">Selamanya</p>
              </div>
              <div>
                <p className="text-sm font-extrabold text-blue-400">Multi Kasir</p>
                <p className="text-xs text-slate-400">Saat Toko Berkembang</p>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Phone Mockup */}
          <div className="lg:col-span-5 flex justify-center">
            <PhoneMockup />
          </div>

        </div>
      </div>
    </section>
  );
}