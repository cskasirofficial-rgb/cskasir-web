import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CSKasir Digital Ecosystem",
    short_name: "CSKasir",
    description: "Aplikasi Kasir POS Offline-First & Pembukuan UMKM Indonesia",
    start_url: "/",
    display: "standalone",
    background_color: "#020617", // slate-950
    theme_color: "#2563eb", // blue-600
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
      {
        src: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  };
}