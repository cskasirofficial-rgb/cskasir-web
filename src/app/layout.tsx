import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: true,
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ? process.env.NEXT_PUBLIC_SITE_URL
  : "http://localhost:3000";

export const metadata: Metadata = {
  // 1. MetadataBase Safe
  metadataBase: new URL(siteUrl),

  // 2. Application Name & Category
  applicationName: "CSKasir",
  category: "Business",

  // 3. Title Resmi & Template SEO
  title: {
    default: "CSKasir - Aplikasi Kasir POS Offline-First & Pembukuan UMKM",
    template: "%s | CSKasir Digital Ecosystem",
  },

  // 4. Deskripsi Utama Pencarian Google
  description:
    "Aplikasi kasir digital offline-first terkemuka untuk UMKM Indonesia. Kelola stok barang, cetak struk Bluetooth 58mm, laporan profit, dan piutang tanpa kuota internet.",

  // 5. Keywords Alami
  keywords: [
    "CSKasir",
    "CS kasir",
    "aplikasi kasir offline",
    "POS kasir android",
    "aplikasi kasir UMKM gratis",
    "cetak struk bluetooth 58mm",
    "laporan untung rugi toko",
    "aplikasi kasir toko kelontong",
    "kasir warung pintar",
    "aplikasi kasir Android",
    "POS Android Indonesia",
  ],

  // 6. Konsistensi Author & Creator
  authors: [{ name: "CS Tech innovate" }],
  creator: "CS Tech innovate",
  publisher: "CSKasir Digital Ecosystem",

  // 7. Canonical URL
  alternates: {
    canonical: "/",
  },

  // 8. OpenGraph (Pratinjau WhatsApp & Sosial Media)
  openGraph: {
    title: "CSKasir - Aplikasi Kasir POS Offline-First & Pembukuan UMKM",
    description:
      "Solusi kasir digital lengkap tanpa internet untuk UMKM Indonesia. Kelola stok, cetak struk Bluetooth, dan pantau keuntungan usaha dengan mudah.",
    url: siteUrl,
    siteName: "CSKasir Digital Ecosystem",
    locale: "id_ID",
    type: "website",
    images: [
      {
        url: "/og/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "CSKasir Digital Ecosystem Banner",
      },
    ],
  },

  // 9. Twitter Card
  twitter: {
    card: "summary_large_image",
    title: "CSKasir - Aplikasi Kasir POS Offline-First",
    description:
      "Solusi kasir digital lengkap tanpa internet untuk UMKM Indonesia.",
    images: ["/og/og-image.jpg"],
  },

  // 10. Robot Pengindeks Google
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Favicon & Ikon Tab Browser
  icons: {
    icon: "/icons/icon.svg",
    shortcut: "/icons/icon.svg",
    apple: "/icons/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="scroll-smooth">
      <body
        className={`${plusJakartaSans.variable} font-sans antialiased bg-slate-950 text-white selection:bg-blue-500 selection:text-white`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}