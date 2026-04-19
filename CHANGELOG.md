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
