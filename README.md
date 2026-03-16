# Kopi Den React

Aplikasi Kedai Kopi profesional yang dibangun dengan Next.js, Supabase, dan Tailwind CSS.

## Fitur

- Desain UI modern dan responsif
- Galeri produk dan menu
- Fungsi keranjang belanja
- Integrasi checkout yang aman
- Pelacakan pesanan

## Tech Stack

- **Framework**: Next.js
- **Database**: Supabase
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Memulai

Pertama, jalankan server pengembangan:

```bash
npm run dev
# atau
yarn dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda untuk melihat hasilnya.

## Instruksi Deployment

### Deploy ke Vercel (Direkomendasikan)

Cara termudah untuk men-deploy aplikasi Next.js Anda adalah dengan menggunakan [Platform Vercel](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).

1.  **Push kode Anda** ke GitHub (sudah dilakukan).
2.  **Daftar ke Vercel** dan hubungkan akun GitHub Anda.
3.  **Impor proyek**: Pilih repositori `kopiden`.
4.  **Tambahkan Variabel Lingkungan (Environment Variables)**:
    - Salin kunci dari file `.env.local` Anda ke pengaturan proyek Vercel (Environment Variables).
    - Variabel yang biasanya diperlukan meliputi:
      - `NEXT_PUBLIC_SUPABASE_URL`
      - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
      - `MIDTRANS_SERVER_KEY`
5.  **Klik Deploy**: Vercel akan menangani proses build dan memberikan Anda URL live.

### Build Secara Lokal

Untuk menguji build produksi secara lokal:

```bash
npm run build
npm run start
```
