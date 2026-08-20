"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { database } from "@/lib/firebase/firebase";
import { ref, onValue, set, get, push, update } from "firebase/database";

export default function KasirPage() {
  const router = useRouter();
  const { user, profile, loading } = useAuth();
  
  // States Utama
  const [produkList, setProdukList] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [customers, setCustomers] = useState<any[]>([]);
  
  // State Edit Transaksi dari Laporan
  const [editMode, setEditMode] = useState<any>(null);
  
  // State Pembayaran & Biaya
  const [showPay, setShowPay] = useState(false);
  const [uangBayar, setUangBayar] = useState("");
  const [metodeBayar, setMetodeBayar] = useState("cash");
  const [biayaAdmin, setBiayaAdmin] = useState(0);
  const [biayaOngkir, setBiayaOngkir] = useState(0);
  const [biayaLainnya, setBiayaLainnya] = useState(0);
  const [namaBiayaLain, setNamaBiayaLain] = useState("Biaya Lain-lain");
  
  // State Modals & Dialogs
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [showBiayaDialog, setShowBiayaDialog] = useState(false);
  const [showEditPrice, setShowEditPrice] = useState<any>(null);
  const [showSuccess, setShowSuccess] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => { if (!loading && !user) router.push("/login"); }, [user, loading, router]);

  // 🔥 TANGKAP LEMPARAN DARI MENU LAPORAN
  useEffect(() => {
    const payload = localStorage.getItem("edit_trx_payload");
    if (payload) {
      const data = JSON.parse(payload);
      if (data.isEditing) {
          setEditMode({ trxId: data.trxId, waktu: data.waktuTransaksi, kasirName: data.kasirName, customerName: data.customerName });
          setCart(data.items);
      }
      localStorage.removeItem("edit_trx_payload"); // Hapus agar tidak terus-terusan mengedit
    }
  }, []);

  // Fetch Data (Stok & Pelanggan)
  useEffect(() => {
    if (!profile?.groupId) return;
    const pRef = ref(database, `stok/${profile.groupId}`);
    const cRef = ref(database, `pelanggan_toko/${profile.groupId}`);
    
    onValue(pRef, (snap) => {
      if (snap.exists()) {
        const list = Object.keys(snap.val()).map(k => ({ id: k, ...snap.val()[k] })).filter(p => p.is_active !== false);
        setProdukList(list.sort((a,b) => a.nama_produk.localeCompare(b.nama_produk)));
      } else setProdukList([]);
    });

    onValue(cRef, (snap) => {
        if(snap.exists()) setCustomers(Object.keys(snap.val()).map(k => ({id:k, ...snap.val()[k]})));
    });
  }, [profile?.groupId]);

  const formatRupiah = (angka: number) => new Intl.NumberFormat("id-ID").format(angka || 0);
  const filteredProduk = produkList.filter(p => p.nama_produk.toLowerCase().includes(searchQuery.toLowerCase()) || (p.barcode || "").includes(searchQuery));

  const totalBelanjaMurni = cart.reduce((sum, item) => sum + (item.qty * item.hargaJual), 0);
  const totalAkhir = totalBelanjaMurni + biayaAdmin + biayaOngkir + biayaLainnya;
  const nominalBayar = metodeBayar === "qris" ? totalAkhir : Number(uangBayar.replace(/\D/g, ''));
  const kembalian = nominalBayar - totalAkhir;
  const isUtang = kembalian < 0;

  // Manajemen Keranjang (Sama dengan CartManager.kt)
  const addToCart = (produk: any, qtyTambah = 1) => {
      const existing = cart.find(c => c.id === produk.id);
      const sisaStok = produk.total_stok - (existing?.qty || 0);
      
      if (sisaStok < qtyTambah) return alert("Stok Habis!");
      
      if (existing) {
          setCart(cart.map(c => c.id === produk.id ? { ...c, qty: c.qty + qtyTambah } : c));
      } else {
          setCart([...cart, { id: produk.id, nama: produk.nama_produk, hargaJual: produk.harga_jual, hargaNormal: produk.harga_jual, hargaModal: produk.harga_modal, qty: qtyTambah, isCustomPrice: false }]);
      }
  };

  const updateCartQty = (id: string, newQty: number) => {
      if (newQty <= 0) setCart(cart.filter(c => c.id !== id));
      else setCart(cart.map(c => c.id === id ? { ...c, qty: newQty } : c));
  };

  const updateCartPrice = (id: string, newPrice: number) => {
      setCart(cart.map(c => c.id === id ? { ...c, hargaJual: newPrice, isCustomPrice: true } : c));
      setShowEditPrice(null);
  };

  // 🔥 PROSES PEMBAYARAN & UPDATE FIREBASE
  const prosesPembayaran = async () => {
      if (isUtang && !selectedCustomer && !editMode?.customerName) return alert("Transaksi Utang wajib memilih pelanggan!");
      setIsProcessing(true);

      try {
          // 1. Eksekusi Pembayaran Biasa
          if (!editMode) {
              const trxId = `trx_${Date.now()}_${Math.random().toString(36).substring(2,7)}`;
              const time = Date.now();
              const cusName = selectedCustomer?.name || "";
              const finalStatus = isUtang ? "UTANG" : "SELESAI";
              
              const payload = {
                  trxId,
                  timestamp: time,
                  kasirName: profile?.username || "Admin Web",
                  customerName: cusName,
                  status: finalStatus,
                  bayar: nominalBayar,
                  kembali: kembalian,
                  metodeBayar: metodeBayar,
                  totalHarga: totalAkhir,
                  biayaAdmin, biayaOngkir, biayaLainnya, namaBiayaLainnya: namaBiayaLain, totalBelanjaMurni,
                  items: cart.reduce((acc, c, i) => ({ ...acc, [i]: { produkId: c.id, nama_produk: c.nama, harga_jual: c.hargaJual, qty: c.qty, modal: c.hargaModal, isCustomPrice: c.isCustomPrice } }), {})
              };

              // Potong Stok
              const updates: any = {};
              cart.forEach(c => {
                 const p = produkList.find(pl => pl.id === c.id);
                 if (p) updates[`stok/${profile?.groupId}/${c.id}/total_stok`] = p.total_stok - c.qty;
              });

              await set(ref(database, `transaksi/${profile?.groupId}/${trxId}`), payload);
              if (Object.keys(updates).length > 0) await update(ref(database), updates);

              setShowSuccess({ trxId, totalAkhir, kembalian });
          } 
          // 2. Eksekusi KOREKSI Transaksi (Dari Laporan)
          else {
              const payload = {
                  isEdited: true,
                  bayar: nominalBayar,
                  kembali: kembalian,
                  status: isUtang ? "UTANG" : "SELESAI",
                  totalHarga: totalAkhir,
                  biayaAdmin, biayaOngkir, biayaLainnya, namaBiayaLainnya: namaBiayaLain, totalBelanjaMurni,
                  items: cart.reduce((acc, c, i) => ({ ...acc, [i]: { produkId: c.id, nama_produk: c.nama, harga_jual: c.hargaJual, qty: c.qty, modal: c.hargaModal, isCustomPrice: c.isCustomPrice } }), {})
              };

              // Hitung delta stok
              const trxLamaRef = ref(database, `transaksi/${profile?.groupId}/${editMode.trxId}`);
              const snapTrxLama = await get(trxLamaRef);
              const itemsLama = snapTrxLama.exists() ? snapTrxLama.val().items : {};
              const stokUpdates: any = {};

              // Kembalikan semua stok lama dulu
              if (itemsLama) {
                  Object.values(itemsLama).forEach((il: any) => {
                      const p = produkList.find(pl => pl.id === il.produkId);
                      if (p) stokUpdates[`stok/${profile?.groupId}/${il.produkId}/total_stok`] = (stokUpdates[`stok/${profile?.groupId}/${il.produkId}/total_stok`] || p.total_stok) + il.qty;
                  });
              }
              // Potong dengan stok baru
              cart.forEach(c => {
                  const currentStok = stokUpdates[`stok/${profile?.groupId}/${c.id}/total_stok`] || produkList.find(pl => pl.id === c.id)?.total_stok || 0;
                  stokUpdates[`stok/${profile?.groupId}/${c.id}/total_stok`] = currentStok - c.qty;
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
      setCart([]); setUangBayar(""); setBiayaAdmin(0); setBiayaOngkir(0); setBiayaLainnya(0); 
      setNamaBiayaLain("Biaya Lain-lain"); setSelectedCustomer(null); setShowSuccess(null); setShowPay(false); setEditMode(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-emerald-500 selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
            
            {/* AREA KIRI: KATALOG BARANG */}
            <div className="flex-1 p-6 flex flex-col border-r border-slate-800">
                {editMode && (
                    <div className="bg-orange-500/20 border border-orange-500/50 p-4 rounded-xl mb-4 flex justify-between items-center">
                        <p className="text-orange-500 font-bold">⚠️ MODE EDIT KOREKSI AKTIF (Trx: #{editMode.trxId.slice(-5)})</p>
                        <button onClick={() => { setEditMode(null); setCart([]); }} className="text-xs bg-red-500 text-white px-3 py-1 rounded-lg">Batal Edit</button>
                    </div>
                )}
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex items-center gap-3 mb-6">
                    <span className="text-xl">🔍</span>
                    <input type="text" placeholder="Cari Nama Barang / Barcode..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm text-white w-full" />
                </div>

                <div className="flex-1 overflow-y-auto pr-2 space-y-3">
                    {filteredProduk.map(p => {
                        const inCart = cart.find(c => c.id === p.id);
                        const qtyDiKeranjang = inCart?.qty || 0;
                        const sisaStok = p.total_stok - qtyDiKeranjang;
                        const isHabis = sisaStok <= 0;
                        
                        return (
                            <div key={p.id} className={`p-4 rounded-2xl flex justify-between items-center ${isHabis ? 'bg-slate-900/50 opacity-50' : 'bg-slate-900'} border border-slate-800`}>
                                <div>
                                    <p className="font-bold text-white">{p.nama_produk}</p>
                                    <p className="text-emerald-400 font-semibold text-sm">Rp {formatRupiah(p.harga_jual)}</p>
                                    <p className="text-xs text-slate-500 mt-1">Stok sisa: {sisaStok}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    {qtyDiKeranjang > 0 && (
                                        <>
                                            <button onClick={() => updateCartQty(p.id, qtyDiKeranjang - 1)} className="w-8 h-8 rounded-full bg-slate-800 text-red-400 font-bold">-</button>
                                            <span className="font-bold text-lg">{qtyDiKeranjang}</span>
                                        </>
                                    )}
                                    <button onClick={() => addToCart(p)} disabled={isHabis} className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-500 border border-emerald-500/50 font-bold hover:bg-emerald-500 hover:text-white">+</button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* AREA KANAN: KERANJANG (CART) */}
            <div className="w-full md:w-96 bg-slate-900 flex flex-col">
                <div className="p-6 bg-slate-800/50 border-b border-slate-800">
                    <h2 className="text-xl font-bold">Keranjang</h2>
                    <p className="text-sm text-slate-400">{cart.reduce((s,c)=>s+c.qty,0)} Item</p>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {cart.map(c => (
                        <div key={c.id} className="border-b border-slate-800 pb-4">
                            <div className="flex justify-between items-start mb-2">
                                <p className="font-bold text-white">{c.nama}</p>
                                <p className="font-bold text-emerald-400">Rp {formatRupiah(c.qty * c.hargaJual)}</p>
                            </div>
                            <div className="flex justify-between items-center text-sm text-slate-400">
                                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setShowEditPrice(c)}>
                                    <p className={c.isCustomPrice ? "text-yellow-500" : ""}>@ Rp {formatRupiah(c.hargaJual)}</p>
                                    <span className="text-xs bg-slate-800 px-2 py-0.5 rounded text-slate-300">✎ Edit</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => updateCartQty(c.id, c.qty - 1)} className="w-6 h-6 bg-slate-800 rounded text-white">-</button>
                                    <span className="w-6 text-center text-white">{c.qty}</span>
                                    <button onClick={() => addToCart(c, 1)} className="w-6 h-6 bg-slate-800 rounded text-white">+</button>
                                </div>
                            </div>
                        </div>
                    ))}
                    {cart.length === 0 && <p className="text-center text-slate-500 mt-10">Keranjang kosong</p>}
                </div>

                {/* FOOTER KERANJANG */}
                <div className="p-6 bg-slate-800/80 border-t border-slate-800">
                    <button onClick={() => setShowBiayaDialog(true)} className="w-full py-2 mb-4 border border-orange-500/50 text-orange-400 rounded-xl text-sm font-bold bg-orange-500/10">
                        + Tambah Biaya (Ongkir/Admin)
                    </button>
                    {(biayaOngkir > 0 || biayaAdmin > 0 || biayaLainnya > 0) && (
                        <div className="bg-orange-500/10 p-3 rounded-xl mb-4 text-xs font-bold text-orange-400 space-y-1">
                            {biayaOngkir > 0 && <div className="flex justify-between"><span>Ongkir</span><span>Rp {formatRupiah(biayaOngkir)}</span></div>}
                            {biayaAdmin > 0 && <div className="flex justify-between"><span>Admin</span><span>Rp {formatRupiah(biayaAdmin)}</span></div>}
                            {biayaLainnya > 0 && <div className="flex justify-between"><span>{namaBiayaLain}</span><span>Rp {formatRupiah(biayaLainnya)}</span></div>}
                        </div>
                    )}
                    
                    <button onClick={() => setShowCustomerSearch(true)} className="w-full py-2 mb-4 border border-blue-500/50 text-blue-400 rounded-xl text-sm font-bold bg-blue-500/10">
                        {selectedCustomer ? `👤 ${selectedCustomer.name}` : editMode?.customerName ? `👤 ${editMode.customerName}` : "👤 + Pilih Pelanggan (Opsional)"}
                    </button>

                    <div className="flex justify-between items-center mb-4">
                        <p className="text-slate-400 font-bold">Total</p>
                        <p className="text-2xl font-black text-emerald-400">Rp {formatRupiah(totalAkhir)}</p>
                    </div>
                    <button disabled={cart.length === 0} onClick={() => setShowPay(true)} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-700 disabled:text-slate-500 text-white font-black text-lg rounded-xl shadow-lg transition-all">
                        {editMode ? "SIMPAN KOREKSI" : "BAYAR"}
                    </button>
                </div>
            </div>
        </main>
      </div>

      {/* MODAL PEMBAYARAN */}
      {showPay && (
          <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-4">Pembayaran</h3>
                  <div className="flex justify-between items-center mb-6">
                      <p className="text-slate-400">Total Tagihan</p>
                      <p className="text-2xl font-black text-emerald-400">Rp {formatRupiah(totalAkhir)}</p>
                  </div>
                  
                  <div className="flex gap-2 mb-6">
                      <button onClick={() => setMetodeBayar("cash")} className={`flex-1 py-2 rounded-lg font-bold border ${metodeBayar === 'cash' ? 'bg-emerald-500 text-slate-950 border-emerald-500' : 'bg-transparent text-slate-400 border-slate-700'}`}>Tunai</button>
                      <button onClick={() => setMetodeBayar("qris")} className={`flex-1 py-2 rounded-lg font-bold border ${metodeBayar === 'qris' ? 'bg-blue-500 text-white border-blue-500' : 'bg-transparent text-slate-400 border-slate-700'}`}>QRIS</button>
                  </div>

                  {metodeBayar === "cash" ? (
                      <>
                          <input type="text" placeholder="Uang Diterima..." value={uangBayar} onChange={(e) => setUangBayar(e.target.value.replace(/\D/g, ''))} className="w-full bg-slate-800 border-none rounded-xl p-4 text-white text-xl font-bold mb-4" />
                          <div className="flex justify-between items-center mb-6">
                              <p className="font-bold text-slate-400">{isUtang ? "Kekurangan" : "Kembalian"}</p>
                              <p className={`text-xl font-bold ${isUtang ? 'text-red-500' : 'text-emerald-400'}`}>Rp {formatRupiah(Math.abs(kembalian))}</p>
                          </div>
                      </>
                  ) : (
                      <div className="text-center p-6 bg-blue-500/10 rounded-xl mb-6 border border-blue-500/30">
                          <p className="text-blue-400 font-bold mb-2">Arahkan pelanggan ke QRIS Akrilik</p>
                          <p className="text-xs text-slate-400">Sistem akan mencatat tagihan lunas.</p>
                      </div>
                  )}

                  <div className="flex gap-3">
                      <button onClick={() => setShowPay(false)} disabled={isProcessing} className="flex-1 py-4 bg-slate-800 text-white font-bold rounded-xl">KEMBALI</button>
                      <button onClick={prosesPembayaran} disabled={isProcessing} className={`flex-1 py-4 font-black rounded-xl text-white ${isUtang ? 'bg-orange-500' : 'bg-emerald-500'}`}>
                          {isProcessing ? "PROSES..." : isUtang ? "SIMPAN UTANG" : "BAYAR LUNAS"}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL EDIT HARGA BARANG */}
      {showEditPrice && (
          <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-6 shadow-2xl">
                  <h3 className="text-xl font-bold text-white mb-2">Ubah Harga</h3>
                  <p className="text-slate-400 mb-6">{showEditPrice.nama} (Normal: Rp {formatRupiah(showEditPrice.hargaNormal)})</p>
                  
                  <input type="number" id="inputHargaBaru" defaultValue={showEditPrice.hargaJual} className="w-full bg-slate-800 border-none rounded-xl p-4 text-yellow-400 text-xl font-bold mb-6" />
                  
                  <div className="flex gap-3">
                      <button onClick={() => setShowEditPrice(null)} className="flex-1 py-3 bg-slate-800 text-white font-bold rounded-xl">BATAL</button>
                      <button onClick={() => {
                          const val = (document.getElementById("inputHargaBaru") as HTMLInputElement).value;
                          updateCartPrice(showEditPrice.id, Number(val));
                      }} className="flex-1 py-3 bg-yellow-500 text-slate-950 font-black rounded-xl">SIMPAN</button>
                  </div>
              </div>
          </div>
      )}

      {/* MODAL SUCCESS */}
      {showSuccess && (
          <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-sm p-8 shadow-2xl text-center">
                  <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 border border-emerald-500/50">✓</div>
                  <h3 className="text-2xl font-black text-white mb-2">Transaksi Sukses!</h3>
                  <p className="text-slate-400 font-mono mb-6">Trx ID: #{showSuccess.trxId.slice(-6)}</p>
                  
                  <button onClick={resetKasir} className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl shadow-lg">SELESAI & KEMBALI</button>
              </div>
          </div>
      )}
    </div>
  );
}