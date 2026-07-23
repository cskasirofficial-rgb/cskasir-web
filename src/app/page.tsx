import type { Metadata } from "next";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Benefits from "../components/Benefits";
import TrustSection from "../components/TrustSection";
import Pricing from "../components/Pricing";
import FAQSection from "../components/FAQSection";
import Footer from "../components/Footer";

export const metadata: Metadata = {
  title: "CSKasir - Aplikasi Kasir Android POS UMKM Indonesia",
  description:
    "Fokus Jualan. Urusan Kasir Biar CSKasir yang Mengelola. Kelola stok, cetak struk Bluetooth 58mm, piutang, dan laporan profit 90% Gratis Selamanya.",
};

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-blue-500 selection:text-white font-sans antialiased">
      <Navbar />
      <Hero />
      <Benefits />
      <TrustSection />
      <Pricing />
      <FAQSection />
      <Footer />
    </div>
  );
}