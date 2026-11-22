'use strict';
/* Pasukan Penjaga Bintang — prototipe PWA tahap 1
   Data disimpan di perangkat (localStorage). Lapisan `Store` di bawah mudah
   diganti Firebase Auth/Firestore pada tahap berikutnya. */

// Isi dengan path ilustrasimu sendiri, mis. 'assets/baim.png', agar menggantikan avatar placeholder.
const HERO_IMG = { baim: null, rara: null };

const KEY = 'pasukanBintang.v1';
const $ = (s, r = document) => r.querySelector(s);
const app = document.getElementById('app');
const today = () => new Date().toLocaleDateString('sv-SE');
const rnd = n => Math.floor(Math.random() * n);
const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const sleep = ms => new Promise(r => setTimeout(r, ms));
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---------- penyimpanan ---------- */
const Store = {
  load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } },
  save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) { /* abaikan */ } }
};
let db = Store.load();
const save = fields => { Store.save(db); Cloud.push(cur, fields); };
Cloud.setGetDb(() => db);
let tk30 = 0;
const newProfile = (id, name, age, color, sex) => ({ id, name, age, color, sex: sex || (id === 'rara' ? 'f' : 'm'), limit: null, stars: 0, spent: 0, iq: 0, eq: 0, aq: 0, plays: 0, dq: {}, lv: { memory: 1 }, log: [], sec: {}, missions: {}, bonus: {}, hist: {}, redeems: [], online: null });
const balance = p => Math.max(0, (p.stars || 0) - (p.spent || 0));
const snap = p => { p.hist = p.hist || {}; p.hist[today()] = [p.iq, p.eq, p.aq]; const k = Object.keys(p.hist).sort(); while (k.length > 30) delete p.hist[k.shift()]; };

/* ---------- state global ---------- */
let cur = null;          // id anak yang sedang bermain
let token = 0;           // naik tiap render; dipakai membatalkan timer lama
let countTime = false;   // apakah waktu layar dihitung
let tick = null;
let role = null;         // 'parent' | 'child' | null
let view = '';           // layar aktif khusus (mis. 'parent')
let nowGame = '';        // game yang sedang dimainkan anak (dilihat orang tua)
let lvl1 = null;         // fungsi untuk menggambar ulang layar level 1
let deferredInstall = null;
const P = () => db.profiles[cur];
const autoVoice = () => !!cur && P().age < 7;
const allowedMin = p => (p.limit != null ? p.limit : db.limitMin) + ((p.bonus && p.bonus[today()]) || 0);
const usedMin = p => (p.sec[today()] || 0) / 60;
const isLocked = () => usedMin(P()) >= allowedMin(P());

function render(html) { token++; countTime = true; view = ''; app.innerHTML = html; window.scrollTo(0, 0); }

/* ---------- suara ---------- */
function say(text, lang = 'id-ID') {
  try {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang; u.rate = 0.9; u.pitch = 1.15;
    speechSynthesis.speak(u);
  } catch (e) { /* abaikan */ }
}
let ac;
function beep(freq, dur = 0.25) {
  try {
    ac = ac || new (window.AudioContext || window.webkitAudioContext)();
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = 'sine'; o.frequency.value = freq; g.gain.value = 0.12;
    o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + dur);
  } catch (e) { /* abaikan */ }
}

/* ---------- gambar (placeholder, silakan ganti dengan ilustrasimu) ---------- */
function hero(p, s = 120) {
  if (HERO_IMG[p.id]) return `<img class="heroimg" src="${HERO_IMG[p.id]}" width="${s}" height="${s}" alt="${esc(p.name)}">`;
  const c = p.color, girl = p.sex ? p.sex === 'f' : p.id === 'rara';
  const hair = girl
    ? '<path d="M36 40 Q38 16 60 16 Q82 16 84 40 Q72 28 60 28 Q48 28 36 40Z" fill="#3b2a20"/><circle cx="31" cy="44" r="9" fill="#3b2a20"/><circle cx="89" cy="44" r="9" fill="#3b2a20"/>'
    : '<path d="M35 42 Q34 14 60 15 Q86 14 85 42 Q74 26 60 28 Q46 26 35 42Z" fill="#2b2118"/>';
  return `<svg viewBox="0 0 120 120" width="${s}" height="${s}" role="img" aria-label="${esc(p.name)}">
    <path d="M26 66 L94 66 L108 114 L12 114Z" fill="${c}" opacity=".55"/>
    <rect x="38" y="68" width="44" height="42" rx="14" fill="${c}"/>
    <polygon points="60,78 63,85 71,86 65,91 67,99 60,95 53,99 55,91 49,86 57,85" fill="#ffd54a"/>
    <circle cx="60" cy="44" r="24" fill="#ffd9b3"/>${hair}
    <rect x="38" y="38" width="44" height="12" rx="6" fill="${c}"/>
    <circle cx="50" cy="44" r="4" fill="#fff"/><circle cx="70" cy="44" r="4" fill="#fff"/>
    <circle cx="50" cy="44" r="2" fill="#222"/><circle cx="70" cy="44" r="2" fill="#222"/>
    <path d="M52 56 Q60 63 68 56" stroke="#a24b3b" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
}
const STAR = Array.from({ length: 10 }, (_, k) => { const r = k % 2 ? 23 : 45, a = (-90 + 36 * k) * Math.PI / 180; return (60 + r * Math.cos(a)).toFixed(1) + ',' + (64 + r * Math.sin(a)).toFixed(1); }).join(' ');
function kiki(s = 80) {
  return `<svg class="clay-star" viewBox="0 0 120 120" width="${s}" height="${s}" aria-hidden="true">
    <ellipse cx="60" cy="113" rx="32" ry="6" fill="#000" opacity=".3"/>
    <polygon points="${STAR}" fill="#d98a00" stroke="#d98a00" stroke-width="13" stroke-linejoin="round" transform="translate(0 6)"/>
    <polygon points="${STAR}" fill="url(#clayGold)" stroke="url(#clayGold)" stroke-width="13" stroke-linejoin="round"/>
    <ellipse cx="42" cy="36" rx="13" ry="6" fill="#fff" opacity=".55" transform="rotate(-35 42 36)" filter="url(#clayBlur)"/>
    <circle cx="49" cy="64" r="5" fill="#4a2e00"/><circle cx="71" cy="64" r="5" fill="#4a2e00"/>
    <circle cx="47.5" cy="62" r="1.6" fill="#fff"/><circle cx="69.5" cy="62" r="1.6" fill="#fff"/>
    <path d="M51 74 Q60 82 69 74" stroke="#4a2e00" stroke-width="3.5" fill="none" stroke-linecap="round"/>
    <circle cx="42" cy="73" r="4.5" fill="#ff8fa3" opacity=".75"/><circle cx="78" cy="73" r="4.5" fill="#ff8fa3" opacity=".75"/></svg>`;
}
const shell = (title, body) => `<header class="bar"><button class="icon" data-act="hub" aria-label="Kembali">←</button><h2>${title}</h2></header><main class="game">${body}</main>`;

const shell1 = (title, body) => `<header class="bar"><button class="icon" data-act="home" aria-label="Kembali">←</button><h2>${title}</h2></header><main class="game">${body}</main>`;

/* ---------- data konten ---------- */
const PRAISE = ['Kamu gigih sekali! 💪', 'Hebat, kamu terus mencoba!', 'Keren, kamu fokus!', 'Usahamu luar biasa, Penjaga Bintang!', 'Salah itu bagian dari belajar. Kamu hebat!'];
const ICONS = ['🚀', '🌙', '⭐', '🪐', '☄️', '👽', '🛸', '🌍', '🔭', '🐱', '🦊', '🐼'];
const PADS = [{ c: '#ff5b5b', f: 262 }, { c: '#ffd23f', f: 330 }, { c: '#3ddc84', f: 392 }, { c: '#4aa3ff', f: 523 }];

// p: 2 = pilihan terbaik, 1 = lumayan, 0 = kurang tepat (tetap diberi penjelasan yang lembut)
const EMO_RARA = [
  { e: '🧸', t: 'Temanmu menangis karena mainannya jatuh.', c: [
    { a: 'Peluk dan tanya, "Kamu sedih ya?"', p: 2, f: 'Wah, kamu peduli! Teman jadi merasa ditemani.' },
    { a: 'Pergi main sendiri', p: 1, f: 'Kadang kita bingung. Menemani sebentar akan membuat temanmu lebih lega.' },
    { a: 'Bilang, "Jangan cengeng!"', p: 0, f: 'Kata itu bisa membuat temanmu makin sedih. Tanya dengan lembut ya.' }] },
  { e: '😠', t: 'Kamu marah karena gambarmu dirusak.', c: [
    { a: 'Tarik napas 3 kali, lalu bilang, "Aku sedih."', p: 2, f: 'Keren! Napas dalam menenangkan badan, kata-kata menjelaskan perasaan.' },
    { a: 'Menangis sendirian', p: 1, f: 'Boleh menangis. Tapi lebih baik cerita juga ke Ibu atau Ayah.' },
    { a: 'Memukul', p: 0, f: 'Memukul bisa menyakiti. Kata-kata dan napas lebih kuat.' }] },
  { e: '🍪', t: 'Kamu punya dua kue, temanmu tidak punya.', c: [
    { a: 'Berbagi satu kue', p: 2, f: 'Berbagi membuat hati terasa hangat. Kamu baik!' },
    { a: 'Bilang, "Ini punyaku."', p: 1, f: 'Boleh, itu memang milikmu. Tapi berbagi membuat dua orang senang.' },
    { a: 'Makan cepat-cepat', p: 0, f: 'Temanmu bisa sedih. Coba tawarkan kuemu.' }] },
  { e: '🌙', t: 'Kamu takut gelap saat mau tidur.', c: [
    { a: 'Bilang ke Ibu atau Ayah, "Aku takut."', p: 2, f: 'Berani bilang takut itu hebat. Orang tua siap menemani.' },
    { a: 'Pura-pura tidak takut', p: 1, f: 'Takut itu normal. Lebih enak kalau diceritakan.' },
    { a: 'Berteriak-teriak', p: 0, f: 'Berteriak bikin tambah takut. Bicara pelan "aku takut" lebih baik.' }] },
  { e: '🏆', t: 'Kamu kalah main, temanmu menang.', c: [
    { a: 'Bilang, "Selamat ya!" lalu main lagi', p: 2, f: 'Keren! Kalah itu cara belajar, dan kamu sportif.' },
    { a: 'Diam dan menangis lama', p: 1, f: 'Sedih itu boleh. Setelah tenang, coba lagi ya.' },
    { a: 'Marah dan pergi', p: 0, f: 'Marah membuat main tidak seru. Coba tarik napas dulu.' }] }
];
const EMO_BAIM = [
  { e: '😔', t: 'Temanmu duduk sendirian saat istirahat.', c: [
    { a: 'Ajak dia main bareng', p: 2, f: 'Ajakan kecilmu bisa membuat harinya berubah. Empati yang bagus!' },
    { a: 'Lihat dulu dari jauh', p: 1, f: 'Peka itu bagus. Langkah berikutnya: dekati dan sapa.' },
    { a: 'Biarkan, bukan urusanku', p: 0, f: 'Kadang orang butuh ditemani. Satu sapaan bisa sangat berarti.' }] },
  { e: '😡', t: 'Kamu kalah di game dan sangat kesal.', c: [
    { a: 'Tarik napas, istirahat, lalu coba lagi', p: 2, f: 'Itu cara pemain tangguh! Tenang dulu, baru berpikir lagi.' },
    { a: 'Berhenti main dulu', p: 1, f: 'Berhenti sebentar boleh. Nanti coba lagi dengan kepala dingin.' },
    { a: 'Membanting HP atau stik', p: 0, f: 'Barangnya bisa rusak dan kamu tetap kesal. Napas dalam lebih ampuh.' }] },
  { e: '🥛', t: 'Kamu tidak sengaja memecahkan gelas.', c: [
    { a: 'Jujur ke orang tua dan minta maaf', p: 2, f: 'Jujur itu berani. Orang tua lebih mudah membantu kalau tahu.' },
    { a: 'Diam, berharap tidak ketahuan', p: 0, f: 'Beban rahasia terasa berat. Jujur membuat hati lega.' },
    { a: 'Bersihkan sendiri lalu cerita', p: 1, f: 'Bertanggung jawab itu bagus. Hati-hati dengan pecahan ya, minta bantuan.' }] },
  { e: '🧱', t: 'Adikmu menangis karena menara baloknya roboh.', c: [
    { a: 'Bantu membangun lagi bersama', p: 2, f: 'Kakak yang hebat! Kerja sama membuat adik merasa disayang.' },
    { a: 'Bilang "nanti ya" lalu pergi', p: 1, f: 'Mungkin kamu sibuk, tapi menemani sebentar sangat berarti.' },
    { a: 'Menertawakan', p: 0, f: 'Tertawa bisa melukai perasaan. Coba bantu dan hibur.' }] },
  { e: '📝', t: 'Besok ada ujian dan kamu merasa cemas.', c: [
    { a: 'Belajar sedikit-sedikit dan cerita ke orang tua', p: 2, f: 'Cemas itu wajar. Bercerita dan bersiap membuatnya mengecil.' },
    { a: 'Tidak mau memikirkannya', p: 1, f: 'Menghindar bikin cemas bertahan. Coba hadapi sedikit demi sedikit.' },
    { a: 'Bilang, "Aku pasti gagal."', p: 0, f: 'Pikiran itu bikin makin cemas. Ingat: gagal itu bagian dari belajar.' }] },
  { e: '🎉', t: 'Temanmu juara kelas, kamu belum pernah.', c: [
    { a: 'Ikut senang dan tanya cara belajarnya', p: 2, f: 'Keren! Iri bisa jadi semangat belajar kalau kamu arahkan begitu.' },
    { a: 'Pura-pura tidak peduli', p: 1, f: 'Wajar kalau ada rasa iri. Kamu bisa jujur pada perasaanmu.' },
    { a: 'Menjauhi temanmu', p: 0, f: 'Persahabatan lebih berharga dari peringkat. Coba ucapkan selamat.' }] }
];

const MIS_RARA = ['🧸 Rapikan mainanmu', '🌟 Lompat bintang 10 kali', '🤗 Peluk Ibu atau Ayah', '😊 Ceritakan 1 hal yang membuatmu senang', '💧 Minum segelas air', '🍽️ Bantu menyiapkan piring'];
const MIS_BAIM = ['📖 Baca 1 halaman buku', '💪 Push-up atau sit-up 10 kali', '🧹 Bantu 1 pekerjaan rumah', '✍️ Tulis 3 hal yang kamu syukuri', '🤝 Ajak adik main bareng 10 menit', '💧 Minum 2 gelas air'];

/* ---------- penghitung waktu layar ---------- */
function ping(off) {
  const p = role === 'child' && cur && db && db.profiles[cur];
  if (!p) return;
  p.online = { t: Date.now(), g: nowGame, off: off ? 1 : 0 };
  Cloud.push(cur, ['online']);
}
function startTick() {
  stopTick(); let n = 0;
  tick = setInterval(() => {
    if (role !== 'child' || !cur || document.hidden) return;
    const p = P(); if (!p) return;
    if (++n % 4 === 0) ping();                          // status online tiap ~20 detik
    if (!countTime) return;
    if (isLocked()) { if (lvl >= 2) { Cloud.push(cur, ['sec']); screenLock(); } return; }
    const d = today();
    p.sec[d] = (p.sec[d] || 0) + 5;
    const keys = Object.keys(p.sec).sort();
    while (keys.length > 14) delete p.sec[keys.shift()];
    Store.save(db); if (++tk30 % 6 === 0) Cloud.push(cur, ['sec']);   // cloud: tiap ~30 detik agar hemat kuota
    if (isLocked() && lvl >= 2) { Cloud.push(cur, ['sec']); screenLock(); }
  }, 5000);
}
function stopTick() { if (tick) clearInterval(tick); tick = null; }

/* ---------- hadiah ---------- */
function reward(game, { iq = 0, eq = 0, aq = 0, stars = 1 }) {
  const p = P();
  p.iq += iq; p.eq += eq; p.aq += aq; p.stars += stars; p.plays++;
  snap(p);
  p.log.push({ d: today(), g: game, s: stars });
  if (p.log.length > 60) p.log.shift();
  save();
}
function result(title, stars, note, extra) {
  const msg = PRAISE[rnd(PRAISE.length)];
  render(`<section class="card center"><div class="confetti">🎉</div>${kiki(96)}<h2>${title}</h2>
    <div class="stars">${'⭐'.repeat(stars)}${'☆'.repeat(Math.max(0, 3 - stars))}</div>
    <p><b>${msg}</b></p><p class="small">${note}</p>
    ${extra || ''}<button class="btn ghost" data-act="hub">Kembali ke menu</button></section>`);
  if (autoVoice()) say(msg);
}

/* ---------- layar waktu habis ---------- */
function screenLock() {
  render(`<section class="card center">${kiki(110)}<h2>Waktunya istirahat, ${esc(P().name)}!</h2>
    <p>Waktu main hari ini sudah habis. Yuk kerjakan misi di dunia nyata!</p>
    <button class="btn big" data-act="g_mis_force">🏃 Misi Dunia Nyata</button>
    <button class="btn ghost" data-act="home">Ke menu utama</button></section>`);
  countTime = false;
  if (autoVoice()) say('Waktunya istirahat. Yuk kerjakan misi di dunia nyata!');
}

/* ---------- game 1: Memori Bintang ---------- */
let M = null;
function memoryStart(level) {
  const p = P(), young = p.age < 7;
  level = level || p.lv.memory || 1;
  const pairs = Math.min((young ? 3 : 6) + level - 1, young ? 6 : 10);
  const icons = shuffle(ICONS).slice(0, pairs);
  const cards = shuffle(icons.concat(icons));
  const cols = cards.length <= 6 ? 3 : cards.length <= 12 ? 4 : 5;
  render(shell(`Memori Bintang • Level ${level}`, `<p class="hint">Cari pasangan yang sama!</p>
    <div class="mem" style="--cols:${cols}">${cards.map((v, i) => `<button class="mcard" data-act="flip" data-i="${i}" aria-label="kartu"><span class="front">❔</span><span class="back">${v}</span></button>`).join('')}</div>
    <p class="hint">Langkah: <b id="mv">0</b></p>`));
  M = { level, pairs, cards, open: [], done: 0, moves: 0, busy: false, tk: token };
  if (autoVoice()) say('Cari kartu yang sama!');
}
function memoryFlip(i, el) {
  if (!M || M.busy || el.classList.contains('open') || el.classList.contains('done')) return;
  el.classList.add('open'); beep(440 + (i % 6) * 60, 0.12);
  M.open.push(i);
  if (M.open.length < 2) return;
  M.moves++; $('#mv').textContent = M.moves;
  const [a, b] = M.open, els = app.querySelectorAll('.mcard');
  if (M.cards[a] === M.cards[b]) {
    els[a].classList.replace('open', 'done'); els[b].classList.replace('open', 'done');
    M.open = []; M.done++; beep(784, 0.2);
    if (M.done === M.pairs) setTimeout(memoryEnd, 500);
  } else {
    M.busy = true; const tk = M.tk;
    setTimeout(() => {
      if (tk !== token || !M) return;
      els[a].classList.remove('open'); els[b].classList.remove('open');
      M.open = []; M.busy = false;
    }, 800);
  }
}
function memoryEnd() {
  if (!M || M.tk !== token) return;
  const stars = M.moves <= M.pairs * 1.6 ? 3 : M.moves <= M.pairs * 2.6 ? 2 : 1;
  const p = P(), next = M.level + 1;
  p.lv.memory = Math.max(p.lv.memory || 1, next);
  reward('memory', { iq: M.pairs, stars });
  result('Semua pasangan ketemu!', stars, `Kamu selesai dalam ${M.moves} langkah.`,
    `<button class="btn big" data-act="memnext" data-lv="${next}">Level ${next} ▶</button>`);
}

/* ---------- game 2: Pola Bintang ---------- */
let S = null;
const makeSeq = n => Array.from({ length: n }, () => rnd(4));
function simonStart() {
  const p = P(), len = p.age < 7 ? 2 : 3;
  render(shell('Pola Bintang', `<p class="hint" id="sm">Lihat dulu polanya…</p>
    <div class="simon">${PADS.map((x, i) => `<button class="pad" id="pad${i}" style="--pc:${x.c}" data-act="pad" data-i="${i}" aria-label="bintang ${i + 1}"></button>`).join('')}</div>
    <p class="hint">Putaran <b id="rd">1</b>/5</p>`));
  S = { len, round: 1, total: 5, retries: 0, seq: makeSeq(len), pos: 0, busy: true, tk: token };
  if (autoVoice()) say('Lihat polanya, lalu ulangi!');
  simonShow();
}
function lightPad(i) {
  const el = $('#pad' + i); if (!el) return;
  el.classList.add('lit'); beep(PADS[i].f, 0.3);
  setTimeout(() => el.classList.remove('lit'), 400);
}
async function simonShow() {
  const tk = S.tk; S.busy = true; S.pos = 0;
  const sm = $('#sm'); if (sm) sm.textContent = 'Lihat dulu polanya…';
  await sleep(800);
  for (const i of S.seq) { if (tk !== token) return; lightPad(i); await sleep(650); }
  if (tk !== token) return;
  S.busy = false; const sm2 = $('#sm'); if (sm2) sm2.textContent = 'Sekarang giliranmu!';
}
function simonPad(i) {
  if (!S || S.busy) return;
  lightPad(i);
  if (i === S.seq[S.pos]) {
    S.pos++;
    if (S.pos === S.seq.length) {
      S.busy = true;
      if (S.round === S.total) return setTimeout(simonEnd, 600);
      S.round++; S.len++; S.seq = makeSeq(S.len);
      $('#rd').textContent = S.round; $('#sm').textContent = 'Mantap! Pola baru…';
      const tk = S.tk; setTimeout(() => { if (S && S.tk === tk && tk === token) simonShow(); }, 900);
    }
  } else {
    S.retries++; S.busy = true;
    $('#sm').textContent = 'Hampir! Tidak apa-apa, lihat lagi ya 💪';
    if (autoVoice()) say('Hampir! Coba lagi ya.');
    const tk = S.tk; setTimeout(() => { if (S && S.tk === tk && tk === token) simonShow(); }, 1300);
  }
}
function simonEnd() {
  if (!S || S.tk !== token) return;
  const stars = S.retries === 0 ? 3 : S.retries <= 3 ? 2 : 1;
  reward('simon', { iq: S.total, aq: Math.min(S.retries, 5) * 2 + 2, stars });
  result('Semua pola selesai!', stars, S.retries
    ? `Kamu sempat salah ${S.retries}× tapi terus mencoba. Itu kekuatan super ketangguhan!`
    : 'Tanpa salah sama sekali. Fokusmu tajam!',
    '<button class="btn big" data-act="g_simon">Main lagi</button>');
}

/* ---------- game 4: Cerita Hati ---------- */
let C = null;
function emoStart() {
  const list = shuffle(P().age < 7 ? EMO_RARA : EMO_BAIM).slice(0, 4);
  C = { list, i: 0, pts: 0, locked: false, ch: [], tk: 0 };
  emoQ();
}
function emoQ() {
  const s = C.list[C.i];
  C.ch = shuffle(s.c); C.locked = false;
  render(shell(`Cerita Hati (${C.i + 1}/${C.list.length})`, `<div class="bigemoji">${s.e}</div>
    <p class="story">${esc(s.t)}</p><p class="q">Apa yang akan kamu lakukan?</p>
    <div class="opts col">${C.ch.map((x, n) => `<button class="opt wide" data-act="emopick" data-n="${n}">${esc(x.a)}</button>`).join('')}</div>
    <div id="fb" class="fbbox"></div>`));
  C.tk = token;
  if (autoVoice()) say(s.t + ' Apa yang akan kamu lakukan?');
}
function emoPick(n, el) {
  if (!C || C.locked) return;
  C.locked = true;
  const x = C.ch[n]; C.pts += x.p;
  const btns = app.querySelectorAll('.opt');
  btns.forEach(b => { b.disabled = true; });
  const best = C.ch.findIndex(c => c.p === 2);
  if (btns[best]) btns[best].classList.add('right');   // tunjukkan pilihan terbaik agar anak belajar
  if (x.p !== 2) el.classList.add('picked');           // pilihan lain ditandai lembut, bukan merah
  const last = C.i + 1 >= C.list.length;
  $('#fb').innerHTML = `<p class="${x.p === 2 ? 'good' : 'soft'}">${x.p === 2 ? '💛 ' : '💭 '}${esc(x.f)}</p><button class="btn" data-act="emonext">${last ? 'Selesai' : 'Lanjut'}</button>`;
  say(x.f);
}
function emoNext() {
  if (!C) return;
  C.i++;
  if (C.i >= C.list.length) {
    const max = C.list.length * 2;
    const stars = C.pts >= max - 1 ? 3 : C.pts >= max / 2 ? 2 : 1;
    reward('emosi', { eq: C.pts + 1, stars });
    result('Cerita selesai!', stars, 'Kamu berlatih mengenali perasaan sendiri dan orang lain.', '<button class="btn big" data-act="g_emo">Cerita lain</button>');
  } else emoQ();
}

/* ---------- Misi Dunia Nyata ---------- */
function screenMissions() {
  const p = P(), list = p.age < 7 ? MIS_RARA : MIS_BAIM, d = today();
  p.missions[d] = p.missions[d] || [];
  const keys = Object.keys(p.missions).sort();
  while (keys.length > 14) delete p.missions[keys.shift()];
  const done = p.missions[d];
  render(shell1('Misi Dunia Nyata', `<p class="hint">Kerjakan misinya di dunia nyata, lalu tekan tombolnya!</p>
    <div class="mlist">${list.map((m, i) => `<button class="mis ${done.includes(i) ? 'done' : ''}" data-act="mis" data-i="${i}">${done.includes(i) ? '✅' : '⬜'} ${esc(m)}</button>`).join('')}</div>
    <p><b>${done.length}/${list.length}</b> misi selesai hari ini ${done.length === list.length ? '🎉 Luar biasa!' : ''}</p>`));
  countTime = false;
}
function missionTap(i) {
  const p = P(), d = today();
  p.missions[d] = p.missions[d] || [];
  if (p.missions[d].includes(i)) return;
  p.missions[d].push(i);
  const all = p.missions[d].length === (p.age < 7 ? MIS_RARA : MIS_BAIM).length;
  p.stars += all ? 4 : 1; p.aq += 2; snap(p); save();
  beep(660, 0.15);
  screenMissions();
  if (autoVoice()) say(all ? 'Hebat! Semua misi selesai!' : 'Bagus sekali!');
}

/* ---------- navigasi & aksi game ---------- */
// lvl: 0 = dashboard anak, 1 = kategori/misi/reward, 2 = game, 3 = submenu game (mis. Saklar)
let lvl = 0;
let lvl2Back = null;   // fungsi untuk kembali ke submenu game saat swipe kembali
function setLvl(n) { while (lvl < n) history.pushState({ l: ++lvl }, ''); }
window.addEventListener('popstate', e => {
  lvl = (e.state && e.state.l) || 0;
  if (role !== 'child' || !cur) return;
  if (lvl >= 2 && lvl2Back) return lvl2Back();
  lvl2Back = null;
  if (lvl >= 1 && lvl1) return lvl1();
  lvl = 0; lvl1 = null; screenKidHome();
});
const gate = fn => () => { if (isLocked()) screenLock(); else { fn(); setLvl(2); } };
const go1 = fn => { lvl1 = fn; fn(); setLvl(1); };
const ACT_GAME = {
  g_memory: 'Memori Bintang', g_simon: 'Pola Bintang', g_puz: 'Puzzle Geser', g_mix: 'Campur Warna',
  g_emo: 'Cerita Hati', g_plan: 'Planetarium Mini', g_rain: 'Simulasi Hujan', g_tanam: 'Menanam Bibit', g_trash: 'Buang Sampah',
  g_sak: 'Saklar Lampu', g_mis: 'Misi Dunia Nyata', g_mis_force: 'Misi Dunia Nyata', g_reward: 'Menukar hadiah'
};
const A = {
  home() { if (lvl > 0) history.go(-lvl); else screenKidHome(); },
  hub() { if (lvl > 1) history.go(1 - lvl); else if (lvl1) lvl1(); else screenKidHome(); },
  g_memory: gate(() => memoryStart()),
  g_simon: gate(simonStart),
  g_emo: gate(emoStart),
  g_mis() { go1(screenMissions); },
  g_mis_force() { go1(screenMissions); },
  memnext: d => gate(() => memoryStart(+d.lv))(),
  flip(d, b) { memoryFlip(+d.i, b); },
  pad(d) { simonPad(+d.i); },
  emopick(d, b) { emoPick(+d.n, b); },
  emonext: emoNext,
  mis(d) { missionTap(+d.i); }
};

app.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const f = A[b.dataset.act];
  if (!f) return;
  if (ACT_GAME[b.dataset.act] && role === 'child') { nowGame = ACT_GAME[b.dataset.act]; ping(); }
  f(b.dataset, b);
});
app.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.target.tagName !== 'INPUT') return;
  const b = $('[data-enter]');
  if (b) b.click();
});
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; const b = $('[data-act="install"]'); if (b) b.hidden = false; });

/* ---------- mulai ---------- */
function splash() {
  const d = document.createElement('div'); d.id = 'splash';
  d.innerHTML = `${kiki(200)}<h1>Penjaga Bintang</h1><p>by Nexora</p>`;
  document.body.appendChild(d);
  setTimeout(() => { d.classList.add('out'); setTimeout(() => d.remove(), 600); }, 2400);
}
history.replaceState({ l: 0 }, '');
splash();   // boot() ada di portal.js
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));