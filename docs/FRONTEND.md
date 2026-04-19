# Frontend Architecture & Strategy: Darling App

Dokumen ini melengkapi `IMPLEMENTATION_PLAN.md` dan menjabarkan arsitektur, pola desain, serta pustaka yang akan digunakan untuk membangun antarmuka pengguna aplikasi Darling di platform Android Native. Strategi ini disusun berdasarkan pembaruan terbaik dari **dokumentasi resmi Expo terkini**.

## 1. Kerangka Kerja Inti (Core Framework)
Aplikasi dibangun menggunakan **Expo SDK terbaru**. Kami menggunakan pendekatan **Continuous Native Generation (CNG)** atau **Prebuild**, sehingga kita tidak perlu menyentuh folder `/android` atau `/ios` secara langsung. Semua konfigurasi native dilakukan melalui `app.json` dan *Config Plugins*.

## 2. Navigasi: Expo Router
Menggantikan implementasi manual `React Navigation` yang sebelumnya direncanakan di `IMPLEMENTATION_PLAN.md`, kita akan menggunakan **Expo Router** (File-based routing). 
*   **Alasan:** Sesuai rekomendasi Expo untuk kemudahan pengelolaan hierarki navigasi, dukungan *deep linking* otomatis, dan arsitektur yang lebih modern layaknya web (Next.js).
*   **Struktur Direktori:**
    ```text
    app/
    ├── (tabs)/                # Bottom Navigation Bar
    │   ├── index.tsx          # Beranda (Video Feed)
    │   ├── explore.tsx        # Jelajah (Peta)
    │   ├── studio.tsx         # Studio AI (Kamera/Upload)
    │   └── profile.tsx        # Profil Saya
    ├── (auth)/                # Grup layar Autentikasi
    │   ├── login.tsx          # Masuk ke Darling
    │   └── register.tsx       # Daftar Akun Baru
    ├── _layout.tsx            # Root layout (Provider & Auth Guard)
    └── +not-found.tsx         # 404 Fallback
    ```

## 3. Styling & UI: NativeWind + "The Kinetic Hearth"
Kita menggunakan **NativeWind v4** (Tailwind CSS untuk React Native) untuk menerapkan *Design System* "The Kinetic Hearth".
*   **Konfigurasi Tailwind (`tailwind.config.js`):**
    *   **Colors:** `primary` (#FF8C00), `secondary` (#90EE90), `surface` (#fff5ed), `surface-container-low` (#ffeedf).
    *   **Border Radius:** Konfigurasi `rounded-2xl` sebagai standar "moderate radius".
*   **Penerapan Khusus:**
    *   **No-Line Rule:** Hindari class `border`. Gunakan utilitas bayangan tonal atau warna latar belakang yang berbeda untuk membedakan elemen.
    *   **Glassmorphism:** Gunakan komponen `BlurView` dari `expo-blur` dengan `tint="light"` dan `intensity={70}` untuk *Bottom Nav* dan *Floating Headers*.

## 4. Manajemen State (State Management)
*   **Global State:** Menggunakan **Zustand** karena ukurannya yang ringan dan bebas *boilerplate*. Digunakan untuk menyimpan state seperti: `userProfile`, `isMerchant`, dan `currentLocation`.
*   **Server State:** Menggunakan **TanStack Query (React Query)** untuk mengambil, *caching*, dan sinkronisasi data dari Backend (contoh: *infinite scroll* video feed, data peta).

## 5. Integrasi Fitur Spesifik
*   **Video Feed (Beranda):** Menggunakan library resmi **`expo-video`** yang baru dan dioptimalkan untuk pemutaran video berkinerja tinggi, dipadukan dengan `FlatList` dengan properti `pagingEnabled={true}`.
*   **Peta (Jelajah):** Menggunakan **`react-native-maps`**. Kita akan mengatur *Config Plugin* di `app.json` untuk memasukkan Google Maps API Key untuk Android.
*   **Studio AI (Kamera):** Menggunakan **`expo-camera`** dan **`expo-image-picker`** untuk pengambilan dan pemilihan video dari galeri.
*   **Geolokasi Real-time:** Menggunakan **`expo-location`** untuk melacak pedagang, meminta izin akses lokasi (*foreground* dan *background* menggunakan *Config Plugins*).

## 6. Pembaruan OTA (Over-The-Air)
Kita akan mengintegrasikan **EAS Update** (`expo-updates`). Ini memungkinkan kita merilis perbaikan *bug* UI/UX atau logika *frontend* langsung kepada pengguna tanpa perlu melewati *review* Google Play Store yang memakan waktu, sangat cocok untuk iterasi cepat di fase MVP.
