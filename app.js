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
const save = () => { Store.save(db); Cloud.push(cur); };
Cloud.setGetDb(() => db);
let tk30 = 0;
const newProfile = (id, name, age, color) => ({ id, name, age, color, stars: 0, iq: 0, eq: 0, aq: 0, plays: 0, lv: { memory: 1 }, log: [], sec: {}, missions: {}, bonus: {} });

async function hashPin(p) {
  try {
    if (window.crypto && crypto.subtle) {
      const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('pb:' + p));
      return Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) { /* jatuh ke bawah */ }
  return 'plain:' + p;
}

/* ---------- state global ---------- */
let cur = null;          // id anak yang sedang bermain
let token = 0;           // naik tiap render; dipakai membatalkan timer lama
let countTime = false;   // apakah waktu layar dihitung
let tick = null;
let pinCb = null;
let deferredInstall = null;
const P = () => db.profiles[cur];
const autoVoice = () => !!cur && P().age < 7;
const allowedMin = p => db.limitMin + ((p.bonus && p.bonus[today()]) || 0);
const usedMin = p => (p.sec[today()] || 0) / 60;
const isLocked = () => usedMin(P()) >= allowedMin(P());

function render(html) { token++; countTime = true; app.innerHTML = html; window.scrollTo(0, 0); }

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
  const c = p.color, girl = p.id === 'rara';
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
function kiki(s = 80) {
  return `<svg viewBox="0 0 100 100" width="${s}" height="${s}" aria-hidden="true">
    <polygon points="50,6 61,36 94,38 68,58 77,90 50,72 23,90 32,58 6,38 39,36" fill="#ffd54a" stroke="#f5a300" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="41" cy="52" r="4" fill="#3a2a00"/><circle cx="59" cy="52" r="4" fill="#3a2a00"/>
    <path d="M42 62 Q50 70 58 62" stroke="#3a2a00" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="35" cy="60" r="4" fill="#ff9aa2" opacity=".7"/><circle cx="65" cy="60" r="4" fill="#ff9aa2" opacity=".7"/></svg>`;
}
const shell = (title, body) => `<header class="bar"><button class="icon" data-act="hub" aria-label="Kembali">←</button><h2>${title}</h2></header><main class="game">${body}</main>`;

/* ---------- data konten ---------- */
const PRAISE = ['Kamu gigih sekali! 💪', 'Hebat, kamu terus mencoba!', 'Keren, kamu fokus!', 'Usahamu luar biasa, Penjaga Bintang!', 'Salah itu bagian dari belajar. Kamu hebat!'];
const ICONS = ['🚀', '🌙', '⭐', '🪐', '☄️', '👽', '🛸', '🌍', '🔭', '🐱', '🦊', '🐼'];
const PADS = [{ c: '#ff5b5b', f: 262 }, { c: '#ffd23f', f: 330 }, { c: '#3ddc84', f: 392 }, { c: '#4aa3ff', f: 523 }];

const WORDS = [
  { e: '🐱', en: 'cat', id: 'kucing', l: 1 }, { e: '🐶', en: 'dog', id: 'anjing', l: 1 }, { e: '🍎', en: 'apple', id: 'apel', l: 1 },
  { e: '🐟', en: 'fish', id: 'ikan', l: 1 }, { e: '🚗', en: 'car', id: 'mobil', l: 1 }, { e: '🌞', en: 'sun', id: 'matahari', l: 1 },
  { e: '🌙', en: 'moon', id: 'bulan', l: 1 }, { e: '⭐', en: 'star', id: 'bintang', l: 1 }, { e: '🌳', en: 'tree', id: 'pohon', l: 1 },
  { e: '📖', en: 'book', id: 'buku', l: 1 }, { e: '🥛', en: 'milk', id: 'susu', l: 1 }, { e: '🍌', en: 'banana', id: 'pisang', l: 1 },
  { e: '🐦', en: 'bird', id: 'burung', l: 1 }, { e: '💧', en: 'water', id: 'air', l: 1 }, { e: '🏠', en: 'house', id: 'rumah', l: 1 },
  { e: '🪑', en: 'chair', id: 'kursi', l: 2 }, { e: '🚪', en: 'door', id: 'pintu', l: 2 }, { e: '🌧️', en: 'rain', id: 'hujan', l: 2 },
  { e: '🚀', en: 'rocket', id: 'roket', l: 2 }, { e: '🦁', en: 'lion', id: 'singa', l: 2 }, { e: '🍞', en: 'bread', id: 'roti', l: 2 },
  { e: '✏️', en: 'pencil', id: 'pensil', l: 2 }, { e: '🎒', en: 'backpack', id: 'tas', l: 2 }, { e: '🦋', en: 'butterfly', id: 'kupu-kupu', l: 2 },
  { e: '🧀', en: 'cheese', id: 'keju', l: 2 }, { e: '🚲', en: 'bicycle', id: 'sepeda', l: 2 }, { e: '☁️', en: 'cloud', id: 'awan', l: 2 }
];

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
function startTick() {
  stopTick();
  tick = setInterval(() => {
    if (!cur || !countTime || document.hidden) return;
    const p = P(), d = today();
    p.sec[d] = (p.sec[d] || 0) + 5;
    const keys = Object.keys(p.sec).sort();
    while (keys.length > 14) delete p.sec[keys.shift()];
    Store.save(db); if (++tk30 % 6 === 0) Cloud.push(cur);   // cloud: tiap ~30 detik agar hemat kuota
    if (isLocked()) { Cloud.push(cur); screenLock(); }
  }, 5000);
}
function stopTick() { if (tick) clearInterval(tick); tick = null; }

/* ---------- hadiah ---------- */
function reward(game, { iq = 0, eq = 0, aq = 0, stars = 1 }) {
  const p = P();
  p.iq += iq; p.eq += eq; p.aq += aq; p.stars += stars; p.plays++;
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

/* ---------- layar: pengaturan awal, beranda, hub ---------- */
function screenSetup() {
  render(`<section class="card center">${kiki(110)}<h1>Pasukan Penjaga Bintang</h1>
    <p>Halo, Ayah/Bunda! Buat PIN 4 angka untuk area orang tua.</p>
    <input id="pin1" class="pin" type="password" inputmode="numeric" maxlength="4" placeholder="••••" autocomplete="off">
    <label class="lbl" for="limit">Batas waktu main per hari</label>
    <select id="limit"><option value="15">15 menit</option><option value="30" selected>30 menit</option><option value="45">45 menit</option><option value="60">60 menit</option></select>
    <p id="msg" class="msg"></p><button class="btn big" data-act="setupDone">Mulai 🚀</button></section>`);
}
function screenHome() {
  cur = null; stopTick();
  const ps = Object.values(db.profiles);
  render(`<header class="top"><h1>Pasukan Penjaga Bintang ✨</h1><p>Siapa yang bertugas hari ini?</p></header>
    <div class="heroes">${ps.map(p => `<button class="herocard" style="--c:${p.color}" data-act="pick" data-id="${p.id}">${hero(p, 130)}<b>${esc(p.name)}</b><span>⭐ ${p.stars}</span></button>`).join('')}</div>
    <button class="link" data-act="parent">🔒 Orang Tua</button>
    <button class="link" data-act="install" ${deferredInstall ? '' : 'hidden'}>📲 Pasang ke layar utama</button>`);
  countTime = false;
}
function screenHub() {
  if (isLocked()) return screenLock();
  const p = P();
  const left = Math.max(0, Math.ceil(allowedMin(p) - usedMin(p)));
  const greet = p.age < 7 ? `Halo ${p.name}! Pilih misi yang kamu suka.` : `Siap bertugas, ${p.name}? Pilih misimu!`;
  render(`<header class="hubtop" style="--c:${p.color}">${hero(p, 70)}<div><b>${esc(p.name)}</b><span>⭐ ${p.stars} &nbsp; ⏳ ${left} mnt</span></div><button class="icon" data-act="home" aria-label="Ganti pemain">↩</button></header>
    <div class="kikirow">${kiki(64)}<p class="bubble">${esc(greet)}</p></div>
    <h3 class="sec">🧠 Game Otak</h3>
    <div class="menu">
      <button class="tile t1" data-act="g_memory">🧠<b>Memori Bintang</b><small>Fokus &amp; ingatan</small></button>
      <button class="tile t2" data-act="g_simon">🌟<b>Pola Bintang</b><small>Konsentrasi &amp; gigih</small></button>
      <button class="tile t6" data-act="g_puz">🧩<b>Puzzle Geser</b><small>3×3, 4×4, 5×5</small></button>
      <button class="tile t7" data-act="g_sak">💡<b>Saklar Lampu</b><small>Listrik &amp; rangkaian</small></button>
    </div>
    <h3 class="sec">🔤 Bahasa &amp; Hati</h3>
    <div class="menu">
      <button class="tile t3" data-act="g_eng">🔤<b>Tebak Kata Inggris</b><small>Belajar dulu, lalu soal</small></button>
      <button class="tile t4" data-act="g_emo">💗<b>Cerita Hati</b><small>Empati &amp; emosi</small></button>
    </div>
    <h3 class="sec">🔭 Simulasi Sains</h3>
    <div class="menu">
      <button class="tile t8" data-act="g_plan">🪐<b>Planetarium Mini</b><small>Tata surya</small></button>
      <button class="tile t9" data-act="g_rain">🌧️<b>Simulasi Hujan</b><small>Siklus air</small></button>
      <button class="tile t3" data-act="g_tanam">🌱<b>Menanam Bibit</b><small>Tumbuhan</small></button>
      <button class="tile t10" data-act="g_trash">♻️<b>Buang Sampah</b><small>Organik, medis, dll</small></button>
    </div>
    <div class="menu" style="margin-top:14px"><button class="tile t5" data-act="g_mis">🏃<b>Misi Dunia Nyata</b><small>Gerak &amp; bantu keluarga</small></button></div>`);
  if (autoVoice()) say(greet);
}
function screenLock() {
  render(`<section class="card center">${kiki(110)}<h2>Waktunya istirahat, ${esc(P().name)}!</h2>
    <p>Waktu main hari ini sudah habis. Yuk kerjakan misi di dunia nyata!</p>
    <button class="btn big" data-act="g_mis_force">🏃 Misi Dunia Nyata</button>
    <button class="btn ghost" data-act="home">Ganti pemain</button></section>`);
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

/* ---------- game 3: Tebak Kata Inggris ---------- */
let E = null;
function engStart() {
  const young = P().age < 7;
  const pool = young ? WORDS.filter(w => w.l === 1) : WORDS;
  E = { qs: shuffle(pool).slice(0, young ? 6 : 8), i: 0, ok: 0, wrong: 0, first: true, young, pool, tk: 0, cur: null, done: false };
  engLearn();
}
function engQ() {
  const w = E.qs[E.i];
  const opts = shuffle([w, ...shuffle(E.pool.filter(x => x.en !== w.en)).slice(0, E.young ? 2 : 3)]);
  E.cur = w; E.first = true; E.done = false;
  render(shell(`Tebak Kata Inggris (${E.i + 1}/${E.qs.length})`, `<div class="bigemoji">${w.e}</div>
    <p class="q">Bahasa Inggrisnya <b>${esc(w.id)}</b> apa?</p>
    <div class="opts">${opts.map(o => `<button class="opt" data-act="engpick" data-w="${o.en}">${o.en}</button>`).join('')}</div>
    <p id="fb" class="fb"></p>`));
  E.tk = token;
  if (autoVoice()) say('Bahasa Inggrisnya ' + w.id + ' apa?');
}
function engPick(word, el) {
  if (!E || E.done || el.disabled) return;
  say(word, 'en-US');
  if (word === E.cur.en) {
    if (E.first) E.ok++;
    E.done = true; el.classList.add('right');
    $('#fb').textContent = `Betul! ${E.cur.en} = ${E.cur.id} 🎉`;
    const tk = E.tk;
    setTimeout(() => {
      if (!E || E.tk !== tk || tk !== token) return;
      E.i++;
      if (E.i >= E.qs.length) engEnd(); else engQ();
    }, 1500);
  } else {
    E.first = false; E.wrong++;
    el.classList.add('wrong'); el.disabled = true;
    $('#fb').textContent = 'Hampir! Coba lagi 💪';
  }
}
function engEnd() {
  const acc = E.ok / E.qs.length;
  const stars = acc >= 0.8 ? 3 : acc >= 0.5 ? 2 : 1;
  reward('english', { iq: E.ok + 1, aq: Math.min(E.wrong, 4), stars });
  result('Misi bahasa selesai!', stars, `Benar di percobaan pertama: ${E.ok} dari ${E.qs.length}. Main lagi untuk mengenal kata-kata baru!`,
    '<button class="btn big" data-act="g_eng">Main lagi</button>');
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
  render(shell('Misi Dunia Nyata', `<p class="hint">Kerjakan misinya di dunia nyata, lalu tekan tombolnya!</p>
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
  p.stars += all ? 4 : 1; p.aq += 2; save();
  beep(660, 0.15);
  screenMissions();
  if (autoVoice()) say(all ? 'Hebat! Semua misi selesai!' : 'Bagus sekali!');
}

/* ---------- area orang tua ---------- */
function askPin(cb) {
  pinCb = cb;
  render(`<section class="card center"><h2>🔒 Area Orang Tua</h2>
    <input id="pin" class="pin" type="password" inputmode="numeric" maxlength="4" placeholder="PIN" autocomplete="off">
    <p id="msg" class="msg"></p><button class="btn" data-act="pinok">Masuk</button><button class="btn ghost" data-act="home">Batal</button></section>`);
  countTime = false;
}
function last7(p) {
  const out = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    out.push(Math.round((p.sec[d.toLocaleDateString('sv-SE')] || 0) / 60));
  }
  return out;
}
function screenParent() {
  const ps = Object.values(db.profiles), d = today();
  const cards = ps.map(p => {
    const w = last7(p), mx = Math.max(10, ...w);
    const dn = (p.missions[d] || []).length;
    const bar = (lbl, v) => `<div class="row"><b>${lbl}</b><div class="bar2"><i style="width:${Math.min(100, v)}%"></i></div><span>${v}</span></div>`;
    return `<article class="pcard" style="--c:${p.color}">
      <h3>${hero(p, 44)} ${esc(p.name)} • usia <input class="age" type="number" min="3" max="17" value="${p.age}" data-age="${p.id}"></h3>
      ${bar('IQ', p.iq)}${bar('EQ', p.eq)}${bar('AQ', p.aq)}
      <p class="small">Poin naik saat anak berlatih. IQ: fokus &amp; kosakata. EQ: empati. AQ: gigih mencoba lagi &amp; misi nyata.</p>
      <p>⭐ ${p.stars} • Main ${p.plays}× • Hari ini ${Math.round(usedMin(p))}/${allowedMin(p)} mnt • Misi nyata ${dn}</p>
      <div class="spark" title="Menit main 7 hari terakhir">${w.map(m => `<span style="height:${Math.round(m / mx * 100)}%"></span>`).join('')}</div>
      <p class="small">Menit main 7 hari terakhir (paling kanan = hari ini)</p>
      <button class="btn mini" data-act="bonus" data-id="${p.id}">+10 menit hari ini</button></article>`;
  }).join('');
  render(`<header class="bar"><button class="icon" data-act="home" aria-label="Kembali">←</button><h2>Dashboard Orang Tua</h2></header>
    ${cards}
    <div class="tip">💡 <b>Tips:</b> Setelah main, tanya "Bagian mana yang paling seru? Apa yang sulit?" Obrolan 5 menit ini mengubah game menjadi latihan berpikir dan bercerita.</div>
    <section class="card"><label class="lbl" for="lim">Batas waktu main per hari</label>
      <select id="lim">${[15, 20, 30, 45, 60].map(m => `<option value="${m}" ${db.limitMin === m ? 'selected' : ''}>${m} menit</option>`).join('')}</select>
      <button class="btn ghost" data-act="newpin">Ganti PIN</button>
      ${Cloud.on() ? `<p class="small center">☁️ Tersinkron: ${esc(Cloud.email())}</p><button class="btn ghost" data-act="logout">Keluar akun</button>` : ''}
      <button class="btn ghost" data-act="export">Unduh data (cadangan)</button>
      <button class="btn ghost" data-act="reset">Hapus semua data</button></section>`);
  countTime = false;
}
function screenNewPin() {
  render(`<section class="card center"><h2>Ganti PIN</h2>
    <input id="pin1" class="pin" type="password" inputmode="numeric" maxlength="4" placeholder="PIN baru" autocomplete="off">
    <p id="msg" class="msg"></p><button class="btn" data-act="newpinok">Simpan</button><button class="btn ghost" data-act="parentBack">Batal</button></section>`);
  countTime = false;
}

/* ---------- akun keluarga (Firebase) ---------- */
function screenAuth() {
  cur = null; stopTick();
  render(`<section class="card center">${kiki(100)}<h1>Masuk Keluarga</h1><p>Satu akun untuk semua HP. Progres Baim &amp; Rara tersinkron otomatis.</p>
    <label class="lbl" for="em">Email orang tua</label><input id="em" type="email" autocomplete="username">
    <label class="lbl" for="pw">Kata sandi</label><input id="pw" type="password" autocomplete="current-password">
    <p id="msg" class="msg"></p><button class="btn big" data-act="login">Masuk</button><button class="btn ghost" data-act="register">Buat akun baru</button></section>`);
  countTime = false;
}
async function authDo(fn) {
  const em = $('#em').value.trim(), pw = $('#pw').value;
  if (!em || !pw) { $('#msg').textContent = 'Isi email dan kata sandi'; return; }
  $('#msg').textContent = 'Memproses…';
  try { await fn(em, pw); await afterLogin(); } catch (e) { $('#msg').textContent = Cloud.err(e); }
}
async function afterLogin() {
  const remote = await Cloud.pull();             // undefined = gagal/offline, null = belum ada data
  if (remote && remote.profiles) { db = remote; Store.save(db); }
  else if (remote === null && db && db.profiles) Cloud.push(null);   // unggah data lokal pertama kali
  Cloud.listen(r => {
    if (!db || !db.profiles) { db = r; Store.save(db); return; }
    Object.keys(r.profiles || {}).forEach(id => { if (id !== cur) db.profiles[id] = r.profiles[id]; });
    db.limitMin = r.limitMin; db.pinHash = r.pinHash; Store.save(db);
  });
  if (!db || !db.profiles) screenSetup(); else screenHome();
}

/* ---------- aksi (delegasi klik) ---------- */
const gate = fn => () => { if (isLocked()) screenLock(); else fn(); };
const A = {
  async setupDone() {
    const pin = $('#pin1').value;
    if (!/^\d{4}$/.test(pin)) { $('#msg').textContent = 'PIN harus 4 angka'; return; }
    db = { v: 1, pinHash: await hashPin(pin), limitMin: +$('#limit').value, profiles: {
      baim: newProfile('baim', 'Super Baim', 8, '#2f80ff'),
      rara: newProfile('rara', 'Super Rara', 6, '#ff4f9a') } };
    save(); screenHome();
  },
  home: screenHome,
  login() { authDo((e, p) => Cloud.signIn(e, p)); },
  register() { authDo((e, p) => Cloud.register(e, p)); },
  async logout() { await Cloud.signOut(); screenAuth(); },
  pick(d) { cur = d.id; startTick(); screenHub(); },
  hub() { if (cur) screenHub(); else screenHome(); },
  g_memory: gate(() => memoryStart()),
  g_simon: gate(simonStart),
  g_eng: gate(engStart),
  g_emo: gate(emoStart),
  g_mis: screenMissions,
  g_mis_force: screenMissions,
  memnext: d => gate(() => memoryStart(+d.lv))(),
  flip(d, b) { memoryFlip(+d.i, b); },
  pad(d) { simonPad(+d.i); },
  engpick(d, b) { engPick(d.w, b); },
  emopick(d, b) { emoPick(+d.n, b); },
  emonext: emoNext,
  mis(d) { missionTap(+d.i); },
  parent() { askPin(screenParent); },
  parentBack() { screenParent(); },
  async pinok() {
    const h = await hashPin($('#pin').value);
    if (h === db.pinHash) { const cb = pinCb; pinCb = null; if (cb) cb(); }
    else { $('#msg').textContent = 'PIN salah'; }
  },
  bonus(d) { const p = db.profiles[d.id], k = today(); p.bonus[k] = (p.bonus[k] || 0) + 10; save(); screenParent(); },
  newpin() { screenNewPin(); },
  async newpinok() {
    const pin = $('#pin1').value;
    if (!/^\d{4}$/.test(pin)) { $('#msg').textContent = 'PIN harus 4 angka'; return; }
    db.pinHash = await hashPin(pin); save(); screenParent();
  },
  export() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' }));
    a.download = 'penjaga-bintang-cadangan.json'; document.body.appendChild(a); a.click(); a.remove();
  },
  reset() {
    if (confirm('Hapus SEMUA data (profil, skor, PIN)? Ini tidak bisa dibatalkan.')) {
      try { localStorage.removeItem(KEY); } catch (e) { /* abaikan */ }
      location.reload();
    }
  },
  async install() {
    if (!deferredInstall) return;
    deferredInstall.prompt(); try { await deferredInstall.userChoice; } catch (e) { /* abaikan */ }
    deferredInstall = null; screenHome();
  }
};

app.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const f = A[b.dataset.act];
  if (f) f(b.dataset, b);
});
app.addEventListener('change', e => {
  const t = e.target;
  if (t.matches && t.matches('[data-age]')) {
    const p = db.profiles[t.dataset.age];
    p.age = Math.max(3, Math.min(17, parseInt(t.value, 10) || p.age)); save();
  } else if (t.id === 'lim') { db.limitMin = +t.value; save(); }
});
app.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  const b = $('[data-act="pinok"]') || $('[data-act="login"]') || $('[data-act="setupDone"]') || $('[data-act="newpinok"]');
  if (b && e.target.tagName === 'INPUT') b.click();
});
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); deferredInstall = e; const b = $('[data-act="install"]'); if (b) b.hidden = false; });

/* ---------- mulai ---------- */
(async function boot() {
  if (!Cloud.enabled) return (!db || !db.profiles) ? screenSetup() : screenHome();
  const u = await Cloud.ready();
  if (!u) return screenAuth();
  afterLogin();
})();
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));