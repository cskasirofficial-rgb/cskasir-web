"use client";

import { useState } from "react";
import Image from "next/image";
import { LayoutDashboard, ShoppingCart, Receipt } from "lucide-react";

const tabs = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    image: "/screenshots/dashboard.jpeg", // Jika gambar masih tidak muncul, ganti .jpeg menjadi .jpg
    alt: "Dashboard CSKasir",
  },
  {
    id: "kasir",
    label: "Kasir POS",
    icon: ShoppingCart,
    image: "/screenshots/kasir.jpeg", // Jika gambar masih tidak muncul, ganti .jpeg menjadi .jpg
    alt: "Kasir POS CSKasir",
  },
  {
    id: "struk",
    label: "Struk Asli",
    icon: Receipt,
    image: "/screenshots/struk.jpeg", // Jika gambar masih tidak muncul, ganti .jpeg menjadi .jpg
    alt: "Struk CSKasir",
  },
];

export default function PhoneMockup() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-md mx-auto">
      {/* Tombol Tab Interaktif */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md shadow-xl w-full justify-between">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-300 active:scale-95 ${
                isActive
                  ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400/40 scale-[1.02]"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Bingkai Smartphone Mewah (dengan Hover Glow Ambient Sinar Biru) */}
      <div className="relative w-full max-w-[320px] aspect-[9/19] rounded-[3rem] bg-slate-900 p-3 border-4 border-slate-800/90 shadow-2xl shadow-blue-500/10 transition-all duration-500 group hover:border-blue-500/50 hover:shadow-[0_0_35px_rgba(37,99,235,0.25)]">
        {/* Notch HP */}
        <div className="absolute top-5 left-1/2 -translate-x-1/2 w-28 h-4 bg-slate-950 rounded-full z-20 flex items-center justify-center">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-800 mr-2" />
          <div className="w-1.5 h-1.5 rounded-full bg-blue-900/50" />
        </div>

        {/* Layar Tampilan Gambar Asli (Standar Kompresi Next.js) */}
        <div className="relative w-full h-full rounded-[2.3rem] overflow-hidden bg-slate-950 border border-slate-800/80">
          <Image
            src={currentTab.image}
            alt={currentTab.alt}
            fill
            priority={activeTab === "dashboard"}
            quality={75}
            className="object-cover object-top transition-all duration-500 group-hover:scale-[1.02]"
            sizes="(max-width: 640px) 280px, 320px"
          />
        </div>
      </div>
    </div>
  );
}