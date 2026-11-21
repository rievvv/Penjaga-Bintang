'use strict';
/* Sinkronisasi Firebase (Auth email+sandi, Firestore). Satu akun orang tua = satu dokumen
   families/{uid}. Tanpa konfigurasi / tanpa internet, aplikasi tetap jalan lokal. */
const Cloud = (() => {
  const cfg = window.FIREBASE_CONFIG || {};
  const enabled = !!(cfg.apiKey && window.firebase);
  let auth, fs, user = null, ref = null, unsub = null, timer = null, getDb = () => null;
  const pend = new Set();
  if (enabled) { firebase.initializeApp(cfg); auth = firebase.auth(); fs = firebase.firestore(); }
  const setUser = u => { user = u; ref = u ? fs.collection('families').doc(u.uid) : null; return u; };
  const clean = o => JSON.parse(JSON.stringify(o));

  async function flush() {
    timer = null;
    const d = getDb(); if (!ref || !d || !d.profiles || !pend.size) return;
    const all = pend.has('*'), ids = [...pend]; pend.clear();
    try {
      if (all) await ref.set(clean({ v: 1, updated: Date.now(), limitMin: d.limitMin, pinHash: d.pinHash, profiles: d.profiles }), { merge: true });
      else {
        const u = { updated: Date.now() };
        ids.forEach(id => { if (d.profiles[id]) u['profiles.' + id] = clean(d.profiles[id]); });
        try { await ref.update(u); } catch (e) {
          if (e.code === 'not-found') await ref.set(clean({ v: 1, limitMin: d.limitMin, pinHash: d.pinHash, profiles: d.profiles }), { merge: true });
          else throw e;
        }
      }
    } catch (e) { ids.forEach(i => pend.add(i)); }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && pend.size) flush(); });

  return {
    enabled,
    on: () => enabled && !!user,
    email: () => (user && user.email) || '',
    setGetDb(f) { getDb = f; },
    ready: () => new Promise(res => { auth.onAuthStateChanged(u => res(setUser(u))); }),
    async signIn(e, p) { setUser((await auth.signInWithEmailAndPassword(e, p)).user); },
    async register(e, p) { setUser((await auth.createUserWithEmailAndPassword(e, p)).user); },
    async signOut() { if (unsub) unsub(); unsub = null; await auth.signOut(); setUser(null); },
    async pull() { try { const s = await ref.get(); return s.exists ? s.data() : null; } catch (e) { return undefined; } },
    listen(cb) {
      if (!ref) return; if (unsub) unsub();
      unsub = ref.onSnapshot(s => { if (s.exists && !s.metadata.hasPendingWrites) cb(s.data()); }, () => { });
    },
    push(id) { if (!ref) return; pend.add(id || '*'); clearTimeout(timer); timer = setTimeout(flush, 1200); },
    err(e) {
      const c = (e && e.code) || '';
      if (/wrong-password|invalid-credential|user-not-found/.test(c)) return 'Email atau kata sandi salah';
      if (c.includes('email-already')) return 'Email sudah terdaftar, silakan Masuk';
      if (c.includes('weak-password')) return 'Kata sandi minimal 6 karakter';
      if (c.includes('invalid-email')) return 'Format email tidak valid';
      if (c.includes('network')) return 'Tidak ada koneksi internet';
      return 'Gagal: ' + (c || 'coba lagi');
    }
  };
})();
