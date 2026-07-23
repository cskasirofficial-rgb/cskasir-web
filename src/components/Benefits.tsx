import {
  Zap,
  Printer,
  BarChart3,
  CreditCard,
  Bell,
  Globe,
  LucideIcon,
} from "lucide-react";

interface BenefitItem {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  description: string;
}

const benefitsData: BenefitItem[] = [
  {
    icon: Zap,
    iconBg: "bg-emerald-500/10 border-emerald-500/20",
    iconColor: "text-emerald-400",
    title: "Toko Tetap Buka Saat Internet Mati",
    description:
      "Sinyal jelek atau listrik padam tak akan menghentikan jualan Anda. Semua transaksi tersimpan aman di HP dan sinkron otomatis saat online kembali.",
  },
  {
    icon: Printer,
    iconBg: "bg-blue-500/10 border-blue-500/20",
    iconColor: "text-blue-400",
    title: "Struk Langsung Keluar ke Pelanggan",
    description:
      "Cetak nota belanja profesional dalam hitungan detik menggunakan Bluetooth Printer 58mm. Pelanggan makin percaya pada toko Anda.",
  },
  {
    icon: BarChart3,
    iconBg: "bg-amber-500/10 border-amber-500/20",
    iconColor: "text-amber-400",
    title: "Ketahui Untung Bersih Tanpa Ribet",
    description:
      "Tidak perlu hitung manual tiap malam. CSKasir langsung menghitung laba bersih, omzet harian, dan memperingatkan stok barang yang mau habis.",
  },
  {
    icon: CreditCard,
    iconBg: "bg-purple-500/10 border-purple-500/20",
    iconColor: "text-purple-300",
    title: "Catat Piutang & Buat Pelanggan Setia",
    description:
      "Kelola catatan bon/piutang tanpa takut hilang. Berikan poin belanja bagi pelanggan langganan agar mereka selalu kembali ke toko Anda.",
  },
  {
    icon: Bell,
    iconBg: "bg-rose-500/10 border-rose-500/20",
    iconColor: "text-rose-400",
    title: "Kontrol Owner Terjamin",
    description:
      "Pemilik toko mendapatkan notifikasi instan saat kasir mengubah harga barang, melakukan pembatalan (void), atau meretur barang.",
  },
  {
    icon: Globe,
    iconBg: "bg-cyan-500/10 border-cyan-500/20",
    iconColor: "text-cyan-400",
    title: "Terima Pesanan Secara Online",
    description:
      "Toko Anda siap menerima orderan pelanggan secara digital. Ada notifikasi otomatis saat pesanan masuk dan saat pesanan siap diambil.",
  },
];

export default function Benefits() {
  return (
    <section className="py-20 bg-slate-900/40 border-y border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            Mengapa Memilih CSKasir?
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
            Solusi Tepat Agar Toko Anda <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">
              Makin Rapi & Untung Jelas
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefitsData.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="group relative p-7 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/90 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 hover:-translate-y-1 space-y-4"
              >
                <div
                  className={`w-12 h-12 rounded-xl border flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${item.iconBg} ${item.iconColor}`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">
                  {item.title}
                </h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

    </section>
  );
}