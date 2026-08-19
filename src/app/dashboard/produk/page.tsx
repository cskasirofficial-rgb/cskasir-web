"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { database } from "@/lib/firebase/firebase";
import { ref, onValue, push, set, update, runTransaction } from "firebase/database";

interface Batch {
  stok: number;
  modal_batch: number;
  expired: string;
  tgl_masuk: number;
}

interface Produk {
  id: string;
  nama_produk: string;
  barcode: string;
  harga_jual: number;
  harga_modal: number;
  total_stok: number;
  is_active: boolean;
  batches?: Record<string, Batch>;
}

export default function ProdukPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  
  const [produkList, setProdukList] = useState<Produk[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loadingData, setLoadingData] = useState(true);

  // State Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isValuasiModalOpen, setIsValuasiModalOpen] = useState(false);
  
  // State Form
  const [selectedProduk, setSelectedProduk] = useState<Produk | null>(null);
  const [nama, setNama] = useState("");
  const [barcode, setBarcode] = useState("");
  const [hargaModal, setHargaModal] = useState("");
  const [hargaJual, setHargaJual] = useState("");
  const [stokAwal, setStokAwal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [adjustTab, setAdjustTab] = useState<"MASUK" | "KELUAR">("MASUK");
  const [adjustQty, setAdjustQty] = useState("");
  const [adjustModal, setAdjustModal] = useState("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Sinkronisasi Firebase
  useEffect(() => {
    if (!profile?.groupId) return;
    setLoadingData(true);

    const stokRef = ref(database, `stok/${profile.groupId}`);
    const unsubscribe = onValue(stokRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        const list: Produk[] = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        })).filter(p => p.is_active !== false); 
        list.sort((a, b) => a.nama_produk.localeCompare(b.nama_produk));
        setProdukList(list);
      } else {
        setProdukList([]);
      }
      setLoadingData(false);
    });

    return () => unsubscribe();
  }, [profile?.groupId]);

  if (loading) return null;

  const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID").format(angka);
  const cleanNumber = (val: string) => parseInt(val.replace(/\D/g, ""), 10) || 0;

  const totalModal = produkList.reduce((acc, curr) => acc + (curr.total_stok * curr.harga_modal), 0);
  const totalOmzet = produkList.reduce((acc, curr) => acc + (curr.total_stok * curr.harga_jual), 0);
  const proyeksiProfit = totalOmzet - totalModal;

  // ==========================================
  // FITUR EXPORT / IMPORT CSV 
  // ==========================================
  const handleExportCSV = () => {
    let csv = "sep=;\nNama;Barcode;Jual;Modal;Stok\n";
    produkList.forEach(p => {
      const namaAman = p.nama_produk.replace(/;/g, " ");
      const barcodeAman = p.barcode ? `'${p.barcode}` : "";
      csv += `${namaAman};${barcodeAman};${p.harga_jual};${p.harga_modal};${p.total_stok}\n`;
    });
    
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Laporan_Stok_CSKasir.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert("⚠️ GAGAL: File harus berformat .csv!");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    
    setIsSubmitting(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n');
        let countNew = 0;
        let countUpdate = 0;
        const updates: any = {};
        
        // Peta barcode untuk ngecek apakah barang diupdate atau ditambah
        const existingMap = new Map();
        produkList.forEach(p => {
          if (p.barcode) existingMap.set(p.barcode.toLowerCase(), p.id);
        });

        const ts = Date.now();

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line || line.startsWith("sep=") || line.startsWith("Nama;Barcode")) continue;
          
          const separator = line.includes(";") ? ";" : ",";
          const t = line.split(separator);
          
          if (t.length >= 5) {
            const namaProd = t[0].trim();
            if (namaProd) {
              const barcodeRaw = t[1].trim().replace(/'/g, "");
              const barcodeKey = barcodeRaw.toLowerCase();
              const jual = parseInt(t[2]) || 0;
              const modal = parseInt(t[3]) || 0;
              const stok = parseInt(t[4]) || 0;

              if (barcodeKey && existingMap.has(barcodeKey)) {
                // UPDATE BARANG LAMA
                const existingId = existingMap.get(barcodeKey);
                updates[`stok/${profile?.groupId}/${existingId}/nama_produk`] = namaProd;
                updates[`stok/${profile?.groupId}/${existingId}/harga_jual`] = jual;
                updates[`stok/${profile?.groupId}/${existingId}/harga_modal`] = modal;
                countUpdate++;
              } else {
                // TAMBAH BARANG BARU
                const newRefKey = push(ref(database, `stok/${profile?.groupId}`)).key;
                const batchId = `B_${ts}_${Math.floor(Math.random() * 90 + 10)}`;
                updates[`stok/${profile?.groupId}/${newRefKey}`] = {
                  nama_produk: namaProd,
                  barcode: barcodeRaw,
                  harga_jual: jual,
                  harga_modal: modal,
                  total_stok: stok,
                  is_active: true,
                  batches: {
                    [batchId]: {
                      stok: stok,
                      modal_batch: modal,
                      expired: "2030-12-31",
                      tgl_masuk: ts
                    }
                  }
                };
                if (barcodeKey) existingMap.set(barcodeKey, newRefKey);
                countNew++;
              }
            }
          }
        }
        
        if (Object.keys(updates).length > 0) {
           await update(ref(database), updates);
        }
        
        alert(`Selesai: ${countNew} Barang Baru, ${countUpdate} Barang Diupdate`);
      } catch (err) {
        console.error(err);
        alert("Gagal memproses file CSV.");
      } finally {
        setIsSubmitting(false);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };
  // ==========================================

  // Handler Simpan Produk Baru
  const handleSimpanProduk = async (e: React.FormEvent) => {
    e.preventDefault();
    const modalL = cleanNumber(hargaModal);
    const jualL = cleanNumber(hargaJual);
    const stokL = cleanNumber(stokAwal);

    if (jualL <= modalL) {
      alert("⚠️ RUGI BOSS! Harga Jual tidak boleh kurang atau sama dengan Modal.");
      return;
    }

    if (produkList.some(p => p.barcode === barcode && barcode.trim() !== "")) {
      alert("Barcode sudah digunakan oleh produk lain!");
      return;
    }

    setIsSubmitting(true);
    try {
      const newRef = push(ref(database, `stok/${profile?.groupId}`));
      const batchId = push(ref(database, `stok/${profile?.groupId}/${newRef.key}/batches`)).key;

      await set(newRef, {
        nama_produk: nama.trim(),
        barcode: barcode.trim(),
        harga_jual: jualL,
        harga_modal: modalL,
        total_stok: stokL,
        is_active: true,
        batches: {
          [batchId as string]: {
            stok: stokL,
            modal_batch: modalL,
            expired: "2030-12-31",
            tgl_masuk: Date.now()
          }
        }
      });

      setIsAddModalOpen(false);
      resetForm();
    } catch (err) {
      alert("Gagal menyimpan produk.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Simpan Edit Produk
  const handleEditProduk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduk || !profile?.groupId) return;

    const modalL = cleanNumber(hargaModal);
    const jualL = cleanNumber(hargaJual);

    if (jualL <= modalL) {
      alert("⚠️ RUGI BOSS! Harga Jual tidak boleh kurang atau sama dengan Modal.");
      return;
    }

    setIsSubmitting(true);
    try {
      const updates: any = {
        nama_produk: nama.trim(),
        barcode: barcode.trim(),
        harga_jual: jualL,
        harga_modal: modalL,
        profit: jualL - modalL
      };

      if (selectedProduk.batches) {
        Object.keys(selectedProduk.batches).forEach(bId => {
          updates[`batches/${bId}/modal_batch`] = modalL;
        });
      }

      await update(ref(database, `stok/${profile.groupId}/${selectedProduk.id}`), updates);
      setIsEditModalOpen(false);
    } catch (err) {
      alert("Gagal mengupdate produk.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handler Hapus (Soft Delete)
  const handleHapusProduk = async (id: string, namaProd: string) => {
    if (confirm(`Hapus barang "${namaProd}" dari kasir? Data akan disembunyikan.`)) {
      await update(ref(database, `stok/${profile?.groupId}/${id}`), { is_active: false });
    }
  };

  // Handler Penyesuaian Stok (Masuk/Keluar)
  const handlePenyesuaianStok = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduk || !profile?.groupId) return;

    const qty = cleanNumber(adjustQty);
    if (qty <= 0) return;

    setIsSubmitting(true);
    const produkRef = ref(database, `stok/${profile.groupId}/${selectedProduk.id}`);

    try {
      await runTransaction(produkRef, (currentData) => {
        if (!currentData) return currentData;

        let stokDasar = currentData.total_stok || 0;
        const ts = Date.now();
        const batchId = `B_${ts}_${Math.floor(Math.random() * 90 + 10)}`;

        if (adjustTab === "MASUK") {
          const modalMasuk = cleanNumber(adjustModal);
          currentData.total_stok = stokDasar + qty;
          currentData.harga_modal = modalMasuk; 
          
          if (!currentData.batches) currentData.batches = {};
          currentData.batches[batchId] = {
            stok: qty,
            modal_batch: modalMasuk,
            expired: "2030-12-31",
            tgl_masuk: ts
          };
        } else {
          if (stokDasar < qty) {
            return; 
          }
          currentData.total_stok = stokDasar - qty;
          
          if (currentData.batches) {
             let sisaPotong = qty;
             const batchKeys = Object.keys(currentData.batches).sort((a, b) => 
                currentData.batches[a].tgl_masuk - currentData.batches[b].tgl_masuk
             );

             for (const key of batchKeys) {
               if (sisaPotong <= 0) break;
               const batchStok = currentData.batches[key].stok;
               const potong = Math.min(batchStok, sisaPotong);
               
               currentData.batches[key].stok -= potong;
               sisaPotong -= potong;
             }
          }
        }
        return currentData;
      });

      setIsAdjustModalOpen(false);
    } catch (err) {
      alert("Transaksi gagal. Pastikan stok mencukupi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNama(""); setBarcode(""); setHargaModal(""); setHargaJual(""); setStokAwal(""); setSelectedProduk(null);
  };

  const filteredProduk = produkList.filter(p => 
    p.nama_produk.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.barcode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-orange-500 selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        
        <main className="p-6 md:p-8 space-y-6 flex-1 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between gap-4 bg-slate-900 p-6 rounded-2xl border border-slate-800 shadow-xl">
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
                Stok Gudang
                <span className="px-2.5 py-0.5 text-xs font-semibold bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-md">
                  {filteredProduk.length} Item
                </span>
              </h1>
              <p className="text-sm text-slate-400 mt-1">Kelola barang, harga, dan ketersediaan stok toko.</p>
            </div>
            
            {/* Input Tersembunyi untuk Import File CSV */}
            <input 
              type="file" 
              ref={fileInputRef} 
              accept=".csv" 
              onChange={handleImportCSV} 
              className="hidden" 
            />

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 font-medium rounded-xl text-sm transition-all border border-blue-500/20"
                title="Upload file CSV"
              >
                📥 Import CSV
              </button>
              <button
                onClick={handleExportCSV}
                className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium rounded-xl text-sm transition-all border border-emerald-500/20"
                title="Download laporan CSV"
              >
                📤 Export CSV
              </button>
              <button
                onClick={() => setIsValuasiModalOpen(true)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-sm transition-all border border-slate-700"
              >
                📊 Valuasi Aset
              </button>
              <button
                onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-orange-500/20"
              >
                + Tambah Barang
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center gap-3">
            <svg className="w-5 h-5 text-slate-500 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input
              type="text"
              placeholder="Cari nama barang atau barcode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-none outline-none text-sm text-white placeholder-slate-500 w-full"
            />
          </div>

          {/* Tabel Barang */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-800/60 text-xs uppercase text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="py-4 px-6">Info Barang</th>
                    <th className="py-4 px-6">Keuangan (Jual / Modal)</th>
                    <th className="py-4 px-6 text-center">Sisa Stok</th>
                    <th className="py-4 px-6 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loadingData ? (
                    <tr><td colSpan={4} className="text-center py-8">Memuat data gudang...</td></tr>
                  ) : filteredProduk.length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8">Gudang masih kosong.</td></tr>
                  ) : (
                    filteredProduk.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-6">
                          <p className="font-bold text-white text-base">{item.nama_produk}</p>
                          <p className="text-xs font-mono text-slate-500">{item.barcode || "Tanpa Barcode"}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="text-emerald-400 font-semibold">Rp {formatRupiah(item.harga_jual)}</p>
                          <p className="text-xs text-slate-500">M: Rp {formatRupiah(item.harga_modal)}</p>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${item.total_stok <= 5 ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                            {item.total_stok} Pcs
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          <button onClick={() => {
                            setSelectedProduk(item);
                            setAdjustTab("MASUK"); setAdjustQty(""); setAdjustModal(item.harga_modal.toString());
                            setIsAdjustModalOpen(true);
                          }} className="text-xs px-3 py-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-lg transition-colors">
                            +/- Stok
                          </button>
                          <button onClick={() => {
                            setSelectedProduk(item);
                            setNama(item.nama_produk); setBarcode(item.barcode);
                            setHargaModal(item.harga_modal.toString()); setHargaJual(item.harga_jual.toString());
                            setIsEditModalOpen(true);
                          }} className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors">
                            Edit
                          </button>
                          <button onClick={() => handleHapusProduk(item.id, item.nama_produk)} className="text-xs px-3 py-1.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors">
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Modal Valuasi Aset */}
      {isValuasiModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-blue-400 mb-4">Valuasi Aset Gudang</h3>
            <div className="space-y-4">
              <div className="bg-slate-800 p-4 rounded-xl">
                <p className="text-xs text-slate-400">Total Modal (Uang Mati)</p>
                <p className="text-lg font-bold text-white">Rp {formatRupiah(totalModal)}</p>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl">
                <p className="text-xs text-slate-400">Potensi Penjualan</p>
                <p className="text-lg font-bold text-blue-400">Rp {formatRupiah(totalOmzet)}</p>
              </div>
              <div className="bg-slate-800 p-4 rounded-xl border border-emerald-500/30">
                <p className="text-xs text-slate-400">Proyeksi Profit Bersih</p>
                <p className="text-xl font-black text-emerald-400">Rp {formatRupiah(proyeksiProfit)}</p>
              </div>
            </div>
            <button onClick={() => setIsValuasiModalOpen(false)} className="mt-6 w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold">
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Modal Tambah & Edit Produk */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6">{isAddModalOpen ? "Tambah Barang Baru" : "Edit Barang"}</h3>
            <form onSubmit={isAddModalOpen ? handleSimpanProduk : handleEditProduk} className="space-y-4">
              <input type="text" placeholder="Barcode (Opsional)" value={barcode} onChange={e => setBarcode(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl p-3 text-white" />
              <input type="text" placeholder="Nama Produk *" required value={nama} onChange={e => setNama(e.target.value)} className="w-full bg-slate-800 border-none rounded-xl p-3 text-white" />
              <div className="flex gap-4">
                <input type="text" placeholder="Harga Modal *" required value={hargaModal} onChange={e => setHargaModal(e.target.value.replace(/\D/g, ""))} className="w-1/2 bg-slate-800 border-none rounded-xl p-3 text-white" />
                <input type="text" placeholder="Harga Jual *" required value={hargaJual} onChange={e => setHargaJual(e.target.value.replace(/\D/g, ""))} className="w-1/2 bg-slate-800 border-none rounded-xl p-3 text-white" />
              </div>
              {isAddModalOpen && (
                <input type="text" placeholder="Stok Awal *" required value={stokAwal} onChange={e => setStokAwal(e.target.value.replace(/\D/g, ""))} className="w-full bg-slate-800 border-none rounded-xl p-3 text-white" />
              )}
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="flex-1 py-3 text-slate-400 font-semibold hover:bg-slate-800 rounded-xl">Batal</button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-3 bg-orange-500 hover:bg-orange-600 text-slate-950 font-bold rounded-xl">{isSubmitting ? "Menyimpan..." : "Simpan"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Penyesuaian Stok */}
      {isAdjustModalOpen && selectedProduk && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2">Penyesuaian Stok</h3>
            <p className="text-sm text-slate-400 mb-4">{selectedProduk.nama_produk} (Sisa: {selectedProduk.total_stok})</p>
            
            <div className="flex bg-slate-800 p-1 rounded-xl mb-4">
              <button onClick={() => setAdjustTab("MASUK")} className={`flex-1 py-2 text-sm font-bold rounded-lg ${adjustTab === "MASUK" ? "bg-blue-500 text-white" : "text-slate-400"}`}>Masuk (In)</button>
              <button onClick={() => setAdjustTab("KELUAR")} className={`flex-1 py-2 text-sm font-bold rounded-lg ${adjustTab === "KELUAR" ? "bg-red-500 text-white" : "text-slate-400"}`}>Keluar (Out)</button>
            </div>

            <form onSubmit={handlePenyesuaianStok} className="space-y-4">
              <input type="text" required placeholder={adjustTab === "MASUK" ? "Jumlah Ditambah" : "Jumlah Dibuang/Retur"} value={adjustQty} onChange={e => setAdjustQty(e.target.value.replace(/\D/g, ""))} className="w-full bg-slate-800 border-none rounded-xl p-3 text-white" />
              
              {adjustTab === "MASUK" && (
                <input type="text" required placeholder="Harga Modal (Kulakan Ini)" value={adjustModal} onChange={e => setAdjustModal(e.target.value.replace(/\D/g, ""))} className="w-full bg-slate-800 border-none rounded-xl p-3 text-white" />
              )}
              
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsAdjustModalOpen(false)} className="flex-1 py-3 text-slate-400 font-semibold">Batal</button>
                <button type="submit" disabled={isSubmitting} className={`flex-1 py-3 font-bold rounded-xl text-white ${adjustTab === "MASUK" ? "bg-blue-500" : "bg-red-500"}`}>
                  {isSubmitting ? "Proses..." : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
