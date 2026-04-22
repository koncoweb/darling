# Changelog

Semua perubahan yang signifikan pada proyek ini akan dicatat dalam file ini.
Format log mendaftar modifikasi fitur diurutkan berdasarkan kegiatan (secara kronologis) sesuai sesi yang berlangsung.

## [Unreleased] - 2026-04-19 (Sesi Optimasi Halaman Jelajah)

### [21:40 - 22:15 WIB] Integrasi Peta Native & Geolokasi
- **Added**: Modul `react-native-maps` untuk mengimplementasikan *Native MapView* menggantikan gambar statis (mockup) pada layar Jelajah (`app/(tabs)/explore.tsx`).
- **Added**: Modul `expo-location` dengan pemakaian presisi tertinggi (`Accuracy.Highest`) untuk mendeteksi lokasi pengguna secara akurat (cukup dengan satu kali percobaan ketika pertama peta dimuat).
- **Added**: Fitur *Auto-Center* ke lokasi pengguna menggunakan *Floating Action Button* (FAB) pada sisi kanan antarmuka. 
- **Changed**: *App Configuration* (`app.json`) kini menyertakan `android.config.googleMaps.apiKey` sebagai *placeholder* integrasi Maps API Key saat di-*build*. Serta penambahan *permission* `NSLocationWhenInUseUsageDescription` (iOS) & izin `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`, `FOREGROUND_SERVICE` (Android).
- **Changed**: Tipe data TypeScript `MerchantPin` disesuaikan agar cocok memuat integrasi variabel lintang bujur (`latitude`, `longitude`) menggabungkan data statis pedagang sebagai Pin pada MapView.

### [22:15 - 22:24 WIB] Modernisasi Desain & Posisi Elemen (Kinetic Hearth)
- **Changed**: Mencopot (hilangkan) Header asli dalam navigasi layar via konfigurasi `app/(tabs)/_layout.tsx` dan `app/(tabs)/index.tsx` mewujudkan tampilan *edge-to-edge* (menyatu dengan area Status Bar aplikasi).
- **Changed**: Menempatkan ulang Panel/Merchant Card Detail pada koordinat aman (melayang 16px di atas menu *Tab Bar* utama) demi menghindari tabrakan klik maupun menu transparan visual antarmuka.
- **Added**: *Smooth Camera Transition*, yakni animasi geser halus kamera ketika Peta terfokus otomatis ke detail titik koordinat toko/pedagang yang ditekan.

### [22:24 - 22:26 WIB] Penyesuaian Umpan Balik Visual & Resolusi Masalah (Bug Fix)
- **Changed**: Tingkat transparansi elemen kaca (*Glassmorphism BlurView*) pada menu Menu Bawah ditiadakan menjadi sedikit solid gelap/putih (`_layout.tsx`), serta penyesuaian opasitas elemen Search Bar dan Card Merchant (`explore.tsx`) demi memprioritaskan keterbacaan teks saat beradu dengan peta.
- **Changed**: Modifikasi elevasi kamera satelit (*Region Delta*) pada kondisi pembuka (`INITIAL_REGION`) dan fungsi Pelacakan Pribadi (`requestLocation`) dengan nilai patokan jarak dekat `0.005` (posisi level jalan lebih *close-to-ground* sesuai input presisi baru).
- **Added**: Titik fokus (*Pin*) saat ini tak lagi hanya memunculkan efek denyut kosong. Kini memiliki logo visual kontekstual `cutlery` (warna tema untuk *active pin*) dan logo `shopping-basket` (untuk *inactive pin*) demi identitas fungsional toko.
- **Fixed**: Mengembalikan komponen fungsi `mapRef.current?.animateToRegion` di barisan `onMarkerPress` yang tak direkam sebelumnya dikarenakan error koma blok, dan mendaftarkan ulang *native dependencies* (`View`, `StyleSheet`) ke halaman Navigation Root *Tab Bar* (`_layout.tsx`) dalam penanganan *syntax error breaking compilation*.

## [Unreleased] - 2026-04-20 (Sesi Penyelarasan Database & Optimasi Visual Berbasis Skills)

### [04:20 - 04:30 WIB] Penyelarasan Skema Database (Neon Postgres Skills)
- **Changed**: Melakukan migrasi database Neon (`ALTER TABLE merchants ADD COLUMN category TEXT;`) untuk menyelaraskan data aplikasi dengan skema backend.
- **Changed**: Memperbarui `lib/dataApi.ts` untuk mendukung fetching kolom `category`, memungkinkan tampilan ikon pedagang yang dinamis berdasarkan jenis jualan.

### [04:30 - 04:35 WIB] Refactoring Arsitektur & Best Practices (Expo Skills)
- **Changed**: Melakukan *refactor* pada `app/(tabs)/explore.tsx` dengan memindahkan tipe data dan *mock data* ke [lib/merchants.ts](file:///c:/projects/darling/lib/merchants.ts) untuk menghindari *co-location* komponen di direktori rute (mengikuti standar Expo Router).
- **Added**: Menginstal dan mengintegrasikan modul `expo-image` untuk rendering avatar pedagang yang lebih efisien dan berperforma tinggi.

### [04:35 - 04:40 WIB] Upgrade Estetika & UI Premium
- **Changed**: Mengganti properti bayangan lama dengan `boxShadow` modern yang mendukung *New Architecture* Expo.
- **Changed**: Menerapkan `borderCurve: 'continuous'` pada elemen kartu dan search bar untuk hasil sudut membulat yang lebih halus (premium feel).
- **Added**: Memperkaya variasi pedagang dummy dengan kategori kuliner khas Indonesia (Soto, Gorengan, Siomay, dll) lengkap dengan ikon fungsional masing-masing.

---

## [Unreleased] - 2026-04-20 (Sesi Debugging Neon Auth — Registrasi & Login di Expo Go)

> **Keterangan Sesi**: Investigasi dan perbaikan masalah autentikasi Neon Auth yang tidak dapat berjalan di lingkungan Expo Go / React Native karena perilaku native HTTP stack yang secara fundamental berbeda dari lingkungan browser web standar.

### [08:00 - 08:20 WIB] Investigasi Awal — Error "Missing or null Origin"

- **Diagnosed**: Error `Missing or null Origin` muncul saat Sign Up dan Sign In melalui Expo Go. Neon Auth (dibangun di atas **Better Auth**) menolak setiap request yang tidak menyertakan header `Origin` atau `Referer` yang valid sebagai mekanisme keamanan CSRF.
- **Root Cause (Layer 1)**: React Native / Expo Go **tidak mengirimkan header `Origin` secara otomatis** pada `fetch` request — berbeda dengan browser web yang melakukannya secara implisit per spesifikasi Fetch API. Ini adalah perilaku bawaan platform yang tidak dapat dikonfigurasi langsung.
- **Context**: Domain tepercaya yang terdaftar di Neon Dashboard adalah `https://darling.app`. Request yang tidak menyertakan origin dari domain ini akan ditolak server.
- **Neon Auth Skill Insight**: Setiap request ke endpoint BetterAuth **wajib** membawa header `Origin` yang cocok dengan *Allowed Domain* yang dikonfigurasi di Neon Console.

### [08:20 - 08:40 WIB] Upaya Pertama — Global fetch Polyfill

- **Added** `lib/polyfills/fetch.js`: Interceptor yang meng-override `global.fetch` untuk mendeteksi URL mengandung `neonauth` dan menyuntikkan header `origin`, `referer`, dan `expo-origin`.
- **Imported** polyfill di `app/_layout.tsx` baris pertama agar aktif sebelum seluruh tree komponen React diinisialisasi.
- **Improved** polyfill: Ditambahkan kemampuan menyalin `method`, `body`, `credentials` dari objek `Request` native agar tidak hilang saat konversi ke format plain object.
- **Partial Success**: Polyfill bekerja untuk `getSession`, namun Sign In tetap gagal. Logout juga tidak menghancurkan sesi di server — akibatnya setiap reload Expo Go mendeteksi sesi lama dan otomatis meloginkan kembali pengguna (bug: "selalu sudah login saat reload").

### [08:40 - 09:10 WIB] Investigasi Mendalam — Membaca Source Code Library

- **Breakthrough**: Membaca source code terkompilasi di `node_modules/@neondatabase/auth/dist/adapter-core-CtmnMMJ7.mjs`.
- **Root Cause (Layer 2, Final)**: Library mengimplementasikan **`customFetchImpl`** di dalam `NeonAuthAdapterCore` yang tidak pernah melewati `global.fetch`. Fungsi ini membuat `Headers` object baru tanpa `Origin`, lalu memanggil `fetch` internal — sepenuhnya mem-bypass semua interceptor global yang kita buat.
- **Expo Skill Insight**: Library yang menyimpan referensi `fetch` pada saat inisialisasi tidak bisa di-intercept via `global.fetch` yang di-patch belakangan. Ini adalah jebakan umum di ekosistem React Native.

### [09:10 - 09:20 WIB] Solusi Final — Injeksi Header di Level Inisialisasi Adapter

- **Fixed** `lib/neonAuth.ts`: Header `origin` dan `referer` diinjeksi langsung melalui parameter `fetchOptions` resmi pada `createInternalNeonAuth()`. Ini memastikan header mengalir melalui seluruh internal pipeline `NeonAuthAdapterCore` termasuk `customFetchImpl`.
- **Cleaned** `components/auth/AuthProvider.tsx`: Menghapus `fetchOptions` redundan yang sebelumnya ditambahkan pada pemanggilan `auth.signIn.email()` dan `auth.signUp.email()`.
- **Status**: Login dan Registrasi berhasil berjalan di Expo Go.

### Ringkasan Pelajaran Teknis (Lessons Learned)

| Topik | Pelajaran |
|---|---|
| **React Native & Origin Header** | Native HTTP stack tidak mengirim `Origin` otomatis. Header wajib diinjeksi secara eksplisit dari kode aplikasi. |
| **Polyfill `global.fetch`** | Tidak efektif jika library target menggunakan `customFetchImpl` internal. Periksa arsitektur HTTP library sebelum membuat patch global. |
| **Titik Injeksi yang Tepat** | Selalu gunakan API resmi library (constructor / init options) untuk injeksi konfigurasi — bukan patch global eksternal. |
| **Debugging Library Internals** | Membaca source code di `node_modules` adalah cara paling akurat memahami execution path aktual sebuah dependency. |
| **Neon Auth + Better Auth** | Konfigurasi global header harus dilakukan via `fetchOptions` pada `createInternalNeonAuth()` — bukan per-request di level `signIn.email()`. |
| **Domain Konfigurasi Neon** | Pastikan domain di Neon Auth Dashboard (`https://darling.app`) tanpa trailing slash dan cocok persis dengan nilai `origin` yang dikirim — case-sensitive. |

## [Unreleased] - 2026-04-22 (Sesi Refactoring UI Profil & Registrasi Pedagang Multi-Select)

### [05:00 - 05:45 WIB] Peningkatan Pengalaman Registrasi Pedagang
- **Added**: Form registrasi pedagang kini menggunakan sistem *multi-step* agar pengguna tidak *overwhelmed* dengan formulir yang panjang.
- **Changed**: Input kategori jualan diubah dari input teks bebas menjadi komponen *multi-select chips dropdown*.
- **Changed**: Struktur kolom database `merchants.category` dimigrasi dari `TEXT` menjadi `TEXT[]` (Array) untuk menampung banyak pilihan kategori sekaligus secara konsisten.
- **Changed**: Dokumentasi arsitektur di `docs/backend.md` diperbarui untuk menjelaskan penggunaan `text[]` sebagai penyimpanan kategori.
- **Fixed**: Menghilangkan duplikasi tombol "Daftar Jadi Pedagang" di halaman Profil pengguna biasa, menyisakan satu tombol konversi yang terpusat di area bawah profil.
- **Fixed**: Mengurangi kompleksitas state dan penanganan *error* pada tahap awal di form registrasi pedagang.
- **Fixed**: Memperbaiki navigasi tombol "Dasbor Pedagang" di halaman Profil agar mengarah ke rute yang benar tanpa pembungkus Pressable redundan.
- **Fixed**: Sinkronisasi nama properti profil (`radar_radius_meters` & `pickup_address`) antara frontend dan backend untuk menghilangkan error TypeScript.

### [13:00 - 13:45 WIB] Stabilisasi Autentikasi & Sinkronisasi Data Pedagang

- **Fixed**: Mengatasi error `Response.json is not a function` dengan menghapus global fetch interceptor (`lib/polyfills/fetch.js`) yang terlalu agresif. Injeksi header kini terfokus hanya pada pipeline `neonAuth`.
- **Fixed**: Memperbaiki masalah *flickering* UI pada halaman profil (`app/(tabs)/profile.tsx`) dengan menambahkan `merchantLoading` state guard, memastikan UI pedagang hanya muncul setelah data sepenuhnya terverifikasi.
- **Fixed**: Resolusi *SyntaxError* pada `AuthProvider.tsx` yang sempat menyebabkan aplikasi *crash* (restorasi deklarasi fungsi `hydrate`).
- **Added**: Implementasi fungsi `listMerchantSummons` di `lib/dataApi.ts` untuk pengambilan data panggilan masuk yang lebih akurat bagi pedagang.
- **Improved**: Sinkronisasi data pada dasbor pedagang menggunakan `useFocusEffect` dari `@react-navigation/native`, memastikan data panggilan dan video selalu *up-to-date* saat layar difokuskan kembali.
- **Improved**: Optimasi `dataApiRequest` dengan mekanisme *silent fallback* (mencoba *authenticated fetch* terlebih dahulu, jika gagal akan menggunakan *anonymous fetch*) untuk meningkatkan *resilience* aplikasi terhadap fluktuasi status sesi JWT.

### Ringkasan Pelajaran Troubleshooting (Lessons Learned)

| Gejala Error | Akar Masalah | Solusi |
|---|---|---|
| `Response.json is not a function` | Global fetch polyfill membungkus objek `Response` asli sehingga metode internalnya hilang. | Hapus interceptor global dan gunakan konfigurasi `fetchOptions` spesifik pada library adapter. |
| UI Profil Flickering | Kondisi `merchant` masih `null` saat pengecekan awal meskipun user adalah pedagang. | Gunakan state `merchantLoading` untuk menahan rendering UI user biasa sampai status pedagang terkonfirmasi. |
| Data Dasbor Stale | Pengambilan data hanya terjadi saat `mount` komponen. | Gunakan `useFocusEffect` untuk memicu pengambilan data setiap kali user masuk ke layar dasbor. |
| "Unexpected end of JSON input" | API mengembalikan respon kosong atau status 204 yang tidak ditangani dengan baik oleh `.json()`. | Tambahkan pengecekan `response.ok` dan `response.status === 204` sebelum melakukan parsing. |

---

- **Added**: Feed "Cerita Anda" pada dasbor yang menampilkan daftar video promosi milik pedagang sendiri menggunakan fungsi `listMyVideos`.
- **Improved**: Sinkronisasi status merchant di halaman Profil menggunakan `useFocusEffect` untuk memastikan data terbaru selalu ditampilkan saat kembali dari dasbor.

### Ringkasan Pelajaran Teknis (Sesi Integrasi Pedagang)

| Kendala / Masalah | Solusi & Pembelajaran |
|---|---|
| **Error Typing UserProfile** | Masalah: Error `Property 'radar_radius' does not exist`. <br>Solusi: Sinkronisasi ulang dengan skema database di `dataApi.ts`. <br>Pelajaran: Selalu verifikasi nama kolom di `lib/dataApi.ts` karena sering ada perbedaan antara *legacy column names* dan *current schema*. |
| **Navigasi Tombol Macet** | Masalah: Tombol "Dasbor Pedagang" dibungkus `Pressable` di luar `GradientCtaButton`. <br>Solusi: Gunakan properti `onPress` bawaan dari komponen kustom untuk menghindari konflik *event handler*. |
| **Data Out-of-Sync** | Masalah: Status merchant tidak terupdate saat kembali dari Dashboard ke Profile. <br>Solusi: Menggunakan `useFocusEffect` dari `@react-navigation/native` daripada `useEffect` standar untuk trigger ulang pengambilan data setiap kali layar difokuskan. |
| **Konfigurasi Route** | Masalah: Error navigasi saat rute baru ditambahkan. <br>Solusi: Pastikan file `app/_layout.tsx` telah mendaftarkan folder/file baru dalam struktur `Stack`. |
### [11:15 - 12:00 WIB] Migrasi Media ke Cloudinary & Perbaikan Keamanan RLS
- **Added**: Modul `lib/cloudinary.ts` untuk menangani *Unsigned Uploads* langsung dari perangkat ke Cloudinary, mem-bypass limit 10MB pada Neon Data API.
- **Changed**: Menghentikan penggunaan Base64 untuk penyimpanan video dan gambar. Semua media kini disimpan sebagai URL Cloudinary di database.
- **Changed**: Refactor `app/(tabs)/studio.tsx` untuk mengunggah video langsung ke Cloudinary sebelum menyimpan metadata ke database. Ditambahkan indikator progres "Uploading to Cloudinary...".
- **Changed**: Refactor `app/merchant/register.tsx` untuk mengunggah foto profil pedagang ke Cloudinary. 
- **Fixed**: Mengatasi error `42501` (RLS Policy Violation) pada tabel `videos`.
- **Improved**: Migrasi kebijakan RLS dari `auth.user_id()::uuid` ke `auth.uid()` yang lebih robust dan asli untuk Neon Auth.
- **Improved**: Penguatan keamanan pada tabel `merchants` dan `menu_items` dengan kebijakan kepemilikan yang lebih ketat menggunakan `auth.uid()`.

### Ringkasan Pelajaran Teknis (Sesi Cloudinary & RLS)

| Kendala / Masalah | Solusi & Pembelajaran |
|---|---|
| **Request Too Large (10MB)** | Masalah: Neon Data API memiliki limit payload 10MB, menyebabkan kegagalan saat upload video Base64. <br>Solusi: Gunakan Cloudinary sebagai *media hosting* eksternal. Upload dilakukan langsung dari client menggunakan *Unsigned Preset*. |
| **RLS Error 42501** | Masalah: Gagal insert ke tabel `videos` karena kebijakan RLS tidak mengenali user. <br>Solusi: Ganti `auth.user_id()` dengan `auth.uid()`. <br>Pelajaran: Pada PostgreSQL 17 dengan Neon Auth, `auth.uid()` adalah fungsi bawaan yang paling tepat untuk mengambil UUID user dari JWT. |
| **Keamanan Merchants** | Masalah: Tabel `merchants` sebelumnya memiliki *write policy* yang terlalu terbuka (`qual: true`). <br>Solusi: Terapkan pengecekan `owner_user_id = auth.uid()` di level database untuk mencegah manipulasi data oleh user lain. |

### [11:15 - 12:45 WIB] Modernisasi Media Feed & Perbaikan UI/UX Premium
- **Added**: Implementasi *Vertical TikTok-style Feed* pada halaman Beranda (`app/(tabs)/index.tsx`) menggunakan `pagingEnabled` dan `FlatList` berkinerja tinggi.
- **Added**: Komponen `VideoFeedItem` (full-screen) dan `VideoGridItem` (grid preview) untuk standarisasi tampilan media di seluruh aplikasi.
- **Changed**: Strategi *Thumbnailing* kini dilakukan secara dinamis melalui Cloudinary (`lib/cloudinary.ts`) dengan transformasi on-the-fly (`f_auto,q_auto,so_auto`), mengurangi beban database.
- **Fixed**: Mengatasi error "JWT Token" pada Beranda dengan mekanisme *anonymous fallback* jika JWT ditemukan tidak valid atau kedaluwarsa saat pertama dimuat.
- **Fixed**: Penyesuaian layout `VideoFeedItem` dengan penambahan *bottom padding* (dinamis berpatokan pada `TAB_BAR_HEIGHT` & Safe Area) demi mencegah teks caption/nama pedagang tertutup oleh menu navigasi bawah.
- **Improved**: Mendukung *Deep Linking* ke video spesifik menggunakan parameter `initialVideoId`, memudahkan navigasi dari notifikasi atau dasbor ke feed utama.

### Ringkasan Pelajaran Teknis (Sesi Modernisasi Feed)

| Kendala / Masalah | Solusi & Pembelajan |
|---|---|
| **JWT Missing/Invalid** | Masalah: API `listFeedVideos` dipanggil sebelum `auth.jwt` siap atau saat token kedaluwarsa. <br>Solusi: Gunakan blok `try-catch` dengan fallback ke pemanggilan anonim agar feed tetap dapat dilihat tamu. |
| **UI Overlap (Tab Bar)** | Masalah: Navigasi bawah (`position: 'absolute'`) menutupi detail pedagang di video. <br>Solusi: Hitung `bottomPadding` yang spesifik (insektisida aman + tinggi tab bar + buffer) pada overlay konten video. |
| **Paging Performance** | Masalah: Scroll paging sering terasa berat pada video. <br>Solusi: Konfigurasi `getItemLayout` secara akurat berdasarkan `WINDOW_HEIGHT` agar FlatList dapat memprediksi posisi scroll dengan efisiensi memori tinggi. |

---
