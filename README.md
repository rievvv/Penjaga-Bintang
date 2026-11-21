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
Setelah mengubah file, naikkan nilai `V` di `sw.js` agar cache diperbarui.
## Game Otak (games3.js)
5 game, masing-masing 5 level. Level 1 terbuka; menang di level N membuka level N+1 (disimpan di `p.lv`), dan bintang yang didapat = nomor level.
Memori Bintang (5×5/5×5/5×7/5×8/5×10, kotak ganjil punya ⭐ bonus di tengah), Dimana Aku?, Labirin (soal tebakan ada di `QZ`), Puzzle Geser, Pola Bintang (2×2 sampai 5×6).