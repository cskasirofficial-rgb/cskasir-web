"use client";

import Image from "next/image";
import { Download, MessageCircle, ShieldCheck, MapPin, PhoneCall } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800/80 pt-16 pb-12 relative overflow-hidden">
      {/* Background Glow Effect */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-slate-800/80">
          
          {/* Kolom 1: Branding & Deskripsi */}
          <div className="md:col-span-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="relative w-10 h-10 overflow-hidden rounded-xl bg-blue-600/20 p-1 border border-blue-500/30">
                <Image
                  src="/logo/logo-icon.svg"
                  alt="CSKasir Logo"
                  width={40}
                  height={40}
                  className="object-contain"
                />
              </div>
              <div>
                <span className="text-xl font-extrabold tracking-wider text-white block leading-none">
                  CSKasir
                </span>
                <span className="text-[10px] font-bold text-blue-400 tracking-widest uppercase">
                  DIGITAL ECOSYSTEM
                </span>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md leading-relaxed">
              Niat murni membantu pemilik toko dan UMKM Indonesia memiliki pembukuan rapi, laporan untung bersih yang jelas, serta kontrol usaha yang terjamin.
            </p>
          </div>

          {/* Kolom 2: AKSES APLIKASI (Diubah Menjadi Tombol Mewah & Berpendar) */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
              AKSES APLIKASI
            </h4>
            <ul className="space-y-3 text-xs font-semibold">
              <li>
                <a
                  href="https://play.google.com/store/apps/details?id=com.cuncun.cskasir"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-200 transition-all duration-300 hover:border-blue-500 hover:bg-blue-600/15 hover:text-white hover:shadow-xl hover:shadow-blue-500/25 active:scale-95 group"
                >
                  <Download className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
                  <span>Download di Play Store</span>
                </a>
              </li>
              <li>
                <a
                  href="https://wa.me/628562673311"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-200 transition-all duration-300 hover:border-emerald-500 hover:bg-emerald-600/15 hover:text-white hover:shadow-xl hover:shadow-emerald-500/25 active:scale-95 group"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span>Konsultasi WhatsApp</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Bantuan & Kontak */}
          <div className="md:col-span-3 space-y-4">
            <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">
              BANTUAN & KONTAK
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400 font-medium">
              <li className="flex items-center gap-2">
                <PhoneCall className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>WhatsApp: +62 856-2673-311</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span>Support: Solo Owner & Multi-Kasir</span>
              </li>
              <li className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span>Wilayah: Indonesia ID</span>
              </li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© 2026 CSKasir Digital Ecosystem. Dibuat dengan bangga untuk UMKM Indonesia.</p>
          <p className="font-mono text-[11px] text-slate-400 bg-slate-900/80 px-3 py-1 rounded-md border border-slate-800">
            v1.0.0 Enterprise Architecture
          </p>
        </div>
      </div>
    </footer>
  );
}