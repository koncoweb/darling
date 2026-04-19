# Implementation Plan: Darling App (Android Native - Expo)

## Ikhtisar Proyek
Aplikasi Darling adalah platform *social commerce* berbasis video untuk UMKM makanan keliling. Rencana implementasi ini dirancang khusus untuk membangun *Minimum Viable Product (MVP)* untuk versi **Android Native** menggunakan Expo, Neon DB (PostgreSQL serverless), dan Neon Auth.

---

## Fase 1: Inisiasi Proyek & Setup Lingkungan (Minggu 1)

### 1.1 Inisialisasi Repositori
- Buat *project scaffold* dengan Expo (TypeScript + React Navigation):
  ```bash
  npx create-expo-app darling-app --template blank-typescript
  ```
- Setup `eslint`, `prettier`, dan konfigurasi absolute path imports (`tsconfig.json`).

### 1.2 Konfigurasi Desain Sistem (The Kinetic Hearth)
- Pasang library UI: `NativeWind` (Tailwind CSS untuk Expo) atau buat folder `constants/Colors.ts` dan `constants/Typography.ts`.
- Impor font utama (Google Fonts via `@expo-google-fonts`):
  - Plus Jakarta Sans (Display/Headlines).
  - Be Vietnam Pro (Body/Labels).
- Terapkan The "No-Line" Rule dan Tonal Vibrancy:
  - Tentukan palet warna (Primary: `#FF8C00`, Secondary: `#90EE90`, Base: `#fff5ed`).
  - Buat komponen dasar: *Buttons* (dengan gradient ringan), *Cards* (rounded `medium`), *Inputs* (tanpa border solid, *ghost border* untuk fokus).

### 1.3 Setup Database & Auth (Backend)
- Buat proyek di Neon Console.
- Inisialisasi Neon Auth untuk manajemen pengguna (Login/Daftar).
- Rancang skema database (SQL) di Neon DB:
  - `users` (id, email, nama, role: 'pembeli' | 'pedagang').
  - `merchants` (id, user_id, lokasi_terakhir, status_aktif, dll).
  - `videos` (id, url, deskripsi, merchant_id, likes, dll).

---

## Fase 2: Implementasi Autentikasi & Profil (Minggu 2)

### 2.1 Integrasi Neon Auth
- Integrasi SDK Neon Auth ke dalam Expo App.
- Buat komponen form `Masuk Ke Darling` dan `Daftar Akun Baru` berdasarkan prototipe HTML/CSS yang sudah ada (`masuk_ke_darling/`, `daftar_akun_baru/`).
- Gunakan context/Redux/Zustand untuk manajemen state user login global (`AuthContext`).

### 2.2 Navigasi Utama (Bottom Tab Navigator)
- Implementasi `createBottomTabNavigator` dari `@react-navigation/bottom-tabs`.
- Buat 4 Tab Utama:
  - Beranda (Ikon: Video/Home)
  - Jelajah (Ikon: Map/Pin)
  - Studio AI (Ikon: Plus/Unggah)
  - Profil (Ikon: User)
- Gaya Tab Bar: Efek *Glassmorphism* (semi-transparan dengan *backdrop blur*).

### 2.3 Profil Pengguna & Pendaftaran Pedagang
- Kembangkan halaman `Profil Saya` (`profil_saya/`).
- Buat alur "Upgrade to Merchant" (`pendaftaran_pedagang/`) di mana pengguna mengisi form untuk menjadi pedagang keliling.

---

## Fase 3: Core Features - Beranda & Jelajah (Minggu 3-4)

### 3.1 Beranda (Video Feed)
- Integrasi library video player (`expo-video` atau `react-native-video`).
- Implementasi layout *Vertical Pager* (seperti TikTok/Reels) menggunakan `FlatList` dengan *pagingEnabled*.
- Komponen Overlay: 
  - Avatar pengguna (*Street Story Bubbles* dengan ring oranye 2px).
  - Detail makanan dan tombol aksi (Like, Komentar, "Lihat Lokasi").
- Integrasi API (via GraphQL/REST ke Neon DB) untuk mengambil daftar video terbaru (`beranda_video_feed/`).

### 3.2 Jelajah (Peta Pedagang)
- Instalasi `react-native-maps`. Konfigurasi Google Maps API Key untuk Android.
- Implementasi peta *full-screen* dengan marker custom (warna `#90EE90` / hijau muda).
- Tarik data `merchants` dari Neon DB (khusus pedagang yang `status_aktif = true`).
- Overlay: *Search Bar* (dengan `surface_container_low`) dan *Bottom Sheet* untuk menampilkan ringkasan kartu pedagang saat marker diklik (`jelajah_peta_pedagang/`).

---

## Fase 4: Core Features - Studio AI & Dasbor Pedagang (Minggu 5)

### 4.1 Studio AI (Unggah)
- Instalasi `expo-camera` dan `expo-image-picker`.
- Bangun UI kamera/pilih dari galeri (`studio_ai_unggah/`).
- Simulasi/Integrasi *AI Assistant* (misalnya panggil OpenAI API/LLM lain) untuk *auto-generate caption* berdasarkan nama makanan yang diketik.
- Fitur *upload* video ke storage (S3 atau Cloudinary) lalu simpan URL ke tabel `videos` di Neon DB.

### 4.2 Dasbor Pedagang (Menu)
- Kembangkan halaman khusus bagi pedagang (`dasbor_pedagang_menu/`).
- Fitur "Mulai Keliling": Toggle switch yang akan memperbarui koordinat GPS (via `expo-location`) secara *real-time* atau berkala ke database.
- Manajemen Menu: Tambah, edit, dan hapus menu makanan.

---

## Fase 5: Pengujian, Optimasi & Rilis MVP (Minggu 6)

### 5.1 Pengujian Perangkat
- Uji coba di Android Emulator dan *physical device* Android via aplikasi Expo Go.
- *Stress test* pada Video Feed untuk memastikan tidak terjadi kebocoran memori (memory leak) saat scroll.
- Cek performa baterai terkait *live location tracking* (expo-location di background/foreground).

### 5.2 Optimasi UI/UX
- Review implementasi komponen terhadap *DESIGN.md*:
  - Pastikan *corner radius* moderat.
  - Hapus semua border 1px solid (ganti dengan background tonal).
  - Cek kontras teks pada warna latar (orange/green gradient).

### 5.3 Build & Release
- Buat konfigurasi `app.json` (nama aplikasi: Darling, package name: `com.darling.app`, icons, splash screen bernuansa orange `#FF8C00`).
- Buat APK/AAB melalui **EAS Build** (Expo Application Services):
  ```bash
  eas build --platform android
  ```
- Rilis internal (TestFlight untuk masa depan / Google Play Internal Testing) kepada beta tester UMKM lokal.

---

## Ringkasan Teknologi Utama
- **Frontend:** Expo SDK, React Native, React Navigation, NativeWind (Tailwind CSS), React Native Maps, Expo Camera, Expo Location, Expo Video.
- **Backend:** Neon Serverless Postgres (DB), Neon Auth (Autentikasi).
- **Infrastruktur/Cloud:** Vercel/Render (API Layer - opsional jika tidak langsung connect via klien SDK) dan Cloudinary/S3 (Video Storage).
