"use client";

import { useState } from "react";
import { HelpCircle, ChevronDown, Sparkles } from "lucide-react";

const faqs = [
  {
    question: "Apakah 90% fiturnya benar-benar gratis selamanya?",
    answer:
      "Benar. Untuk penggunaan Solo Owner (dijaga sendiri), semua fitur operasional dari kasir, cetak struk, stok, hingga laporan keuangan 100% gratis tanpa batasan waktu.",
  },
  {
    question: "Kapan saya perlu membayar?",
    answer:
      "Anda hanya perlu berlangganan jika toko makin berkembang dan membutuhkan penambahan akun pegawai / multi-kasir.",
  },
  {
    question: "Apakah aplikasi bisa digunakan saat internet mati (offline)?",
    answer:
      "100% Bisa! CSKasir dirancang dengan arsitektur Offline-First. Seluruh transaksi kasir dan cetak struk tetap berjalan mulus meski tanpa koneksi internet.",
  },
  {
    question: "Apakah bisa cetak struk menggunakan printer Bluetooth 58mm?",
    answer:
      "Sangat bisa. CSKasir sudah terintegrasi langsung dengan berbagai merk printer Bluetooth thermal 58mm di pasaran.",
  },
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 bg-slate-950 text-white relative border-t border-slate-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Badge & Judul FAQ (Dark Theme Gradient Glow) */}
        <div className="text-center mb-12 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pertanyaan Sering Diajukan</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
            Pertanyaan Umum Seputar <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              CSKasir
            </span>
          </h2>
        </div>

        {/* Daftar Accordion FAQ Interaktif */}
        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                onClick={() => toggleFAQ(index)}
                className={`p-6 rounded-2xl bg-slate-900/60 border transition-all duration-300 cursor-pointer ${
                  isOpen
                    ? "border-blue-500/50 shadow-xl shadow-blue-500/10 bg-slate-900/90"
                    : "border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/80"
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <HelpCircle
                      className={`w-5 h-5 shrink-0 transition-colors ${
                        isOpen ? "text-blue-400" : "text-slate-500"
                      }`}
                    />
                    <h3 className="font-bold text-base sm:text-lg text-white">
                      {faq.question}
                    </h3>
                  </div>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-300 ${
                      isOpen ? "rotate-180 text-blue-400" : ""
                    }`}
                  />
                </div>

                {isOpen && (
                  <p className="mt-4 pt-4 border-t border-slate-800/80 text-sm text-slate-300 leading-relaxed pl-8">
                    {faq.answer}
                  </p>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}