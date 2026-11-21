# Pasukan Penjaga Bintang (PWA v2)

Game edukasi untuk Super Baim (8 th) dan Super Rara (6 th): IQ, EQ, AQ.

## Isi
- **Game otak:** Memori Bintang, Pola Bintang, Puzzle Geser (3×3, 4×4, 5×5), Saklar Lampu (rangkaian listrik, korsleting & tegangan)
- **Bahasa & hati:** Tebak Kata Inggris (belajar kata dulu, baru soal), Cerita Hati
- **Simulasi sains:** Planetarium Mini, Simulasi Hujan, Menanam Bibit, Buang Sampah (organik, anorganik, kertas, medis & B3)
- Misi Dunia Nyata, batas waktu harian, dashboard orang tua, latar luar angkasa (bintang & komet)

## Menyambungkan Firebase (sinkron antar HP)
1. Firebase Console → buat project → tambah **Web app**, salin config ke `firebase-config.js`.
2. Build → **Authentication** → aktifkan provider **Email/Password**.
3. Build → **Firestore Database** → buat database, lalu pasang rules:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{db}/documents {
    match /families/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```
4. Authentication → Settings → Authorized domains: tambahkan domain hosting-mu.
5. Buka aplikasi, "Buat akun baru" di HP pertama, lalu "Masuk" dengan akun yang sama di HP lain.

Catatan: PIN 4 angka hanya pengunci di aplikasi; keamanan data ada pada akun Firebase. Sinkronisasi butuh internet,
saat offline aplikasi tetap jalan dan mengirim data begitu online. Jika `apiKey` kosong, aplikasi berjalan lokal saja.

## Mencoba
`python3 -m http.server 8000` lalu buka http://localhost:8000 (untuk HP: hosting HTTPS, mis. Firebase Hosting / GitHub Pages).
Setelah mengubah file, naikkan nilai `V` di `sw.js` agar cache diperbarui.