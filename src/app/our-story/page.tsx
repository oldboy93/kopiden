'use client';

import Image from 'next/image';
import Link from 'next/link';
import AppHeader from '@/components/AppHeader';
import { Coffee, Heart, Globe, Sparkles, ArrowRight } from 'lucide-react';

export default function OurStory() {
  return (
    <div className="min-h-screen bg-[#fcfaf8] selection:bg-primary/10">
      <AppHeader title="Cerita Kami" />

      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[80vh] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/story_origin.png"
          alt="Perkebunan Kopi"
          fill
          className="object-cover brightness-50"
          priority
        />
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white/90 text-xs font-bold uppercase tracking-widest mb-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles size={14} className="text-amber-400" /> Established 2025
          </div>
          <h1 className="text-4xl md:text-7xl font-black text-white mb-6 tracking-tighter leading-none animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200 uppercase">
            The Perfect <span className="text-primary italic">Break</span>.
          </h1>
          <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
            Perjalanan dari meja kantor hingga menjadi cangkir kopi favorit Anda setiap hari.
          </p>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/40 animate-bounce">
          <span className="text-[10px] font-bold uppercase tracking-widest">Gulir untuk eksplorasi</span>
          <div className="w-px h-12 bg-gradient-to-b from-white/40 to-transparent"></div>
        </div>
      </section>

      {/* The Origin */}
      <section className="py-20 md:py-32 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="order-2 lg:order-1 relative aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl skew-y-1">
            <Image
              src="/images/story_roasting.png"
              alt="Proses Pemanggangan"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
          <div className="order-1 lg:order-2 space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-black text-[#1a1a1a] tracking-tight leading-tight uppercase">
                From Office Desk <br />
                <span className="text-primary italic">to Coffee Quest</span>.
              </h2>
              <div className="w-20 h-1.5 bg-primary rounded-full"></div>
            </div>
            <p className="text-gray-500 leading-relaxed text-lg font-medium italic">
              "Kopiden bermula dari kebosanan kami dengan kopi instan di kantor, hingga akhirnya kami memutuskan untuk membawa kualitas kopi kafe ke meja kerja kami sendiri."
            </p>
            <div className="space-y-6 text-gray-500 leading-relaxed">
              <p>
                Cerita kami cukup sederhana. Pada tahun 2025, sebagai pekerja kantoran, kami menyadari betapa pentingnya segelas kopi berkualitas di tengah padatnya pekerjaan. Ketidakpuasan kami terhadap kopi kantor yang biasa saja mendorong kami untuk mulai mencoba menyeduh kopi sendiri di meja kerja.
              </p>
              <p>
                Hobi menyeduh ini pun berkembang. Teman-teman kantor mulai tertarik dan terinspirasi. Dari sanalah ide Kopiden lahir: menciptakan usaha kopi yang memang dirancang khusus untuk memenuhi ekspektasi orang kantoran yang butuh fokus dan semangat baru.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Stats */}
      <section className="bg-white py-20 px-4 md:px-8 border-y border-gray-100">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="space-y-4">
            <div className="h-16 w-16 bg-primary/10 rounded-[2rem] flex items-center justify-center mx-auto text-primary">
              <Globe size={32} />
            </div>
            <h3 className="text-xl font-black text-[#1a1a1a] uppercase">100% Indonesian</h3>
            <p className="text-sm text-gray-400 font-medium">Bekerja sama langsung dengan petani lokal terbaik dari seluruh pelosok Nusantara.</p>
          </div>
          <div className="space-y-4">
            <div className="h-16 w-16 bg-amber-50 rounded-[2rem] flex items-center justify-center mx-auto text-amber-500">
              <Heart size={32} />
            </div>
            <h3 className="text-xl font-black text-[#1a1a1a] uppercase">Ethical Craft</h3>
            <p className="text-sm text-gray-400 font-medium">Kami menjunjung tinggi keadilan bagi petani dan kelestarian ekosistem lingkungan.</p>
          </div>
          <div className="space-y-4">
            <div className="h-16 w-16 bg-emerald-50 rounded-[2rem] flex items-center justify-center mx-auto text-emerald-500">
              <Coffee size={32} />
            </div>
            <h3 className="text-xl font-black text-[#1a1a1a] uppercase">Precision Roasted</h3>
            <p className="text-sm text-gray-400 font-medium">Setiap biji dipanggang dengan teknik presisi untuk menghasilkan kafein yang maksimal dan nyaman di lambung.</p>
          </div>
        </div>
      </section>

      {/* The Craft */}
      <section className="py-20 md:py-32 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">
          <div className="space-y-8">
            <div className="space-y-4 text-right lg:text-left">
              <h2 className="text-3xl md:text-5xl font-black text-[#1a1a1a] tracking-tight leading-tight uppercase">
                Crafted for <br />
                <span className="text-primary italic">the Hustlers</span>.
              </h2>
              <div className="w-20 h-1.5 bg-primary rounded-full ml-auto lg:ml-0"></div>
            </div>
            <div className="space-y-6 text-gray-500 leading-relaxed text-right lg:text-left">
              <p>
                Kami memahami kebutuhan orang kantoran: energi yang stabil tanpa rasa deg-degan berlebih. Oleh karena itu, kami melakukan riset mendalam untuk menemukan profil panggangan yang pas untuk mendukung fokus Anda selama bekerja.
              </p>
              <p>
                Kopiden bukan sekadar bisnis kopi; ini adalah solusi bagi Anda yang menuntut performa tinggi namun tetap ingin menikmati seni dalam setiap tegukan kopi.
              </p>
            </div>
          </div>
          <div className="relative aspect-square rounded-[2.5rem] overflow-hidden shadow-2xl -rotate-1">
            <Image
              src="/images/story_craft.png"
              alt="Barista Sedang Menuang"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 md:py-32 px-4 text-center bg-[#1a1a1a] relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-primary blur-[120px]"></div>
          <div className="absolute bottom-0 right-0 w-64 h-64 bg-primary blur-[120px]"></div>
        </div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-5xl font-black text-white mb-8 leading-tight">
            Start your day with <br />
            <span className="text-primary">Kopiden.</span>
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/menu"
              className="w-full sm:w-auto px-10 py-5 bg-primary text-white rounded-full font-black shadow-xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 group"
            >
              Cek Menu Kami <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer-like section for mobile links */}
      <section className="md:hidden pb-32 pt-10 px-8 text-center bg-[#fcfaf8]">
         <div className="text-2xl font-black text-primary tracking-tighter mb-4 uppercase">Kopiden</div>
         <p className="text-xs text-gray-400 font-medium mb-12">Dibuat dengan semangat untuk para pekerja oleh UAY</p>
         <div className="flex justify-center gap-6 text-gray-400 text-sm font-bold">
            <Link href="/" className="hover:text-primary transition-colors">UTAMA</Link>
            <Link href="/menu" className="hover:text-primary transition-colors">MENU</Link>
            <Link href="/dashboard" className="hover:text-primary transition-colors">AKUN</Link>
         </div>
      </section>
    </div>
  );
}
