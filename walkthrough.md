# Kopiden Coffee App Walkthrough

The "Kopiden by UAY" application is now fully implemented, verified, and running with a premium design system.

## 🌟 Key Features

### 🛒 Customer Experience
- **Premium Shop**: A beautiful home page and a functional menu catalog.
- **Login & Registration**: Secure account creation and sign-in with Supabase Auth.
- **User Dashboard**: A premium area for customers to view order history and profile stats.
- **Live Shopping Cart**: Real-time cart management with pricing and persistence.
- **Smooth Checkout**: Multi-step checkout flow integrated with Midtrans Snap.
- **Our Story**: A cinematic narrative page (in Indonesian) detailing the brand's origins from office brewing to premium coffee for office workers, featuring a bearded barista.
- **Live Updates**: A real-time order tracking system for customers.

### 🛠️ Administrative Control
- **Unified Sidebar**: A shared [AdminSidebar](file:///d:/kopidenreact/src/components/AdminSidebar.tsx#8-53) component across all admin pages for a consistent experience.
- **Mobile Optimized**: All admin pages are fully responsive, from stats grids to vertical order cards.
- **Payment Transparency**: Real-time payment status badges (`paid`, `pending`, `failed`) now appear alongside order statuses.
- **Manual Overrides**: Added a "Mark as Paid" button (Banknote icon) for admins to manually update status for cash or manual transfer cases.
- **Live Order Tracking**: Customers can now watch their order progress in real-time. The new dynamic route `/order/tracking/[id]` connects directly to Supabase for live status updates (`brewing`, `shipped`, `delivered`).
- **Customer Payment Recovery**: Users can now retry failed or forgotten payments via a "Bayar Sekarang" button in their order history.
- **Smart Token Reuse**: Payment tokens are now saved to the database, ensuring customers resume the *exact same* transaction (QR code/Link) without creating duplicate "Pending" entries in your Midtrans dashboard.

## 🔧 Technical Achievements

- **Live Data Synchronization**: Implemented real-time data fetching for the admin dashboard using Supabase aggregate queries.
- **Security Hardening (RLS)**: Enforced strict Row Level Security (RLS) on `menu`, `orders`, and `payments` tables using a custom `is_admin()` helper function.
- **Dynamic Auth Redirects**: Configured authentication emails to use context-aware redirect URLs (Vercel vs Localhost).
- **Next.js & Turbopack**: High-performance development and build environment.
- **Tailwind CSS v4**: Migrated to the latest CSS-based theme system for modern styling.
- **ES Modules (ESM)**: Project fully transitioned to modern ESM standards.
- **Supabase Core**: Integrated PostgreSQL database and authentication.

---

## 📸 Visual Showcase

````carousel
![Homepage View](C:/Users/ubaid/.gemini/antigravity/brain/fa8703b7-da64-4bdc-aeb2-644a0e94b07e/homepage_view_1773209766743.png)
<!-- slide -->
![Admin Dashboard Tablet](C:/Users/ubaid/.gemini/antigravity/brain/fa8703b7-da64-4bdc-aeb2-644a0e94b07e/admin_dashboard_tablet_1774245889917.png)
<!-- slide -->
![Admin Dashboard Payment](C:/Users/ubaid/.gemini/antigravity/brain/fa8703b7-da64-4bdc-aeb2-644a0e94b07e/admin_dashboard_payment_column_1774246403254.png)
Payment column integrated into the dashboard overview.
<!-- slide -->
![Admin Orders Dual Status](C:/Users/ubaid/.gemini/antigravity/brain/fa8703b7-da64-4bdc-aeb2-644a0e94b07e/admin_orders_dual_status_badges_1774246417801.png)
Dual status badges (Order + Payment) on live order cards.
<!-- slide -->
![Admin Orders Mobile](C:/Users/ubaid/.gemini/antigravity/brain/fa8703b7-da64-4bdc-aeb2-644a0e94b07e/admin_orders_mobile_1774245919048.png)
<!-- slide -->
![Admin Menu Mobile](C:/Users/ubaid/.gemini/antigravity/brain/fa8703b7-da64-4bdc-aeb2-644a0e94b07e/admin_menu_mobile_1774245904785.png)
<!-- slide -->
![Midtrans Secure Checkout](C:/Users/ubaid/.gemini/antigravity/brain/fa8703b7-da64-4bdc-aeb2-644a0e94b07e/midtrans_snap_popup_success_1773215721718.png)
<!-- slide -->
![Bearded Barista (Our Story)](C:/Users/ubaid/.gemini/antigravity/brain/fa8703b7-da64-4bdc-aeb2-644a0e94b07e/bearded_barista_premium_1774230880650.png)
````

---

## 🚀 How to Run

1.  **Environment Setup**: Ensure [.env.local](file:///d:/kopidenreact/.env.local) is populated with your Supabase and Midtrans keys.
2.  **Start Development**:
    ```bash
    npm run dev
    ```
3.  **Access the App**:
    - **Customer**: [http://localhost:3000](http://localhost:3000)
    - **Admin**: [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard)

## 💳 Midtrans Configuration Guide

To enable live payments, follow these steps:

1.  **Credentials**: Log in to [Midtrans Dashboard](https://dashboard.sandbox.midtrans.com/) and copy your **Server Key** and **Client Key** from *Settings > Access Keys*.
2.  **Environment Variables**: Add these to your [.env.local](file:///d:/kopidenreact/.env.local) or Vercel dashboard:
    ```bash
    MIDTRANS_SERVER_KEY=your_server_key_here
    NEXT_PUBLIC_MIDTRANS_CLIENT_KEY=your_client_key_here
    ```
3.  **Webhooks**: Set the **Notification URL** in *Settings > Payment > Notification URL* to:
    `https://your-domain.app/api/payment/webhook`
4.  **Sandbox Mode**: The app is currently set to `isProduction: false` in [src/app/api/payment/create/route.ts](file:///d:/kopidenreact/src/app/api/payment/create/route.ts). Change this to `true` when moving to production.

> [!IMPORTANT]
> The project has been configured with `postcss.config.mjs` and `next.config.js` in ESM mode to support the latest Next.js and Tailwind v4 features.

---

### 💳 Customer Payment Recovery

![Retry Payment Button](C:/Users/ubaid/.gemini/antigravity/brain/fa8703b7-da64-4bdc-aeb2-644a0e94b07e/dashboard_recent_orders_1774248795402.png)

*Pesanan yang belum dibayar kini memiliki tombol "Bayar Sekarang" di dashboard user, memungkinkan pelanggan untuk melanjutkan pembayaran tanpa membuat pesanan baru.*
### 🕒 Live Order Tracking

![Live Tracking Page](C:/Users/ubaid/.gemini/antigravity/brain/fa8703b7-da64-4bdc-aeb2-644a0e94b07e/tracking_page_verification_1774253633886.png)

*Halaman pelacakan kini bersifat dinamis dan terhubung langsung ke database. Pelanggan dapat melihat status pesanan mereka diperbarui secara otomatis dari "Order Received" hingga "Delivered" tanpa perlu me-refresh halaman.*


### 🎫 Sistem Voucher Diskon

![Voucher Applied](C:/Users/ubaid/.gemini/antigravity/brain/fa8703b7-da64-4bdc-aeb2-644a0e94b07e/voucher_verification.png)

- **Admin Control**: Admin dapat membuat kode voucher (misal: `PROMO50`) dengan persentase diskon kustom.
- **Auto-Calculated**: Diskon otomatis memotong subtotal di keranjang sebelum lanjut ke pembayaran.

### 📸 Bukti Pengiriman & Status Baru

![Tracking Status Progression](C:/Users/ubaid/.gemini/antigravity/brain/fa8703b7-da64-4bdc-aeb2-644a0e94b07e/tracking_verification.png)

- **Enhanced Lifecycle**: Pesanan kini memiliki tahap `Brewing` dan `Out for Delivery`.
- **Proof of Receipt**: Saat pesanan dalam pengiriman (`On the Way`), tombol "Pesanan Diterima" akan muncul di HP pelanggan.
- **Mandatory Photo**: Pelanggan diminta mengambil foto kopi sebagai bukti penerimaan sebelum pesanan ditandai selesai.

### 🗑️ Manajemen Penghapusan Keranjang

![Cart Deletion Modal](C:/Users/ubaid/.gemini/antigravity/brain/fa8703b7-da64-4bdc-aeb2-644a0e94b07e/cart_final_state_1774277851672.png)

- **Smart Interception**: Menekan tombol `-` saat quantity `1` atau menekan ikon [Trash](file:///d:/kopidenreact/src/app/cart/page.tsx#27-31) akan memicu modal konfirmasi "Hapus dari Keranjang?".
- **Safe Revert Logic**:
  - Jika batal dari tombol `-`, jumlah akan tetap di `1` (tidak terhapus).
  - Jika batal dari tombol [Trash](file:///d:/kopidenreact/src/app/cart/page.tsx#27-31), item tetap ada dengan jumlah sebelumnya.
- **Premium UI**: Modal menggunakan efek *backdrop blur* dan animasi yang halus untuk pengalaman pengguna yang aman.

### ✨ Interaksi Premium (Animations)

![Cart Animation](C:/Users/ubaid/.gemini/antigravity/brain/fa8703b7-da64-4bdc-aeb2-644a0e94b07e/cart_animations_test_1774276972526.webp)

- **Button Feedback**: Saat klik "+", tombol berubah menjadi ikon [Check](file:///d:/kopidenreact/src/app/checkout/page.tsx#30-479) hijau dengan efek *bounce-scale* dan rotasi 360 derajat.
- **Cart Bounce**: Ikon keranjang di Navbar akan memberikan efek *bounce* (melompat kecil) setiap kali ada item baru yang masuk, memberikan konfirmasi visual instan.
- **Smooth Transitions**: Menggunakan durasi 500ms dan *cubic-bezier* untuk gerakan yang terasa "hidup" dan premium.

### 🛠️ Admin Dashboard Refined

![Admin Status Updates](C:/Users/ubaid/.gemini/antigravity/brain/fa8703b7-da64-4bdc-aeb2-644a0e94b07e/admin_orders_brewing_verified_1774276371107.png)

- **Clean UI**: Link "Track Live Progress" telah dihapus dari sisi admin (hanya untuk pelanggan).
- **Responsive Logic**: Tombol `Brewing` dan `Delivery` kini aktif secara otomatis untuk semua pesanan yang sudah berstatus `Paid`, termasuk pesanan yang sebelumnya tersangkut di status `processing`.
- **Real-time Order Injection**: Pesanan baru yang dibuat pelanggan akan langsung muncul di baris paling atas daftar pesanan Admin tanpa perlu refresh manual.
- **Instant Status Sync**: Perubahan status pembayaran dari pelanggan (seperti menekan tombol "Bayar Sekarang") akan langsung memperbarui tampilan Admin secara instan.

### 📍 Pelacakan Pesanan (User Tracker)

- **Reactive Milestones**: Langkah "Order Received" pada tracker pelanggan kini otomatis tercentang (`completed`) segera setelah pembayaran berhasil dikonfirmasi.
- **Better UX**: Pengguna tidak lagi bingung melihat tracker yang "diam" setelah membayar; tracker akan langsung menunjukkan bahwa pesanan telah diterima dan siap masuk tahap `Brewing`.

---

---
