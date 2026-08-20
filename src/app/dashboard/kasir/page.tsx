// @ts-nocheck
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { database } from "@/lib/firebase/firebase";
import { ref, onValue, set, get, update } from "firebase/database";

export default function KasirPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  
  const [produkList, setProdukList] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  
  const [editMode, setEditMode] = useState<any>(null);
  
  const [showPay, setShowPay] = useState(false);
  const [uangBayar, setUangBayar] = useState("");
  const [metodeBayar, setMetodeBayar] = useState("cash");
  const [biayaAdmin, setBiayaAdmin] = useState(0);
  const [biayaOngkir, setBiayaOngkir] = useState(0);
  const [biayaLainnya, setBiayaLainnya] = useState(0);
  const [namaBiayaLain, setNamaBiayaLain] = useState("Biaya Lain-lain");
  
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [showBiayaDialog, setShowBiayaDialog] = useState(false);
  const [showEditPrice, setShowEditPrice] = useState<any>(null);
  const [inputHargaBaru, setInputHargaBaru] = useState("");
  const [showSuccess, setShowSuccess] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => { 
    if (!loading && !user) router.push("/login"); 
  }, [user, loading, router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const payload = localStorage.getItem("edit_trx_payload");
      if (payload) {
        try {
          const data = JSON.parse(payload);
          if (data.isEditing) {
            setEditMode({ 
              trxId: data.trxId, 
              waktu: data.waktuTransaksi, 
              kasirName: data.kasirName, 
              customerName: data.customerName 
            });
            setCart(data.items || []);
          }
        } catch (e) {}
        localStorage.removeItem("edit_trx_payload");
      }
    }
  }, []);

  useEffect(() => {
    const prof = profile as any;
    if (!prof?.groupId) return;
    const pRef = ref(database, `stok/${prof.groupId}`);
    const cRef = ref(database, `pelanggan_toko/${prof.groupId}`);
    
    const unsubProduk = onValue(pRef, (snap) => {
      if (snap.exists()) {
        const list = Object.keys(snap.val()).map(k => ({ id: k, ...snap.val()[k] })).filter(p => p.is_active !== false);
        setProdukList(list.sort((a,b) => (a.nama_produk || "").localeCompare(b.nama_produk || "")));
      } else {
        setProdukList([]);
      }
    });

    const unsubCustomer = onValue(cRef, (snap) => {
      if (snap.exists()) {
        setCustomers(Object.keys(snap.val()).map(k => ({ id: k, ...snap.val()[k] })));
      }
    });

    return () => {
      unsubProduk();
      unsubCustomer();
    };
  }, [profile]);

  const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID").format(angka || 0);

  const filteredProduk = produkList.filter(p => 
    (p.nama_produk || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
    (p.barcode || "").includes(searchQuery)
  );

  const totalBelanjaMurni = cart.reduce((sum, item) => sum + (item.qty * item.hargaJual), 0);
  const totalAkhir = totalBelanjaMurni + biayaAdmin + biayaOngkir + biayaLainnya;
  const nominalBayar = metodeBayar === "qris" ? totalAkhir : Number(uangBayar.replace(/\D/g, ''));
  const kembalian = nominalBayar - totalAkhir;
  const isUtang = kembalian < 0;

  const addToCart = (produk: any, qtyTambah = 1) => {
    const existing = cart.find(c => c.id === produk.id);
    const sisaStok = (produk.total_stok || 0) - (existing?.qty || 0);
    
    if (sisaStok < qtyTambah) return alert("Stok Habis!");
    
    if (existing) {
      setCart(cart.map(c => c.id === produk.id ? { ...c, qty: c.qty + qtyTambah } : c));
    } else {
      setCart([...cart, { 
        id: produk.id, 
        nama: produk.nama_produk || "Produk", 
        hargaJual: Number(produk.harga_jual || 0), 
        hargaNormal: Number(produk.harga_jual || 0), 
        hargaModal: Number(produk.harga_modal || 0), 
        qty: qtyTambah, 
        isCustomPrice: false 
      }]);
    }
  };

  const updateCartQty = (id: string, newQty: number) => {
    if (newQty <= 0) {
      setCart(cart.filter(c => c.id !== id));
    } else {
      setCart(cart.map(c => c.id === id ? { ...c, qty: newQty } : c));
    }
  };

  const updateCartPrice = (id: string, newPrice: number) => {
    setCart(cart.map(c => c.id === id ? { ...c, hargaJual: newPrice, isCustomPrice: true } : c));
    setShowEditPrice(null);
  };

  const prosesPembayaran = async () => {
    if (isUtang && !selectedCustomer && !editMode?.customerName) {
      return alert("Transaksi Utang wajib memilih pelanggan!");
    }
    setIsProcessing(true);

    const prof = profile as any;
    const usr = user as any;
    const namaKasir = prof?.username || prof?.name || usr?.displayName || usr?.email || "Admin Web";
    const targetGroupId = prof?.groupId;

    try {
      if (!editMode) {
        const trxId = `trx_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
        const time = Date.now();
        const cusName = selectedCustomer?.name || "";
        const finalStatus = isUtang ? "UTANG" : "SELESAI";
        
        const payload = {
          trxId,
          timestamp: time,
          kasirName: namaKasir,
          customerName: cusName,
          status: finalStatus,
          bayar: nominalBayar,
          kembali: kembalian,
          metodeBayar: metodeBayar,
          totalHarga: totalAkhir,
          biayaAdmin, 
          biayaOngkir, 
          biayaLainnya, 
          namaBiayaLainnya: namaBiayaLain, 
          totalBelanjaMurni,
          items: cart.reduce((acc: any, c: any, i: number) => {
            acc[i] = { produkId: c.id, nama_produk: c.nama, harga_jual: c.hargaJual, qty: c.qty, modal: c.hargaModal, isCustomPrice: c.isCustomPrice };
            return acc;
          }, {})
        };

        const updates: any = {};
        cart.forEach(c => {
          const p = produkList.find(pl => pl.id === c.id);
          if (p) updates[`stok/${targetGroupId}/${c.id}/total_stok`] = (p.total_stok || 0) - c.qty;
        });

        await set(ref(database, `transaksi/${targetGroupId}/${trxId}`), payload);
        if (Object.keys(updates).length > 0) await update(ref(database), updates);

        setShowSuccess({ trxId, totalAkhir, kembalian });
      } else {
        const payload = {
          isEdited: true,
          bayar: nominalBayar,
          kembali: kembalian,
          status: isUtang ? "UTANG" : "SELESAI",
          totalHarga: totalAkhir,
          biayaAdmin, 
          biayaOngkir, 
          biayaLainnya, 
          namaBiayaLainnya: namaBiayaLain, 
          totalBelanjaMurni,
          items: cart.reduce((acc: any, c: any, i: number) => {
            acc[i] = { produkId: c.id, nama_produk: c.nama, harga_jual: c.hargaJual, qty: c.qty, modal: c.hargaModal, isCustomPrice: c.isCustomPrice };
            return acc;
          }, {})
        };

        const trxLamaRef = ref(database, `transaksi/${targetGroupId}/${editMode.trxId}`);
        const snapTrxLama = await get(trxLamaRef);
        const itemsLama = snapTrxLama.exists() ? snapTrxLama.val().items : {};
        const stokUpdates: any = {};

        if (itemsLama) {
          Object.values(itemsLama).forEach((il: any) => {
            const p = produkList.find(pl => pl.id === il.produkId);
            if (p) stokUpdates[`stok/${targetGroupId}/${il.produkId}/total_stok`] = (stokUpdates[`stok/${targetGroupId}/${il.produkId}/total_stok`] || p.total_stok || 0) + (il.qty || 0);
          });
        }
        
        cart.forEach(c => {
          const currentStok = stokUpdates[`stok/${targetGroupId}/${c.id}/total_stok`] ?? (produkList.find(pl => pl.id === c.id)?.total_stok || 0);
          stokUpdates[`stok/${targetGroupId}/${c.id}/total_stok`] = currentStok - c.qty;
        });

        await update(trxLamaRef, payload);
        if (Object.keys(stokUpdates).length > 0) await update(ref(database), stokUpdates);

        alert("Koreksi berhasil disimpan ke server!");
        router.push('/dashboard/laporan');
      }
    } catch (err) {
      alert("Gagal memproses transaksi.");
    }
    setIsProcessing(false);
  };

  const resetKasir = () => {
    setCart([]); 
    setUangBayar(""); 
    setBiayaAdmin(0); 
    setBiayaOngkir(0); 
    setBiayaLainnya(0); 
    setNamaBiayaLain("Biaya Lain-lain"); 
    setSelectedCustomer(null); 
    setShowSuccess(null); 
    setShowPay(false); 
    setEditMode(null);
  };

  return (
    <div className="h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-emerald-500 selection:text-white overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Navbar />
        
        {/* MAIN CONTAINER TERKUNCI (H-SCREEN RESPONSIVE) */}
        <main className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
          {/* AREA KIRI: KATALOG BARANG */}
          <div className="flex-1 p-6 flex flex-col overflow-hidden border-r border-slate-800">
            {editMode && (
              <div className="bg-orange-500/20 border border-orange-500/50 p-4 rounded-xl mb-4 flex justify-between items-center shrink-0">
                <p className="text-orange-400 font-bold text-sm">⚠️ MODE EDIT KOREKSI AKTIF (Trx: #{String(editMode.trxId).slice(-5)})</p>
                <button onClick={() => { setEditMode(null); setCart([]); }} className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-red-600">Batal Edit</button>
              </div>
            )}
            <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex items-center gap-3 mb-4 shrink-0">
              <span className="text-lg">🔍</span>
              <input type="text" placeholder="Cari Nama Barang / Barcode..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm text-white w-full" />
            </div>

            {/* List Barang Scrollable */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-3">
              {filteredProduk.map(p => {
                const inCart = cart.find(c => c.id === p.id);
                const qtyDiKeranjang = inCart?.qty || 0;
                const sisaStok = (p.total_stok || 0) - qtyDiKeranjang;
                const isHabis = sisaStok <= 0;
                
                return (
                  <div key={p.id} className={`p-4 rounded-2xl flex justify-between items-center ${isHabis ? 'bg-slate-900/50 opacity-50' : 'bg-slate-900'} border border-slate-800 transition-all`}>
                    <div>
                      <p className="font-bold text-white text-base">{p.nama_produk}</p>
                      <p className="text-emerald-400 font-semibold text-sm">Rp {formatRupiah(p.harga_jual)}</p>
                      <p className="text-xs text-slate-500 mt-1">Stok sisa: {sisaStok}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {qtyDiKeranjang > 0 && (
                        <>
                          <button onClick={() => updateCartQty(p.id, qtyDiKeranjang - 1)} className="w-8 h-8 rounded-full bg-slate-800 text-red-400 font-bold hover:bg-slate-700">-</button>
                          <span className="font-bold text-base min-w-[20px] text-center">{qtyDiKeranjang}</span>
                        </>
                      )}
                      <button onClick={() => addToCart(p)} disabled={isHabis} className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold hover:bg-emerald-500 hover:text-slate-950 transition-all">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AREA KANAN: KERANJANG TERKUNCI (STICKY FOOTER) */}
          <div className="w-full md:w-96 bg-slate-900 flex flex-col h-full border-l border-slate-800 shrink-0">
            {/* Header Keranjang */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center shrink-0">
              <h2 className="text-lg font-bold text-white">Keranjang</h2>
              <span className="text-xs font-semibold bg-slate-800 px-2.5 py-1 rounded-full text-slate-400">{cart.reduce((s,c)=>s+c.qty,0)} Item</span>
            </div>
            
            {/* Items Keranjang Scrollable */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {cart.map(c => (
                <div key={c.id} className="border-b border-slate-800/80 pb-3">
                  <div className="flex justify-between items-start mb-1.5">
                    <p className="font-bold text-sm text-white">{c.nama}</p>
                    <p className="font-bold text-sm text-emerald-400">Rp {formatRupiah(c.qty * c.hargaJual)}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-yellow-400" onClick={() => {
                      setShowEditPrice(c);
                      setInputHargaBaru(String(c.hargaJual));
                    }}>
                      <p className={c.isCustomPrice ? "text-yellow-500 font-bold" : ""}>@ Rp {formatRupiah(c.hargaJual)}</p>
                      <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">✎ Edit</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => updateCartQty(c.id, c.qty - 1)} className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded text-white font-bold">-</button>
                      <span className="w-6 text-center text-white font-semibold">{c.qty}</span>
                      <button onClick={() => addToCart(c, 1)} className="w-6 h-6 bg-slate-800 hover:bg-slate-700 rounded text-white font-bold">+</button>
                    </div>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="text-center py-16 text-slate-500">
                  <p className="text-4xl mb-2">🛒</p>
                  <p className="text-sm font-medium">Keranjang masih kosong</p>
                </div>
              )}
            </div>

            {/* FOOTER KERANJANG (SELALU KELIHATAN DI BAWAH) */}
            <div className="p-4 bg-slate-900 border-t border-slate-800 shrink-0 space-y-3">
              <div className="flex gap-2">
                <button onClick={() => setShowBiayaDialog(true)} className="flex-1 py-1.5 border border-orange-500/40 text-orange-400 rounded-lg text-xs font-semibold bg-orange-500/10 hover:bg-orange-500/20">
                  + Biaya Lain
                </button>
                <button onClick={() => setShowCustomerSearch(true)} className="flex-1 py-1.5 border border-blue-500/40 text-blue-400 rounded-lg text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 truncate px-2">
                  {selectedCustomer ? `👤 ${selectedCustomer.name}` : editMode?.customerName ? `👤 ${editMode.customerName}` : "👤 + Pelanggan"}
                </button>
              </div>

              {(biayaOngkir > 0 || biayaAdmin > 0 || biayaLainnya > 0) && (
                <div className="bg-orange-500/10 p-2 rounded-lg text-[11px] font-semibold text-orange-400 space-y-0.5">
                  {biayaOngkir > 0 && <div className="flex justify-between"><span>Ongkir</span><span>Rp {formatRupiah(biayaOngkir)}</span></div>}
                  {biayaAdmin > 0 && <div className="flex justify-between"><span>Admin</span><span>Rp {formatRupiah(biayaAdmin)}</span></div>}
                  {biayaLainnya > 0 && <div className="flex justify-between"><span>{namaBiayaLain}</span><span>Rp {formatRupiah(biayaLainnya)}</span></div>}
                </div>
              )}

              <div className="flex justify-between items-center pt-1">
                <p className="text-slate-400 text-sm font-semibold">Total Tagihan</p>
                <p className="text-xl font-black text-emerald-400">Rp {formatRupiah(totalAkhir)}</p>
              </div>

              {/* TOMBOL BAYAR / SIMPAN KOREKSI UTAMA */}
              <button 
                disabled={cart.length === 0} 
                onClick={() => setShowPay(true)} 
                className={`w-full py-3.5 ${editMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-500 hover:bg-emerald-600'} disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black text-base rounded-xl shadow-lg transition-all`}
              >
                {editMode ? "SIMPAN KOREKSI" : "BAYAR"}
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* MODAL PILIH PELANGGAN */}
      {showCustomerSearch && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white">Pilih Pelanggan</h3>
              <button onClick={() => setShowCustomerSearch(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <input type="text" placeholder="Cari nama / no hp..." value={customerSearchQuery} onChange={(e) => setCustomerSearchQuery(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-sm mb-3 outline-none" />
            <div className="max-h-48 overflow-y-auto space-y-2 mb-4">
              {customers.filter(c => (c.name || "").toLowerCase().includes(customerSearchQuery.toLowerCase())).map(c => (
                <div key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerSearch(false); }} className="p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 cursor-pointer flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-white">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.phoneNumber || "-"}</p>
                  </div>
                  <span className="text-xs text-emerald-400 font-semibold">{c.totalPoints || 0} Poin</span>
                </div>
              ))}
            </div>
            <button onClick={() => { setSelectedCustomer(null); setShowCustomerSearch(false); }} className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold">
              Tanpa Pelanggan (Umum)
            </button>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH BIAYA */}
      {showBiayaDialog && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Tambah Biaya Tambahan</h3>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Biaya Ongkir (Rp)</label>
              <input type="number" value={biayaOngkir || ""} onChange={(e) => setBiayaOngkir(Number(e.target.value))} placeholder="0" className="w-full bg-slate-800 rounded-xl p-3 text-white text-sm border border-slate-700 outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Biaya Admin (Rp)</label>
              <input type="number" value={biayaAdmin || ""} onChange={(e) => setBiayaAdmin(Number(e.target.value))} placeholder="0" className="w-full bg-slate-800 rounded-xl p-3 text-white text-sm border border-slate-700 outline-none" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Biaya Lain-lain (Rp)</label>
              <input type="number" value={biayaLainnya || ""} onChange={(e) => setBiayaLainnya(Number(e.target.value))} placeholder="0" className="w-full bg-slate-800 rounded-xl p-3 text-white text-sm border border-slate-700 outline-none" />
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowBiayaDialog(false)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">TUTUP</button>
              <button onClick={() => setShowBiayaDialog(false)} className="flex-1 py-2.5 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold">SIMPAN</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PEMBAYARAN */}
      {showPay && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-3">Rincian Pembayaran</h3>
            <div className="flex justify-between items-center mb-4 bg-slate-800/60 p-3.5 rounded-2xl border border-slate-700/50">
              <p className="text-slate-400 text-sm">Total Tagihan</p>
              <p className="text-xl font-black text-emerald-400">Rp {formatRupiah(totalAkhir)}</p>
            </div>
            
            <div className="flex gap-2 mb-4">
              <button onClick={() => setMetodeBayar("cash")} className={`flex-1 py-2 rounded-xl font-bold text-xs border ${metodeBayar === 'cash' ? 'bg-emerald-500 text-slate-950 border-emerald-500' : 'bg-transparent text-slate-400 border-slate-700'}`}>Tunai (Cash)</button>
              <button onClick={() => setMetodeBayar("qris")} className={`flex-1 py-2 rounded-xl font-bold text-xs border ${metodeBayar === 'qris' ? 'bg-blue-500 text-white border-blue-500' : 'bg-transparent text-slate-400 border-slate-700'}`}>QRIS</button>
            </div>

            {metodeBayar === "cash" ? (
              <>
                <input type="text" placeholder="Masukkan Uang Diterima..." value={uangBayar} onChange={(e) => setUangBayar(e.target.value.replace(/\D/g, ''))} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3.5 text-white text-lg font-bold mb-3 outline-none" />
                <div className="flex justify-between items-center mb-5 px-1">
                  <p className="font-semibold text-xs text-slate-400">{isUtang ? "Sisa Piutang (Kurang)" : "Kembalian"}</p>
                  <p className={`text-base font-black ${isUtang ? 'text-orange-400' : 'text-emerald-400'}`}>Rp {formatRupiah(Math.abs(kembalian))}</p>
                </div>
              </>
            ) : (
              <div className="text-center p-5 bg-blue-500/10 rounded-2xl mb-5 border border-blue-500/30">
                <p className="text-blue-400 font-bold text-sm mb-1">Arahkan Pelanggan ke QRIS</p>
                <p className="text-xs text-slate-400">Tagihan akan dicatat lunas otomatis.</p>
              </div>
            )}

            <div className="flex gap-2.5">
              <button onClick={() => setShowPay(false)} disabled={isProcessing} className="flex-1 py-3.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">BATAL</button>
              <button onClick={prosesPembayaran} disabled={isProcessing} className={`flex-1 py-3.5 font-black rounded-xl text-xs text-white ${isUtang ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                {isProcessing ? "MEMPROSES..." : isUtang ? "SIMPAN UTANG" : "SELESAIKAN"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT HARGA BARANG */}
      {showEditPrice && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-1">Ubah Harga Satuan</h3>
            <p className="text-xs text-slate-400 mb-4">{showEditPrice.nama} (Normal: Rp {formatRupiah(showEditPrice.hargaNormal)})</p>
            
            <input 
              type="number" 
              value={inputHargaBaru} 
              onChange={(e) => setInputHargaBaru(e.target.value)} 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-yellow-400 text-lg font-bold mb-4 outline-none" 
            />
            
            <div className="flex gap-2">
              <button onClick={() => setShowEditPrice(null)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">BATAL</button>
              <button onClick={() => {
                const p = Number(inputHargaBaru);
                if (p > 0) updateCartPrice(showEditPrice.id, p);
              }} className="flex-1 py-2.5 bg-yellow-500 text-slate-950 font-black rounded-xl text-xs">SIMPAN</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL SUCCESS */}
      {showSuccess && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-sm p-6 shadow-2xl text-center">
            <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-3xl mx-auto mb-3 border border-emerald-500/40">✓</div>
            <h3 className="text-xl font-black text-white mb-1">Transaksi Sukses!</h3>
            <p className="text-slate-400 font-mono text-xs mb-5">ID: #{String(showSuccess.trxId).slice(-6)}</p>
            
            <button onClick={resetKasir} className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-sm shadow-lg">
              SELESAI & KEMBALI
            </button>
          </div>
        </div>
      )}
    </div>
  );
}