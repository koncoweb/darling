# Backend Architecture & Strategy: Darling App (Serverless Client-to-DB)

Sesuai dengan kebutuhan pengembangan aplikasi Android Native secara efisien dan cepat tanpa perlu memelihara *backend* terpisah, arsitektur kita rancang ulang menjadi **2-Tier Architecture (Client-to-Database)**. 

Kita akan mengandalkan fitur **Neon Authorize** (integrasi JWT dengan PostgreSQL) dan **Row-Level Security (RLS)** agar aplikasi Expo (React Native) dapat berkomunikasi langsung ke Neon DB dengan aman.

## 1. Arsitektur Inti: Client-to-Database
Tidak ada layanan *API Server* (seperti Node.js/Hono/Next.js) di tengah-tengah. Aplikasi Android langsung melakukan *query* SQL (melalui Drizzle ORM atau driver `@neondatabase/serverless`) ke Neon Serverless Postgres.
*   **Framework Klien:** Expo (React Native).
*   **Database:** Neon Serverless Postgres.
*   **Keamanan Data:** PostgreSQL Row-Level Security (RLS).

## 2. Autentikasi: Neon Auth & PostgreSQL RLS
Tantangan terbesar dari koneksi langsung ke DB adalah keamanan. Jika kita meletakkan kredensial DB di dalam APK Android, siapa pun bisa meretasnya. Solusinya:
1.  **Login Pengguna:** Aplikasi seluler menggunakan SDK Neon Auth untuk mendapatkan *JSON Web Token (JWT)*.
2.  **Koneksi Aman (Neon Authorize):** Token JWT yang didapat akan dikirimkan sebagai bagian dari string koneksi atau parameter saat membuka sesi dengan database Neon.
3.  **Row-Level Security (RLS):** Di sisi Neon DB, kita mengonfigurasi aturan RLS. PostgreSQL akan mengekstrak `user_id` atau `role` dari JWT tersebut.
    *   *Contoh Aturan:* "Hanya izinkan `INSERT` ke tabel `videos` jika `merchant_id` di database sama dengan `user_id` di dalam token JWT."
    *   Dengan ini, meskipun seseorang memiliki string koneksi publik, mereka hanya bisa membaca/menulis data milik mereka sendiri sesuai token yang mereka miliki.

## 3. Database: Neon Serverless Postgres (Direct Client)
*   **Driver Koneksi:** Menggunakan modul **`@neondatabase/serverless`** langsung di dalam proyek Expo. Driver ini menggunakan WebSocket yang didukung dengan baik oleh React Native, tanpa memerlukan *TCP connection pooler* yang berat.
*   **Fitur AI/Vector:** Ekstensi **`pgvector`** tetap digunakan. Pencarian semantik (mencari makanan berdasarkan deskripsi alami) bisa dilakukan langsung dari aplikasi klien melalui *query* SQL yang aman (Read-Only).

## 4. Alur Integrasi (Data Flow) Tanpa Backend
*   **Pembuatan Pengguna Baru (Registration Flow):**
    *   Pengguna mendaftar melalui Neon Auth di aplikasi.
    *   Setelah mendapatkan JWT, klien langsung melakukan *query* `INSERT INTO users ...` ke Neon DB. RLS memastikan mereka hanya bisa meng-*insert* data dengan ID mereka sendiri.
*   **Video Feed (Beranda):**
    *   Aplikasi klien menjalankan *query* `SELECT` ke tabel `videos` dan `merchants` menggunakan Drizzle ORM. Aturan RLS untuk tabel ini diatur ke `PUBLIC READ` (semua pengguna, bahkan yang belum login, bisa melihat video).
*   **Geolokasi Real-Time (Jelajah):**
    *   Aplikasi pedagang yang "Mulai Keliling" menjalankan `UPDATE merchants SET last_location = ...` secara berkala (misal: setiap 3 menit).
    *   Hanya pedagang pemilik baris (*row*) tersebut yang diizinkan melakukan pembaruan (berkat RLS).
    *   Pembeli menjalankan *query* spasial (PostGIS) untuk mengambil pedagang aktif terdekat secara langsung.

## 5. Manajemen File (Storage)
Karena tidak ada *backend* untuk menerbitkan *Pre-signed URL* yang aman untuk mengunggah video, kita memiliki dua opsi klien-sentris:
1.  **Penyedia Storage Serverless (Supabase Storage / Firebase Storage):** Meskipun database memakai Neon, kita bisa mengandalkan layanan storage *serverless* pihak ketiga yang juga memiliki sistem *Security Rules* (RLS) bawaan untuk menangani unggahan langsung dari klien Android.
2.  **Upload Langsung dengan Batasan (Direct Cloudinary):** Menggunakan API *unsigned upload* dari Cloudinary dengan batasan (*preset*) ketat (misalnya maksimal ukuran video 50MB, otomatis dikompresi). Setelah video terunggah dan klien mendapat URL-nya, klien menyimpannya ke Neon DB. Opsi ke-2 ini lebih mudah untuk MVP.


---

## 6. Autentikasi di Lingkungan Mobile Native â€” Lesson Learned & Best Practice

Implementasi Neon Auth di Expo / React Native memiliki tantangan unik yang berbeda dari lingkungan browser web. Berikut arsitektur dan keputusan teknis yang telah **divalidasi dan berhasil bekerja**.

### Masalah Utama: Header `Origin` di React Native

Spesifikasi Fetch API di browser web secara otomatis menyertakan header `Origin` pada setiap request cross-origin. React Native / Expo Go **tidak melakukan ini** â€” header `Origin` tidak pernah dikirim secara otomatis oleh native HTTP stack.

Neon Auth (dibangun di atas **Better Auth**) mewajibkan header `Origin` atau `Referer` yang valid pada setiap request autentikasi sebagai mekanisme keamanan CSRF. Tanpa ini, server menolak request dengan pesan: **`Missing or null Origin`**.

### Anti-Pattern â€” Solusi yang Tidak Bekerja

**âŒ Polyfill `global.fetch`** â€” Tidak efektif karena `@neondatabase/auth` menggunakan `customFetchImpl` internal di dalam `NeonAuthAdapterCore`. Library ini menyimpan referensi `fetch` pada saat inisialisasi dan memanggilnya secara langsung, men-*bypass* seluruh `global.fetch` interceptor yang dibuat setelahnya.

**âŒ Menambahkan headers per-call** (pada `signIn.email(fetchOptions)`) â€” Header diproses di context yang berbeda dan tidak menjamin kehadirannya di level network request aktual yang dilakukan oleh `customFetchImpl`.

### Best Practice â€” Pattern yang Direkomendasikan

**âœ… Injeksi header di level inisialisasi adapter** via `fetchOptions` pada `createInternalNeonAuth()`:

```typescript
// lib/neonAuth.ts â€” KONFIGURASI YANG BENAR
import { createInternalNeonAuth } from '@neondatabase/neon-js/auth';

const TRUSTED_ORIGIN = 'https://darling.app';

const internal = createInternalNeonAuth(neonAuthUrl, {
  allowAnonymous: true,
  fetchOptions: {
    headers: {
      origin: TRUSTED_ORIGIN,
      referer: `${TRUSTED_ORIGIN}/`,
      'x-expo-origin': TRUSTED_ORIGIN,
    },
    onRequest: (ctx: any) => {
      // Callback ini dipanggil di dalam pipeline adapter sebelum setiap request
      ctx.headers.set('origin', TRUSTED_ORIGIN);
      ctx.headers.set('referer', `${TRUSTED_ORIGIN}/`);
      return ctx;
    },
  },
} as any);
```

Header yang diinjeksi di sini mengalir melalui pipeline internal `NeonAuthAdapterCore` â€” termasuk `customFetchImpl` â€” sehingga **semua** request (signIn, signUp, signOut, getSession, getAnonymousToken) secara konsisten membawa header yang diperlukan.

### Konfigurasi Neon Dashboard yang Wajib

Di **Neon Console â†’ Auth Settings â†’ Allowed Domains**, pastikan:
- Domain terdaftar: `https://darling.app` (**tanpa trailing slash**)
- Nilai ini harus **persis sama** dengan nilai `origin` header yang dikirim aplikasi (case-sensitive)
- Untuk Expo Go (development), origin tetap menggunakan domain production karena diinjeksi secara manual oleh kode â€” bukan oleh sistem

### Alur Autentikasi yang Telah Divalidasi

```
Expo Go / Android App
       â”‚
       â–¼
lib/neonAuth.ts
  â””â”€â”€ createInternalNeonAuth(url, { fetchOptions: { origin: 'https://darling.app' } })
       â”‚
       â–¼
NeonAuthAdapterCore (better-auth internal)
  â””â”€â”€ customFetchImpl: fetch(url, { ...init, headers }) â€” origin sudah ada
       â”‚
       â–¼
Neon Auth Server â€” Validasi Origin âœ… OK
       â”‚
       â–¼
AuthProvider.tsx
  â”œâ”€â”€ hydrate()     â€” getSession() saat app dibuka
  â”œâ”€â”€ signUpWithEmail() â€” register + sinkronisasi ke public.profiles
  â”œâ”€â”€ signInWithEmail() â€” login + refresh JWT
  â””â”€â”€ signOut()     â€” hapus sesi server + hapus token lokal
       â”‚
       â–¼
expo-secure-store â€” JWT disimpan lokal untuk request berikutnya
```

### Catatan Sinkronisasi Profile

Setelah `signUp` berhasil, aplikasi melakukan sinkronisasi tambahan ke tabel `public.profiles` via `createUserProfile()` di `lib/dataApi.ts`. Ini diperlukan karena Neon Auth mengelola tabel `neon_auth.users_sync` secara internal — tabel `public.profiles` adalah data aplikasi yang dikelola oleh kita sendiri.

---

## 7. Skema Database: Kategori Multi-Select

Untuk mendukung profil pedagang yang lebih informatif, sistem kategori pada tabel `merchants` telah diubah untuk menggunakan array (`text[]`) di Neon PostgreSQL. Pilihan ini diambil alih-alih menggunakan tabel *join* (*many-to-many*) karena:

1. **Kesederhanaan Query:** Memudahkan React Native/Expo klien mengambil semua kategori dengan satu kueri sederhana tanpa perlu melakukan `JOIN`.
2. **Kesesuaian dengan Neon Serverless:** Mengurangi beban transaksi database dan latensi koneksi langsung dari mobile.
3. **Kompatibilitas Tipe:** Driver Drizzle ORM atau interaksi via SDK mendukung konversi otomatis array string di PostgreSQL (`text[]`) menjadi array objek di Typescript (`string[]`). 

Pada UI aplikasi (misalnya saat pendafataran pedagang), input tipe string biasa diubah menjadi *multi-select chips* sehingga input lebih seragam dan bebas *typo*. Format array ini kemudian digabungkan dengan fungsi bawaan `.join(', ')` di bagian frontend untuk keperluan presentasi UI di Profil Merchant dan Eksplorasi.
