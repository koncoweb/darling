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
    *   **Optimasi Scroll:** Menggunakan `getItemLayout` berbasis `WINDOW_HEIGHT` agar transisi antar video (snap) berjalan mulus tanpa drop frame.
*   **Peta (Jelajah):** Menggunakan **`react-native-maps`**. Kita akan mengatur *Config Plugin* di `app.json` untuk memasukkan Google Maps API Key untuk Android.
*   **Studio AI (Kamera):** Menggunakan **`expo-camera`** dan **`expo-image-picker`** untuk pengambilan dan pemilihan video dari galeri.
*   **Geolokasi Real-time:** Menggunakan **`expo-location`** untuk melacak pedagang, meminta izin akses lokasi (*foreground* dan *background* menggunakan *Config Plugins*).

## 6. Pembaruan OTA (Over-The-Air)
Kita akan mengintegrasikan **EAS Update** (`expo-updates`). Ini memungkinkan kita merilis perbaikan *bug* UI/UX atau logika *frontend* langsung kepada pengguna tanpa perlu melewati *review* Google Play Store yang memakan waktu, sangat cocok untuk iterasi cepat di fase MVP.


---

## 7. Sistem Autentikasi â€” Implementasi & Arsitektur yang Telah Divalidasi

### 7.1 Komponen File Autentikasi

| File | Peran |
|---|---|
| `lib/neonAuth.ts` | Inisialisasi adapter Neon Auth. **Satu-satunya tempat yang benar** untuk injeksi header global. |
| `lib/polyfills/fetch.js` | Interceptor `global.fetch` (dipertahankan sebagai lapisan tambahan, namun bukan solusi utama). |
| `lib/polyfills/crypto.js` | Polyfill Web Crypto API untuk React Native (diperlukan oleh better-auth). |
| `components/auth/AuthProvider.tsx` | React Context Provider yang membungkus seluruh state autentikasi: `user`, `jwt`, `isLoading`. |
| `app/_layout.tsx` | Root layout yang mengimpor polyfill dan membungkus app dengan `<AuthProvider>`. |
| `app/(auth)/login.tsx` | Layar login dengan form email + password. |
| `app/(auth)/register.tsx` | Layar registrasi dengan sinkronisasi profil ke `public.profiles`. |

### 7.2 Pola AuthProvider yang Direkomendasikan

Komponen `AuthProvider` mengikuti pola berikut yang telah terbukti stabil:

```typescript
// Pattern inti AuthProvider
const hydrate = useCallback(async () => {
  // 1. Ambil JWT tersimpan dari secure storage
  const storedJwt = await getSecureItem(jwtKey);
  setJwt(storedJwt);

  // 2. Verifikasi sesi aktif ke Neon Auth server
  const sessionResult = await auth.getSession();
  setUser(sessionResult?.data?.user ?? null);

  // 3. Refresh JWT jika diperlukan (fallback ke anonymous token)
  await refreshJwt();
}, [refreshJwt]);

// Jalankan hydrate() setiap kali app dimuat
useEffect(() => { void hydrate(); }, [hydrate]);
```

**Penting**: `signInWithEmail()` dan `signUpWithEmail()` **tanpa** `fetchOptions` tambahan karena header sudah diinjeksi di level adapter (`lib/neonAuth.ts`). Jangan tambahkan headers secara manual di sini â€” bisa menyebabkan konflik duplikasi.

### 7.3 Alur Polyfill yang Benar

Urutan pemuatan di `app/_layout.tsx`:

```typescript
// app/_layout.tsx â€” urutan import WAJIB dipertahankan
import '@/lib/polyfills/crypto';  // 1. Crypto polyfill (dependency better-auth)
import '@/lib/polyfills/fetch';   // 2. Fetch interceptor (fallback tambahan)
// ... rest of imports
```

### 7.4 Perbedaan Perilaku: Browser vs React Native

| Aspek | Browser Web | React Native / Expo Go |
|---|---|---|
| Header `Origin` | Otomatis dikirim oleh browser | **Tidak** dikirim â€” wajib diinjeksi manual |
| Header `Cookie` | Dikelola otomatis | Perlu konfigurasi khusus |
| `global.fetch` wrapping | Efektif untuk interceptor | Tidak efektif jika library cache referensi awal |
| CSRF Protection | Built-in via browser policy | Harus dikonfigurasi eksplisit via allowed domains |

### 7.5 Troubleshooting Cepat

| Pesan Error | Penyebab | Solusi |
|---|---|---|
| `Missing or null Origin` | Header `origin` tidak sampai ke server | Pastikan injeksi ada di `fetchOptions` pada `createInternalNeonAuth()` |
| Selalu "sudah login" saat reload | `signOut` gagal menghancurkan sesi server | Efek samping `customFetchImpl` bypass â€” teratasi dengan solusi di atas |
| `crypto is not defined` | Web Crypto API tidak tersedia di Hermes engine | Import `lib/polyfills/crypto` di `_layout.tsx` baris pertama |
| `User already exists` | Email sudah terdaftar di Neon Auth | Tampilkan pesan error dari `result.error.message` |


---

## 8. Manajemen Media & Cloudinary

Untuk menangani file video yang besar (>10MB), aplikasi menggunakan Cloudinary sebagai media provider.

### Alur Kerja Upload:
1. **Selection:** User memilih video/gambar menggunakan \ImagePicker\.
2. **Binary Upload:** Klien mengirim data binary langsung ke Cloudinary \upload\ endpoint menggunakan *Unsigned Upload Preset*.
3. **Optimasi:** Cloudinary secara otomatis melakukan kompresi dan optimasi format.
4. **Metadata Persistence:** Klien menerima URL hasil upload, lalu mengirim URL tersebut ke Neon DB via Data API untuk disimpan sebagai record.
5. **Dynamic Display:** Menggunakan `getCloudinaryThumbnail` di `lib/cloudinary.ts` untuk memunculkan preview/thumbnail dengan transformasi `so_auto` (start offset otomatis) agar feed terlihat hidup tanpa mengunduh seluruh file video.

### UI Overlap Avoidance (Tab Bar Policy):
Untuk layar full-screen (Video Feed), gunakan hook `useSafeAreaInsets` + konstanta `TAB_BAR_HEIGHT` (92px) untuk menghitung `bottomPadding` pada elemen overlay. 

```typescript
// Contoh di VideoFeedItem.tsx
const insets = useSafeAreaInsets();
const BOTTOM_NAV_HEIGHT = 92;
const contentPaddingBottom = insets.bottom + BOTTOM_NAV_HEIGHT + 20;
```
Strategi ini menjamin detail merchant dan caption tetap terbaca sempurna di atas *floating tab bar*.

### Keuntungan UI/UX:
- **Progress Tracking:** Frontend dapat memberikan feedback visual (loading indicator/status) selama proses upload yang memakan waktu.
- **Fail-safe:** Jika upload media gagal, transaksi ke database tidak dilakukan, mencegah data *corrupt*.
