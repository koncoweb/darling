# Product Requirements Document (PRD): Darling

## 1. Pendahuluan
**Darling** adalah aplikasi *social commerce* yang dikhususkan untuk ekosistem makanan keliling dan UMKM. Aplikasi ini menjembatani para pedagang makanan keliling dengan pembeli potensial melalui pendekatan sosial (video feed) dan geolokasi (peta interaktif). 

Versi awal (MVP) akan difokuskan pada platform **Android Native** yang dibangun menggunakan **Expo (React Native)**. Di fase selanjutnya, aplikasi ini akan diekspansi menjadi versi web.

## 2. Tujuan Produk
1. **Meningkatkan Visibilitas Pedagang:** Memberikan platform bagi pedagang makanan keliling untuk mempromosikan dagangannya melalui konten video pendek dan pelacakan lokasi real-time.
2. **Memudahkan Pembeli:** Membantu pengguna menemukan makanan keliling terdekat dan melihat ulasan/video dari makanan tersebut sebelum membeli.
3. **Membangun Komunitas:** Menciptakan ekosistem *social commerce* yang interaktif antara pembuat konten, pedagang, dan pembeli.

## 3. Spesifikasi Teknis Utama
- **Frontend / Mobile Framework:** Expo (React Native) untuk Android Native.
- **Database:** Neon DB (Serverless Postgres).
- **Authentication:** Neon Auth.
- **Styling / UI Library:** NativeWind (Tailwind CSS untuk React Native) atau custom stylesheet yang mematuhi Design System "The Kinetic Hearth".
- **Maps / Geolocation:** React Native Maps (Google Maps API untuk Android).
- **Video Player:** Expo Video (untuk memutar video feed seperti TikTok/Reels).

## 4. Panduan Desain & UI/UX (The Kinetic Hearth)
Mengacu pada `DESIGN.md` dan prototipe desain yang sudah ada:
- **Tema Visual:** Modern, bersih, cerah, ramah pengguna.
- **Warna Utama:** 
  - **Primary (Orange - #FF8C00):** Melambangkan makanan, kehangatan, dan energi.
  - **Secondary (Light Green - #90EE90):** Melambangkan mobilitas, kesegaran, dan status aktif (keliling).
  - **Background / Tonal Neutrals:** `#fff5ed` (Base), `#ffeedf` (Sectional), `#ffffff` (Actionable Layer).
- **Bentuk & Sudut:** *Rounded corners* yang besar (Level 2 / moderat). Hindari sudut tajam 0px.
- **Ruang (Whitespace):** Luas dan lega. Hindari penggunaan garis pemisah (border 1px solid); gunakan perbedaan warna latar atau whitespace untuk memisahkan konten (The "No-Line" Rule).
- **Tipografi:** 
  - *Headlines:* Plus Jakarta Sans (Rapat, modern).
  - *Body/Labels:* Be Vietnam Pro (Tingkat keterbacaan tinggi).
- **Efek Visual:** *Glassmorphism* (Backdrop blur) untuk Bottom Navigation dan Header, serta *Tonal Layering* (bukan drop shadow pekat) untuk kedalaman.

## 5. Fitur Utama & Struktur Navigasi (Bottom Navigation Bar)

### 5.1. Beranda (Video Feed)
- **Fungsi:** Menampilkan *infinite scroll* video pendek (gaya TikTok/Reels) dari pedagang makanan atau review pengguna.
- **Interaksi:** Like, Komentar, Share, dan tombol CTA "Lihat Lokasi Pedagang".
- **UI Notes:** Video layar penuh (full-screen) dengan overlay informasi (nama pedagang, deskripsi makanan, avatar).

### 5.2. Jelajah (Peta Pedagang)
- **Fungsi:** Peta interaktif yang menampilkan lokasi pedagang makanan keliling secara *real-time* atau posisi mangkal terakhir.
- **Interaksi:** 
  - *Mobility Map Pins:* Pin hijau (#90EE90) yang menandakan pedagang aktif.
  - Klik pin untuk melihat kartu ringkasan pedagang (nama, jarak, menu unggulan, tombol arahkan).
- **UI Notes:** Floating search bar dengan *glassmorphism* di atas peta.

### 5.3. Studio AI (Unggah)
- **Fungsi:** Halaman khusus bagi pengguna atau pedagang untuk merekam, mengedit sederhana, dan mengunggah video makanan mereka. Dilengkapi fitur *AI assistant* untuk menyarankan caption atau tag yang menarik.
- **Interaksi:** Tombol rekam, pilih dari galeri, input deskripsi, dan post.

### 5.4. Profil Saya
- **Fungsi:** Manajemen akun pengguna (sebagai pembeli atau pedagang).
- **Sub-halaman (berdasarkan prototipe yang ada):**
  - Profil Pengguna Biasa (Riwayat interaksi, video tersimpan).
  - Masuk ke Darling / Daftar Akun Baru (Integrasi dengan Neon Auth).
  - Pendaftaran Pedagang (Formulir upgrade akun ke pedagang).
  - Dasbor Pedagang (Manajemen menu, status "Mulai Keliling / Berhenti", statistik video).

## 6. Persyaratan Non-Fungsional
- **Kinerja:** Video feed harus memuat dengan cepat tanpa *lag* (gunakan mekanisme caching). Peta harus responsif saat digeser.
- **Keamanan:** Autentikasi yang aman menggunakan standar JWT/Session dari Neon Auth. Data lokasi tidak disalahgunakan.
- **Aksesibilitas:** Kontras warna teks di atas latar belakang yang cerah harus mematuhi standar keterbacaan (gunakan `on_surface` color, hindari hitam pekat #000000).

## 7. Metrik Keberhasilan (MVP)
- Proses login/registrasi lancar via Neon Auth.
- Pengguna dapat menggulir (scroll) minimal 5 video tanpa *crash*.
- Peta dapat menampilkan minimal *dummy data* lokasi pedagang dengan akurasi yang baik.
- Pedagang dapat mengunggah satu video menu melalui Studio AI.
