"use client";

import { ShieldCheck, Zap, Store, Headphones } from "lucide-react";

const features = [
  {
    icon: ShieldCheck,
    title: "Aman & Privat",
    description: "Data keuangan toko tersimpan aman dan hanya diakses oleh Anda.",
    color: "emerald",
    borderColor: "hover:border-emerald-500/50",
    glowColor: "hover:shadow-emerald-500/15",
    iconBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  },
  {
    icon: Zap,
    title: "Ringan & Cepat",
    description: "Aplikasi tidak bikin HP lemot, ramah untuk berbagai tipe smartphone.",
    color: "blue",
    borderColor: "hover:border-blue-500/50",
    glowColor: "hover:shadow-blue-500/15",
    iconBg: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  {
    icon: Store,
    title: "Pas Untuk Warung",
    description: "Dirancang khusus untuk pola belanja warung, toko kelontong, & minimarket.",
    color: "amber",
    borderColor: "hover:border-amber-500/50",
    glowColor: "hover:shadow-amber-500/15",
    iconBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  },
  {
    icon: Headphones,
    title: "Dukungan Penuh",
    description: "Bantuan responsif lewat WhatsApp jika Anda butuh panduan setting.",
    color: "purple",
    borderColor: "hover:border-purple-500/50",
    glowColor: "hover:shadow-purple-500/15",
    iconBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  },
];

export default function TrustSection() {
  return (
    <section className="py-20 bg-slate-950 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Bingkai Luar Mewah */}
        <div className="p-8 sm:p-12 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md relative overflow-hidden">
          
          {/* Background Glow Effect Center */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

          {/* Header Section (Dark Theme Glow & Pill Badge) */}
          <div className="text-center max-w-2xl mx-auto mb-12 relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              KOMITMEN KEPERCAYAAN
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Mengapa Owner Toko <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
                Memilih CSKasir?
              </span>
            </h2>
          </div>

          {/* Grid 4 Kotak Fitur Interaktif */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {features.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className={`p-6 rounded-2xl bg-slate-950/70 border border-slate-800/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${item.borderColor} ${item.glowColor} group cursor-pointer flex flex-col justify-between`}
                >
                  <div className="space-y-4">
                    {/* Badge Icon Berpendar saat Hover */}
                    <div
                      className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${item.iconBg}`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>

                    <h3 className="text-lg font-bold text-white group-hover:text-white transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}