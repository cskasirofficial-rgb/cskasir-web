"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { database } from "@/lib/firebase/firebase";
import { ref, onValue, update, get } from "firebase/database";

export default function LaporanPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();

  const [transaksiList, setTransaksiList] = useState<any[]>([]);
  const [adjustmentList, setAdjustmentList] = useState<any[]>([]);
  const [produkMaster, setProdukMaster] = useState<any[]>([]);
  
  const [filter, setFilter] = useState("Minggu Ini");
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  const [selectedTrx, setSelectedTrx] = useState<any>(null);
  const [showProfit, setShowProfit] = useState(false);
  const [showBestSeller, setShowBestSeller] = useState(false);
  const [showVoid, setShowVoid] = useState(false);
  const [showPiutang, setShowPiutang] = useState(false);

  const [voidReason, setVoidReason] = useState("");
  const [cicilan, setCicilan] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!profile?.groupId) return;
    const prodRef = ref(database, `stok/${profile.groupId}`);
    onValue(prodRef, (snap) => {
      if (snap.exists()) {
        const pList = Object.keys(snap.val()).map(k => ({ id: k, ...snap.val()[k] }));
        setProdukMaster(pList);
      }
    });
  }, [profile?.groupId]);

  const getTimeRange = () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (filter === "Minggu Ini") {
      const day = start.getDay(); 
      const diff = start.getDate() - day;
      start.setDate(diff);
    } else if (filter === "Bulan Ini") {
      start.setDate(1);
      end.setMonth(end.getMonth() + 1, 0);
    } else if (filter === "Tahun Ini") {
      start.setMonth(0, 1);
      end.setMonth(11, 31);
    } else if (filter === "Semua") {
      start.setFullYear(2020, 0, 1);
    }
    return { start: start.getTime(), end: end.getTime() };
  };

  useEffect(() => {
    if (!profile?.groupId) return;
    setLoadingData(true);
    const { start, end } = getTimeRange();

    const trxRef = ref(database, `transaksi/${profile.groupId}`);
    const adjRef = ref(database, `transaksi_adjustment/${profile.groupId}`);

    onValue(adjRef, (adjSnap) => {
      const adjs: any[] = [];
      if (adjSnap.exists()) {
        adjSnap.forEach(child => { adjs.push({ id: child.key, ...child.val() }); });
      }
      setAdjustmentList(adjs);

      onValue(trxRef, (snap) => {
        const list: any[] = [];
        if (snap.exists()) {
          snap.forEach(child => {
            const data = child.val();
            const ts = data.timestamp || data.waktu || 0;
            if (ts >= start && ts <= end) {
              list.push({ id: child.key, ...data });
            }
          });
        }
        setTransaksiList(list.sort((a, b) => b.timestamp - a.timestamp));
        setLoadingData(false);
      });
    });
  }, [profile?.groupId, filter]);

  if (loading) return null;

  const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID").format(angka || 0);

  const processedList = transaksiList.map(trx => {
    const koreksi = adjustmentList.filter(a => a.trxId === trx.id);
    const totalKoreksi = koreksi.reduce((sum, a) => sum + (Number(a.deltaTotal) || 0), 0);
    
    // 🔥 PERBAIKAN: Hitung ulang Subtotal Item untuk memastikan tidak ada Rp 0
    let manualSubtotalItems = 0;
    if (trx.items) {
        Object.values(trx.items).forEach((item: any) => {
            const h = Number(item.harga_jual || item.hargaJual || item.harga || 0);
            const q = Number(item.qty || item.jumlah || item.jml || 1);
            manualSubtotalItems += (h * q);
        });
    }

    const totalAsliDB = Number(trx.totalHarga || trx.total || trx.bayar || manualSubtotalItems);
    const finalTotal = totalAsliDB + totalKoreksi;
    
    const isVoid = trx.isVoid === true || trx.isVoid === "true";
    const status = trx.status || trx.statusTrx || "SELESAI";
    
    let finalBayar = Number(trx.bayar || trx.uangBayar) || 0;
    if (status !== "UTANG" && status !== "PIUTANG" && finalBayar < finalTotal) {
        finalBayar = finalTotal;
    }

    return { ...trx, finalTotal, isVoid, finalBayar, koreksi, status };
  }).filter(t => 
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (t.kasirName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.customerName || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalOmzetLayar = processedList.filter(t => !t.isVoid).reduce((sum, t) => sum + t.finalTotal, 0);

  const calculateProfit = () => {
    let omzetSum = 0;
    let modalSum = 0;
    processedList.filter(t => !t.isVoid).forEach(trx => {
        omzetSum += trx.finalTotal;
        let trxModal = Number(trx.totalModal || 0);
        
        if (trxModal === 0 && trx.items) {
            Object.values(trx.items).forEach((item: any) => {
                const pId = item.produkId || item.id;
                const qty = item.qty || item.jumlah || 1;
                const m = produkMaster.find(p => p.id === pId || p.nama_produk === item.nama_produk)?.harga_modal || 0;
                trxModal += (qty * m);
            });
        }
        modalSum += trxModal;
    });
    return { omzetSum, modalSum, profit: omzetSum - modalSum };
  };

  const getBestSeller = () => {
      const mapTerlaris: Record<string, number> = {};
      const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
      
      transaksiList.filter(t => !t.isVoid && (t.timestamp || t.waktu) >= thirtyDaysAgo).forEach(trx => {
          if (trx.items) {
              Object.values(trx.items).forEach((item: any) => {
                  const nama = item.nama_produk || item.namaProduk || "Produk";
                  const qty = Number(item.qty || item.jumlah || 1);
                  mapTerlaris[nama] = (mapTerlaris[nama] || 0) + qty;
              });
          }
      });
      return Object.entries(mapTerlaris).sort((a, b) => b[1] - a[1]).slice(0, 10);
  };

  const handleExportCSV = () => {
      let csv = "sep=;\nTanggal;Jam;No Transaksi;Kasir;Status;Nama Barang;Harga Satuan;Qty;Subtotal\n";
      processedList.forEach(trx => {
          const date = new Date(trx.timestamp || trx.waktu);
          const tgl = `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()}`;
          const jam = `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
          const status = trx.isVoid ? "BATAL" : "SUKSES";

          csv += ` ${tgl}; ${jam}; ${trx.id};${trx.kasirName?.split("|||")[0] || ''};${status};;;;\n`;

          if (trx.items) {
              Object.values(trx.items).forEach((item: any) => {
                  const rawHarga = trx.isVoid ? 0 : Number(item.harga_jual || item.hargaJual || item.harga || 0);
                  const qty = Number(item.qty || item.jumlah || 1);
                  const rawSub = rawHarga * qty;
                  csv += `;;;;; - ${item.nama_produk || item.namaProduk || ''};${rawHarga};${qty};${rawSub}\n`;
              });
          }
          const rawTotal = trx.isVoid ? 0 : trx.finalTotal;
          csv += `;;;;;TOTAL PENJUALAN;;;${rawTotal}\n`;
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.setAttribute("download", `Laporan_${filter.replace(" ", "")}_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const handleVoid = async () => {
      if (!voidReason.trim()) return alert("Alasan wajib diisi!");
      setIsProcessing(true);
      try {
          await update(ref(database, `transaksi/${profile?.groupId}/${selectedTrx.id}`), {
              isVoid: true,
              status: "BATAL",
              voidReason: voidReason,
              voidBy: user?.displayName || user?.email || "Admin Web",
              voidAt: Date.now()
          });

          if (selectedTrx.items) {
              const updates: any = {};
              for (const key of Object.keys(selectedTrx.items)) {
                  const item = selectedTrx.items[key];
                  const pId = item.produkId || item.id;
                  if (pId && pId !== "ongkir" && pId !== "admin" && pId !== "lainnya") {
                      const pSnap = await get(ref(database, `stok/${profile?.groupId}/${pId}`));
                      if (pSnap.exists()) {
                          const currentStock = pSnap.val().total_stok || 0;
                          updates[`stok/${profile?.groupId}/${pId}/total_stok`] = currentStock + Number(item.qty || item.jumlah || 1);
                      }
                  }
              }
              if (Object.keys(updates).length > 0) {
                  await update(ref(database), updates);
              }
          }

          alert("Transaksi berhasil dibatalkan dan stok dikembalikan otomatis.");
          setShowVoid(false);
          setSelectedTrx(null);
          setVoidReason("");
      } catch (err) {
          alert("Gagal membatalkan transaksi.");
      }
      setIsProcessing(false);
  };

  const handlePiutang = async () => {
      const bayar = Number(cicilan.replace(/\D/g, ''));
      if (bayar <= 0) return alert("Nominal tidak valid!");
      setIsProcessing(true);

      try {
          const newBayar = (selectedTrx.finalBayar || 0) + bayar;
          const isLunas = newBayar >= selectedTrx.finalTotal;
          const statusBaru = isLunas ? "SELESAI" : "UTANG";

          await update(ref(database, `transaksi/${profile?.groupId}/${selectedTrx.id}`), {
              bayar: newBayar,
              status: statusBaru
          });

          alert(isLunas ? "Piutang Lunas!" : `Cicilan masuk. Sisa: Rp ${formatRupiah(selectedTrx.finalTotal - newBayar)}`);
          setShowPiutang(false);
          setSelectedTrx(null);
          setCicilan("");
      } catch(err) {
          alert("Gagal memproses pembayaran.");
      }
      setIsProcessing(false);
  };

  const handleEditKeKasir = () => {
    if (!selectedTrx) return;

    const cartToRestore: any[] = [];
    if (selectedTrx.items) {
        Object.values(selectedTrx.items).forEach((item: any) => {
            const pId = item.produkId || item.id || "0";
            const qty = Number(item.qty || item.jumlah || item.jml || 1);
            const hJual = Number(item.harga_jual || item.hargaJual || item.harga || 0);
            
            const master = produkMaster.find(p => p.id === pId || p.nama_produk === (item.nama_produk || item.namaProduk));
            
            cartToRestore.push({
                id: pId,
                nama: item.nama_produk || item.namaProduk || "Produk",
                hargaModal: Number(item.modal || item.hargaModal || item.harga_modal || (master ? master.harga_modal : 0)),
                hargaJual: hJual,
                qty: qty,
                stok: master ? (master.total_stok + qty) : 9999, 
                isCustomPrice: item.isCustomPrice === true || item.isCustomPrice === "true" || item.isCustomPriceStr === "1"
            });
        });
    }

    const editPayload = {
        isEditing: true,
        trxId: selectedTrx.id,
        waktuTransaksi: selectedTrx.timestamp || selectedTrx.waktu,
        items: cartToRestore,
        kasirName: selectedTrx.kasirName,
        customerName: selectedTrx.customerName
    };

    localStorage.setItem("edit_trx_payload", JSON.stringify(editPayload));
    router.push('/dashboard/kasir');
  };

  const hitungProfitStruk = () => {
    if (!selectedTrx || selectedTrx.isVoid) return 0;
    let modalStruk = Number(selectedTrx.totalModal || 0);

    if (modalStruk === 0 && selectedTrx.items) {
        Object.values(selectedTrx.items).forEach((item: any) => {
            const pId = item.produkId || item.id;
            const pNama = (item.nama_produk || item.namaProduk || "").toLowerCase();
            const qty = Number(item.qty || item.jumlah || 1);
            let m = Number(item.modal || item.hargaModal || item.harga_modal || 0);

            if (pId === "ongkir" || pId === "lainnya" || pNama.includes("ongkir") || pNama.includes("box")) {
                m = Number(item.harga_jual || item.hargaJual || item.harga || 0); 
            } else if (pId === "admin" || pNama.includes("admin") || pNama.includes("jasa")) {
                m = 0; 
            } else if (m === 0) {
                m = produkMaster.find(p => p.id === pId || p.nama_produk === (item.nama_produk || item.namaProduk))?.harga_modal || 0;
            }
            modalStruk += (qty * m);
        });
    }

    if (selectedTrx.koreksi && selectedTrx.koreksi.length > 0) {
        selectedTrx.koreksi.forEach((adj: any) => {
            if (adj.items) {
                Object.values(adj.items).forEach((ai: any) => {
                    const qDelta = Number(ai.qtyDelta || 0);
                    const m = produkMaster.find(p => p.id === ai.produkId || p.nama_produk === ai.nama_produk)?.harga_modal || 0;
                    modalStruk += (qDelta * m);
                });
            }
        });
    }

    return selectedTrx.finalTotal - modalStruk;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-emerald-500 selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        
        <main className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Laporan Penjualan</h1>
              <p className="text-sm text-slate-400 mt-1">Pantau omzet, riwayat, dan piutang toko Anda.</p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setShowProfit(true)} className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm transition-all border border-slate-700">
                 📊 Valuasi / Profit
              </button>
              <button onClick={() => setShowBestSeller(true)} className="px-3 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400 font-medium rounded-xl text-sm transition-all border border-yellow-500/20">
                 ⭐ Best Seller
              </button>
              <button onClick={handleExportCSV} className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium rounded-xl text-sm transition-all border border-emerald-500/20">
                📤 Export CSV
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4">
             <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center gap-3 flex-1">
                <span className="text-xl">🔍</span>
                <input type="text" placeholder="Cari No. Transaksi, Kasir, atau Pelanggan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 w-full" />
             </div>
             <div className="flex bg-slate-900 rounded-2xl border border-slate-800 p-1 overflow-x-auto">
                 {["Hari Ini", "Minggu Ini", "Bulan Ini", "Tahun Ini", "Semua"].map(f => (
                     <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap ${filter === f ? "bg-emerald-500 text-slate-950" : "text-slate-400"}`}>
                         {f}
                     </button>
                 ))}
             </div>
          </div>

          {/* Omzet Mini Dashboard */}
          <div className="bg-white p-6 rounded-2xl shadow-xl flex justify-between items-center">
              <div>
                  <p className="text-sm font-bold text-gray-500 uppercase tracking-wide">Total Penjualan</p>
                  <p className="text-3xl font-black text-emerald-600 mt-1">Rp {formatRupiah(totalOmzetLayar)}</p>
              </div>
              <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <span className="text-2xl">💰</span>
              </div>
          </div>

          {/* Daftar Transaksi */}
          <div className="space-y-4 pb-20">
              {loadingData ? (
                  <div className="text-center py-20"><p className="text-slate-400">Memuat laporan...</p></div>
              ) : processedList.length === 0 ? (
                  <div className="text-center py-20">
                      <p className="text-5xl mb-4">📭</p>
                      <p className="text-xl font-bold text-slate-400">Belum ada transaksi</p>
                  </div>
              ) : (
                  processedList.map(trx => {
                      const isPiutang = trx.status === "UTANG" || trx.status === "PIUTANG" || (trx.finalBayar < trx.finalTotal);
                      const isMinus = trx.isStockConflict === true || trx.isStockConflict === "true";
                      const date = new Date(trx.timestamp || trx.waktu);
                      const timeStr = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth()+1).padStart(2, '0')}/${String(date.getFullYear()).slice(-2)} • ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
                      let cardColor = trx.isVoid ? "bg-red-950/40 border-red-900/50" : "bg-slate-900 border-slate-800";
                      
                      return (
                          <div key={trx.id} onClick={() => setSelectedTrx(trx)} className={`p-5 rounded-2xl border cursor-pointer hover:brightness-110 transition-all ${cardColor} relative overflow-hidden`}>
                              {trx.isVoid && <div className="absolute inset-0 flex items-center justify-center opacity-10 pointer-events-none"><span className="text-6xl font-black text-red-500 tracking-widest uppercase transform -rotate-12">BATAL</span></div>}
                              {!trx.isVoid && isPiutang && <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none"><span className="text-5xl font-black text-orange-500 tracking-widest uppercase transform -rotate-12">PIUTANG</span></div>}

                              <div className="flex justify-between items-start relative z-10">
                                  <div>
                                      <div className="flex items-center gap-3 mb-1">
                                          <p className={`text-lg font-bold ${trx.isVoid ? 'text-red-400 line-through' : 'text-emerald-400'}`}>
                                              Rp {formatRupiah(trx.finalTotal)}
                                          </p>
                                          <p className="text-sm font-medium text-slate-400">👤 {trx.kasirName?.split("|||")[0] || "Kasir"}</p>
                                          {isPiutang && !trx.isVoid && <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">Piutang</span>}
                                          {trx.adaEditHarga && !trx.isVoid && <span className="bg-yellow-500 text-slate-900 text-[10px] font-bold px-2 py-0.5 rounded-full" title="Harga diubah manual">✎ Edit Harga</span>}
                                      </div>
                                      <p className="text-xs text-slate-500 font-mono mt-2">
                                          {timeStr} {trx.customerName ? ` • Cust: ${trx.customerName}` : ''}
                                      </p>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-xs font-mono text-slate-600 mb-1">#{trx.id.slice(-6)}</p>
                                  </div>
                              </div>
                          </div>
                      );
                  })
              )}
          </div>
        </main>
      </div>

      {/* MODAL DETAIL TRANSAKSI */}
      {selectedTrx && !showVoid && !showPiutang && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            
            <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
                <div>
                    <h3 className="text-xl font-bold text-white">Detail Transaksi</h3>
                    <p className="text-xs text-slate-500 font-mono mt-1">ID: {selectedTrx.id}</p>
                </div>
                <div className="flex items-center gap-2">
                    {!selectedTrx.isVoid && (
                        <button onClick={handleEditKeKasir} className="w-10 h-10 rounded-full bg-orange-500/20 text-orange-500 flex items-center justify-center hover:bg-orange-500 hover:text-white transition-all border border-orange-500/50" title="Edit Transaksi ke Kasir">
                            ✏️
                        </button>
                    )}
                    <button onClick={() => setSelectedTrx(null)} className="w-10 h-10 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white">✕</button>
                </div>
            </div>
            
            {(selectedTrx.status === "UTANG" || selectedTrx.status === "PIUTANG") && !selectedTrx.isVoid && (
                <div onClick={() => setShowPiutang(true)} className="bg-orange-500/10 border border-orange-500/30 p-4 rounded-xl mb-6 cursor-pointer hover:bg-orange-500/20 transition-all flex justify-between items-center">
                    <div>
                        <p className="text-sm font-bold text-orange-500">⚠️ STATUS: BELUM LUNAS (PIUTANG)</p>
                        <p className="text-xs text-slate-400 mt-1">Uang Masuk: Rp {formatRupiah(selectedTrx.finalBayar)} | Kurang: Rp {formatRupiah(selectedTrx.finalTotal - selectedTrx.finalBayar)}</p>
                    </div>
                    <span className="bg-orange-500 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-md">BAYAR</span>
                </div>
            )}

            {/* DAFTAR BARANG (Perbaikan Variabel Harga) */}
            <div className="space-y-4 mb-6">
                {selectedTrx.items && Object.values(selectedTrx.items).map((item: any, idx: number) => {
                    const isCustom = item.isCustomPrice === true || item.isCustomPrice === "true" || item.isCustomPriceStr === "1";
                    const color = isCustom ? "text-yellow-500" : "text-white";
                    
                    // 🔥 KAMUS DIALEK HARGA DIPERBAIKI
                    const hJual = Number(item.harga_jual || item.hargaJual || item.harga || 0);
                    const qty = Number(item.qty || item.jumlah || item.jml || 1);
                    const subtotal = qty * hJual;

                    return (
                        <div key={idx} className="flex justify-between items-end border-b border-slate-800/50 pb-3">
                            <div className="flex-1 pr-4">
                                <p className={`font-bold text-sm ${color}`}>{item.nama_produk || item.namaProduk}</p>
                                <p className={`text-xs mt-1 ${isCustom ? 'text-yellow-600' : 'text-slate-400'}`}>
                                    {qty} x Rp {formatRupiah(hJual)}
                                </p>
                            </div>
                            <p className={`font-bold text-sm ${color}`}>Rp {formatRupiah(subtotal)}</p>
                        </div>
                    );
                })}
            </div>

            {selectedTrx.koreksi && selectedTrx.koreksi.length > 0 && (
                <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-4 mb-6">
                    <p className="text-xs font-bold text-emerald-500 mb-3">Riwayat Koreksi / Retur:</p>
                    {selectedTrx.koreksi.map((adj: any, idx: number) => (
                        <div key={idx} className="text-xs text-slate-300 mb-3 border-b border-emerald-900/20 pb-3 last:border-0 last:mb-0 last:pb-0">
                            <p className="text-[10px] text-slate-500 mb-1">Waktu: {new Date(adj.createdAt || adj.timestamp).toLocaleString()}</p>
                            {adj.items && Object.values(adj.items).map((ai: any, i2: number) => {
                                const qDelta = Number(ai.qtyDelta || 0);
                                const hBaru = Number(ai.hargaBaru || 0);
                                const sign = qDelta > 0 ? `(+${qDelta})` : qDelta < 0 ? `(${qDelta})` : `(Edit Harga)`;
                                const cColor = qDelta > 0 ? 'text-emerald-400' : qDelta < 0 ? 'text-red-400' : 'text-yellow-500';

                                return (
                                    <div key={i2} className="flex justify-between items-center mt-1">
                                        <p className={`font-bold ${cColor}`}>• {ai.nama_produk || ai.namaProduk} {sign}</p>
                                        <p className="text-slate-400">@ Rp {formatRupiah(hBaru)}</p>
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50">
                <div className="flex justify-between items-center mb-2">
                    <p className="text-sm font-bold text-slate-300">TOTAL</p>
                    <p className={`text-xl font-black ${selectedTrx.isVoid ? 'text-slate-500 line-through' : 'text-emerald-400'}`}>
                        Rp {formatRupiah(selectedTrx.finalTotal)}
                    </p>
                </div>
                
                <div className="flex justify-between items-center pt-2 border-t border-slate-700">
                    <p className="text-xs font-medium text-slate-400">PROFIT</p>
                    <p className={`text-sm font-bold ${selectedTrx.isVoid ? 'text-slate-500' : (hitungProfitStruk() >= 0 ? 'text-emerald-500' : 'text-red-500')}`}>
                        {selectedTrx.isVoid ? "Rp 0 (BATAL)" : `Rp ${formatRupiah(hitungProfitStruk())}`}
                    </p>
                </div>
            </div>

            {!selectedTrx.isVoid && (
                <div className="flex gap-3 mt-4">
                    <button onClick={() => setShowVoid(true)} className="flex-1 py-3 rounded-xl font-bold bg-slate-800 text-red-400 hover:bg-red-500/20 transition-all border border-transparent hover:border-red-500/30">
                        BATALKAN (VOID)
                    </button>
                </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL PROFIT */}
      {showProfit && (
          <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-4">Laporan Keuangan</h3>
              <p className="text-sm text-slate-400 mb-4">Periode: {filter}</p>
              
              {(() => {
                  const { omzetSum, modalSum, profit } = calculateProfit();
                  return (
                      <div className="space-y-4">
                          <div className="bg-slate-800 p-4 rounded-xl">
                              <p className="text-xs text-slate-400">Total Omzet</p>
                              <p className="text-lg font-bold text-white">Rp {formatRupiah(omzetSum)}</p>
                          </div>
                          <div className="bg-slate-800 p-4 rounded-xl">
                              <p className="text-xs text-slate-400">Total Modal</p>
                              <p className="text-lg font-bold text-slate-300">Rp {formatRupiah(modalSum)}</p>
                          </div>
                          <div className="bg-emerald-950 border border-emerald-900 p-4 rounded-xl">
                              <p className="text-xs text-emerald-400 font-bold">PROFIT BERSIH</p>
                              <p className={`text-2xl font-black ${profit >= 0 ? 'text-emerald-400' : 'text-red-500'}`}>
                                  Rp {formatRupiah(profit)}
                              </p>
                          </div>
                      </div>
                  );
              })()}
              <button onClick={() => setShowProfit(false)} className="mt-6 w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition-all">
                  TUTUP
              </button>
          </div>
          </div>
      )}

      {/* MODAL BEST SELLER */}
      {showBestSeller && (
          <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
              <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">⭐</span>
                  <h3 className="text-xl font-bold text-slate-900">Top 10 Best Seller</h3>
              </div>
              <p className="text-xs text-slate-500 mb-4">Produk terlaris dalam 30 hari terakhir.</p>
              
              <div className="space-y-3">
                  {getBestSeller().map(([nama, qty], idx) => (
                      <div key={nama} className="flex justify-between items-center border-b border-slate-100 pb-2">
                          <p className="text-sm font-bold text-slate-700">{idx + 1}. {nama}</p>
                          <p className="text-sm font-black text-emerald-600">{qty} Terjual</p>
                      </div>
                  ))}
                  {getBestSeller().length === 0 && <p className="text-center text-sm text-slate-400 py-4">Belum ada data valid.</p>}
              </div>
              <button onClick={() => setShowBestSeller(false)} className="mt-6 w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all">
                  TUTUP
              </button>
          </div>
          </div>
      )}

      {/* MODAL VOID */}
      {showVoid && selectedTrx && (
          <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-red-500 mb-2">Batalkan Transaksi?</h3>
              <p className="text-sm text-slate-300 mb-4">Data omzet akan dihapus dan stok barang dikembalikan otomatis.</p>
              
              <input type="text" placeholder="Alasan pembatalan (Wajib)..." value={voidReason} onChange={(e) => setVoidReason(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl p-4 text-white mb-6" />
              
              <div className="flex gap-3">
                  <button onClick={() => setShowVoid(false)} disabled={isProcessing} className="flex-1 py-3 rounded-xl font-bold text-slate-400 bg-slate-800">KEMBALI</button>
                  <button onClick={handleVoid} disabled={isProcessing} className="flex-1 py-3 rounded-xl font-bold bg-red-600 text-white">{isProcessing ? "MEMPROSES..." : "BATALKAN"}</button>
              </div>
          </div>
          </div>
      )}

      {/* MODAL BAYAR PIUTANG */}
      {showPiutang && selectedTrx && (
          <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-slate-900 mb-1">Terima Pembayaran</h3>
              <p className="text-sm text-red-500 font-bold mb-4">Sisa Piutang: Rp {formatRupiah(selectedTrx.finalTotal - selectedTrx.finalBayar)}</p>
              
              <input type="text" placeholder="Masukkan Uang Masuk..." value={cicilan} onChange={(e) => setCicilan(e.target.value.replace(/\D/g, ''))} className="w-full bg-slate-100 border-none rounded-xl p-4 text-slate-900 font-bold text-lg mb-6" />
              
              <div className="flex gap-3">
                  <button onClick={() => setShowPiutang(false)} disabled={isProcessing} className="flex-1 py-3 rounded-xl font-bold text-slate-500 bg-slate-100">BATAL</button>
                  <button onClick={handlePiutang} disabled={isProcessing} className="flex-1 py-3 rounded-xl font-bold bg-emerald-500 text-white">{isProcessing ? "MEMPROSES..." : "SIMPAN"}</button>
              </div>
          </div>
          </div>
      )}
    </div>
  );
}