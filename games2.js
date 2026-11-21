'use strict';
/* Game & simulasi tambahan. Memakai fungsi/variabel global dari app.js (render, shell, reward, result, A, gate, dll). */
const nbrs = (i, n) => { const r = (i / n) | 0, c = i % n, o = []; if (r) o.push(i - n); if (r < n - 1) o.push(i + n); if (c) o.push(i - 1); if (c < n - 1) o.push(i + 1); return o; };
const say2 = t => { if (autoVoice()) say(t); };

/* ---------- Puzzle geser 3x3 / 4x4 / 5x5 ---------- */
let Z = null;
function puzMenu() {
  render(shell('Puzzle Geser', `<div class="bigemoji">🧩</div><p class="hint">Geser kotak ke tempat kosong sampai angkanya berurutan.</p>
    <div class="opts col">${[[3, 'Mudah'], [4, 'Sedang'], [5, 'Tantangan']].map(([n, t]) => `<button class="opt" data-act="puzgo" data-n="${n}">${n}×${n} • ${t}</button>`).join('')}</div>`));
}
function puzStart(n) {
  const N = n * n, t = Array.from({ length: N }, (_, i) => (i + 1) % N);
  let b = N - 1, prev = -1;
  for (let k = 0; k < N * 10; k++) { const c = nbrs(b, n).filter(x => x !== prev), m = c[rnd(c.length)]; t[b] = t[m]; t[m] = 0; prev = b; b = m; }
  Z = { n, t, moves: 0 };
  render(shell(`Puzzle ${n}×${n}`, `<p class="hint">Urutkan 1 sampai ${N - 1}. Langkah: <b id="mv">0</b></p><div id="pz" class="pz" style="--n:${n}"></div>`));
  puzDraw();
}
function puzDraw() {
  $('#pz').innerHTML = Z.t.map((v, i) => v ? `<button class="pt" data-act="puzmv" data-i="${i}" style="background:hsl(${v * 37 % 360} 70% 62%)">${v}</button>` : '<span class="pt blank"></span>').join('');
  $('#mv').textContent = Z.moves;
}
function puzMove(i) {
  if (!Z) return;
  const b = Z.t.indexOf(0);
  if (!nbrs(b, Z.n).includes(i)) { beep(200, .08); return; }
  Z.t[b] = Z.t[i]; Z.t[i] = 0; Z.moves++; beep(520, .06); puzDraw();
  if (Z.t.every((v, k) => v === (k + 1) % Z.t.length)) { const tk = token; setTimeout(() => { if (tk === token) puzEnd(); }, 400); }
}
function puzEnd() {
  const N = Z.n * Z.n, stars = Z.moves <= N * 4 ? 3 : Z.moves <= N * 8 ? 2 : 1;
  reward('puzzle', { iq: Z.n * 2, aq: 1, stars });
  result('Puzzle selesai!', stars, `Selesai dalam ${Z.moves} langkah. Trik: selesaikan baris paling atas dulu, lalu turun satu per satu. Merencanakan beberapa langkah ke depan melatih berpikir logis.`,
    '<button class="btn big" data-act="g_puz">Puzzle lagi</button>');
}

/* ---------- Saklar Lampu (rangkaian listrik) ---------- */
const TC = { P: [50, 46], N: [50, 174], S1: [120, 174], S2: [210, 174], L1: [225, 118], L2: [285, 118] };
let K = null;
function circStart() {
  const young = P().age < 7;
  K = { rs: shuffle(young ? [3, 3, 3] : [3, 6, 9]), i: 0, fails: 0 };
  circRound();
}
function circRound() {
  K.rating = K.rs[K.i]; K.volt = null; K.wires = []; K.sel = null; K.sw = false; K.state = ''; K.busy = false;
  K.msg = 'Pilih baterai, pasang kabel, lalu tekan saklar!';
  render(shell(`Saklar Lampu (${K.i + 1}/${K.rs.length})`, `<p class="hint">Baca label: lampu ini butuh baterai <b>${K.rating}V</b>.</p>
    <div class="opts" style="grid-template-columns:repeat(4,1fr)">${[1.5, 3, 6, 9].map(v => `<button class="opt" data-act="batt" data-v="${v}">${v}V</button>`).join('')}</div>
    <div id="kv"></div>`));
  say2('Pasang kabel dari baterai ke saklar dan lampu, lalu tekan saklar!');
  circDraw();
}
function circDraw() {
  const lit = K.state === 'lit', dim = K.state === 'dim', boom = K.state === 'boom';
  const wires = K.wires.map(([a, b], i) => `<line x1="${TC[a][0]}" y1="${TC[a][1]}" x2="${TC[b][0]}" y2="${TC[b][1]}" class="wire" data-act="unwire" data-i="${i}"/>`).join('');
  const term = k => `<circle cx="${TC[k][0]}" cy="${TC[k][1]}" r="11" class="term ${K.sel === k ? 'sel' : ''}" data-act="term" data-t="${k}"/>`;
  const tip = K.sw ? TC.S2 : [TC.S2[0] - 8, TC.S2[1] - 40];
  $('#kv').innerHTML = `<svg viewBox="0 0 320 220" class="circ">
    <rect x="25" y="62" width="50" height="96" rx="10" fill="#3a3f5c" stroke="#aab"/><text x="50" y="116" text-anchor="middle" class="ct big">${K.volt ? K.volt + 'V' : '?'}</text>
    <text x="68" y="50" class="ct">+</text><text x="68" y="182" class="ct">−</text>
    <line x1="${TC.S1[0]}" y1="${TC.S1[1]}" x2="${tip[0]}" y2="${tip[1]}" stroke="#ddd" stroke-width="7" stroke-linecap="round"/><text x="165" y="208" text-anchor="middle" class="ct">Saklar</text>
    ${boom ? '<text x="255" y="90" text-anchor="middle" font-size="64">💥</text>' : `<circle cx="255" cy="70" r="32" fill="${lit ? '#ffe34a' : dim ? '#9c8f55' : '#4a4f70'}" stroke="#ccd" stroke-width="3" ${lit ? 'style="filter:drop-shadow(0 0 16px #ffe34a)"' : ''}/><text x="255" y="77" text-anchor="middle" class="ct" fill="${lit ? '#3a2a00' : '#fff'}">${K.rating}V</text>`}
    <text x="255" y="140" text-anchor="middle" class="ct">Lampu</text>
    ${wires}${Object.keys(TC).map(term).join('')}</svg>
    <p class="fb">${esc(K.msg)}</p>
    ${boom ? '<button class="btn" data-act="ktry">Coba lagi 🔧</button>' : lit ? '<button class="btn big" data-act="knext">Lanjut ▶</button>' : `<button class="btn big" data-act="ksw">🔘 ${K.sw ? 'Matikan saklar' : 'Tekan saklar'}</button><p class="small">Ketuk dua titik untuk memasang kabel. Ketuk kabel untuk melepasnya.</p>`}`;
  app.querySelectorAll('[data-act="batt"]').forEach(b => b.classList.toggle('picked', +b.dataset.v === K.volt));
}
function circTerm(t) {
  if (K.busy) return;
  if (!K.sel) K.sel = t;
  else if (K.sel === t) K.sel = null;
  else {
    const a = K.sel, b = t;
    if (!K.wires.some(w => (w[0] === a && w[1] === b) || (w[0] === b && w[1] === a))) K.wires.push([a, b]);
    K.sel = null; beep(600, .08);
  }
  circDraw();
}
function circReach(edges) {
  const adj = {};
  edges.forEach(([a, b]) => { (adj[a] = adj[a] || []).push(b); (adj[b] = adj[b] || []).push(a); });
  const seen = new Set(['P']), q = ['P'];
  while (q.length) { const x = q.pop(); (adj[x] || []).forEach(y => { if (!seen.has(y)) { seen.add(y); q.push(y); } }); }
  return seen.has('N');
}
function circSwitch() {
  if (K.busy) return;
  if (K.sw) { K.sw = false; K.state = ''; K.msg = 'Saklar mati. Arus berhenti mengalir.'; return circDraw(); }
  if (!K.volt) { K.msg = 'Pilih baterai dulu ya 🔋'; return circDraw(); }
  const base = K.wires.concat([['S1', 'S2']]);
  K.sw = true;
  if (circReach(base)) {
    K.state = 'boom'; K.busy = true; K.fails++;
    K.msg = 'KORSLETING! Arus mengambil jalan pintas dari + ke − tanpa melewati lampu, kabel jadi panas dan meledak. Arus harus melewati lampu.';
  } else if (!circReach(base.concat([['L1', 'L2']]))) {
    K.sw = false;
    K.msg = 'Lampu belum menyala. Arus hanya mengalir kalau rangkaian tertutup: kutub + → saklar → lampu → kutub −.';
  } else if (K.volt > K.rating) {
    K.state = 'boom'; K.busy = true; K.fails++;
    K.msg = `Baterai ${K.volt}V terlalu kuat untuk lampu ${K.rating}V. Lampu menerima terlalu banyak arus dan meledak! Cocokkan tegangan dengan label lampu.`;
  } else if (K.volt < K.rating) {
    K.state = 'dim'; K.msg = `Lampu redup karena baterai ${K.volt}V kurang kuat. Ganti baterai yang sesuai label lampu.`;
  } else {
    K.state = 'lit'; K.busy = true; K.sel = null;
    K.msg = 'Menyala! Rangkaian tertutup dan tegangan baterai cocok dengan lampu. 💡';
  }
  if (K.state === 'boom') { beep(120, .5); say2('Duar! Coba lagi ya.'); } else if (K.state === 'lit') { beep(784, .3); }
  circDraw();
}
function circEnd() {
  const stars = K.fails === 0 ? 3 : K.fails <= 3 ? 2 : 1;
  reward('saklar', { iq: 3, aq: Math.min(K.fails, 5) + 1, stars });
  result('Semua lampu menyala!', stars, 'Ingat tiga aturan listrik: (1) rangkaian harus tertutup, (2) tegangan harus cocok dengan alat, (3) jangan buat jalan pintas (korsleting). Listrik asli berbahaya, jangan dicoba tanpa orang dewasa.',
    '<button class="btn big" data-act="g_sak">Main lagi</button>');
}

/* ---------- Planetarium mini ---------- */
const SUN = ['Matahari', '#ffd54a', 'Bintang terdekat dengan Bumi, bukan planet. Cahaya dan panasnya membuat kita bisa hidup.'];
const PLN = [
  ['Merkurius', '#b5b5b5', 3, 28, 5, 'Planet terkecil dan terdekat dengan Matahari. Satu tahunnya hanya 88 hari Bumi!'],
  ['Venus', '#e8c27a', 5, 44, 8, 'Planet terpanas, sekitar 465°C, diselimuti awan tebal. Venus berputar terbalik.'],
  ['Bumi', '#4aa3ff', 5, 60, 11, 'Rumah kita! Satu-satunya planet yang kita tahu ada kehidupan. Sekitar 70% permukaannya air.'],
  ['Mars', '#ff6b4a', 4, 76, 16, 'Planet merah karena tanahnya berkarat. Punya gunung tertinggi di tata surya, Olympus Mons.'],
  ['Jupiter', '#e0a870', 11, 100, 26, 'Planet terbesar. Badai raksasanya, Bintik Merah, sudah terlihat lebih dari 150 tahun.'],
  ['Saturnus', '#f0d98a', 9, 122, 34, 'Punya cincin indah dari es dan batu. Saturnus sangat ringan, kerapatannya lebih kecil dari air!'],
  ['Uranus', '#7fe0e6', 6, 140, 44, 'Berputar miring seperti bola menggelinding. Sangat dingin.'],
  ['Neptunus', '#4a6bff', 6, 154, 52, 'Planet terjauh dengan angin sangat kencang. Satu tahunnya sama dengan 165 tahun Bumi.']];
let PL = null;
function planStart() {
  PL = { seen: new Set(), given: false };
  const orbits = PLN.map(([n, c, s, r, t], i) => `<circle cx="160" cy="160" r="${r}" fill="none" stroke="#fff3"/>
    <g class="orb" style="animation-duration:${t}s"><circle cx="${160 + r}" cy="160" r="${s}" fill="${c}"/>${i === 5 ? `<ellipse cx="${160 + r}" cy="160" rx="${s + 6}" ry="2.5" fill="none" stroke="${c}"/>` : ''}<circle cx="${160 + r}" cy="160" r="${s + 9}" fill="transparent" data-act="plansel" data-i="${i}"/></g>`).join('');
  render(shell('Planetarium Mini', `<p class="hint">Ketuk planet atau namanya untuk mengenalnya!</p>
    <svg viewBox="0 0 320 320" class="solar" id="solar"><circle cx="160" cy="160" r="16" fill="#ffd54a" style="filter:drop-shadow(0 0 12px #ffb300)"/>
    <circle cx="160" cy="160" r="26" fill="transparent" data-act="plansel" data-i="-1"/>${orbits}</svg>
    <div class="chips"><button class="chip" data-act="plansel" data-i="-1"><i style="background:${SUN[1]}"></i>${SUN[0]}</button>${PLN.map((p, i) => `<button class="chip" data-act="plansel" data-i="${i}"><i style="background:${p[1]}"></i>${p[0]}</button>`).join('')}</div>
    <button class="btn ghost" data-act="planpause">⏸ Jeda / ▶ Putar</button>
    <div class="card" id="pi"><p>Pilih benda langit di atas 🔭</p></div>`));
}
function planSel(i) {
  const o = i < 0 ? SUN : PLN[i]; PL.seen.add(i);
  const order = i < 0 ? 'Pusat tata surya' : `Planet ke-${i + 1} dari Matahari`;
  let extra = '';
  if (PL.seen.size >= 4 && !PL.given) { PL.given = true; reward('planetarium', { iq: 4, stars: 2 }); extra = '<p class="good">⭐ +2 bintang! Kamu sudah mengenal 4 benda langit.</p>'; }
  $('#pi').innerHTML = `<h3 style="color:${o[1]}">${o[0]}</h3><p class="small">${order}</p><p>${esc(o[i < 0 ? 2 : 5])}</p>${extra}`;
  app.querySelectorAll('.chip').forEach((c, k) => c.classList.toggle('on', k === i + 1));
  say2(o[i < 0 ? 2 : 5]);
}

/* ---------- Simulasi hujan (siklus air) ---------- */
let R = null;
const RAIN = [
  ['☀️ Panaskan air laut', 'Penguapan: panas Matahari mengubah air laut menjadi uap air yang naik ke langit.'],
  ['☁️ Dinginkan uap jadi awan', 'Pengembunan: di tempat tinggi udara dingin, uap air berubah menjadi titik air kecil dan membentuk awan.'],
  ['🌧️ Turunkan hujan', 'Hujan: awan menjadi berat, titik air jatuh ke bumi, mengalir ke sungai, lalu kembali ke laut. Siklus berulang!']];
function rainStart() { R = { s: 0 }; render(shell('Simulasi Hujan', '<div id="rs"></div>')); rainDraw(); }
function rainDraw() {
  const s = R.s;
  $('#rs').innerHTML = `<div class="scene s${s}"><span class="sun">☀️</span><span class="cloud">☁️</span>
    ${[1, 2, 3, 4].map(i => `<i class="vap v${i}">💨</i>`).join('')}
    ${Array.from({ length: 9 }, (_, i) => `<i class="drop" style="left:${14 + i * 9}%;animation-delay:${(i % 3) * .3}s">💧</i>`).join('')}<div class="sea"></div></div>
    <p class="story">${s === 0 ? 'Air laut yang tenang. Ayo mulai siklus air!' : esc(RAIN[s - 1][1])}</p>
    <button class="btn big" data-act="rainnext">${s < 3 ? RAIN[s][0] : 'Selesai 🎉'}</button>`;
}
function rainNext() {
  if (R.s >= 3) {
    reward('hujan', { iq: 3, stars: 3 });
    return result('Siklus air selesai!', 3, 'Air tidak pernah hilang, hanya berputar: menguap → mengembun → hujan. Hemat air ya, karena air bersih itu berharga!', '<button class="btn big" data-act="g_rain">Main lagi</button>');
  }
  R.s++; beep(300 + R.s * 150, .2); rainDraw(); say2(RAIN[R.s - 1][1]);
}

/* ---------- Menanam bibit ---------- */
let T = null;
function tanamStart() { T = { soil: 0, seed: 0, w: 0, s: 0 }; render(shell('Menanam Bibit', '<div id="ts"></div>')); tanamDraw(); }
function tanamDraw() {
  const g = T.seed ? Math.min(T.w, T.s, 3) : 0;
  const plant = !T.soil ? '🪴' : !T.seed ? '🟫' : ['🌰', '🌱', '🌿', '🌻'][g];
  const msg = !T.soil ? 'Mulai dengan mengisi pot dengan tanah yang subur.' : !T.seed ? 'Sekarang tanam bibitnya.'
    : g >= 3 ? 'Hore! Tanamanmu berbunga. Tumbuhan membuat makanan dari air, cahaya matahari, dan udara. 🌻'
    : T.w - T.s >= 3 ? 'Terlalu banyak air! Akar bisa busuk. Tumbuhan juga butuh sinar matahari.'
    : T.s - T.w >= 3 ? 'Tanahnya kering! Tumbuhan butuh air.' : 'Tumbuhan butuh air dan matahari secara seimbang. Terus rawat ya!';
  const b = (a, t, off) => `<button class="opt" data-act="${a}" ${off ? 'disabled' : ''}>${t}</button>`;
  $('#ts').innerHTML = `<div class="bigemoji" style="font-size:${4 + g}rem">${plant}</div><p class="hint">💧 ${T.w} &nbsp; ☀️ ${T.s}</p><p class="story">${esc(msg)}</p>
    <div class="opts">${b('t_soil', '🟫 Isi tanah', T.soil)}${b('t_seed', '🌰 Tanam biji', !T.soil || T.seed)}${b('t_water', '💧 Siram', !T.seed || g >= 3)}${b('t_sun', '☀️ Beri matahari', !T.seed || g >= 3)}</div>
    ${g >= 3 ? '<button class="btn big" data-act="t_done">Selesai 🎉</button>' : ''}`;
  if (T.seed) say2(msg);
}
function tanamDone() {
  reward('tanam', { iq: 2, eq: 1, aq: 2, stars: 3 });
  result('Tanamanmu tumbuh!', 3, 'Merawat makhluk hidup butuh sabar dan konsisten: tanah, air, dan matahari.', '<button class="btn big" data-act="g_tanam">Tanam lagi</button>');
}

/* ---------- Buang sampah pintar ---------- */
const BINS = {
  org: ['🍃', 'Organik', '#3ddc84', 'Organik berasal dari makhluk hidup dan bisa membusuk, jadi bisa dijadikan kompos.'],
  anorg: ['🧴', 'Anorganik', '#ffd23f', 'Anorganik sulit membusuk (plastik, kaleng, kaca) tetapi bisa didaur ulang.'],
  kertas: ['📰', 'Kertas', '#4aa3ff', 'Kertas bisa didaur ulang menjadi kertas baru. Simpan dalam keadaan kering.'],
  medis: ['🏥', 'Medis & B3', '#ff5b5b', 'Sampah medis dan B3 (bahan berbahaya) bisa menular atau beracun. Jangan disentuh langsung, minta bantuan orang dewasa dan buang di tempat khusus.']
};
const TRASH = [['🍌', 'kulit pisang', 'org'], ['🍎', 'sisa apel', 'org'], ['🥬', 'sisa sayur', 'org'], ['🍂', 'daun kering', 'org'], ['🥚', 'cangkang telur', 'org'],
  ['🥤', 'botol plastik', 'anorg'], ['🥫', 'kaleng bekas', 'anorg'], ['🛍️', 'kantong plastik', 'anorg'], ['🍾', 'botol kaca', 'anorg'],
  ['📰', 'koran bekas', 'kertas'], ['📦', 'kardus', 'kertas'], ['📄', 'kertas bekas', 'kertas'],
  ['😷', 'masker bekas', 'medis'], ['💉', 'jarum suntik', 'medis'], ['🩹', 'perban kotor', 'medis'], ['🔋', 'baterai bekas', 'medis'], ['💊', 'obat kedaluwarsa', 'medis']];
let W = null;
function trashStart() {
  const young = P().age < 7, bins = young ? ['org', 'anorg', 'medis'] : Object.keys(BINS);
  W = { bins, q: shuffle(TRASH.filter(t => bins.includes(t[2]))).slice(0, young ? 6 : 8), i: 0, ok: 0, wrong: 0, first: true, done: false };
  trashQ();
}
function trashQ() {
  const t = W.q[W.i]; W.first = true; W.done = false;
  render(shell(`Buang Sampah (${W.i + 1}/${W.q.length})`, `<div class="bigemoji">${t[0]}</div><p class="q">Ini <b>${t[1]}</b>. Buang ke tempat sampah mana?</p>
    <div class="opts">${W.bins.map(k => `<button class="bin" style="--bc:${BINS[k][2]}" data-act="trpick" data-b="${k}">${BINS[k][0]}<b>${BINS[k][1]}</b></button>`).join('')}</div><p id="fb" class="fb"></p>`));
  W.tk = token; say2(`Ini ${t[1]}. Buang ke tempat sampah mana?`);
}
function trashPick(b, el) {
  if (!W || W.done || el.disabled) return;
  const t = W.q[W.i];
  if (b === t[2]) {
    if (W.first) W.ok++;
    W.done = true; el.classList.add('right'); beep(784, .2);
    $('#fb').textContent = '✅ ' + BINS[b][3]; say2(BINS[b][3]);
    const tk = W.tk;
    setTimeout(() => { if (!W || W.tk !== tk || tk !== token) return; W.i++; if (W.i >= W.q.length) trashEnd(); else trashQ(); }, 2800);
  } else {
    W.first = false; W.wrong++; el.disabled = true; el.classList.add('wrong'); beep(200, .15);
    $('#fb').textContent = `Belum tepat. ${t[1]} bukan sampah ${BINS[b][1]}. Coba lagi 💪`;
  }
}
function trashEnd() {
  const acc = W.ok / W.q.length, stars = acc >= .8 ? 3 : acc >= .5 ? 2 : 1;
  reward('sampah', { iq: 1, eq: W.ok, aq: Math.min(W.wrong, 4), stars });
  result('Bumi lebih bersih!', stars, `Benar di percobaan pertama: ${W.ok} dari ${W.q.length}. Memilah sampah membantu daur ulang dan menjaga kesehatan.`, '<button class="btn big" data-act="g_trash">Main lagi</button>');
}

/* ---------- Tebak Kata Inggris: fase belajar dulu ---------- */
function engLearn() {
  E.li = E.li || 0;
  const w = E.qs[E.li], last = E.li === E.qs.length - 1;
  render(shell(`Belajar Kata (${E.li + 1}/${E.qs.length})`, `<p class="hint">Kenali dulu kata barunya. Setelah ini ada soalnya!</p>
    <div class="bigemoji">${w.e}</div><div class="learn"><b>${w.en}</b><span>${esc(w.id)}</span></div>
    <button class="btn ghost" data-act="engsay">🔊 Dengarkan lagi</button>
    <button class="btn big" data-act="englnext">${last ? 'Mulai soal 🎯' : 'Kata berikutnya ▶'}</button>`));
  setTimeout(() => say(w.en, 'en-US'), 300);
}

/* ---------- daftar aksi ---------- */
Object.assign(A, {
  g_puz: gate(puzMenu), puzgo: d => puzStart(+d.n), puzmv: d => puzMove(+d.i),
  g_sak: gate(circStart),
  batt(d) { if (!K || K.busy) return; K.volt = +d.v; K.sw = false; K.state = ''; K.msg = `Baterai ${K.volt}V dipilih. Sambungkan kabel!`; circDraw(); },
  term(d) { circTerm(d.t); },
  unwire(d) { if (K.busy) return; K.wires.splice(+d.i, 1); K.sw = false; K.state = ''; circDraw(); },
  ksw: circSwitch,
  ktry() { circRound(); },
  knext() { K.i++; if (K.i >= K.rs.length) circEnd(); else circRound(); },
  g_plan: gate(planStart),
  plansel(d) { planSel(+d.i); },
  planpause() { $('#solar').classList.toggle('paused'); },
  g_rain: gate(rainStart), rainnext: rainNext,
  g_tanam: gate(tanamStart),
  t_soil() { T.soil = 1; beep(300, .1); tanamDraw(); },
  t_seed() { T.seed = 1; beep(400, .1); tanamDraw(); },
  t_water() { T.w++; beep(500, .1); tanamDraw(); },
  t_sun() { T.s++; beep(600, .1); tanamDraw(); },
  t_done: tanamDone,
  g_trash: gate(trashStart), trpick(d, b) { trashPick(d.b, b); },
  engsay() { say(E.qs[E.li].en, 'en-US'); },
  englnext() { if (E.li >= E.qs.length - 1) { E.li = 0; engQ(); } else { E.li++; engLearn(); } }
});
