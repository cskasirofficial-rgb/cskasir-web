"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Download, MessageCircle, Menu, X } from "lucide-react";

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Logo Resmi CSKasir */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-9 h-9 overflow-hidden rounded-xl bg-blue-600/20 p-1 border border-blue-500/30 transition-transform group-hover:scale-105">
            <Image
              src="/logo/logo-icon.svg"
              alt="CSKasir Logo"
              width={36}
              height={36}
              className="object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-white flex items-center gap-1">
              CS<span className="text-blue-500">Kasir</span>
            </span>
            <span className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase">
              DIGITAL ECOSYSTEM
            </span>
          </div>
        </Link>

        {/* Menu Navigasi Desktop (dengan Pendaran Teks Neon saat Hover) */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="#fitur"
            className="text-sm font-semibold text-slate-300 hover:text-sky-300 hover:drop-shadow-[0_0_10px_rgba(56,189,248,0.8)] transition-all duration-300"
          >
            Fitur Utama
          </Link>
          <Link
            href="#keunggulan"
            className="text-sm font-semibold text-slate-300 hover:text-sky-300 hover:drop-shadow-[0_0_10px_rgba(56,189,248,0.8)] transition-all duration-300"
          >
            Keunggulan
          </Link>
          <Link
            href="#download"
            className="text-sm font-semibold text-slate-300 hover:text-sky-300 hover:drop-shadow-[0_0_10px_rgba(56,189,248,0.8)] transition-all duration-300"
          >
            Download
          </Link>
        </nav>

      {/* Tombol Aksi Desktop (Persis Racikan Hover Pendaran Hero.tsx) */}
        <div className="hidden md:flex items-center gap-3">

          {/* Tombol Konsultasi WA */}
          <a
            href="https://wa.me/628562673311"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all duration-300 hover:border-emerald-500 hover:bg-emerald-600/15 hover:text-white hover:shadow-xl hover:shadow-emerald-500/25 active:scale-95"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Konsultasi WA</span>
          </a>

          {/* Tombol Download Gratis (Direct ke Play Store) */}
          <a
            href="https://play.google.com/store/apps/details?id=com.cuncun.cskasir"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 font-bold text-xs flex items-center gap-2 transition-all duration-300 hover:border-blue-500 hover:bg-blue-600/15 hover:text-white hover:shadow-xl hover:shadow-blue-500/25 active:scale-95"
          >
            <Download className="w-4 h-4 text-blue-400" />
            <span>Download Gratis</span>
          </a>

        </div>

        {/* Tombol Mobile Hamburger */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-slate-300 hover:text-white bg-slate-900 border border-slate-800 transition-colors"
          aria-label="Toggle Menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6 text-sky-400" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Menu Pop-up Mobile */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-xl px-5 pt-4 pb-6 space-y-4">
          <nav className="flex flex-col space-y-3">
            <Link
              href="#fitur"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-semibold text-slate-300 hover:text-white py-1"
            >
              Fitur Utama
            </Link>
            <Link
              href="#keunggulan"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-semibold text-slate-300 hover:text-white py-1"
            >
              Keunggulan
            </Link>
            <Link
              href="#download"
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-sm font-semibold text-slate-300 hover:text-white py-1"
            >
              Download
            </Link>
          </nav>
<div className="pt-3 flex flex-col gap-2.5 border-t border-slate-900">
            <a
              href="https://wa.me/628562673311"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 font-bold text-xs transition-all duration-300 hover:border-emerald-500 hover:bg-emerald-600/15 hover:text-white hover:shadow-xl hover:shadow-emerald-500/25 active:scale-95"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>Konsultasi WA</span>
            </a>

            <a
              href="https://play.google.com/store/apps/details?id=com.cuncun.cskasir"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-200 font-bold text-xs transition-all duration-300 hover:border-blue-500 hover:bg-blue-600/15 hover:text-white hover:shadow-xl hover:shadow-blue-500/25 active:scale-95"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>Download Gratis</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}