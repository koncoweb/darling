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
2.  **Upload Langsung (Direct Cloudinary - Dipilih):** Menggunakan API *unsigned upload* dari Cloudinary. Ini adalah standar industri untuk mengatasi batasan payload pada database serverless (Neon Data API memiliki limit 10MB).
    *   **Keuntungan:** Mengurangi beban database, menghemat bandwidth DB, dan mendukung file video besar.
    *   **Implementasi:** Menggunakan `FormData` untuk mengirim file binary langsung ke endpoint Cloudinary dari aplikasi Expo.


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

### 7. API Layanan & Sinkronisasi Data (Merchant)

Untuk mendukung operasional pedagang yang responsif, aplikasi menggunakan fungsi khusus di `lib/dataApi.ts` yang dioptimalkan untuk performa native.

#### listMerchantSummons
Fungsi ini digunakan untuk mengambil data panggilan/summon dari pelanggan yang ditujukan khusus untuk pedagang yang sedang login.
- **Endpoint**: `https://geopost.neon.tech/summons` (via Data API).
- **Filter**: Dilakukan di sisi database menggunakan RLS atau parameter query yang membatasi hasil hanya untuk `merchant_id` yang sesuai dengan sub-JWT.
- **Resilience**: Menggunakan `dataApiRequest` dengan *silent fallback* untuk memastikan data tetap bisa ditarik meskipun ada fluktuasi pada state autentikasi klien.

#### Strategi Sinkronisasi Layar (Screen Sync)
Karena aplikasi menggunakan **2-Tier Architecture**, sinkronisasi data antar layar (misal: dari Form Edit kembali ke Profil, atau dari Beranda ke Dasbor) dilakukan di sisi klien menggunakan:
1.  **`useFocusEffect`**: Memastikan pengambilan data ulang (*re-fetching*) setiap kali layar mendapatkan fokus kembali. Ini sangat krusial untuk data dinamis seperti status panggilan pelanggan.
2.  **State Guard (`merchantLoading`)**: Mencegah *UI Flickering* dengan menunda rendering komponen spesifik (seperti menu pedagang di profil) sampai status `merchant` terkonfirmasi dari database.

---

## 8. Troubleshooting & Penanganan Error Umum

Dokumentasi ini mencatat temuan teknis penting selama pengembangan untuk referensi masa depan.

| Masalah | Penyebab | Solusi |
|---|---|---|
| `Response.json is not a function` | Terjadi saat menggunakan global polyfill fetch di React Native/Expo. Polyfill membungkus objek `Response` asli sehingga method internalnya hilang. | **Hindari global polyfill**. Injeksi header (`Origin`, `Referer`) harus dilakukan langsung pada konfigurasi adapter library (misal: `fetchOptions` di Neon Auth). |
| "Unexpected end of JSON input" | Terjadi saat mencoba mem-parsing JSON dari respon kosong (misal: status 204 No Content). | Selalu periksa `response.status === 204` sebelum memanggil `.json()`. |
| Gagal Fetch di Expo Go | Neon Auth menolak request tanpa `Origin`. | Injeksi manual `origin: https://darling.app` pada inisialisasi client auth. |

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

---

## 8. Keamanan & Row-Level Security (RLS) Hardening

Untuk memastikan integritas data dan kepemilikan yang sah, kita menerapkan kebijakan RLS yang ketat pada tabel-tabel utama:

### Integrasi Neon Auth (`auth.uid()`)
Kita menggunakan fungsi bawaan `auth.uid()` dari Neon Auth untuk mengidentifikasi pengguna yang terautentikasi. Ini jauh lebih aman dan reliabel dibandingkan melempar `user_id` secara manual dari frontend.

### Kebijakan Tabel Utama:
1.  **Tabel `videos`**:
    *   `SELECT`: Terbuka untuk umum (`PUBLIC`).
    *   `INSERT/UPDATE/DELETE`: Hanya diizinkan jika `merchant_id` (diambil dari profil user) cocok dengan `auth.uid()`.
2.  **Tabel `merchants`**:
    *   `INSERT`: Hanya untuk user yang belum memiliki merchant profile.
    *   `UPDATE`: Hanya pemilik merchant (`user_id = auth.uid()`).
3.  **Tabel `menu_items`**:
    *   `ALL`: Hanya pemilik merchant yang menaungi menu tersebut yang boleh melakukan modifikasi.

### Troubleshooting RLS:
Jika muncul error `42501 (Permission Denied)`, pastikan:
1. Header `Authorization: Bearer <JWT>` dikirim dengan benar.
2. Kebijakan RLS menggunakan `auth.uid()` bukan `auth.user_id()::uuid` (yang mungkin tidak terdefinisi di session tertentu).
3. Tabel tidak sedang dalam mode `FORCE RLS` tanpa kebijakan yang valid.

---

## 9. Sinkronisasi Media & Video Feed

Aplikasi menggunakan pendekatan **Hybrid Media Storage** (Metadata di Neon, File di Cloudinary).

### Alur Kerja Video:
1.  **Upload**: Klien mengunggah langsung ke Cloudinary menggunakan *unsigned presets*.
2.  **Metadata**: Setelah sukses, URL video dan `public_id` disimpan ke tabel `videos` di Neon DB.
3.  **Display**: Saat menampilkan feed, aplikasi menggunakan Cloudinary SDK/URL transformation untuk menghasilkan thumbnail secara instan (`f_auto, q_auto, so_auto`).

### Penanganan JWT Error pada Feed:
Pada halaman Beranda (`(tabs)/index.tsx`), terdapat risiko error jika JWT kedaluwarsa atau belum terinisialisasi saat `listFeedVideos` dipanggil. 

**Solusi Premium:**
- Implementasikan blok `try-catch` yang mendeteksi error `401 Unauthorized` atau string "JWT" pada pesan error.
- Jika terdeteksi, lakukan pemanggilan ulang (retry) tanpa menyertakan JWT (`null`).
- Ini memastikan pengguna "Tamu" atau pengguna dengan sesi kedaluwarsa tetap bisa melihat konten publik tanpa terhenti oleh layar error/blank.

---
