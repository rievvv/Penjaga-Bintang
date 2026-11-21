'use strict';
/* Portal: login orang tua / anak, dashboard orang tua, dashboard anak, reward, dan boot.
   Memakai fungsi/variabel global dari app.js (render, shell1, hero, kiki, P, save, A, go1, dll). */

const PF = ['name', 'age', 'color', 'sex', 'limit', 'bonus'];   // field yang hanya diubah orang tua
const RESET_F = ['stars', 'spent', 'iq', 'eq', 'aq', 'plays', 'log', 'hist', 'redeems'];
const KID_COLORS = ['#2f80ff', '#ff4f9a', '#17b890', '#ff9f1c', '#8a4fe0', '#ff5b5b'];
const RW_ICONS = ['🍦', '🍫', '🍕', '🎮', '📱', '🎬', '🧸', '🚲', '🎈', '🏊', '📚', '🎁'];
const CHILD_KEY = 'pb.child';
const getChild = () => { try { return JSON.parse(localStorage.getItem(CHILD_KEY)); } catch (e) { return null; } };
const setChild = o => { try { if (o) localStorage.setItem(CHILD_KEY, JSON.stringify(o)); else localStorage.removeItem(CHILD_KEY); } catch (e) { /* abaikan */ } };
const clearLocal = () => { try { localStorage.removeItem(KEY); } catch (e) { /* abaikan */ } };
const limOf = p => p.limit != null ? p.limit : db.limitMin;

function normalize(d) {
  d = d || {};
  d.v = 2; d.profiles = d.profiles || {}; d.owner = d.owner || {};
  d.rewards = Array.isArray(d.rewards) ? d.rewards : [];
  d.limitMin = d.limitMin || 30;
  Object.keys(d.profiles).forEach(id => {
    const p = d.profiles[id], b = newProfile(id, p.name || 'Anak', p.age || 7, p.color || KID_COLORS[0], p.sex);
    for (const k in b) if (p[k] === undefined) p[k] = b[k];
  });
  return d;
}
function toast(t) {
  const d = document.createElement('div'); d.className = 'toast'; d.textContent = t;
  document.body.appendChild(d); setTimeout(() => d.remove(), 1800);
}

/* ================= MASUK: pilihan peran ================= */
function screenNoCloud() {
  role = null; cur = null;
  render(`<section class="card center">${kiki(100)}<h1>Firebase belum diatur</h1>
    <p>Isi <b>apiKey</b> dan data project di <code>firebase-config.js</code> agar login orang tua &amp; anak bisa dipakai.</p></section>`);
  countTime = false;
}
function screenWelcome() {
  role = null; cur = null; view = ''; stopTick();
  render(`<section class="card center welcome">${kiki(120)}<h1>Pasukan Penjaga Bintang</h1><p>Siapa yang mau masuk?</p>
    <button class="btn big" data-act="toParent">👨‍👩‍👧 Masuk sebagai Orang Tua</button>
    <button class="btn big kid" data-act="toKid">🧒 Masuk sebagai Anak</button></section>
    <button class="link" data-act="install" ${deferredInstall ? '' : 'hidden'}>📲 Pasang ke layar utama</button>`);
  countTime = false;
}

/* ================= MASUK / DAFTAR ORANG TUA ================= */
function screenParentAuth(mode) {
  const reg = mode === 'reg';
  render(`<header class="bar"><button class="icon" data-act="welcome" aria-label="Kembali">←</button><h2>Orang Tua</h2></header>
    <section class="card center">
      <div class="seg"><button class="${reg ? '' : 'on'}" data-act="pmode" data-m="in">Masuk</button><button class="${reg ? 'on' : ''}" data-act="pmode" data-m="reg">Daftar</button></div>
      <p class="small">${reg ? 'Buat akun dengan email &amp; kata sandi. Kode untuk anak dibuat otomatis.' : 'Masuk dengan email &amp; kata sandi yang sudah terdaftar.'}</p>
      <label class="lbl" for="em">Email</label><input id="em" type="email" inputmode="email" autocomplete="username">
      <label class="lbl" for="pw">Kata sandi</label><input id="pw" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}">
      ${reg ? '<label class="lbl" for="pw2">Ulangi kata sandi</label><input id="pw2" type="password" autocomplete="new-password">' : ''}
      <p id="msg" class="msg"></p><button class="btn big" data-act="pgo" data-m="${mode}" data-enter>${reg ? 'Daftar &amp; Masuk' : 'Masuk'}</button></section>`);
  countTime = false;
}
async function parentAuth(mode) {
  const em = $('#em').value.trim(), pw = $('#pw').value, msg = $('#msg');
  if (!em || !pw) { msg.textContent = 'Isi email dan kata sandi'; return; }
  if (mode === 'reg') {
    if (pw.length < 6) { msg.textContent = 'Kata sandi minimal 6 karakter'; return; }
    if (pw !== $('#pw2').value) { msg.textContent = 'Kata sandi tidak sama'; return; }
  }
  msg.textContent = 'Memproses…';
  try {
    if (mode === 'reg') await Cloud.register(em, pw); else await Cloud.signIn(em, pw);
    await afterParent();
  } catch (e) { const m = $('#msg'); if (m) m.textContent = Cloud.err(e); }
}
async function afterParent() {
  role = 'parent'; cur = null; stopTick(); Cloud.setRole('parent');
  const uid = Cloud.uid(), remote = await Cloud.pull();   // undefined = gagal/offline, null = belum ada dokumen
  let up = false;
  if (remote && remote.profiles) { db = normalize(remote); }
  else if (remote === null) {
    const legacy = db && db.profiles && !db.uid ? db : null;   // data lokal versi lama diambil alih sekali
    db = normalize(legacy || { profiles: {} }); up = true;
  } else if (!(db && db.uid === uid)) { db = normalize({ profiles: {} }); }
  db.uid = uid;
  if (!db.code && remote !== undefined) { try { db.code = await Cloud.claimCode(); up = true; } catch (e) { /* tombol "Buat kode" tersedia */ } }
  Store.save(db); if (up) Cloud.push(null);
  Cloud.listen(onRemote);
  ptab = 'home'; screenParent();
}

/* ================= MASUK ANAK ================= */
function screenKidLogin() {
  render(`<header class="bar"><button class="icon" data-act="welcome" aria-label="Kembali">←</button><h2>Masuk Anak</h2></header>
    <section class="card center"><div class="bigemoji">🧒</div><h2>Masukkan kode dari Ayah/Bunda</h2>
      <p class="small">Kode terdiri dari 6 huruf besar dan angka.</p>
      <input id="code" class="codein" maxlength="6" autocapitalize="characters" autocomplete="off" spellcheck="false" placeholder="••••••">
      <p id="msg" class="msg"></p><button class="btn big" data-act="kgo" data-enter>Masuk 🚀</button></section>`);
  countTime = false;
}
async function kidLogin() {
  const code = $('#code').value.trim().toUpperCase(), msg = $('#msg');
  if (!/^[A-Z0-9]{6}$/.test(code)) { msg.textContent = 'Kode harus 6 huruf/angka'; return; }
  msg.textContent = 'Memeriksa…';
  try {
    const r = await Cloud.childLogin(code);
    if (!r) { msg.textContent = 'Kode tidak ditemukan. Cek lagi ya.'; return; }
    if (!r.data || !r.data.profiles) { msg.textContent = 'Data keluarga belum siap. Minta Ayah/Bunda membuka aplikasi dulu.'; return; }
    db = normalize(r.data); db.uid = r.uid; Store.save(db);
    setChild({ uid: r.uid, code, kid: null });
    role = 'child'; Cloud.setRole('child'); Cloud.listen(onRemote);
    screenKidPick();
  } catch (e) { const m = $('#msg'); if (m) m.textContent = Cloud.err(e); }
}
function screenKidPick() {
  cur = null; stopTick(); view = '';
  const ps = Object.values(db.profiles);
  render(`<header class="top"><h1>Siapa kamu?</h1><p>Pilih kartu namamu</p></header>
    ${ps.length ? `<div class="heroes">${ps.map(p => `<button class="herocard" style="--c:${p.color}" data-act="kidpick" data-id="${p.id}">${hero(p, 130)}<b>${esc(p.name)}</b><span>⭐ ${balance(p)}</span></button>`).join('')}</div>`
      : '<section class="card center"><p>Ayah/Bunda belum menambahkan nama anak. Minta mereka menambahkannya di Dashboard Orang Tua.</p></section>'}
    <button class="link" data-act="kidout">Keluar</button>`);
  countTime = false;
}
function enterKid(id) {
  cur = id; role = 'child'; Cloud.setRole('child'); view = '';
  const c = getChild(); if (c) { c.kid = id; setChild(c); }
  lvl = 0; lvl1 = null; lvl2Back = null; history.replaceState({ l: 0 }, '');
  startTick(); screenKidHome();
}

/* ================= DASHBOARD ANAK ================= */
const GAMES = {
  memory: ['g_memory', '🧠', 'Memori Bintang', 'Warna, gambar, angka, huruf', 't1'], simon: ['g_simon', '🌟', 'Pola Bintang', '2×2 sampai 5×6', 't2'],
  where: ['g_where', '🥥', 'Dimana Aku?', 'Tebak biji di tempurung', 't12'], maze: ['g_maze', '🌀', 'Labirin', 'Tarik garis ke finish', 't13'],
  puz: ['g_puz', '🧩', 'Puzzle Geser', 'Angka, abjad, gambar, warna', 't6'], mix: ['g_mix', '🎨', 'Campur Warna', 'Misi mencampur cat', 't11'],
  eng: ['g_eng', '🔤', 'Tebak Kata Inggris', 'Belajar dulu, lalu soal', 't3'], emo: ['g_emo', '💗', 'Cerita Hati', 'Empati & emosi', 't4'],
  plan: ['g_plan', '🪐', 'Planetarium Mini', 'Tata surya', 't8'], rain: ['g_rain', '🌧️', 'Simulasi Hujan', 'Siklus air', 't9'],
  tanam: ['g_tanam', '🌱', 'Menanam Bibit', 'Tumbuhan', 't3'], trash: ['g_trash', '♻️', 'Buang Sampah', 'Organik, medis, dll', 't10'],
  sak: ['g_sak', '💡', 'Saklar Lampu', '6 game listrik', 't7']
};
// Tambahkan game baru ke daftar `g` kategori yang sesuai (lihat GAMES di atas untuk format: aksi, ikon, judul, keterangan, warna).
const CATS = [
  { k: 'otak', e: '🧠', t: 'Game Otak', bg: 'linear-gradient(135deg,#7b5cff,#4a8bff)', g: ['memory', 'where', 'maze', 'puz', 'simon'] },
  { k: 'mat', e: '➕', t: 'Matematika', bg: 'linear-gradient(135deg,#ff7a59,#ffb347)', g: [] },
  { k: 'sains', e: '🔭', t: 'Simulasi Sains', bg: 'linear-gradient(135deg,#5f2c82,#49a09d)', g: ['plan', 'rain', 'tanam', 'trash', 'sak', 'mix'] },
  { k: 'bahasa', e: '🔤', t: 'Bahasa', bg: 'linear-gradient(135deg,#17b890,#4fd1c5)', g: ['eng'] },
  { k: 'sosial', e: '🤝', t: 'Sosial', bg: 'linear-gradient(135deg,#ff5d8f,#ff8fb1)', g: ['emo'] },
  { k: 'dunia', e: '🌏', t: 'Wawasan Internasional', bg: 'linear-gradient(135deg,#2193b0,#6dd5ed)', g: [] },
  { k: 'agama', e: '🙏', t: 'Agama', bg: 'linear-gradient(135deg,#8e6bd8,#c39bf0)', g: [] },
  { k: 'misi', e: '🏃', t: 'Misi Dunia Nyata', bg: 'linear-gradient(135deg,#5b8c2a,#a3d65c)', a: 'g_mis', sub: 'Gerak & bantu keluarga' },
  { k: 'reward', e: '🎁', t: 'Reward', bg: 'linear-gradient(135deg,#f7971e,#ffd200)', a: 'g_reward', sub: 'Tukar bintangmu', wide: 1 }
];
function screenKidHome(quiet) {
  nowGame = ''; ping();
  const p = P(), tot = allowedMin(p), left = Math.max(0, Math.ceil(tot - usedMin(p))), lock = isLocked();
  const pct = tot ? Math.max(0, Math.min(100, left / tot * 100)) : 0;
  const greet = lock ? 'Waktu main habis. Kamu masih bisa mengerjakan misi dan menukar hadiah!' : p.age < 7 ? `Halo ${p.name}! Pilih misi yang kamu suka.` : `Siap bertugas, ${p.name}? Pilih misimu!`;
  render(`<section class="kidcard" style="--c:${p.color}">${hero(p, 92)}<div class="kinfo"><small>Penjaga Bintang</small><b>${esc(p.name)}</b><span class="bal">⭐ ${balance(p)} <em>bintang</em></span></div></section>
    <section class="timecard ${lock ? 'out' : ''}" style="--c:${lock ? '#ff8a65' : p.color}"><div><span>⏳ Sisa waktu bermain</span><b>${lock ? 'Habis' : left + ' menit'}</b></div><div class="bar2"><i style="width:${pct}%"></i></div></section>
    <div class="kikirow">${kiki(56)}<p class="bubble">${esc(greet)}</p></div>
    <div class="cats">${CATS.map(c => {
      const n = c.g ? c.g.length : 0, soon = !c.a && !n, locked = lock && !c.a;
      return `<button class="cat${soon ? ' soon' : ''}${locked ? ' lockd' : ''}${c.wide ? ' wide' : ''}" style="background:${c.bg}" data-act="cat" data-k="${c.k}"><span class="ci">${c.e}</span><b>${c.t}</b><small>${locked ? '🔒 Waktu habis' : c.a ? c.sub : soon ? 'Segera hadir' : n + ' permainan'}</small></button>`;
    }).join('')}</div>
    <div class="linkrow"><button class="link" data-act="kidswitch">Ganti anak</button><button class="link" data-act="kidout">Keluar</button></div>`);
  if (!quiet && autoVoice()) say(greet);
}
function screenCat(k) {
  const c = CATS.find(x => x.k === k); nowGame = ''; ping();
  render(shell1(`${c.e} ${c.t}`, c.g.length
    ? `<div class="menu">${c.g.map(id => { const [a, e, t, s, cl] = GAMES[id]; return `<button class="tile ${cl}" data-act="${a}">${e}<b>${t}</b><small>${s}</small></button>`; }).join('')}</div>`
    : `<section class="card center">${kiki(90)}<h2>Segera hadir!</h2><p>Game ${esc(c.t)} sedang disiapkan. Tunggu ya, Penjaga Bintang! 🚧</p></section>`));
}

/* ================= REWARD (ANAK) ================= */
function screenRewards() {
  const p = P(), bal = balance(p), rs = db.rewards || [], hist = (p.redeems || []).slice(-5).reverse();
  render(shell1('🎁 Reward', `<section class="balbox"><span>Bintangmu</span><b>⭐ ${bal}</b></section>
    ${rs.length ? `<div class="rwgrid">${rs.map(r => {
      const ok = bal >= r.cost;
      return `<article class="rwcard ${ok ? 'ok' : ''}"><div class="rwi">${esc(r.icon)}</div><b>${esc(r.name)}</b><span class="rwc">⭐ ${r.cost}</span>
        ${ok ? `<button class="btn mini2" data-act="rwask" data-id="${esc(r.id)}">Tukar</button>` : `<div class="bar2"><i style="width:${Math.min(100, bal / r.cost * 100)}%"></i></div><small>Kurang ${r.cost - bal} ⭐</small>`}</article>`;
    }).join('')}</div>` : '<section class="card center"><p>Belum ada hadiah. Minta Ayah/Bunda menambahkannya ya!</p></section>'}
    ${hist.length ? `<section class="card"><h3>Hadiahku</h3>${hist.map(r => `<p class="small">${esc(r.i)} ${esc(r.n)} • ⭐ ${r.c} • ${esc(r.d)}</p>`).join('')}</section>` : ''}`));
  countTime = false;
}

/* ================= DASHBOARD ORANG TUA ================= */
let ptab = 'home', chartMode = 'time', rwEdit = null;
const TABS = [['home', '🏠', 'Ringkasan'], ['kids', '🧒', 'Anak'], ['rw', '🎁', 'Reward'], ['acc', '⚙️', 'Akun']];
const MODES = { time: ['⏱', 'Waktu', 'menit bermain per hari'], stars: ['⭐', 'Bintang', 'bintang dari game per hari'], iq: ['🧠', 'IQ', 'poin IQ (kumulatif)'], eq: ['💗', 'EQ', 'poin EQ (kumulatif)'], aq: ['💪', 'AQ', 'poin AQ (kumulatif)'] };
const redraw = () => { const y = window.scrollY; screenParent(); window.scrollTo(0, y); };
const psave = (id, f) => { Store.save(db); Cloud.push(id, f); };
const psaveTop = f => { Store.save(db); Cloud.pushTop(f); };
const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'baru saja' : m < 60 ? m + ' mnt lalu' : m < 1440 ? Math.round(m / 60) + ' jam lalu' : Math.round(m / 1440) + ' hari lalu'; };
const isOn = p => !!(p.online && !p.online.off && Date.now() - p.online.t < 120000);
const status = p => isOn(p)
  ? `<span class="dot on"></span>Online • ${p.online.g ? 'bermain <b>' + esc(p.online.g) + '</b>' : 'di menu utama'}`
  : `<span class="dot"></span>Offline${p.online && p.online.t ? ' • terakhir ' + ago(p.online.t) : ''}`;
const week = () => Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); return { d: d.toLocaleDateString('sv-SE'), l: d.toLocaleDateString('id-ID', { weekday: 'short' }) }; });
function series(p, mode, wk) {
  if (mode === 'time') return wk.map(x => Math.round((p.sec[x.d] || 0) / 60));
  if (mode === 'stars') { const m = {}; (p.log || []).forEach(l => { m[l.d] = (m[l.d] || 0) + l.s; }); return wk.map(x => m[x.d] || 0); }
  const i = { iq: 0, eq: 1, aq: 2 }[mode], h = p.hist || {}, ks = Object.keys(h).sort();
  return wk.map((x, n) => { let v = null; for (const k of ks) { if (k <= x.d) v = h[k][i]; else break; } return v == null ? (n === 6 && !ks.length ? p[mode] : 0) : v; });
}
function chart(ps, mode) {
  const W = 320, H = 160, L = 30, R = 10, T = 12, B = 24, wk = week(), data = ps.map(p => ({ p, v: series(p, mode, wk) }));
  const mx = Math.max(5, Math.ceil(Math.max(0, ...data.flatMap(x => x.v)) / 5) * 5);
  const X = i => L + (W - L - R) * i / 6, Y = v => T + (H - T - B) * (1 - v / mx);
  const grid = [0, .5, 1].map(f => `<line x1="${L}" x2="${W - R}" y1="${Y(mx * f)}" y2="${Y(mx * f)}" stroke="rgba(255,255,255,.15)"/><text x="${L - 4}" y="${Y(mx * f) + 4}" text-anchor="end" font-size="10" fill="#b8c0ee">${Math.round(mx * f)}</text>`).join('');
  const xl = wk.map((x, i) => `<text x="${X(i)}" y="${H - 6}" text-anchor="middle" font-size="10" fill="#b8c0ee">${esc(x.l)}</text>`).join('');
  const lines = data.map(({ p, v }) => `<polyline fill="none" stroke="${p.color}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round" points="${v.map((n, i) => X(i) + ',' + Y(n)).join(' ')}"/>${v.map((n, i) => `<circle cx="${X(i)}" cy="${Y(n)}" r="3.5" fill="${p.color}"/>`).join('')}`).join('');
  return `<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Grafik ${MODES[mode][1]}">${grid}${xl}${lines}</svg>
    <div class="legend">${ps.map(p => `<span><i style="background:${p.color}"></i>${esc(p.name)}</span>`).join('')}</div>`;
}
const bar3 = (l, v) => `<div class="row"><b>${l}</b><div class="bar2"><i style="width:${Math.min(100, v)}%"></i></div><span>${v}</span></div>`;
const topAbility = p => { const a = [['IQ', p.iq], ['EQ', p.eq], ['AQ', p.aq]].sort((x, y) => y[1] - x[1]); return a[0][1] > 0 ? `Paling menonjol: <b>${a[0][0]}</b>` : 'Belum ada poin. Ajak anak bermain!'; };

function pHeader() {
  const o = db.owner || {};
  return `<section class="phead"><label class="pphoto" for="pf" title="Ganti foto">${o.photo ? `<img src="${o.photo}" alt="Foto orang tua">` : '<span>👤</span>'}<i>📷</i></label><input id="pf" type="file" accept="image/*" hidden>
    <div class="pinfo"><small>Dashboard Orang Tua</small><input id="oname" class="oname" maxlength="24" value="${esc(o.name || '')}" placeholder="Nama Ayah/Bunda" aria-label="Nama orang tua"><small>${esc(Cloud.email())}</small></div></section>`;
}
function tabHome() {
  const ps = Object.values(db.profiles);
  const code = db.code
    ? `<section class="codebox"><small>Username anak (kode login)</small><div class="code">${esc(db.code)}</div><button class="btn mini2" data-act="copycode">📋 Salin kode</button>
        <p class="small">Anak membuka aplikasi → <b>Masuk sebagai Anak</b> → memasukkan kode ini. Kode ini unik dan tidak pernah sama dengan keluarga lain.</p></section>`
    : '<section class="card center"><p>Kode anak belum dibuat.</p><p id="msg" class="msg"></p><button class="btn" data-act="getcode">Buat kode anak</button></section>';
  const info = `<details class="card"><summary><b>Apa itu IQ, EQ, dan AQ?</b></summary>
      <p class="small"><b>IQ</b>: kemampuan berpikir (ingatan, logika, kosakata, sains). <b>EQ</b>: mengenali perasaan &amp; empati. <b>AQ</b>: ketangguhan, yaitu mau mencoba lagi setelah salah dan mengerjakan misi nyata.</p>
      <p class="small">Poin naik saat anak berlatih. Ini penanda kemajuan latihan, bukan tes IQ resmi.</p></details>`;
  if (!ps.length) return code + `<section class="card center"><div class="bigemoji">🧒</div><p>Belum ada anak. Tambahkan anak di tab <b>Anak</b>.</p><button class="btn" data-act="ptab" data-k="kids">Tambah anak</button></section>` + info;
  return code + `<section class="card"><h3>📡 Status Anak</h3>${ps.map(p => `<div class="strow">${hero(p, 40)}<div><b>${esc(p.name)}</b><small>${status(p)}</small></div></div>`).join('')}</section>
    <section class="card"><h3>📈 Grafik Perkembangan</h3>
      <div class="seg sm">${Object.keys(MODES).map(k => `<button class="${chartMode === k ? 'on' : ''}" data-act="cmode" data-m="${k}">${MODES[k][0]} ${MODES[k][1]}</button>`).join('')}</div>
      ${chart(ps, chartMode)}<p class="small center">${MODES[chartMode][2]} • 7 hari terakhir</p></section>
    <section class="card"><h3>🧠 IQ • 💗 EQ • 💪 AQ</h3>${ps.map(p => `<div class="abil" style="--c:${p.color}"><b>${esc(p.name)}</b>${bar3('IQ', p.iq)}${bar3('EQ', p.eq)}${bar3('AQ', p.aq)}<p class="small">${topAbility(p)}</p></div>`).join('')}</section>` + info;
}
function kidCard(p) {
  const sex = p.sex || 'm', dn = (p.missions[today()] || []).length;
  return `<article class="pcard" style="--c:${p.color}">
    <div class="kh">${hero(p, 58)}<div class="kn"><input class="kname" data-name="${p.id}" value="${esc(p.name)}" maxlength="16" aria-label="Nama anak"><small>${status(p)}</small></div></div>
    <div class="krow"><label>Usia <input class="age" type="number" min="3" max="17" value="${p.age}" data-age="${p.id}"></label>
      <label>Anak <select data-sex="${p.id}"><option value="m" ${sex === 'm' ? 'selected' : ''}>Laki-laki</option><option value="f" ${sex === 'f' ? 'selected' : ''}>Perempuan</option></select></label></div>
    <div class="limrow"><span>⏳ Batas main per hari</span><div class="step"><button data-act="lim" data-id="${p.id}" data-d="-5" aria-label="Kurangi 5 menit">−</button><b>${limOf(p)} mnt</b><button data-act="lim" data-id="${p.id}" data-d="5" aria-label="Tambah 5 menit">+</button></div></div>
    <p class="small">Hari ini: ${Math.round(usedMin(p))} / ${allowedMin(p)} menit • Misi nyata ${dn}</p>
    ${bar3('IQ', p.iq)}${bar3('EQ', p.eq)}${bar3('AQ', p.aq)}
    <p>⭐ Saldo ${balance(p)} (total ${p.stars}) • Main ${p.plays}×</p>
    <button class="btn mini" data-act="resetscore" data-id="${p.id}">↺ Reset skor</button><button class="btn mini" data-act="delkid" data-id="${p.id}">🗑 Hapus anak</button></article>`;
}
function tabKids() {
  return Object.values(db.profiles).map(kidCard).join('') + `<section class="card"><h3>➕ Tambah Anak</h3>
    <label class="lbl" for="kn">Nama anak</label><input id="kn" maxlength="16" placeholder="Nama">
    <div class="two"><div><label class="lbl" for="ka">Usia</label><input id="ka" type="number" min="3" max="17" value="7"></div>
    <div><label class="lbl" for="ks">Anak</label><select id="ks"><option value="m">Laki-laki</option><option value="f">Perempuan</option></select></div></div>
    <p id="msg" class="msg"></p><button class="btn" data-act="addkid">Tambah anak</button></section>`;
}
function tabReward() {
  const rs = db.rewards || [], ed = rwEdit ? rs.find(r => r.id === rwEdit) || {} : {};
  const hist = Object.values(db.profiles).flatMap(p => (p.redeems || []).map(r => ({ ...r, k: p.name }))).sort((a, b) => b.t - a.t).slice(0, 8);
  return `<section class="card"><h3>🎁 ${rwEdit ? 'Ubah Reward' : 'Tambah Reward'}</h3>
    <label class="lbl">Icon Reward</label>
    <div class="emojis">${RW_ICONS.map(e => `<button type="button" class="eb" data-act="rwicon" data-e="${e}">${e}</button>`).join('')}</div>
    <input id="rwi" class="rwin" maxlength="4" value="${esc(ed.icon || '🎁')}" aria-label="Icon reward">
    <label class="lbl" for="rwn">Nama Reward</label><input id="rwn" maxlength="30" placeholder="mis. Es krim" value="${esc(ed.name || '')}">
    <label class="lbl" for="rwc">Jumlah Penukaran Bintang</label><input id="rwc" type="number" min="1" max="9999" inputmode="numeric" placeholder="mis. 20" value="${ed.cost || ''}">
    <p id="msg" class="msg"></p><button class="btn" data-act="rwsave">${rwEdit ? 'Simpan perubahan' : 'Tambah reward'}</button>${rwEdit ? '<button class="btn ghost" data-act="rwcancel">Batal</button>' : ''}</section>
    <section class="card"><h3>Daftar Reward</h3>${rs.length ? rs.map(r => `<div class="rwrow"><span class="rwi">${esc(r.icon)}</span><div><b>${esc(r.name)}</b><small>⭐ ${r.cost} bintang</small></div>
      <button class="icon sm" data-act="rwedit" data-id="${esc(r.id)}" aria-label="Ubah">✏️</button><button class="icon sm" data-act="rwdel" data-id="${esc(r.id)}" aria-label="Hapus">🗑</button></div>`).join('') : '<p class="small">Belum ada reward. Tambahkan lewat form di atas.</p>'}</section>
    <section class="card"><h3>🧾 Riwayat Penukaran</h3>${hist.length ? hist.map(r => `<p class="small">${esc(r.i)} <b>${esc(r.k)}</b> menukar ${esc(r.n)} • ⭐ ${r.c} • ${esc(r.d)}</p>`).join('') : '<p class="small">Belum ada penukaran.</p>'}</section>`;
}
function tabAcc() {
  return `<section class="card"><h3>⚙️ Pengaturan</h3>
    <label class="lbl" for="lim">Batas waktu main bawaan untuk anak baru</label>
    <select id="lim">${[15, 20, 30, 45, 60].map(m => `<option value="${m}" ${db.limitMin === m ? 'selected' : ''}>${m} menit</option>`).join('')}</select>
    <p class="small">Batas tiap anak diatur di tab Anak.</p>
    <p class="small center">☁️ Tersinkron: ${esc(Cloud.email())}</p>
    <button class="btn ghost" data-act="export">Unduh data (cadangan)</button>
    <button class="btn ghost" data-act="install" ${deferredInstall ? '' : 'hidden'}>📲 Pasang ke layar utama</button>
    <button class="btn ghost" data-act="plogout">Keluar akun</button></section>
    <div class="tip">💡 <b>Tips:</b> Setelah main, tanya "Bagian mana yang paling seru? Apa yang sulit?" Obrolan 5 menit ini mengubah game menjadi latihan berpikir dan bercerita.</div>`;
}
function screenParent() {
  if (!db) return screenWelcome();
  const body = ptab === 'kids' ? tabKids() : ptab === 'rw' ? tabReward() : ptab === 'acc' ? tabAcc() : tabHome();
  render(`${pHeader()}<nav class="tabs">${TABS.map(([k, e, t]) => `<button class="${ptab === k ? 'on' : ''}" data-act="ptab" data-k="${k}"><span>${e}</span>${t}</button>`).join('')}</nav>${body}`);
  view = 'parent'; countTime = false;
}
function refreshParent() {
  if (view !== 'parent') return;
  const a = document.activeElement;
  if (a && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)) return;
  redraw();
}
setInterval(refreshParent, 30000);

function photoFrom(file) {
  return new Promise((res, rej) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const s = 200, c = document.createElement('canvas'); c.width = c.height = s;
      const m = Math.min(img.width, img.height);
      c.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s);
      URL.revokeObjectURL(url); res(c.toDataURL('image/jpeg', .8));
    };
    img.onerror = () => rej(new Error('img')); img.src = url;
  });
}

/* ================= SINKRON DARI PERANGKAT LAIN ================= */
function onRemote(r) {
  if (!db || !r || !r.profiles) return;
  const rem = normalize(r);
  if (role === 'child') {
    let kicked = false;
    Object.keys(rem.profiles).forEach(id => {
      if (id !== cur || !db.profiles[id]) { db.profiles[id] = rem.profiles[id]; return; }
      PF.forEach(k => { db.profiles[id][k] = rem.profiles[id][k]; });
    });
    Object.keys(db.profiles).forEach(id => { if (!rem.profiles[id]) { delete db.profiles[id]; if (id === cur) kicked = true; } });
    db.rewards = rem.rewards; db.limitMin = rem.limitMin; db.code = rem.code; db.owner = rem.owner;
    Store.save(db);
    if (kicked) { cur = null; stopTick(); screenKidPick(); }
    else if (cur && lvl === 0 && lvl1 === null && view === '' && app.querySelector('.cats')) screenKidHome(true);
  } else if (role === 'parent') {
    rem.uid = db.uid; db = rem; Store.save(db); refreshParent();
  }
}
document.addEventListener('visibilitychange', () => {
  if (role !== 'child' || !cur || !db) return;
  if (document.hidden) { ping(true); Cloud.flushNow(); } else ping();
});

/* ================= AKSI ================= */
Object.assign(A, {
  welcome: screenWelcome,
  toParent() { screenParentAuth('in'); },
  toKid() { screenKidLogin(); },
  pmode(d) { screenParentAuth(d.m); },
  pgo(d) { parentAuth(d.m); },
  kgo() { kidLogin(); },
  kidpick(d) { enterKid(d.id); },
  kidswitch() { ping(true); Cloud.flushNow(); const c = getChild(); if (c) { c.kid = null; setChild(c); } screenKidPick(); },
  async kidout() {
    if (!confirm('Keluar dari akun anak di HP ini?')) return;
    ping(true); try { await Cloud.flushNow(); } catch (e) { /* abaikan */ }
    stopTick(); await Cloud.signOut(); setChild(null); clearLocal(); db = null; cur = null; screenWelcome();
  },
  cat(d) {
    const c = CATS.find(x => x.k === d.k); if (!c) return;
    if (c.a) return A[c.a]();
    if (isLocked()) return screenLock();
    go1(() => screenCat(c.k));
  },
  g_reward() { go1(screenRewards); },
  rwask(d) {
    const r = db.rewards.find(x => x.id === d.id), bal = balance(P());
    if (!r || bal < r.cost) return screenRewards();
    render(shell1('🎁 Reward', `<section class="card center"><div class="bigemoji">${esc(r.icon)}</div><h2>Tukar ${esc(r.name)}?</h2>
      <p>Bintangmu dipakai <b>⭐ ${r.cost}</b>. Sisa: ⭐ ${bal - r.cost}</p>
      <button class="btn big" data-act="rwyes" data-id="${esc(r.id)}">Ya, tukar!</button><button class="btn ghost" data-act="rwno">Batal</button></section>`));
    countTime = false;
  },
  rwyes(d) {
    const p = P(), r = db.rewards.find(x => x.id === d.id);
    if (!r || balance(p) < r.cost) return screenRewards();
    p.spent = (p.spent || 0) + r.cost; p.redeems = p.redeems || [];
    p.redeems.push({ i: r.icon, n: r.name, c: r.cost, d: today(), t: Date.now() });
    if (p.redeems.length > 30) p.redeems.shift();
    save(['spent', 'redeems']); beep(784, .2);
    render(shell1('🎁 Reward', `<section class="card center"><div class="confetti">🎉</div><div class="bigemoji">${esc(r.icon)}</div><h2>Hore! Kamu menukar ${esc(r.name)}</h2>
      <p>Tunjukkan layar ini ke Ayah/Bunda ya!</p><button class="btn big" data-act="rwno">Kembali ke Reward</button></section>`));
    countTime = false; if (autoVoice()) say('Hore! Kamu menukar ' + r.name);
  },
  rwno: screenRewards,

  ptab(d) { ptab = d.k; if (d.k !== 'rw') rwEdit = null; screenParent(); },
  cmode(d) { chartMode = d.m; redraw(); },
  async copycode() {
    try { await navigator.clipboard.writeText(db.code); }
    catch (e) { const t = document.createElement('textarea'); t.value = db.code; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (_) { /* abaikan */ } t.remove(); }
    toast('Kode disalin ✅');
  },
  async getcode() {
    const m = $('#msg'); if (m) m.textContent = 'Membuat kode…';
    try { db.code = await Cloud.claimCode(); Store.save(db); Cloud.pushTop(['code']); redraw(); } catch (e) { const m2 = $('#msg'); if (m2) m2.textContent = Cloud.err(e); }
  },
  lim(d) { const p = db.profiles[d.id]; if (!p) return; p.limit = Math.max(5, Math.min(240, limOf(p) + (+d.d))); psave(d.id, ['limit']); redraw(); },
  addkid() {
    const name = $('#kn').value.trim(), age = parseInt($('#ka').value, 10), m = $('#msg');
    if (!name) { m.textContent = 'Isi nama anak'; return; }
    if (!(age >= 3 && age <= 17)) { m.textContent = 'Usia antara 3 dan 17 tahun'; return; }
    const id = 'k' + Date.now().toString(36), p = newProfile(id, name, age, KID_COLORS[Object.keys(db.profiles).length % KID_COLORS.length], $('#ks').value);
    p.limit = db.limitMin; db.profiles[id] = p; psave(id); redraw(); toast('Anak ditambahkan ✅');
  },
  delkid(d) {
    const p = db.profiles[d.id]; if (!p || !confirm(`Hapus ${p.name} beserta semua skornya? Ini tidak bisa dibatalkan.`)) return;
    delete db.profiles[d.id]; Store.save(db); Cloud.drop(d.id); redraw();
  },
  resetscore(d) {
    const p = db.profiles[d.id];
    if (!p || !confirm(`Reset skor ${p.name}? IQ, EQ, AQ, bintang, hadiah yang sudah ditukar, dan riwayat main akan kembali ke 0.`)) return;
    p.iq = p.eq = p.aq = p.stars = p.spent = p.plays = 0; p.log = []; p.hist = {}; p.redeems = [];
    psave(d.id, RESET_F); redraw();
  },
  rwicon(d) { $('#rwi').value = d.e; app.querySelectorAll('.eb').forEach(b => b.classList.toggle('on', b.dataset.e === d.e)); },
  rwsave() {
    const icon = Array.from($('#rwi').value.trim() || '🎁').slice(0, 2).join(''), name = $('#rwn').value.trim(), cost = parseInt($('#rwc').value, 10), m = $('#msg');
    if (!name) { m.textContent = 'Isi nama reward'; return; }
    if (!(cost >= 1)) { m.textContent = 'Jumlah bintang minimal 1'; return; }
    const ex = rwEdit && db.rewards.find(r => r.id === rwEdit);
    if (ex) { ex.icon = icon; ex.name = name; ex.cost = cost; } else db.rewards.push({ id: 'r' + Date.now().toString(36), icon, name, cost });
    rwEdit = null; psaveTop(['rewards']); redraw(); toast('Reward tersimpan ✅');
  },
  rwedit(d) { rwEdit = d.id; screenParent(); window.scrollTo(0, 0); },
  rwcancel() { rwEdit = null; redraw(); },
  rwdel(d) {
    const r = db.rewards.find(x => x.id === d.id); if (!r || !confirm(`Hapus reward "${r.name}"?`)) return;
    db.rewards = db.rewards.filter(x => x.id !== d.id); if (rwEdit === d.id) rwEdit = null; psaveTop(['rewards']); redraw();
  },
  async plogout() {
    if (!confirm('Keluar dari akun orang tua di HP ini?')) return;
    try { await Cloud.flushNow(); } catch (e) { /* abaikan */ }
    await Cloud.signOut(); clearLocal(); db = null; role = null; screenWelcome();
  },
  export() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' }));
    a.download = 'penjaga-bintang-cadangan.json'; document.body.appendChild(a); a.click(); a.remove();
  },
  async install() {
    if (!deferredInstall) return;
    deferredInstall.prompt(); try { await deferredInstall.userChoice; } catch (e) { /* abaikan */ }
    deferredInstall = null; if (role === 'parent') redraw(); else screenWelcome();
  }
});

app.addEventListener('input', e => {
  if (e.target.id === 'code') e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
});
app.addEventListener('change', async e => {
  const t = e.target; if (!db || role !== 'parent') return;
  const kid = id => db.profiles[id];
  if (t.matches('[data-age]')) { const p = kid(t.dataset.age); p.age = Math.max(3, Math.min(17, parseInt(t.value, 10) || p.age)); t.value = p.age; psave(p.id, ['age']); }
  else if (t.matches('[data-name]')) { const p = kid(t.dataset.name), n = t.value.trim().slice(0, 16); if (n) { p.name = n; psave(p.id, ['name']); } else t.value = p.name; }
  else if (t.matches('[data-sex]')) { const p = kid(t.dataset.sex); p.sex = t.value; psave(p.id, ['sex']); redraw(); }
  else if (t.id === 'lim') { db.limitMin = +t.value; psaveTop(['limitMin']); }
  else if (t.id === 'oname') { db.owner.name = t.value.trim().slice(0, 24); psaveTop(['owner']); }
  else if (t.id === 'pf' && t.files && t.files[0]) {
    try { db.owner.photo = await photoFrom(t.files[0]); psaveTop(['owner']); redraw(); } catch (err) { toast('Foto tidak bisa dibaca'); }
  }
});

/* ================= BOOT ================= */
(async function boot() {
  if (!Cloud.enabled) return screenNoCloud();
  let u = null; try { u = await Cloud.ready(); } catch (e) { /* abaikan */ }
  if (!u) { setChild(null); return screenWelcome(); }
  if (u.isAnonymous) {                                  // sesi anak
    const c = getChild();
    if (!c) { await Cloud.signOut(); return screenWelcome(); }
    Cloud.useFamily(c.uid); Cloud.setRole('child');
    const remote = await Cloud.pull();
    if (remote && remote.profiles) { db = normalize(remote); db.uid = c.uid; Store.save(db); }
    else if (remote === undefined) { const l = Store.load(); if (l && l.uid === c.uid) db = normalize(l); else return screenWelcome(); }
    else { await Cloud.signOut(); setChild(null); return screenWelcome(); }
    role = 'child'; Cloud.listen(onRemote);
    if (c.kid && db.profiles[c.kid]) enterKid(c.kid); else screenKidPick();
    return;
  }
  afterParent();                                        // sesi orang tua
})();