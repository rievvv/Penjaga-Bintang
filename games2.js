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

/* ---------- Saklar Lampu 3D: cocokkan warna kabel, saklar, dan lampu ---------- */
const KC = [['Merah', '#ff4d4d'], ['Kuning', '#ffd23f'], ['Hijau', '#3ddc84'], ['Biru', '#4aa3ff']];
let K = null;
function circStart() {
  K = { rs: P().age < 7 ? [1, 2] : [1, 2, 3, 4], i: 0, fails: 0 };
  circRound();
}
function circRound() {
  const n = K.rs[K.i];
  K.n = n; K.cs = shuffle(KC).slice(0, n); K.lamp = shuffle([...Array(n).keys()]);   // K.lamp[j] = warna lampu di posisi j
  K.wire = Array(n).fill(-1); K.on = Array(n).fill(false); K.boom = -1; K.sel = null; K.busy = false; K.done = false;
  K.msg = 'Ketuk bulatan saklar, lalu bulatan lampu untuk memasang kabel.';
  render(shell(`Saklar Lampu (${K.i + 1}/${K.rs.length})`, `<p class="hint">Ada <b>${n} saklar</b>. Sambungkan tiap saklar ke lampu yang <b>warnanya sama</b>, lalu tekan saklarnya!</p>
    <div id="kb" class="kb"></div><p id="km" class="fb"></p><div id="kx"></div>`));
  say2(`Ada ${n} saklar. Sambungkan ke lampu yang warnanya sama, lalu tekan saklar!`);
  circDraw();
}
function circDraw() {
  const rows = K.cs.map((c, i) => {
    const l = K.cs[K.lamp[i]], lit = K.wire.some((w, s) => w === i && K.on[s]);
    const cls = K.boom === i ? 'boom' : lit ? 'lit' : '';
    return `<div class="krow"><div class="ksw" style="--k:${c[1]}"><button class="lever ${K.on[i] ? 'on' : ''}" data-act="ksw" data-i="${i}" aria-label="Saklar ${c[0]}"><i></i></button>
      <button class="plug ${K.sel === 's' + i ? 'sel' : ''}" data-act="term" data-k="s${i}" style="--k:${c[1]}" aria-label="Kabel saklar ${c[0]}"></button></div>
      <div class="kl"><button class="plug ${K.sel === 'l' + i ? 'sel' : ''}" data-act="term" data-k="l${i}" style="--k:${l[1]}" aria-label="Kabel lampu ${l[0]}"></button>
      <div class="bulb ${cls}" style="--k:${l[1]}">${cls === 'boom' ? '💥' : ''}</div></div></div>`;
  }).join('');
  const kb = $('#kb'); kb.innerHTML = '<svg id="kw"></svg>' + rows;
  const br = kb.getBoundingClientRect();
  const pt = k => { const r = kb.querySelector(`[data-k="${k}"]`).getBoundingClientRect(); return [r.left - br.left + r.width / 2, r.top - br.top + r.height / 2]; };
  $('#kw').innerHTML = K.wire.map((j, i) => {
    if (j < 0) return '';
    const a = pt('s' + i), b = pt('l' + j), m = (a[0] + b[0]) / 2, d = `M${a[0]} ${a[1]} C${m} ${a[1]} ${m} ${b[1]} ${b[0]} ${b[1]}`;
    return `<path class="wb" d="${d}"/><path class="wc" d="${d}" style="stroke:${K.cs[i][1]}"/><path class="wh" d="${d}"/>`;
  }).join('');
  $('#km').textContent = K.msg;
  $('#kx').innerHTML = K.boom >= 0 ? '<button class="btn" data-act="ktry">Coba lagi 🔧</button>'
    : K.done ? '<button class="btn big" data-act="knext">Lanjut ▶</button>'
    : '<button class="btn ghost" data-act="kclear">🧹 Lepas semua kabel</button>';
}
function circTerm(k) {
  if (K.busy) return;
  if (K.sel === k) K.sel = null;
  else if (!K.sel || K.sel[0] === k[0]) K.sel = k;
  else {
    const si = +(K.sel[0] === 's' ? K.sel : k).slice(1), lj = +(K.sel[0] === 'l' ? K.sel : k).slice(1);
    K.wire.forEach((w, x) => { if (w === lj) { K.wire[x] = -1; K.on[x] = false; } });
    K.wire[si] = lj; K.on[si] = false; K.sel = null; K.msg = 'Kabel terpasang. Sekarang tekan saklarnya!'; beep(600, .08);
  }
  circDraw();
}
function circSwitch(i) {
  if (K.busy) return;
  if (K.on[i]) { K.on[i] = false; K.msg = 'Saklar dimatikan, lampu padam.'; return circDraw(); }
  const j = K.wire[i];
  if (j < 0) { K.msg = `Saklar ${K.cs[i][0]} belum tersambung ke lampu. Pasang kabel dulu!`; beep(200, .1); return circDraw(); }
  const lamp = K.cs[K.lamp[j]];
  if (K.lamp[j] === i) {
    K.on[i] = true; beep(784, .25); K.msg = `Lampu ${lamp[0]} menyala! ✨`;
    if (K.on.every(Boolean)) {
      K.busy = K.done = true;
      K.msg = K.n === 1 ? 'Hebat! Satu saklar mengendalikan satu lampu lewat satu rangkaian tertutup. 🎉'
        : `Hebat! Tiap saklar punya rangkaiannya sendiri, jadi ${K.n} lampu bisa dinyalakan satu per satu. 🎉`;
    }
  } else {
    K.boom = j; K.busy = true; K.fails++; beep(120, .5);
    K.msg = `DUAR! Kabel ${K.cs[i][0]} masuk ke lampu ${lamp[0]}. Warna berbeda berarti rangkaian berbeda: arus tidak cocok, terjadi korsleting dan lampu meledak.`;
    say2('Duar! Warna kabelnya beda. Coba lagi ya.');
  }
  circDraw();
}
function circEnd() {
  const stars = K.fails === 0 ? 3 : K.fails <= 2 ? 2 : 1;
  reward('saklar', { iq: 3, aq: Math.min(K.fails, 5) + 1, stars });
  result('Semua lampu menyala!', stars, 'Ingat: arus listrik mengalir lewat rangkaian tertutup, dan setiap saklar harus tersambung ke lampunya yang tepat. Salah sambung bisa korsleting. Listrik asli berbahaya, jangan dicoba tanpa orang dewasa.',
    '<button class="btn big" data-act="g_sak">Main lagi</button>');
}
addEventListener('resize', () => { if (K && $('#kb') && !K.done) circDraw(); });

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
  term(d) { circTerm(d.k); },
  ksw(d) { circSwitch(+d.i); },
  kclear() { if (!K.busy) { K.wire.fill(-1); K.on.fill(false); K.sel = null; K.msg = 'Kabel dilepas. Pasang lagi!'; circDraw(); } },
  ktry() { K.wire = K.wire.map(w => w === K.boom ? -1 : w); K.boom = -1; K.busy = false; K.msg = 'Coba lagi! Cocokkan warna kabel dengan warna lampu.'; circDraw(); },
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