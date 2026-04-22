# Database & Migration Strategy: Darling App (Serverless Client-to-DB)

Dokumen ini menjelaskan strategi pengelolaan skema *database*, alat bantu migrasi (ORM), dan manajemen keamanan (RLS) menggunakan **Neon Serverless Postgres** secara aman dalam arsitektur yang tidak menggunakan *backend* terpisah (langsung dari klien).

## 1. Alat Bantu & Framework: Drizzle ORM
Kami menggunakan **Drizzle ORM** baik sebagai pengatur skema lokal (saat *development*) maupun sebagai antarmuka *query* di dalam aplikasi Expo (saat *runtime*).
*   **Performa Client-side:** Drizzle dirancang dengan inti ringan (*edge/serverless compatible*), sehingga ukuran *bundle*-nya sangat kecil dan dapat dijalankan langsung di *runtime* JavaScript React Native dengan koneksi WebSocket.
*   **Keamanan Tipe Data (Type-Safety):** Menghasilkan *TypeScript safety* langsung dari definisi skema, mencegah kesalahan *query*.

## 2. Keamanan Utama: Row-Level Security (RLS)
Karena kita tidak memiliki API perantara yang memeriksa izin sebelum menjalankan *query*, seluruh beban keamanan dipindahkan ke database itu sendiri. PostgreSQL **RLS (Row-Level Security)** wajib diterapkan di setiap tabel.

*   **Neon Authorize:** Saat *client* membuat sesi (koneksi) dengan database, aplikasi menyelipkan token JWT dari Neon Auth. Postgres akan mengurai token ini (via parameter khusus yang di-set di koneksi atau sesi *transaction*) menjadi variabel seperti `current_setting('request.jwt.claims')::json->>'sub'` yang mewakili ID Pengguna (User ID).
*   **Kebijakan (Policy) Wajib:**
    1.  **Users:** Seseorang hanya dapat `SELECT` dan `UPDATE` pada *row* di mana `id = auth.uid()`.
    2.  **Merchants:** Seseorang hanya dapat `INSERT`, `UPDATE`, `DELETE` jika `user_id = auth.uid()`.
    3.  **Videos (Public Read):** Semua *role* (bahkan *anonymous*) diizinkan untuk `SELECT` tabel *videos* agar fitur *feed* berjalan, namun hanya pemilik yang dapat `INSERT` atau `DELETE` (verifikasi via `auth.uid()`).

## 3. Strategi Lingkungan (Environment Strategy): Neon Branching
Fitur **Branching** Neon (*Copy-on-Write*) adalah fondasi kerja tim.
*   **Branch Utama (`main`):** Basis data produksi (*Production Database*). Hanya diakses oleh *release build* aplikasi.
*   **Branch Pengembangan (`dev` / fitur):** Basis data isolasi tempat *developer* menjalankan *script* migrasi Drizzle dari laptop masing-masing.
*   Tidak ada satu pun koneksi *admin* atau URL database *root* (yang tidak dibatasi RLS) yang boleh disimpan di dalam kode sumber aplikasi.

## 4. Struktur Skema Database Awal & Aturan RLS (Draft MVP)

### Tabel `users`
*   `id`: UUID (Primary Key, dari Neon Auth / Eksternal Auth Provider).
*   `name`: Varchar(100)
*   `email`: Varchar(150)
*   `role`: Enum ('buyer', 'merchant')
*   **Aturan RLS:** `CREATE POLICY "User can update own profile" ON users FOR UPDATE USING (id = current_setting('app.user_id')::uuid);`

### Tabel `merchants`
*   `id`: Serial/UUID (Primary Key).
*   `user_id`: UUID (Foreign Key ke `users.id`).
*   `store_name`: Varchar(100).
*   `is_active`: Boolean (Default: `false`).
*   `last_location`: Point/PostGIS Geometry.
*   **Aturan RLS:** `CREATE POLICY "Merchant can update own status" ON merchants FOR UPDATE USING (user_id = current_setting('app.user_id')::uuid);`

### Tabel `videos`
*   `id`: Serial/UUID (Primary Key).
*   `merchant_id`: UUID (Foreign Key ke `merchants.id`).
*   `video_url`: Varchar(255).
*   `caption`: Text.
*   `embedding`: Vector (Ekstensi **`pgvector`**).
*   **Aturan RLS:** 
    *   `CREATE POLICY "Public can read videos" ON videos FOR SELECT USING (true);`
    *   `CREATE POLICY "Merchant can insert videos" ON videos FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);`
    *   *Note:* `video_url` sekarang menyimpan URL dari **Cloudinary** untuk menghindari limit payload 10MB pada Neon Data API.

## 5. Alur Migrasi & Manajemen Skema (Local Execution)
Meskipun aplikasi berjalan tanpa *backend*, perubahan skema (*migration*) **TIDAK PERNAH** dijalankan dari aplikasi klien. Skema hanya diubah oleh pengembang dari terminal laptop mereka.

1.  **Mendefinisikan Skema:**
    Membuat file `schema.ts` (misalnya di folder `db/` di luar *bundle* aplikasi yang diekspor).
2.  **Menghasilkan Migrasi (Generate):**
    Menjalankan perintah terminal lokal `npx drizzle-kit generate` untuk membuat skrip `.sql` berdasarkan perubahan `schema.ts`.
3.  **Menerapkan Migrasi (Push/Migrate):**
    Menggunakan kunci koneksi **admin** (yang disimpan aman di `.env.local` pada mesin *developer*, tidak di *commit*) untuk menjalankan `npx drizzle-kit push` ke *branch* pengembangan Neon (`dev`).
4.  **Menambahkan RLS:**
    Menjalankan *query* SQL tambahan (biasanya dalam file *custom migration* Drizzle) untuk membuat aturan `POLICY` RLS di tabel yang baru dibuat.
5.  **Penggabungan ke Produksi:**
    Kapan pun rilis APK baru dilakukan, *script* migrasi Drizzle dijalankan melalui CI/CD (GitHub Actions) menggunakan kunci *admin* ke *branch* `main`.
