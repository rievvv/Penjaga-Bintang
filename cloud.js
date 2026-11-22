'use strict';
/* Sinkronisasi Firebase.
   - Orang tua: Auth email+sandi -> dokumen families/{uid} (data keluarga) + codes/{KODE} (kode anak -> uid).
   - Anak: Auth anonim + kode 6 karakter dari orang tua; anak hanya menulis kemajuannya sendiri.
   Tanpa konfigurasi / tanpa internet, aplikasi tetap jalan dengan data lokal. */
const Cloud = (() => {
  const cfg = window.FIREBASE_CONFIG || {};
  const enabled = !!(cfg.apiKey && window.firebase);
  // field kemajuan yang boleh ditulis perangkat anak
  const CF = ['stars', 'spent', 'iq', 'eq', 'aq', 'plays', 'lv', 'log', 'sec', 'missions', 'hist', 'redeems', 'online', 'dq'];
  let auth, fs, user = null, ref = null, unsub = null, timer = null, role = null, getDb = () => null;
  const pend = {};   // id -> true (seluruh profil) | Set(field) | 'del';  '*' = seluruh dokumen; '$' = field tingkat atas
  if (enabled) { firebase.initializeApp(cfg); auth = firebase.auth(); fs = firebase.firestore(); }
  const clean = o => JSON.parse(JSON.stringify(o));
  const famRef = uid => fs.collection('families').doc(uid);
  const setUser = u => { user = u; ref = u && !u.isAnonymous ? famRef(u.uid) : null; return u; };
  const join = (a, b) => a === undefined ? b : (a === 'del' || b === 'del') ? 'del' : (a === true || b === true) ? true : new Set([...a, ...b]);
  function mark(id, fields) {
    if (!id) id = '*';
    pend[id] = join(pend[id], fields ? new Set(fields) : true);
  }
  const whole = d => ({ v: 2, updated: Date.now(), uid: d.uid, code: d.code, owner: d.owner, rewards: d.rewards, limitMin: d.limitMin, profiles: d.profiles });
  const genCode = () => {
    const L = 'ABCDEFGHJKLMNPQRSTUVWXYZ', N = '23456789', all = L + N, r = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
    for (;;) { let c = ''; for (let i = 0; i < 6; i++) c += all[r(all.length)]; if (/[A-Z]/.test(c) && /[0-9]/.test(c)) return c; }
  };

  async function flush() {
    timer = null;
    const d = getDb(), ids = Object.keys(pend);
    if (!ref || !d || !d.profiles || !ids.length) return;
    const snap = {}; ids.forEach(k => { snap[k] = pend[k]; delete pend[k]; });
    let full = false;
    try {
      const u = { updated: Date.now() };
      for (const id of ids) {
        const f = snap[id];
        if (id === '*') { full = true; continue; }
        if (id === '$') { if (f === true) full = true; else f.forEach(k => { if (d[k] !== undefined) u[k] = clean(d[k]); }); continue; }
        if (f === 'del') { u['profiles.' + id] = firebase.firestore.FieldValue.delete(); continue; }
        if (role === 'child' && f === true) { CF.forEach(k => { if (d.profiles[id] && d.profiles[id][k] !== undefined) u['profiles.' + id + '.' + k] = clean(d.profiles[id][k]); }); continue; }
        const p = d.profiles[id]; if (!p) continue;
        if (f === true) u['profiles.' + id] = clean(p);
        else f.forEach(k => { if (p[k] !== undefined) u['profiles.' + id + '.' + k] = clean(p[k]); });
      }
      if (full && role !== 'child') await ref.set(clean(whole(d)), { merge: true });
      else if (Object.keys(u).length > 1) {
        try { await ref.update(u); } catch (e) {
          if (e.code === 'not-found' && role !== 'child') await ref.set(clean(whole(d)), { merge: true });
          else throw e;
        }
      }
    } catch (e) { ids.forEach(k => { pend[k] = join(pend[k], snap[k]); }); }
  }
  document.addEventListener('visibilitychange', () => { if (document.hidden && Object.keys(pend).length) flush(); });

  return {
    enabled, CF,
    on: () => enabled && !!ref,
    uid: () => (user && user.uid) || '',
    email: () => (user && user.email) || '',
    setRole(r) { role = r; },
    setGetDb(f) { getDb = f; },
    useFamily(uid) { ref = famRef(uid); },
    ready: () => new Promise(res => { auth.onAuthStateChanged(u => res(setUser(u))); }),
    async signIn(e, p) { setUser((await auth.signInWithEmailAndPassword(e, p)).user); },
    async register(e, p) { setUser((await auth.createUserWithEmailAndPassword(e, p)).user); },
    async signOut() {
      if (unsub) unsub(); unsub = null; clearTimeout(timer); timer = null;
      Object.keys(pend).forEach(k => delete pend[k]);
      await auth.signOut(); user = null; ref = null; role = null;
    },
    // Kode anak: dokumen codes/{KODE} hanya bisa dibuat sekali (rules: create-only), jadi kode tidak pernah kembar.
    async claimCode() {
      if (!user) throw new Error('no-user');
      for (let i = 0; i < 10; i++) {
        const c = genCode();
        try { await fs.collection('codes').doc(c).set({ uid: user.uid, t: Date.now() }); return c; }
        catch (e) { if (e.code !== 'permission-denied') throw e; }   // sudah dipakai (atau rules belum dipasang) -> coba kode lain
      }
      throw Object.assign(new Error('code'), { code: 'code-failed' });
    },
    // Login anak: sign-in anonim, cari uid keluarga dari kode, lalu baca dokumen keluarga.
    async childLogin(code) {
      if (auth.currentUser && !auth.currentUser.isAnonymous) await auth.signOut();
      if (!auth.currentUser) await auth.signInAnonymously();
      user = auth.currentUser;
      const s = await fs.collection('codes').doc(code).get();
      if (!s.exists) return null;
      const uid = s.data().uid; ref = famRef(uid);
      const f = await ref.get();
      return { uid, data: f.exists ? f.data() : null };
    },
    async pull() { try { const s = await ref.get(); return s.exists ? s.data() : null; } catch (e) { return undefined; } },
    listen(cb) {
      if (!ref) return; if (unsub) unsub();
      unsub = ref.onSnapshot(s => { if (s.exists && !s.metadata.hasPendingWrites) cb(s.data()); }, () => { });
    },
    // push(id) = tulis profil (anak: hanya field kemajuan); push(id, ['name']) = field tertentu; push(null) = seluruh dokumen
    push(id, fields) {
      if (!ref) return;
      if (role === 'child' && (!id || id === '$')) return;
      mark(id, fields || (role === 'child' ? CF : null));
      clearTimeout(timer); timer = setTimeout(flush, 1200);
    },
    pushTop(fields) { if (!ref || role === 'child') return; mark('$', fields); clearTimeout(timer); timer = setTimeout(flush, 1200); },
    drop(id) { if (!ref || role === 'child') return; pend[id] = 'del'; clearTimeout(timer); timer = setTimeout(flush, 1200); },
    flushNow() { clearTimeout(timer); return flush(); },
    err(e) {
      const c = (e && e.code) || '';
      if (/wrong-password|invalid-credential|user-not-found/.test(c)) return 'Email atau kata sandi salah';
      if (c.includes('email-already')) return 'Email sudah terdaftar, silakan Masuk';
      if (c.includes('weak-password')) return 'Kata sandi minimal 6 karakter';
      if (c.includes('invalid-email')) return 'Format email tidak valid';
      if (c.includes('network') || c === 'unavailable') return 'Tidak ada koneksi internet';
      if (c.includes('too-many')) return 'Terlalu banyak percobaan, coba lagi nanti';
      if (c.includes('operation-not-allowed') || c.includes('admin-restricted')) return 'Login anak belum aktif: aktifkan provider Anonymous di Firebase Authentication';
      if (c === 'permission-denied') return 'Izin ditolak. Pasang Firestore Rules terbaru (lihat firestore.rules)';
      if (c === 'code-failed') return 'Kode belum bisa dibuat. Pasang Firestore Rules terbaru, lalu coba lagi';
      return 'Gagal: ' + (c || 'coba lagi');
    }
  };
})();