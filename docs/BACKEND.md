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
