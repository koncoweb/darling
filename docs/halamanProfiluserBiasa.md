Rencana Pengembangan Halaman Profil User - Aplikasi Darling (Dagang Keliling)

Dokumen ini merangkum strategi desain dan fitur untuk halaman profil pengguna (pembeli) di aplikasi Darling. Berbeda dengan aplikasi food delivery tradisional (seperti ShopeeFood), Darling berfokus pada konsep Summon (Pemanggilan), di mana pedagang UMKM yang bergerak akan mendatangi lokasi pengguna.

1. Filosofi Desain: "Profil Proaktif"
Pada aplikasi delivery konvensional, profil cenderung pasif. Pada Darling, profil berfungsi sebagai Beacon (Menara Suar). Karena pedagang yang bergerak, profil user harus memberikan informasi yang memudahkan pedagang untuk menemukan dan melayani mereka secara personal.
2. Struktur Informasi & Fitur Utama
A. Identitas & Reputasi (Header)
Memberikan rasa percaya bagi pedagang bahwa user adalah pemesan yang serius.
Badge Pahlawan UMKM: Leveling berdasarkan jumlah transaksi dengan pedagang kecil (Contoh: Pencinta Bakso, Sultan UMKM Keliling).
Verifikasi Identitas: Menampilkan status akun (terhubung ke No. HP/Email) untuk meminimalisir fake summon.
B. Pusat Kendali Lokasi & Radius (Fitur Unggulan)
Karena pedagang keliling memiliki rute, user perlu mengatur visibilitas mereka:
Titik Jemput Utama: Pin lokasi presisi dengan catatan detail (Contoh: "Pagar warna hitam" atau "Depan Pos Ronda").
Radar Notifikasi (Radius Setting): Slider untuk mengatur jarak jangkauan.
Fungsi: User akan mendapat notifikasi jika pedagang favorit masuk ke radius yang ditentukan (misal: 500 meter).
Status Keberadaan: Toggle "Aktif/Siaga". Jika aktif, pedagang bisa melihat ada potensi pembeli di rute tersebut.
C. Personalisasi & Preferensi (Quick-Serve)
Mempercepat proses transaksi saat pedagang tiba di lokasi:
Catatan Selera Tetap: Preferensi otomatis yang akan muncul di layar pedagang saat menerima panggilan (Contoh: "Tanpa Seledri", "Pedas Level 5", "Minum Tanpa Gula").
Pedagang Favorit (Langganan): Daftar pedagang yang sering dipanggil. User bisa melihat posisi real-time mereka di peta kecil langsung dari profil.
D. Manajemen Interaksi
Riwayat Panggilan (Summon History): Bukan sekadar riwayat belanja, tapi catatan pedagang mana saja yang pernah dipanggil dan seberapa cepat mereka sampai.
Review Video: Galeri video pendek (UGC) yang diunggah user saat mengulas produk UMKM. Ini mendukung aspek promosi bagi pedagang.
3. Komponen UI yang Diperlukan
KomponenDeskripsiPrioritasRadar SwitchTombol untuk mengaktifkan/nonaktifkan radar deteksi pedagang.TinggiAddress ManagerManajemen lokasi favorit (Rumah, Kantor, Kost).TinggiFavorite ListKartu vertikal berisi pedagang langganan dan status "Sedang Keliling".MenengahMerchant TransitionBanner "Ingin Berjualan?" untuk upgrade ke akun pedagang.Sudah AdaLoyalty PointPoin "Darling" yang bisa ditukar dengan promo atau apresiasi UMKM.Rendah4. Alur Kerja (User Journey) dari ProfilPengaturan Awal: User masuk ke profil, mengatur Radius Radar ke 300 meter.
Deteksi: Saat pedagang favorit (misal: Tukang Sate) masuk ke radius tersebut, aplikasi mengirim notifikasi.
Summon: User membuka profil/home, melihat posisi pedagang, lalu menekan tombol "Panggil Ke Sini".
Preferensi: Pedagang menerima notifikasi pemanggilan beserta catatan selera user (misal: "Sate 10 tusuk, bumbu kacang pisah").
Transaksi: Pedagang tiba, transaksi selesai dengan satu kali scan QR yang saldonya terintegrasi di halaman profil.
5. Rekomendasi Integrasi Data (Backend)
Mengingat database sudah tersedia, pastikan kolom berikut dioptimalkan untuk halaman profil:
user_radius_preference (Integer)
default_order_notes (Text)
is_visible_on_map (Boolean)
favorite_merchants_ids (Array/Relation)
Dokumen ini dirancang untuk menjadi acuan dalam pengembangan antarmuka (UI) dan logika bisnis pada aplikasi Darling.