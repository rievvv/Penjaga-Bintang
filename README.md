# Pasukan Penjaga Bintang (PWA v2)

Game edukasi untuk Super Baim (8 th) dan Super Rara (6 th): IQ, EQ, AQ.

## Alur pemakaian
- **Orang tua**: Splash → *Masuk sebagai Orang Tua* → Daftar (email + kata sandi) / Masuk → Dashboard Orang Tua (foto custom, kode anak 6 karakter yang bisa disalin, status online anak & game yang dimainkan, grafik perkembangan, IQ/EQ/AQ, card profil anak + tambah anak, batas jam main per anak, pengaturan Reward).
- **Anak**: Splash → *Masuk sebagai Anak* → masukkan kode dari orang tua → pilih kartu nama → Dashboard Anak (sisa waktu, bintang, kategori game, Misi Dunia Nyata, Reward).
- Kode anak dibuat otomatis saat orang tua pertama kali masuk, unik (huruf besar + angka, tanpa 0/O/1/I), dan tidak pernah sama antar keluarga.
- Menambah game baru: tambahkan entri di `GAMES` dan masukkan id-nya ke `g` pada kategori yang sesuai di `CATS` (`portal.js`), lalu daftarkan aksinya (`g_xxx: gate(fn)`) di `A`.

## Menyambungkan Firebase (sinkron antar HP)
1. Firebase Console → buat project → tambah **Web app**, salin config ke `firebase-config.js`.
2. Build → **Authentication** → aktifkan provider **Email/Password** dan **Anonymous** (Anonymous dipakai untuk login anak).
3. Build → **Firestore Database** → buat database, lalu tempel isi **`firestore.rules`** ke tab Rules dan Publish.
4. Authentication → Settings → Authorized domains: tambahkan domain hosting-mu.
5. Buka aplikasi, daftar sebagai orang tua, tambah anak, lalu beri kode ke anak untuk login di HP lain.

Catatan: perangkat anak hanya boleh menulis kemajuannya sendiri (bintang, waktu, status online). Siapa pun yang tahu kode bisa membaca data keluarga itu, jadi jaga kerahasiaan kode.
Sinkronisasi butuh internet; saat offline aplikasi tetap jalan dan mengirim data begitu online.

## Mencoba
`python3 -m http.server 8000` lalu buka http://localhost:8000 (untuk HP: hosting HTTPS, mis. Firebase Hosting / GitHub Pages).
Service worker memakai jaringan dulu, jadi update langsung terpakai. Tetap naikkan nilai `V` di `sw.js` bila ingin cache lama dibersihkan.
## Game Otak (games3.js)
5 game, masing-masing 5 level. Level 1 terbuka; menang di level N membuka level N+1 (disimpan di `p.lv`), dan bintang yang didapat = nomor level.
Memori Bintang (5×5/5×5/5×7/5×8/5×10, kotak ganjil punya ⭐ bonus di tengah), Dimana Aku?, Labirin (soal tebakan ada di `QZ`), Puzzle Geser, Pola Bintang (2×2 sampai 5×6).

## Struktur file
`index.html`, `sw.js`, `manifest.webmanifest`, ikon, `firestore.rules`, skrip (`app.js`, `games2.js`, `games3.js`, `games4.js`, `games5.js`, `portal.js`, `cloud.js`, `sky.js`) dan folder `css/` (base, game, extras, clay, saklar, portal, games-otak, games-math). `firebase-config.js` milikmu sendiri tidak ikut di paket ini, jangan sampai terhapus dari repository.

## Revisi terbaru
- **Planetarium**: planet lebih besar; semua planet mengorbit ↺ (berlawanan jarum jam), rotasi poros ↺ kecuali **Venus & Uranus ↻** (terbalik). Detail di `PLN` (`games2.js`).
- **Campur Warna**: gelas tidak lagi tertimpa gaya `.cup` milik game tempurung.
- **Bahasa Inggris & Bahasa Arab** (`games5.js`): 120 kartu (hewan 20, buah 20, kendaraan 20, benda sekitar 30, alam 30). Kuota **20 soal/hari per bahasa** (dipakai bersama semua kategori), 1 benar = 1 ⭐, salah tidak bisa dikoreksi. Gambar: lihat `DAFTAR_SVG.md` (`assets/cards/<kategori>/<nama>.svg`).
- **Agama Islam** (ikon 🕌) — isinya masih "Segera hadir".
- **Roulette Harian**: 3 putaran/hari, roda berhenti di salah satu kategori, 1 soal wawasan umum, benar +2 ⭐. Bank soal di `RLQ` (`games5.js`).
- Data harian disimpan di `p.dq` (ikut tersinkron ke Firebase lewat field `dq` di `cloud.js`). `sw.js` dinaikkan ke `pb-v12`.
