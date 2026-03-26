"use client";

import AppHeader from "@/components/AppHeader";
import { 
  Check, 
  Coffee, 
  Zap, 
  Store, 
  TrendingUp, 
  ShieldCheck, 
  MessageCircle,
  Sparkles,
  ChevronRight,
  CreditCard,
  History,
  Smartphone,
  LayoutGrid,
  Heart,
  BarChart3,
  Users
} from "lucide-react";
import Link from "next/link";

const tiers = [
  {
    name: "Kedai",
    subtitle: "Starter POS",
    price: "149.000",
    description: "Solusi POS dasar untuk operasional satu pintu.",
    features: [
      "Menu Digital & Self-Order",
      "Pencatatan Pesanan Realtime",
      "Admin Dashboard (Live Orders)",
      "Transfer Manual (Upload Bukti)",
      "Laporan Penjualan Dasar",
      "1 Akun Admin (Owner)",
    ],
    icon: <Coffee className="w-6 h-6" />,
    color: "primary",
    recommended: false,
  },
  {
    name: "Kafe",
    subtitle: "Professional POS",
    price: "299.000",
    description: "Automasi penuh untuk meminimalkan ketergantungan staff.",
    features: [
      "Semua fitur Starter",
      "Pembayaran Otomatis (Midtrans)",
      "Sistem Loyalitas CRM Otomatis",
      "Manajemen Stok (Inventory)",
      "3 Akun Staff (Kasir/Barista)",
      "Analisa Tren & Top Sellers",
    ],
    icon: <TrendingUp className="w-6 h-6" />,
    color: "primary",
    recommended: true,
  },
  {
    name: "Bisnis",
    subtitle: "Enterprise POS",
    price: "749.000",
    description: "Multi-cabang dengan kontrol terpusat yang presisi.",
    features: [
      "Semua fitur Professional",
      "Manajemen Multi-outlet",
      "Opsi Managed Payment (Pusat)",
      "Kustomisasi Branding Penuh",
      "Domain Kustom & White-label",
      "Unlimited Akun & Staff",
    ],
    icon: <Zap className="w-6 h-6" />,
    color: "black",
    recommended: false,
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] pb-24 md:pb-16 font-inter">
      <AppHeader title="Smart POS Solutions" />
      
      <div className="container mx-auto px-4 md:px-8 max-w-6xl py-8 md:py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-4">
            <Sparkles size={14} /> POS Generasi Baru
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-[#1a1a1a] mb-4">
            Efisiensi <span className="text-primary italic">Maksimal</span> <br className="hidden md:block" />
            Tanpa Ribet Antre
          </h1>
          <p className="text-gray-500 max-w-2xl mx-auto text-sm md:text-base font-medium">
            Tinggalkan sistem kasir lama yang memperlambat bisnis Anda. Beralih ke Kopiden untuk automasi penuh dari pemesanan hingga loyalitas.
          </p>
        </div>

        {/* Why Switch Section (POS Replacement) */}
        <div className="bg-[#1a1a1a] rounded-[3rem] p-8 md:p-12 mb-16 text-white relative overflow-hidden">
           <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
           <div className="relative z-10">
              <div className="text-center mb-12">
                 <h2 className="text-2xl md:text-3xl font-black mb-4">Mengapa Pindah ke Kopiden?</h2>
                 <p className="text-gray-400 text-sm max-w-2xl mx-auto">
                    Aplikasi POS tradisional berfokus pada apa yang dilakukan staff Anda. Kopiden berfokus pada kenyamanan pelanggan Anda.
                 </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 bg-primary/20 text-[#E3F0AF] rounded-2xl flex items-center justify-center mb-6">
                       <BarChart3 size={24} />
                    </div>
                    <h3 className="font-bold text-lg mb-3">Hemat Biaya Staff</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                       Pelanggan memesan & membayar langsung dari meja. Anda tidak butuh banyak waiter/kasir untuk menangani jam sibuk.
                    </p>
                 </div>

                 <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                       <Heart size={24} />
                    </div>
                    <h3 className="font-bold text-lg mb-3">Loyalitas Otomatis</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                       Tiap transaksi otomatis jadi poin. Tidak perlu kartu fisik atau input nomor manual oleh kasir. Semua tersistem.
                    </p>
                 </div>

                 <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10 hover:bg-white/10 transition-colors">
                    <div className="w-12 h-12 bg-pink-500/20 text-pink-400 rounded-2xl flex items-center justify-center mb-6">
                       <LayoutGrid size={24} />
                    </div>
                    <h3 className="font-bold text-lg mb-3">Live Monitoring</h3>
                    <p className="text-xs text-gray-500 leading-relaxed font-medium">
                       Pantau pesanan & tren penjualan dari mana saja secara real-time. Tidak perlu menunggu tutup buku di akhir hari.
                    </p>
                 </div>
              </div>
           </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-16">
          {tiers.map((tier, idx) => (
            <div 
              key={tier.name}
              className={`relative rounded-[2.5rem] p-8 md:p-10 flex flex-col transition-all duration-300 hover:translate-y-[-8px] shadow-sm ${
                tier.recommended 
                  ? "bg-primary text-white shadow-2xl shadow-primary/20 scale-105 z-10 border-4 border-[#E3F0AF]/20" 
                  : "bg-white text-[#1a1a1a] border border-gray-100 hover:shadow-xl"
              }`}
            >
              {tier.recommended && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#E3F0AF] text-[#025726] px-6 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">
                  Investasi Populer
                </div>
              )}

              <div className="mb-8">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-inner ${
                  tier.recommended ? "bg-white/10 text-[#E3F0AF]" : "bg-primary/10 text-primary"
                }`}>
                  {tier.icon}
                </div>
                <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-1 ${
                  tier.recommended ? "text-[#E3F0AF]/80" : "text-gray-400"
                }`}>
                  {tier.subtitle}
                </div>
                <h3 className="text-2xl font-black mb-2">{tier.name}</h3>
                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-[10px] font-bold">Rp</span>
                  <span className="text-4xl font-black tracking-tight">{tier.price}</span>
                  <span className={`text-xs font-medium ${tier.recommended ? "text-white/60" : "text-gray-400"}`}>
                    /bulan
                  </span>
                </div>
                <p className={`text-xs font-medium leading-relaxed ${
                  tier.recommended ? "text-white/80" : "text-gray-500"
                }`}>
                  {tier.description}
                </p>
              </div>

              <div className="space-y-4 mb-10 flex-grow">
                {tier.features.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                      tier.recommended ? "bg-[#E3F0AF] text-[#025726]" : "bg-primary/10 text-primary"
                    }`}>
                      <Check size={12} strokeWidth={4} />
                    </div>
                    <span className={`text-[13px] font-bold ${
                      tier.recommended ? "text-white" : "text-[#333]"
                    }`}>
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <button className={`w-full py-4 rounded-2xl font-black text-sm transition-all active:scale-95 shadow-lg ${
                tier.recommended 
                  ? "bg-white text-primary hover:bg-[#E3F0AF]" 
                  : "bg-primary text-white hover:bg-black"
              }`}>
                Mulai Berlangganan
              </button>
            </div>
          ))}
        </div>

        {/* Payment Gateways Solutions */}
        <div className="mb-16 grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center">
                    <History size={24} />
                 </div>
                 <h3 className="font-black text-lg">Migrasi dari POS Lama</h3>
              </div>
              <p className="text-gray-500 text-xs font-medium leading-relaxed mb-6">
                Kami bantu proses migrasi menu dan data pelanggan dari sistem POS lama Anda (seperti Majoo/Moka) ke ekosistem Kopiden secara gratis.
              </p>
              <div className="flex items-center gap-2 text-primary font-black text-[10px] uppercase tracking-wider">
                 <Check size={14} /> Full White-Glove Support
              </div>
           </div>

           <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm">
              <div className="flex items-center gap-4 mb-6">
                 <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center">
                    <CreditCard size={24} />
                 </div>
                 <h3 className="font-black text-lg">Solusi Pembayaran</h3>
              </div>
              <p className="text-gray-500 text-xs font-medium leading-relaxed mb-6">
                Belum punya akun payment gateway? Kami sediakan opsi Managed Account untuk paket Enterprise agar Anda terima bersih tiap minggu.
              </p>
              <div className="flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase tracking-wider">
                 <Sparkles size={14} /> Bayar Tanpa Ribet
              </div>
           </div>
        </div>

        {/* CTA Section */}
        <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-blue-100 bg-gradient-to-br from-white to-blue-50/30 shadow-sm text-center relative overflow-hidden group">
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-[#1a1a1a] mb-6 flex items-center justify-center gap-3">
              <MessageCircle className="text-primary" size={28} />
              Buktikan Sendiri Efeknya
            </h2>
            <p className="text-gray-500 text-sm md:text-base font-medium max-w-xl mx-auto mb-10 leading-relaxed">
              Jadwalkan demo singkat 15 menit untuk melihat bagaimana Kopiden bisa memangkas labor cost di bisnis Anda.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4">
              <a 
                href="https://wa.me/6281234567890" 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-full md:w-auto flex items-center justify-center gap-3 bg-[#25D366] text-white px-10 py-5 rounded-full font-black text-sm shadow-xl shadow-[#25D366]/20 hover:scale-105 active:scale-95 transition-all"
              >
                Chat via WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
