// @ts-nocheck
"use client";

import { useEffect, useState, useRef } from "react";
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
  
  // Data Toko & QRIS
  const [identitasToko, setIdentitasToko] = useState<any>({
    namaToko: "CSKasir",
    alamatToko: "",
    noTelp: "",
    slogan: "",
    footerStruk: "Terima Kasih atas Kunjungan Anda!"
  });
  const [qrisUrl, setQrisUrl] = useState("");

  const [editMode, setEditMode] = useState<any>(null);
  
  // Pembayaran & Biaya
  const [showPay, setShowPay] = useState(false);
  const [uangBayar, setUangBayar] = useState("");
  const [metodeBayar, setMetodeBayar] = useState("cash");
  
  const [biayaAdmin, setBiayaAdmin] = useState(0);
  const [biayaOngkir, setBiayaOngkir] = useState(0);
  const [biayaLainnya, setBiayaLainnya] = useState(0);
  const [namaBiayaLain, setNamaBiayaLain] = useState("Biaya Lain-lain");
  
  // Modals
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState("");
  const [showBiayaDialog, setShowBiayaDialog] = useState(false);
  const [showEditPrice, setShowEditPrice] = useState<any>(null);
  const [inputHargaBaru, setInputHargaBaru] = useState("");
  const [showManualQty, setShowManualQty] = useState<any>(null);
  const [inputManualQty, setInputManualQty] = useState("");

  // Dialog Sukses & Struk
  const [showSuccess, setShowSuccess] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => { 
    if (!loading && !user) router.push("/login"); 
  }, [user, loading, router]);

  // Tangkap Lemparan Edit dari Laporan
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

  // Fetch Stok, Pelanggan, Identitas Toko, & QRIS
  useEffect(() => {
    const prof = profile as any;
    if (!prof?.groupId) return;

    // 1. Stok Produk
    const pRef = ref(database, `stok/${prof.groupId}`);
    const unsubProduk = onValue(pRef, (snap) => {
      if (snap.exists()) {
        const list = Object.keys(snap.val()).map(k => ({ id: k, ...snap.val()[k] })).filter(p => p.is_active !== false);
        setProdukList(list.sort((a,b) => (a.nama_produk || "").localeCompare(b.nama_produk || "")));
      } else {
        setProdukList([]);
      }
    });

    // 2. Pelanggan
    const cRef = ref(database, `pelanggan_toko/${prof.groupId}`);
    const unsubCustomer = onValue(cRef, (snap) => {
      if (snap.exists()) {
        setCustomers(Object.keys(snap.val()).map(k => ({ id: k, ...snap.val()[k] })));
      }
    });

    // 3. Identitas Toko
    const tokoRef = ref(database, `DATA_TOKO/${prof.groupId}/identitas`);
    const unsubToko = onValue(tokoRef, (snap) => {
      if (snap.exists()) {
        const val = snap.val();
        setIdentitasToko({
          namaToko: val.namaToko || "CSKasir",
          alamatToko: val.alamatToko || "",
          noTelp: val.noTelp || "",
          slogan: val.slogan || "",
          footerStruk: val.footerStruk || "Terima Kasih atas Kunjungan Anda!"
        });
      }
    });

    // 4. QRIS Kasir
    if (user?.uid) {
      const userRef = ref(database, `users/${user.uid}`);
      onValue(userRef, (snap) => {
        if (snap.exists()) {
          setQrisUrl(snap.val().qrisUrl || "");
        }
      });
    }

    return () => {
      unsubProduk();
      unsubCustomer();
      unsubToko();
    };
  }, [profile, user]);

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

  const getMasterProduk = (id: string, nama?: string) => {
    return produkList.find(p => p.id === id || (nama && (p.nama_produk || "").toLowerCase() === nama.toLowerCase()));
  };

  const addToCart = (item: any, qtyTambah = 1) => {
    const master = getMasterProduk(item.id, item.nama || item.nama_produk);
    const targetId = master ? master.id : item.id;
    const maxStok = master ? Number(master.total_stok ?? master.stok ?? 0) : 9999;
    
    const existing = cart.find(c => c.id === targetId);
    const currentQty = existing ? existing.qty : 0;
    
    if ((currentQty + qtyTambah) > maxStok) {
      return alert("Stok Habis / Melebihi batas stok toko!");
    }

    if (existing) {
      setCart(cart.map(c => c.id === targetId ? { ...c, qty: c.qty + qtyTambah } : c));
    } else {
      const namaBarang = master ? master.nama_produk : (item.nama || item.nama_produk || "Produk");
      const hargaJual = Number(item.hargaJual || item.harga_jual || (master ? master.harga_jual : 0));
      const hargaModal = Number(item.hargaModal || item.harga_modal || (master ? master.harga_modal : 0));
      
      setCart([...cart, { 
        id: targetId, 
        nama: namaBarang, 
        hargaJual: hargaJual, 
        hargaNormal: master ? Number(master.harga_jual || hargaJual) : hargaJual, 
        hargaModal: hargaModal, 
        qty: qtyTambah, 
        isCustomPrice: item.isCustomPrice || false 
      }]);
    }
  };

  const updateCartQty = (id: string, newQty: number) => {
    if (newQty <= 0) {
      setCart(cart.filter(c => c.id !== id));
      return;
    }
    const master = getMasterProduk(id);
    const maxStok = master ? Number(master.total_stok ?? master.stok ?? 0) : 9999;
    
    if (newQty > maxStok) {
      return alert(`Jumlah melebihi stok toko (Maks: ${maxStok})!`);
    }
    setCart(cart.map(c => c.id === id ? { ...c, qty: newQty } : c));
  };

  const openManualQtyDialog = (item: any) => {
    const master = getMasterProduk(item.id, item.nama || item.nama_produk);
    const maxStok = master ? Number(master.total_stok ?? master.stok ?? 0) : 9999;
    const currentQty = cart.find(c => c.id === item.id)?.qty || item.qty || 1;
    
    setShowManualQty({
      id: item.id,
      nama: master ? master.nama_produk : (item.nama || item.nama_produk || "Produk"),
      maxStok: maxStok,
      currentQty: currentQty
    });
    setInputManualQty(String(currentQty));
  };

  const saveManualQty = () => {
    if (!showManualQty) return;
    const q = Number(inputManualQty.replace(/\D/g, ''));
    
    if (q <= 0) {
      updateCartQty(showManualQty.id, 0);
    } else {
      if (q > showManualQty.maxStok) {
        return alert(`Jumlah melebihi stok yang tersedia (Maks: ${showManualQty.maxStok})!`);
      }
      const existing = cart.find(c => c.id === showManualQty.id);
      if (existing) {
        setCart(cart.map(c => c.id === showManualQty.id ? { ...c, qty: q } : c));
      } else {
        const master = getMasterProduk(showManualQty.id);
        if (master) {
          setCart([...cart, {
            id: master.id,
            nama: master.nama_produk,
            hargaJual: Number(master.harga_jual || 0),
            hargaNormal: Number(master.harga_jual || 0),
            hargaModal: Number(master.harga_modal || 0),
            qty: q,
            isCustomPrice: false
          }]);
        }
      }
    }
    setShowManualQty(null);
  };

  const updateCartPrice = (id: string, newPrice: number) => {
    setCart(cart.map(c => c.id === id ? { ...c, hargaJual: newPrice, isCustomPrice: true } : c));
    setShowEditPrice(null);
  };

  // 🔥 PROSES TRANSAKSI
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

        setShowPay(false);
        setShowSuccess({
          trxId,
          timestamp: time,
          items: [...cart],
          totalAkhir,
          bayar: nominalBayar,
          kembali: kembalian,
          metodeBayar,
          biayaOngkir,
          biayaAdmin,
          biayaLainnya,
          namaBiayaLainnya: namaBiayaLain,
          kasirName: namaKasir,
          customerName: cusName
        });
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

  // 🔥 CETAK STRUK (THERMAL BROWSER PRINT)
  const handlePrintStruk = () => {
    if (!showSuccess) return;
    const printWindow = window.open('', '_blank', 'width=350,height=600');
    if (!printWindow) return alert("Izinkan pop-up browser untuk mencetak struk!");

    const date = new Date(showSuccess.timestamp || Date.now());
    const tglStr = `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

    let itemsHtml = showSuccess.items.map(item => `
      <div style="display:flex; justify-content:space-between; margin-bottom:2px;">
        <span style="font-weight:bold;">${item.nama}</span>
        <span>Rp ${formatRupiah(item.qty * item.hargaJual)}</span>
      </div>
      <div style="font-size:11px; color:#555; margin-bottom:4px;">
        ${item.qty} x Rp ${formatRupiah(item.hargaJual)}
      </div>
    `).join('');

    if (showSuccess.biayaOngkir > 0) {
      itemsHtml += `<div style="display:flex; justify-content:space-between; font-size:12px;"><span>Biaya Ongkir</span><span>Rp ${formatRupiah(showSuccess.biayaOngkir)}</span></div>`;
    }
    if (showSuccess.biayaAdmin > 0) {
      itemsHtml += `<div style="display:flex; justify-content:space-between; font-size:12px;"><span>Biaya Admin</span><span>Rp ${formatRupiah(showSuccess.biayaAdmin)}</span></div>`;
    }
    if (showSuccess.biayaLainnya > 0) {
      itemsHtml += `<div style="display:flex; justify-content:space-between; font-size:12px;"><span>${showSuccess.namaBiayaLainnya || "Biaya Lain"}</span><span>Rp ${formatRupiah(showSuccess.biayaLainnya)}</span></div>`;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Struk_${showSuccess.trxId}</title>
          <style>
            @page { margin: 0; size: auto; }
            body { font-family: monospace, Courier, sans-serif; width: 58mm; padding: 6px; margin: 0 auto; color: #000; font-size: 12px; }
            .center { text-align: center; }
            .line { border-top: 1px dashed #000; margin: 6px 0; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size:14px;">${identitasToko.namaToko}</div>
          ${identitasToko.slogan ? `<div class="center" style="font-size:10px;">${identitasToko.slogan}</div>` : ''}
          ${identitasToko.alamatToko ? `<div class="center" style="font-size:10px;">${identitasToko.alamatToko}</div>` : ''}
          ${identitasToko.noTelp ? `<div class="center" style="font-size:10px;">Telp: ${identitasToko.noTelp}</div>` : ''}
          
          <div class="line"></div>
          <div>No. Trx : #${showSuccess.trxId.slice(-6)}</div>
          <div>Tgl     : ${tglStr}</div>
          <div>Kasir   : ${showSuccess.kasirName}</div>
          ${showSuccess.customerName ? `<div>Pelanggan: ${showSuccess.customerName}</div>` : ''}
          
          <div class="line"></div>
          ${itemsHtml}
          <div class="line"></div>
          
          <div style="display:flex; justify-content:space-between;" class="bold">
            <span>TOTAL</span>
            <span>Rp ${formatRupiah(showSuccess.totalAkhir)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:11px; margin-top:2px;">
            <span>Bayar (${showSuccess.metodeBayar.toUpperCase()})</span>
            <span>Rp ${formatRupiah(showSuccess.bayar)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:11px;">
            <span>Kembali</span>
            <span>Rp ${formatRupiah(showSuccess.kembali)}</span>
          </div>
          
          <div class="line"></div>
          <div class="center" style="font-size:11px;">${identitasToko.footerStruk}</div>
          <script>
            window.onload = function() { window.print(); window.close(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // 🔥 KIRIM STRUK WHATSAPP
  const handleKirimWA = () => {
    if (!showSuccess) return;
    const date = new Date(showSuccess.timestamp || Date.now());
    const tglStr = `${date.getDate()}/${date.getMonth()+1}/${date.getFullYear()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;

    let text = `*STRUK PEMBELIAN - ${identitasToko.namaToko.toUpperCase()}*\n`;
    if (identitasToko.alamatToko) text += `${identitasToko.alamatToko}\n`;
    if (identitasToko.noTelp) text += `Telp: ${identitasToko.noTelp}\n`;
    text += `--------------------------------\n`;
    text += `No. Trx : #${showSuccess.trxId.slice(-6)}\n`;
    text += `Waktu   : ${tglStr}\n`;
    text += `Kasir   : ${showSuccess.kasirName}\n`;
    if (showSuccess.customerName) text += `Customer: ${showSuccess.customerName}\n`;
    text += `--------------------------------\n`;

    showSuccess.items.forEach(item => {
      text += `• *${item.nama}*\n  ${item.qty} x Rp ${formatRupiah(item.hargaJual)} = Rp ${formatRupiah(item.qty * item.hargaJual)}\n`;
    });

    if (showSuccess.biayaOngkir > 0) text += `• Ongkir : Rp ${formatRupiah(showSuccess.biayaOngkir)}\n`;
    if (showSuccess.biayaAdmin > 0) text += `• Admin  : Rp ${formatRupiah(showSuccess.biayaAdmin)}\n`;
    if (showSuccess.biayaLainnya > 0) text += `• ${showSuccess.namaBiayaLainnya || "Biaya Lain"} : Rp ${formatRupiah(showSuccess.biayaLainnya)}\n`;

    text += `--------------------------------\n`;
    text += `*TOTAL   : Rp ${formatRupiah(showSuccess.totalAkhir)}*\n`;
    text += `Bayar (${showSuccess.metodeBayar.toUpperCase()}) : Rp ${formatRupiah(showSuccess.bayar)}\n`;
    text += `Kembali : Rp ${formatRupiah(showSuccess.kembali)}\n`;
    text += `--------------------------------\n`;
    text += `${identitasToko.footerStruk}\n`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
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
    <div className="h-screen w-screen bg-slate-950 text-slate-100 flex font-sans selection:bg-emerald-500 selection:text-white overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Navbar />
        
        <main className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden">
            
          {/* AREA KIRI: KATALOG BARANG */}
          <div className="flex-1 p-4 md:p-6 flex flex-col min-h-0 overflow-hidden border-r border-slate-800">
            {editMode && (
              <div className="bg-orange-500/20 border border-orange-500/50 p-3.5 rounded-xl mb-3 flex justify-between items-center shrink-0">
                <p className="text-orange-400 font-bold text-xs md:text-sm">⚠️ MODE EDIT KOREKSI AKTIF (Trx: #{String(editMode.trxId).slice(-5)})</p>
                <button onClick={() => { setEditMode(null); setCart([]); }} className="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg font-bold hover:bg-red-600">Batal Edit</button>
              </div>
            )}
            
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 flex items-center gap-3 mb-3 shrink-0">
              <span className="text-base">🔍</span>
              <input type="text" placeholder="Cari Nama Barang / Barcode..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-transparent border-none outline-none text-sm text-white w-full" />
            </div>

            {/* List Barang */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-2.5">
              {filteredProduk.map(p => {
                const inCart = cart.find(c => c.id === p.id);
                const qtyDiKeranjang = inCart?.qty || 0;
                const sisaStok = (p.total_stok || 0) - qtyDiKeranjang;
                const isHabis = sisaStok <= 0;
                
                return (
                  <div key={p.id} className={`p-3.5 rounded-xl flex justify-between items-center ${isHabis ? 'bg-slate-900/50 opacity-50' : 'bg-slate-900'} border border-slate-800 transition-all`}>
                    <div>
                      <p className="font-bold text-white text-sm md:text-base">{p.nama_produk}</p>
                      <p className="text-emerald-400 font-semibold text-xs md:text-sm">Rp {formatRupiah(p.harga_jual)}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">Stok sisa: {sisaStok}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {qtyDiKeranjang > 0 && (
                        <>
                          <button onClick={() => updateCartQty(p.id, qtyDiKeranjang - 1)} className="w-7 h-7 rounded-lg bg-slate-800 text-red-400 font-bold hover:bg-slate-700">-</button>
                          <span 
                            onClick={() => openManualQtyDialog(p)}
                            className="font-black text-sm min-w-[28px] text-center bg-slate-800 hover:bg-slate-700 text-emerald-400 px-2 py-1 rounded-lg cursor-pointer border border-slate-700 shadow-sm"
                            title="Klik untuk ketik jumlah langsung"
                          >
                            {qtyDiKeranjang}
                          </span>
                        </>
                      )}
                      <button onClick={() => addToCart(p, 1)} disabled={isHabis} className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold hover:bg-emerald-500 hover:text-slate-950 transition-all">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AREA KANAN: KERANJANG BELANJA */}
          <div className="w-full md:w-96 bg-slate-900/90 flex flex-col h-full min-h-0 border-l border-slate-800 shrink-0">
            <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex justify-between items-center shrink-0">
              <h2 className="text-base font-bold text-white">Keranjang Belanja</h2>
              <span className="text-xs font-semibold bg-slate-800 px-2.5 py-0.5 rounded-full text-slate-400">{cart.reduce((s,c)=>s+c.qty,0)} Item</span>
            </div>
            
            <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-2.5">
              {cart.map(c => (
                <div key={c.id} className="border-b border-slate-800/80 pb-2.5">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-bold text-xs md:text-sm text-white">{c.nama}</p>
                    <p className="font-bold text-xs md:text-sm text-emerald-400">Rp {formatRupiah(c.qty * c.hargaJual)}</p>
                  </div>
                  <div className="flex justify-between items-center text-xs text-slate-400">
                    <div className="flex items-center gap-1.5 cursor-pointer hover:text-yellow-400" onClick={() => {
                      setShowEditPrice(c);
                      setInputHargaBaru(String(c.hargaJual));
                    }}>
                      <p className={c.isCustomPrice ? "text-yellow-500 font-bold" : ""}>@ Rp {formatRupiah(c.hargaJual)}</p>
                      <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-300">✎ Edit</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => updateCartQty(c.id, c.qty - 1)} className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded text-white font-bold text-xs">-</button>
                      <span 
                        onClick={() => openManualQtyDialog(c)}
                        className="min-w-[24px] text-center text-emerald-400 font-bold text-xs bg-slate-800 hover:bg-slate-700 py-0.5 px-1 rounded cursor-pointer border border-slate-700"
                        title="Klik untuk ketik jumlah langsung"
                      >
                        {c.qty}
                      </span>
                      <button onClick={() => addToCart(c, 1)} className="w-5 h-5 bg-slate-800 hover:bg-slate-700 rounded text-white font-bold text-xs">+</button>
                    </div>
                  </div>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="text-center py-12 text-slate-500">
                  <p className="text-3xl mb-1">🛒</p>
                  <p className="text-xs font-medium">Keranjang masih kosong</p>
                </div>
              )}
            </div>

            {/* FOOTER KERANJANG */}
            <div className="p-3.5 bg-slate-900 border-t border-slate-800 shrink-0 space-y-2.5">
              <div className="flex gap-2">
                <button onClick={() => setShowBiayaDialog(true)} className="flex-1 py-1.5 border border-orange-500/40 text-orange-400 rounded-lg text-xs font-semibold bg-orange-500/10 hover:bg-orange-500/20 truncate">
                  + Biaya
                </button>
                <button onClick={() => setShowCustomerSearch(true)} className="flex-1 py-1.5 border border-blue-500/40 text-blue-400 rounded-lg text-xs font-semibold bg-blue-500/10 hover:bg-blue-500/20 truncate px-2">
                  {selectedCustomer ? `👤 ${selectedCustomer.name}` : editMode?.customerName ? `👤 ${editMode.customerName}` : "👤 + Pelanggan"}
                </button>
              </div>

              {(biayaOngkir > 0 || biayaAdmin > 0 || biayaLainnya > 0) && (
                <div className="bg-orange-500/10 p-2 rounded-lg text-[11px] font-semibold text-orange-400 space-y-0.5">
                  {biayaOngkir > 0 && <div className="flex justify-between"><span>Ongkir</span><span>Rp {formatRupiah(biayaOngkir)}</span></div>}
                  {biayaAdmin > 0 && <div className="flex justify-between"><span>Admin</span><span>Rp {formatRupiah(biayaAdmin)}</span></div>}
                  {biayaLainnya > 0 && <div className="flex justify-between"><span>{namaBiayaLain || "Lain-lain"}</span><span>Rp {formatRupiah(biayaLainnya)}</span></div>}
                </div>
              )}

              <div className="flex justify-between items-center pt-0.5">
                <p className="text-slate-400 text-xs font-semibold">Total Tagihan</p>
                <p className="text-lg md:text-xl font-black text-emerald-400">Rp {formatRupiah(totalAkhir)}</p>
              </div>

              <button 
                disabled={cart.length === 0} 
                onClick={() => setShowPay(true)} 
                className={`w-full py-3 ${editMode ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-500 hover:bg-emerald-600'} disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-black text-sm md:text-base rounded-xl shadow-lg transition-all`}
              >
                {editMode ? "SIMPAN KOREKSI" : "BAYAR"}
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* ============================================================== */}
      {/* 🔥 MODAL TAMBAH BIAYA DINAMIS (ONGKIR, ADMIN, BIAYA LAIN KUSTOM) */}
      {/* ============================================================== */}
      {showBiayaDialog && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl space-y-3">
            <h3 className="text-sm font-bold text-white">Tambah Biaya Tambahan</h3>
            
            <div>
              <label className="text-xs text-slate-400 block mb-1">Biaya Ongkir (Rp)</label>
              <input type="number" value={biayaOngkir || ""} onChange={(e) => setBiayaOngkir(Number(e.target.value))} placeholder="0" className="w-full bg-slate-800 rounded-xl p-2.5 text-white text-xs border border-slate-700 outline-none" />
            </div>
            
            <div>
              <label className="text-xs text-slate-400 block mb-1">Biaya Admin / Jasa (Rp)</label>
              <input type="number" value={biayaAdmin || ""} onChange={(e) => setBiayaAdmin(Number(e.target.value))} placeholder="0" className="w-full bg-slate-800 rounded-xl p-2.5 text-white text-xs border border-slate-700 outline-none" />
            </div>

            {/* 🔥 BIAYA LAIN-LAIN DENGAN KETERANGAN CUSTOM */}
            <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 space-y-2">
              <label className="text-xs font-bold text-orange-400 block">Biaya Lain-lain (Kustom)</label>
              <input 
                type="text" 
                value={namaBiayaLain === "Biaya Lain-lain" ? "" : namaBiayaLain} 
                onChange={(e) => setNamaBiayaLain(e.target.value || "Biaya Lain-lain")} 
                placeholder="Nama Biaya (Cth: Bungkus, Box, Kardus)" 
                className="w-full bg-slate-800 rounded-xl p-2.5 text-white text-xs border border-slate-700 outline-none" 
              />
              <input 
                type="number" 
                value={biayaLainnya || ""} 
                onChange={(e) => setBiayaLainnya(Number(e.target.value))} 
                placeholder="Nominal Biaya (Rp)" 
                className="w-full bg-slate-800 rounded-xl p-2.5 text-white text-xs border border-slate-700 outline-none" 
              />
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setShowBiayaDialog(false)} className="flex-1 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold">TUTUP</button>
              <button onClick={() => setShowBiayaDialog(false)} className="flex-1 py-2 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold">SIMPAN</button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 🔥 MODAL PEMBAYARAN (DENGAN TAMPILAN GAMBAR QRIS OTOMATIS) */}
      {/* ============================================================== */}
      {showPay && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-sm p-5 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2.5">Rincian Pembayaran</h3>
            <div className="flex justify-between items-center mb-3 bg-slate-800/60 p-3 rounded-2xl border border-slate-700/50">
              <p className="text-slate-400 text-xs">Total Tagihan</p>
              <p className="text-lg font-black text-emerald-400">Rp {formatRupiah(totalAkhir)}</p>
            </div>
            
            <div className="flex gap-2 mb-3">
              <button onClick={() => setMetodeBayar("cash")} className={`flex-1 py-2 rounded-xl font-bold text-xs border ${metodeBayar === 'cash' ? 'bg-emerald-500 text-slate-950 border-emerald-500' : 'bg-transparent text-slate-400 border-slate-700'}`}>Tunai (Cash)</button>
              <button onClick={() => setMetodeBayar("qris")} className={`flex-1 py-2 rounded-xl font-bold text-xs border ${metodeBayar === 'qris' ? 'bg-blue-500 text-white border-blue-500' : 'bg-transparent text-slate-400 border-slate-700'}`}>QRIS</button>
            </div>

            {metodeBayar === "cash" ? (
              <>
                <input type="text" placeholder="Masukkan Uang Diterima..." value={uangBayar} onChange={(e) => setUangBayar(e.target.value.replace(/\D/g, ''))} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white text-base font-bold mb-2.5 outline-none" />
                <div className="flex justify-between items-center mb-4 px-1">
                  <p className="font-semibold text-xs text-slate-400">{isUtang ? "Sisa Piutang (Kurang)" : "Kembalian"}</p>
                  <p className={`text-sm font-black ${isUtang ? 'text-orange-400' : 'text-emerald-400'}`}>Rp {formatRupiah(Math.abs(kembalian))}</p>
                </div>
              </>
            ) : (
              <div className="text-center p-3 bg-slate-800/60 rounded-2xl mb-4 border border-blue-500/30 flex flex-col items-center">
                {qrisUrl ? (
                  <>
                    <img src={qrisUrl} alt="QRIS Toko" className="w-48 h-48 object-contain rounded-xl bg-white p-2 mb-2 border border-slate-700" />
                    <p className="text-blue-400 font-bold text-xs">Scan QRIS untuk Bayar</p>
                  </>
                ) : (
                  <div className="py-6">
                    <p className="text-3xl mb-2">📱</p>
                    <p className="text-blue-400 font-bold text-xs mb-1">Arahkan Pelanggan ke Akrilik QRIS</p>
                    <p className="text-[11px] text-slate-400">QRIS digital belum diunggah di profil kasir.</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setShowPay(false)} disabled={isProcessing} className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">BATAL</button>
              <button onClick={prosesPembayaran} disabled={isProcessing} className={`flex-1 py-2.5 font-black rounded-xl text-xs text-white ${isUtang ? 'bg-orange-500 hover:bg-orange-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}>
                {isProcessing ? "MEMPROSES..." : isUtang ? "SIMPAN UTANG" : "SELESAIKAN"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 🔥 MODAL SUCCESS (DENGAN TOMBOL CETAK STRUK & SHARE WA) */}
      {/* ============================================================== */}
      {showSuccess && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl w-full max-w-sm p-5 shadow-2xl text-center">
            <div className="w-14 h-14 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-2xl mx-auto mb-2.5 border border-emerald-500/40">✓</div>
            <h3 className="text-lg font-black text-white mb-1">Transaksi Berhasil!</h3>
            <p className="text-slate-400 font-mono text-xs mb-4">ID: #{String(showSuccess.trxId).slice(-6)}</p>
            
            <div className="bg-slate-800/60 p-3 rounded-2xl mb-4 text-left text-xs space-y-1.5 border border-slate-700/50">
              <div className="flex justify-between font-bold text-white"><span>Total</span><span>Rp {formatRupiah(showSuccess.totalAkhir)}</span></div>
              <div className="flex justify-between text-slate-400"><span>Bayar ({showSuccess.metodeBayar.toUpperCase()})</span><span>Rp {formatRupiah(showSuccess.bayar)}</span></div>
              <div className="flex justify-between text-emerald-400 font-semibold"><span>Kembali</span><span>Rp {formatRupiah(showSuccess.kembali)}</span></div>
            </div>

            <p className="text-[11px] text-slate-400 mb-3">Silakan pilih tindakan:</p>

            {/* 🔥 2 TOMBOL UTAMA PERSIS ANDROID */}
            <div className="flex gap-2 mb-3">
              <button 
                onClick={handlePrintStruk} 
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                🖨️ Cetak Struk
              </button>
              
              <button 
                onClick={handleKirimWA} 
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md"
              >
                📲 Kirim Struk
              </button>
            </div>

            <button onClick={resetKasir} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs">
              Selesai & Transaksi Baru
            </button>
          </div>
        </div>
      )}

      {/* MODAL MANUAL QTY */}
      {showManualQty && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xs p-5 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-1">Jumlah {showManualQty.nama}</h3>
            <p className="text-xs text-slate-400 mb-3">Stok tersedia: <span className="text-emerald-400 font-semibold">{showManualQty.maxStok}</span></p>
            
            <input 
              type="number" 
              value={inputManualQty} 
              onChange={(e) => setInputManualQty(e.target.value)} 
              placeholder="Ketik jumlah..." 
              autoFocus
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-emerald-400 text-2xl font-black mb-4 outline-none text-center" 
            />
            
            <div className="flex gap-2">
              <button onClick={() => setShowManualQty(null)} className="flex-1 py-2.5 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">BATAL</button>
              <button onClick={saveManualQty} className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs shadow-md">OK</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT HARGA */}
      {showEditPrice && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white mb-1">Ubah Harga Satuan</h3>
            <p className="text-xs text-slate-400 mb-3">{showEditPrice.nama} (Normal: Rp {formatRupiah(showEditPrice.hargaNormal)})</p>
            
            <input 
              type="number" 
              value={inputHargaBaru} 
              onChange={(e) => setInputHargaBaru(e.target.value)} 
              className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-yellow-400 text-base font-bold mb-3 outline-none" 
            />
            
            <div className="flex gap-2">
              <button onClick={() => setShowEditPrice(null)} className="flex-1 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl text-xs">BATAL</button>
              <button onClick={() => {
                const p = Number(inputHargaBaru);
                if (p > 0) updateCartPrice(showEditPrice.id, p);
              }} className="flex-1 py-2 bg-yellow-500 text-slate-950 font-black rounded-xl text-xs">SIMPAN</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PILIH PELANGGAN */}
      {showCustomerSearch && (
        <div className="fixed inset-0 bg-slate-950/80 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-bold text-white">Pilih Pelanggan</h3>
              <button onClick={() => setShowCustomerSearch(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <input type="text" placeholder="Cari nama / no hp..." value={customerSearchQuery} onChange={(e) => setCustomerSearchQuery(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white text-xs mb-3 outline-none" />
            <div className="max-h-48 overflow-y-auto space-y-2 mb-3">
              {customers.filter(c => (c.name || "").toLowerCase().includes(customerSearchQuery.toLowerCase())).map(c => (
                <div key={c.id} onClick={() => { setSelectedCustomer(c); setShowCustomerSearch(false); }} className="p-2.5 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 cursor-pointer flex justify-between items-center">
                  <div>
                    <p className="font-bold text-xs text-white">{c.name}</p>
                    <p className="text-[11px] text-slate-400">{c.phoneNumber || "-"}</p>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-semibold">{c.totalPoints || 0} Poin</span>
                </div>
              ))}
            </div>
            <button onClick={() => { setSelectedCustomer(null); setShowCustomerSearch(false); }} className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold">
              Tanpa Pelanggan (Umum)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}