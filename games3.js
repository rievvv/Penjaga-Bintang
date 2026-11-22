'use strict';
/* Game Otak (5 level per game): Memori Bintang, Dimana Aku?, Labirin, Puzzle Geser, Pola Bintang.
   Dimuat setelah games2.js dan sebelum portal.js. Memakai render, shell, reward, result, A, gate, P, token, dll dari app.js.
   Aturan umum: level 1 terbuka, menang di level N membuka level N+1, bintang yang didapat = nomor level. */
const lvOf = k => Math.min(5, (P().lv && P().lv[k]) || 1);
const LV = {};   // LV[kunci](level) memulai game pada level itu

function lvMenu(k, title, emoji, intro, descs) {
  const open = lvOf(k);
  render(shell(title, `<div class="bigemoji">${emoji}</div><p class="hint">${intro}</p>
    <div class="opts col">${descs.map((t, i) => `<button class="opt wide" data-act="lvgo" data-g="${k}" data-l="${i + 1}" ${i + 1 > open ? 'disabled' : ''}>${i + 1 > open ? '🔒' : '⭐'.repeat(i + 1)} <b>Level ${i + 1}</b><br><small>${t}</small></button>`).join('')}</div>`));
}
function lvWin(k, L, title, note, iq, aq) {
  const p = P(); p.lv = p.lv || {};
  p.lv[k] = Math.max(lvOf(k), Math.min(5, L + 1));
  reward(k, { iq, aq, stars: L });
  result(title, L, note + ` Kamu dapat ${L} bintang!`,
    `${L < 5 ? `<button class="btn big" data-act="lvgo" data-g="${k}" data-l="${L + 1}">Level ${L + 1} ▶</button>` : ''}
     <button class="btn ghost" data-act="lvgo" data-g="${k}" data-l="${L}">Main level ${L} lagi</button>
     <button class="btn ghost" data-act="g_${k}">Pilih level</button>`);
}
const say3 = t => { if (autoVoice()) say(t); };

/* ================= 1. MEMORI BINTANG ================= */
const MCOL = [['Merah', '#ff4d4d'], ['Oranye', '#ff9f1c'], ['Kuning', '#ffd23f'], ['Hijau', '#3ddc84'], ['Biru', '#2f80ff'], ['Ungu', '#8a4fe0'],
  ['Merah muda', '#ff8fc0'], ['Cokelat', '#8a5a2b'], ['Abu-abu', '#9aa0b4'], ['Hitam', '#222'], ['Putih', '#fff'], ['Toska', '#17c3b2']];
const MICO = ['🚀', '🌙', '🪐', '☄️', '👽', '🛸', '🌍', '🔭', '🐱', '🦊', '🐼', '🐸', '🦁', '🐘', '🦋', '🍎'];
const MLET = [...'ABCDEFGHJKMNPRSTUVWXYZ'];
const MDEF = [null, { rows: 5, kind: 'c', t: 'Cari warna yang sama!' }, { rows: 5, kind: 'i', t: 'Cari gambar yang sama!' }, { rows: 7, kind: 'n', t: 'Cari angka yang sama!' },
  { rows: 8, kind: 'l', t: 'Cari huruf yang sama!' }, { rows: 10, kind: 'm', t: 'Cari warna, gambar, angka, dan huruf yang sama!' }];
let M3 = null;
const mFace = c => c.t === 'c' ? `<i class="sw" style="background:${c.v[1]}"></i>` : c.t === 'i' ? c.v : esc(c.v);
function memStart(L) {
  const d = MDEF[L], total = 5 * d.rows, pairs = total >> 1;
  const pool = {
    c: () => shuffle(MCOL).map(v => ({ t: 'c', v })), i: () => shuffle(MICO).map(v => ({ t: 'i', v })),
    n: () => shuffle(Array.from({ length: 20 }, (_, i) => i + 1)).map(v => ({ t: 'n', v })), l: () => shuffle(MLET).map(v => ({ t: 'l', v }))
  };
  let items = d.kind === 'm' ? [...pool.c().slice(0, 7), ...pool.i().slice(0, 6), ...pool.n().slice(0, 6), ...pool.l().slice(0, 6)] : pool[d.kind]().slice(0, pairs);
  items = items.slice(0, pairs);
  const cards = shuffle(items.concat(items));
  const joker = total % 2 ? total >> 1 : -1;      // kotak ganjil: bintang bonus di tengah
  if (joker >= 0) cards.splice(joker, 0, null);
  render(shell(`Memori Bintang • Level ${L}`, `<p class="hint">${d.t}</p>
    <div class="mem dense" style="--cols:5">${cards.map((c, i) => c ? `<button class="mcard" data-act="m3flip" data-i="${i}" aria-label="kartu"><span class="front">❔</span><span class="back">${mFace(c)}</span></button>` : '<span class="mcard done joker">⭐</span>').join('')}</div>
    <p class="hint">Pasangan: <b id="mp">0</b>/${pairs} • Langkah: <b id="mv">0</b></p>`));
  M3 = { L, cards, pairs, open: [], done: 0, moves: 0, busy: false, tk: token };
  say3(d.t);
}
const mKey = c => c.t + (c.t === 'c' ? c.v[0] : c.v);
function memFlip(i, el) {
  const m = M3; if (!m || m.busy || el.classList.contains('open') || el.classList.contains('done')) return;
  el.classList.add('open'); beep(440 + (i % 6) * 60, .1); m.open.push(i);
  if (m.open.length < 2) return;
  m.moves++; $('#mv').textContent = m.moves;
  const [a, b] = m.open, els = app.querySelectorAll('.mcard');
  if (mKey(m.cards[a]) === mKey(m.cards[b])) {
    els[a].classList.replace('open', 'done'); els[b].classList.replace('open', 'done');
    m.open = []; m.done++; $('#mp').textContent = m.done; beep(784, .2);
    if (m.done === m.pairs) setTimeout(() => { if (M3 === m && m.tk === token) lvWin('memory', m.L, 'Semua pasangan ketemu!', `Selesai dalam ${m.moves} langkah.`, 2 + m.L, 1); }, 500);
  } else {
    m.busy = true;
    setTimeout(() => { if (m.tk !== token) return; els[a].classList.remove('open'); els[b].classList.remove('open'); m.open = []; m.busy = false; }, 800);
  }
}
LV.memory = memStart;

/* ================= 2. DIMANA AKU? (tempurung) ================= */
const SEEDS = [['Merah', '#ff4d4d'], ['Biru', '#2f80ff'], ['Hijau', '#3ddc84'], ['Kuning', '#ffd23f']];
//        tempurung, biji, jumlah warna yang dicari, jumlah putaran acak, durasi geser (ms)
const WDEF = [null, { cups: 3, seeds: 1, find: 1, swaps: 6, ms: 700 }, { cups: 3, seeds: 2, find: 1, swaps: 8, ms: 600 }, { cups: 4, seeds: 2, find: 1, swaps: 10, ms: 520 },
  { cups: 4, seeds: 3, find: 1, swaps: 12, ms: 450 }, { cups: 5, seeds: 4, find: 2, swaps: 14, ms: 400 }];
let H3 = null;
async function whStart(L) {
  const d = WDEF[L], n = d.cups, cols = d.seeds === 1 ? [['emas', '#ffc400']] : shuffle(SEEDS).slice(0, d.seeds);
  const cupsWith = shuffle([...Array(n).keys()]).slice(0, d.seeds);        // cup -> indeks biji
  const seed = Array(n).fill(null); cupsWith.forEach((c, k) => { seed[c] = cols[k]; });
  const targets = d.seeds === 1 ? [cols[0]] : shuffle(cols).slice(0, d.find);
  const name = d.seeds === 1 ? 'biji' : 'biji ' + targets.map(t => t[0].toLowerCase()).join(' dan ');
  H3 = { L, d, n, seed, targets, order: [...Array(n).keys()], picked: [], fails: 0, state: 'show', tk: 0 };
  render(shell(`Dimana Aku? • Level ${L}`, `<p class="hint" id="wh"></p>
    <div class="cups" id="cups" style="--d:${d.ms}ms">${seed.map((s, c) => `<div class="cup" id="cp${c}" style="left:${c * 100 / n}%;width:${100 / n}%">${s ? `<i class="seed" style="--k:${s[1]}"></i>` : ''}<button class="shell" data-act="whpick" data-c="${c}" aria-label="tempurung"></button></div>`).join('')}</div>
    <div id="wx"></div>`));
  H3.tk = token; const tk = token;
  const wh = $('#wh'), cups = [...app.querySelectorAll('.cup')];
  wh.textContent = d.seeds === 1 ? 'Lihat dulu di mana bijinya!' : 'Lihat dulu semua bijinya!'; say3(wh.textContent);
  await sleep(500); if (tk !== token) return;
  cups.forEach(c => c.classList.add('up')); await sleep(1800); if (tk !== token) return;
  wh.innerHTML = `Ingat: cari <b>${name}</b>!` + (d.seeds > 1 ? ' ' + targets.map(t => `<i class="dot" style="background:${t[1]}"></i>`).join('') : '');
  say3(`Cari ${name}!`); await sleep(1100); if (tk !== token) return;
  cups.forEach(c => c.classList.remove('up')); await sleep(600);
  for (let k = 0; k < d.swaps; k++) {
    if (tk !== token) return;
    const a = rnd(n); let b = rnd(n - 1); if (b >= a) b++;
    const ca = H3.order[a], cb = H3.order[b]; H3.order[a] = cb; H3.order[b] = ca;
    const ea = $('#cp' + ca), eb = $('#cp' + cb);
    ea.style.transform = 'translateY(-26px)'; eb.style.transform = 'translateY(26px)';
    ea.style.left = b * 100 / n + '%'; eb.style.left = a * 100 / n + '%'; beep(300 + k * 20, .06);
    await sleep(d.ms / 2); if (tk !== token) return; ea.style.transform = eb.style.transform = ''; await sleep(d.ms / 2 + 120);
  }
  if (tk !== token) return;
  H3.state = 'pick';
  wh.innerHTML = d.find > 1 ? `Di mana <b>${targets.map(t => t[0].toLowerCase()).join(' dan ')}</b>? Pilih 2 tempurung.` : `Di mana <b>${name}</b>? Pilih satu tempurung!`;
  say3(wh.textContent);
}
function whPick(c) {
  const h = H3; if (!h || h.state !== 'pick' || h.picked.includes(c)) return;
  const el = $('#cp' + c); el.classList.add('up'); h.picked.push(c); beep(500, .1);
  const s = h.seed[c], ok = s && h.targets.includes(s) && h.seed.filter((x, i) => h.picked.includes(i) && x === s).length === 1;
  if (!ok) {
    h.state = 'end'; h.fails++; beep(200, .25);
    app.querySelectorAll('.cup').forEach(e => e.classList.add('up'));
    $('#wh').textContent = s ? 'Itu biji yang lain. Ini tempat semua biji tadi!' : 'Tempurung itu kosong. Ini tempat semua biji tadi!';
    $('#wx').innerHTML = `<button class="btn big" data-act="lvgo" data-g="where" data-l="${h.L}">Coba lagi 💪</button><button class="btn ghost" data-act="g_where">Pilih level</button>`;
    return;
  }
  beep(784, .2);
  const got = h.picked.filter(i => h.targets.includes(h.seed[i])).length;
  if (got < h.targets.length) { $('#wh').textContent = 'Benar! Satu lagi, pilih tempurung berikutnya.'; return; }
  h.state = 'end'; app.querySelectorAll('.cup').forEach(e => e.classList.add('up'));
  const tk = h.tk; setTimeout(() => { if (tk === token) lvWin('where', h.L, 'Tebakanmu benar!', 'Matamu tajam mengikuti tempurung yang bergerak.', 2 + h.L, Math.min(h.fails, 3) + 1); }, 1400);
}
LV.where = whStart;

/* ================= 3. LABIRIN ================= */
const QZ = [
  ['Hewan apa yang lehernya panjang?', ['Jerapah', 'Kelinci', 'Kura-kura'], 0], ['Aku hewan besar, hidungku panjang. Siapa aku?', ['Singa', 'Gajah', 'Kucing'], 1],
  ['Hewan apa yang bisa terbang dan punya sayap?', ['Ikan', 'Sapi', 'Burung'], 2], ['Aku hewan kecil yang suka makan keju. Siapa aku?', ['Tikus', 'Kuda', 'Bebek'], 0],
  ['Buah apa yang kuning dan panjang?', ['Apel', 'Pisang', 'Jeruk'], 1], ['Benda apa yang bersinar di langit malam?', ['Pelangi', 'Awan', 'Bulan'], 2],
  ['Hewan apa yang hidup di laut dan punya sirip?', ['Ikan', 'Ayam', 'Kambing'], 0], ['Aku punya belang hitam putih seperti baju. Siapa aku?', ['Zebra', 'Kerbau', 'Domba'], 0],
  ['Merah dicampur kuning menjadi warna apa?', ['Hijau', 'Ungu', 'Oranye'], 2], ['Hewan apa yang suka melompat dan punya kantung di perut?', ['Kanguru', 'Bebek', 'Kura-kura'], 0],
  ['Benda apa yang kita pakai untuk melihat waktu?', ['Sendok', 'Jam', 'Sisir'], 1], ['Aku penghasil madu, dan punya sengat. Siapa aku?', ['Lebah', 'Semut', 'Kupu-kupu'], 0],
  ['Ada berapa jumlah hari dalam seminggu?', ['Lima', 'Tujuh', 'Sepuluh'], 1], ['Hewan apa yang mengeong?', ['Kucing', 'Anjing', 'Sapi'], 0]
];
const MZD = [null, { s: 'm', star: 0, q: 0 }, { s: 'm', star: 1, q: 0 }, { s: 'h', star: 0, q: 0 }, { s: 'h', star: 2, q: 0 }, { s: 'h', star: 0, q: 3 }];
let Z3 = null;
const mzId = (r, c, n) => r * n + c;
function mzGen(n) {
  const open = new Set(), seen = new Set([0]), st = [0], key = (a, b) => a < b ? a + '-' + b : b + '-' + a;
  const nb = i => { const r = (i / n) | 0, c = i % n, o = []; if (r) o.push(i - n); if (r < n - 1) o.push(i + n); if (c) o.push(i - 1); if (c < n - 1) o.push(i + 1); return o; };
  while (st.length) {
    const i = st[st.length - 1], f = shuffle(nb(i)).filter(x => !seen.has(x));
    if (!f.length) { st.pop(); continue; }
    open.add(key(i, f[0])); seen.add(f[0]); st.push(f[0]);
  }
  const can = (a, b) => open.has(key(a, b));
  // jalur penyelesaian (unik) dari 0 ke n*n-1 lewat BFS
  const goal = n * n - 1, par = { 0: -1 }, qu = [0];
  for (let h = 0; h < qu.length; h++) { for (const x of nb(qu[h])) if (par[x] === undefined && can(qu[h], x)) { par[x] = qu[h]; qu.push(x); } }
  const sol = new Set(); for (let x = goal; x !== -1; x = par[x]) sol.add(x);
  // jarak tiap sel dari jalur utama (cabang buntu terjauh dipakai untuk bintang/titik tanya)
  const dist = {}, q2 = [...sol]; q2.forEach(x => { dist[x] = 0; });
  for (let h = 0; h < q2.length; h++) for (const x of nb(q2[h])) if (dist[x] === undefined && can(q2[h], x)) { dist[x] = dist[q2[h]] + 1; q2.push(x); }
  return { n, can, nb, sol, dist, goal };
}
function mzPlace(m, k) {
  const cand = Object.keys(m.dist).map(Number).filter(x => !m.sol.has(x)).sort((a, b) => m.dist[b] - m.dist[a] || rnd(3) - 1), pick = [];
  const far = (a, b) => Math.abs(((a / m.n) | 0) - ((b / m.n) | 0)) + Math.abs(a % m.n - b % m.n) >= 3;
  for (const x of cand) { if (pick.length >= k) break; if (pick.every(y => far(x, y))) pick.push(x); }
  for (const x of cand) { if (pick.length >= k) break; if (!pick.includes(x)) pick.push(x); }
  return pick;
}
function mzStart(L) {
  const d = MZD[L], young = P().age < 7, n = d.s === 'm' ? (young ? 6 : 7) : (young ? 8 : 10), m = mzGen(n);
  const items = mzPlace(m, d.star + d.q), qs = shuffle(QZ).slice(0, d.q);
  Z3 = { L, d, m, n, path: [0], items: items.map((c, k) => ({ c, kind: k < d.star ? 's' : 'q', q: qs[k - d.star], done: false })), drag: false, last: null, quiz: null, fails: 0, tk: token, msg: '' };
  const goal = d.star ? `Ambil ⭐ dulu, lalu ke 🏁` : d.q ? 'Lewati 3 ❓ dan jawab soalnya, lalu ke 🏁' : 'Tarik garis dari 🚀 sampai 🏁';
  render(shell(`Labirin • Level ${L}`, `<p class="hint" id="mh">${goal}</p><div class="mzw"><svg id="mz" class="mz" viewBox="-.1 -.1 ${n + .2} ${n + .2}"></svg><div id="qzb"></div></div>
    <p class="fb" id="mm"></p><button class="btn ghost" data-act="mzreset">🔄 Ulangi garis</button>`));
  Z3.tk = token; mzDraw(); say3(goal.replace(/[⭐🏁❓🚀]/g, ''));
}
function mzDraw() {
  const z = Z3, n = z.n, m = z.m, cx = i => (i % n) + .5, cy = i => ((i / n) | 0) + .5;
  let w = '';
  for (let i = 0; i < n * n; i++) {
    const r = (i / n) | 0, c = i % n;
    if (c < n - 1 && !m.can(i, i + 1)) w += `<line x1="${c + 1}" y1="${r}" x2="${c + 1}" y2="${r + 1}"/>`;
    if (r < n - 1 && !m.can(i, i + n)) w += `<line x1="${c}" y1="${r + 1}" x2="${c + 1}" y2="${r + 1}"/>`;
  }
  const it = z.items.map(o => `<text x="${cx(o.c)}" y="${cy(o.c) + .06}" class="mzi ${o.done ? 'got' : ''}">${o.kind === 's' ? '⭐' : '❓'}</text>`).join('');
  z.pts = z.path.map(i => cx(i) + ',' + cy(i)).join(' ');
  $('#mz').innerHTML = `<rect x="0" y="0" width="${n}" height="${n}" rx=".15" class="mzb"/><g class="mzw2" stroke-width=".09" stroke-linecap="round">${w}</g>
    <rect x="0" y="0" width="${n}" height="${n}" rx=".15" fill="none" class="mzo" stroke-width=".14"/>
    <polyline points="${z.pts}" class="mzp"/>${it}<text x=".5" y=".56" class="mzi">🚀</text><text x="${n - .5}" y="${n - .44}" class="mzi">🏁</text>
    <circle cx="${cx(z.path[z.path.length - 1])}" cy="${cy(z.path[z.path.length - 1])}" r=".2" class="mzh"/>`;
}
function mzCell(px, py) {
  const r = $('#mz').getBoundingClientRect(), s = (Z3.n + .2) / r.width, x = (px - r.left) * s - .1, y = (py - r.top) * s - .1;
  return x < 0 || y < 0 || x >= Z3.n || y >= Z3.n ? -1 : (y | 0) * Z3.n + (x | 0);
}
function mzStep(c) {
  const z = Z3, h = z.path[z.path.length - 1];
  if (c < 0 || c === h || z.quiz) return;
  if (!z.m.nb(h).includes(c) || !z.m.can(h, c)) return;
  if (z.path.length > 1 && z.path[z.path.length - 2] === c) z.path.pop();
  else if (!z.path.includes(c)) z.path.push(c); else return;
  beep(300 + z.path.length * 8, .03);
  const o = z.items.find(x => x.c === c && !x.done);
  if (o && z.path[z.path.length - 1] === c) {
    if (o.kind === 's') { o.done = true; beep(880, .2); $('#mm').textContent = '⭐ Bintang didapat!'; }
    else { z.drag = false; mzQuiz(o); }
  }
  if (c === z.m.goal && z.path[z.path.length - 1] === c) {
    if (z.items.every(x => x.done)) { z.drag = false; mzDraw(); const tk = z.tk; return void setTimeout(() => { if (tk === token) lvWin('maze', z.L, 'Kamu keluar dari labirin!', 'Kamu menemukan jalan keluar dengan sabar.', 2 + z.L, 1 + Math.min(z.fails, 3)); }, 500); }
    $('#mm').textContent = z.d.star ? 'Ambil dulu semua ⭐ di jalan buntu, baru ke 🏁!' : 'Jawab semua ❓ dulu, baru ke 🏁!';
  }
  mzDraw();
}
function mzQuiz(o) {
  const z = Z3, q = o.q; z.quiz = o; z.qo = shuffle(q[1].map((t, i) => [t, i === q[2]]));
  $('#qzb').innerHTML = `<div class="qz"><div class="qbox"><div class="bigemoji">❓</div><p class="story">${esc(q[0])}</p><div class="opts col">${z.qo.map((x, i) => `<button class="opt" data-act="mzq" data-n="${i}">${esc(x[0])}</button>`).join('')}</div><p class="fb" id="qf"></p></div></div>`;
  say3(q[0]);
}
function mzAnswer(n, el) {
  const z = Z3; if (!z || !z.quiz) return;
  if (z.qo[n][1]) {
    z.quiz.done = true; z.quiz = null; beep(784, .25); $('#qzb').innerHTML = ''; $('#mm').textContent = '✅ Jawabanmu benar!'; mzDraw();
  } else { z.fails++; el.disabled = true; el.classList.add('wrong'); beep(200, .15); $('#qf').textContent = 'Hampir! Coba jawaban lain 💪'; }
}
app.addEventListener('pointerdown', e => {
  const s = e.target.closest('#mz'); if (!s || !Z3 || Z3.tk !== token || Z3.quiz) return;
  e.preventDefault(); Z3.drag = true; Z3.last = [e.clientX, e.clientY]; try { s.setPointerCapture(e.pointerId); } catch (_) { /* abaikan */ }
  mzStep(mzCell(e.clientX, e.clientY));
});
app.addEventListener('pointermove', e => {
  if (!Z3 || !Z3.drag || Z3.tk !== token || !$('#mz')) return;
  const [x0, y0] = Z3.last, dx = e.clientX - x0, dy = e.clientY - y0, st = Math.max(1, Math.ceil(Math.hypot(dx, dy) / 6));
  for (let k = 1; k <= st && Z3.drag; k++) mzStep(mzCell(x0 + dx * k / st, y0 + dy * k / st));
  Z3.last = [e.clientX, e.clientY];
});
const mzUp = () => { if (Z3) Z3.drag = false; };
addEventListener('pointerup', mzUp); addEventListener('pointercancel', mzUp);
LV.maze = mzStart;

/* ================= 4. PUZZLE GESER ================= */
const ZCOL = [['Merah', '#ff4d4d', '🔴'], ['Kuning', '#ffd23f', '🟡'], ['Hijau', '#3ddc84', '🟢'], ['Biru', '#2f80ff', '🔵'], ['Ungu', '#8a4fe0', '🟣']];
const ZICO = [['🚀', 'roket'], ['🌙', 'bulan'], ['⭐', 'bintang'], ['🪐', 'planet'], ['🛸', 'UFO']];
const ZFLAG = ['🇮🇩', '🇯🇵', '🇧🇷', '🇫🇷'];
// tiap tile: {k: kunci pembanding, h: isi HTML, bg: warna latar}. Mengembalikan {n, tiles(tanpa kotak kosong), rows(petunjuk), intro}
function puzDef(L) {
  const T = (k, h, bg) => ({ k, h, bg });
  if (L === 1) return { n: 3, tiles: Array.from({ length: 8 }, (_, i) => T('n' + (i + 1), i + 1, `hsl(${(i + 1) * 37} 70% 62%)`)), intro: 'Urutkan angka 1 sampai 8 dari kiri ke kanan, baris demi baris.' };
  if (L === 2) return { n: 4, tiles: Array.from({ length: 15 }, (_, i) => T('l' + i, String.fromCharCode(65 + i), `hsl(${i * 24} 70% 62%)`)), intro: 'Urutkan huruf A sampai O dari kiri ke kanan, baris demi baris.' };
  if (L === 3) {
    const tiles = []; ZICO.slice(0, 4).forEach((ic, r) => { for (let c = 0; c < 4; c++) if (r < 3 || c < 3) tiles.push(T('i' + r, ic[0], '#fff')); });
    return { n: 4, tiles, rows: ZICO.slice(0, 4).map((ic, r) => `Baris ${r + 1}: ${ic[0].repeat(r < 3 ? 4 : 3)} (${ic[1]})`), intro: 'Susun gambar sesuai petunjuk di bawah.' };
  }
  if (L === 4) {
    const tiles = []; ZCOL.forEach((co, r) => { for (let c = 0; c < 5; c++) if (r < 4 || c < 4) tiles.push(T('c' + r, '', co[1])); });
    return { n: 5, tiles, rows: ZCOL.map((co, r) => `Baris ${r + 1}: ${co[2]} ${co[0]}`), intro: 'Susun warna sesuai petunjuk di bawah.' };
  }
  const tiles = [];
  for (let i = 0; i < 5; i++) tiles.push(T('n' + i, i + 1, '#ffe08a'));
  for (let i = 0; i < 5; i++) tiles.push(T('a' + i, String.fromCharCode(65 + i), '#b8e1ff'));
  ZICO.forEach((ic, i) => tiles.push(T('g' + i, ic[0], '#fff')));
  ZCOL.forEach((co, i) => tiles.push(T('w' + i, '', co[1])));
  ZFLAG.forEach((f, i) => tiles.push(T('f' + i, f, '#fff')));
  return { n: 5, tiles, rows: ['Baris 1: angka 1 2 3 4 5', 'Baris 2: huruf A B C D E', 'Baris 3: ' + ZICO.map(x => x[0]).join(' '), 'Baris 4: ' + ZCOL.map(x => x[2]).join(' '), 'Baris 5: ' + ZFLAG.join(' ')], intro: 'Susun angka, huruf, gambar, warna, dan bendera sesuai petunjuk.' };
}
let Q3 = null;
function puzzStart(L) {
  const d = puzDef(L), n = d.n, N = n * n, goal = d.tiles.concat([null]), t = goal.slice();
  let b = N - 1, prev = -1;
  for (let k = 0; k < N * 14; k++) { const c = nbrs(b, n).filter(x => x !== prev), m = c[rnd(c.length)]; t[b] = t[m]; t[m] = null; prev = b; b = m; }
  Q3 = { L, n, t, goal, moves: 0, tk: token };
  render(shell(`Puzzle Geser • Level ${L}`, `<p class="hint">${d.intro}</p>${d.rows ? `<div class="card zinfo">${d.rows.map(r => `<div>${r}</div>`).join('')}</div>` : ''}
    <p class="hint">Langkah: <b id="mv">0</b></p><div id="pz" class="pz" style="--n:${n}"></div>`));
  puzzDraw(); say3(d.intro);
}
function puzzDraw() {
  const q = Q3; $('#pz').innerHTML = q.t.map((v, i) => v ? `<button class="pt" data-act="pzmv" data-i="${i}" style="background:${v.bg}">${v.h}</button>` : '<span class="pt blank"></span>').join('');
  $('#mv').textContent = q.moves;
}
function puzzMove(i) {
  const q = Q3; if (!q) return;
  const n = q.n, b = q.t.indexOf(null), r1 = (b / n) | 0, c1 = b % n, r2 = (i / n) | 0, c2 = i % n;
  if (r1 !== r2 && c1 !== c2) { beep(200, .08); return; }
  const stp = r1 === r2 ? (i > b ? 1 : -1) : (i > b ? n : -n);
  for (let k = b; k !== i; k += stp) q.t[k] = q.t[k + stp];   // geser semua kotak sebaris menuju celah
  q.t[i] = null; q.moves++; beep(520, .06); puzzDraw();
  if (q.t.every((v, k) => (v ? v.k : null) === (q.goal[k] ? q.goal[k].k : null))) { const tk = token; setTimeout(() => { if (tk === token) lvWin('puz', q.L, 'Puzzle selesai!', `Selesai dalam ${q.moves} langkah.`, 2 + q.L, 1); }, 450); }
}
LV.puz = puzzStart;

/* ================= 5. POLA BINTANG ================= */
const PGD = [null, [2, 2], [3, 3], [4, 4], [5, 5], [5, 6]];   // [kolom, baris]
let G3 = null;
const pgFreq = i => 262 * 2 ** ([0, 2, 4, 7, 9][i % 5] / 12 + ((i / 5 | 0) % 2));
function pgStart(L) {
  const [c, r] = PGD[L], n = c * r, young = P().age < 7, len = young ? 2 : 3;
  G3 = { L, n, len, round: 1, total: 5, retries: 0, seq: [], pos: 0, busy: true, tk: token, gap: Math.max(380, 700 - L * 60) };
  G3.seq = Array.from({ length: len }, () => rnd(n));
  render(shell(`Pola Bintang • Level ${L}`, `<p class="hint" id="sm">Lihat dulu polanya…</p>
    <div class="pg" style="--c:${c}">${Array.from({ length: n }, (_, i) => `<button class="pgp" id="pg${i}" style="--pc:hsl(${(i * 360 / n) | 0} 85% 58%)" data-act="pgpad" data-i="${i}" aria-label="bintang ${i + 1}">⭐</button>`).join('')}</div>
    <p class="hint">Putaran <b id="rd">1</b>/5 • Pola ${c}×${r}</p>`));
  G3.tk = token; say3('Lihat polanya, lalu ulangi!'); pgShow();
}
function pgLight(i) { const el = $('#pg' + i); if (!el) return; el.classList.add('lit'); beep(pgFreq(i), .28); setTimeout(() => el.classList.remove('lit'), G3 ? G3.gap - 120 : 300); }
async function pgShow() {
  const g = G3, tk = g.tk; g.busy = true; g.pos = 0; const sm = $('#sm'); if (sm) sm.textContent = 'Lihat dulu polanya…';
  await sleep(800);
  for (const i of g.seq) { if (tk !== token) return; pgLight(i); await sleep(g.gap); }
  if (tk !== token) return; g.busy = false; const s2 = $('#sm'); if (s2) s2.textContent = 'Sekarang giliranmu!';
}
function pgPad(i) {
  const g = G3; if (!g || g.busy) return; pgLight(i);
  if (i === g.seq[g.pos]) {
    g.pos++;
    if (g.pos === g.seq.length) {
      g.busy = true;
      if (g.round === g.total) return void setTimeout(() => { if (G3 === g && g.tk === token) lvWin('pola', g.L, 'Semua pola selesai!', g.retries ? `Kamu sempat salah ${g.retries}× tapi terus mencoba. Itu ketangguhan!` : 'Tanpa salah sama sekali. Fokusmu tajam!', 2 + g.L, 2 + Math.min(g.retries, 5)); }, 600);
      g.round++; g.seq.push(rnd(g.n)); $('#rd').textContent = g.round; $('#sm').textContent = 'Mantap! Pola baru…';
      const tk = g.tk; setTimeout(() => { if (G3 === g && g.tk === tk && tk === token) pgShow(); }, 900);
    }
  } else {
    g.retries++; g.busy = true; $('#sm').textContent = 'Hampir! Tidak apa-apa, lihat lagi ya 💪'; say3('Hampir! Coba lagi ya.');
    const tk = g.tk; setTimeout(() => { if (G3 === g && g.tk === tk && tk === token) pgShow(); }, 1300);
  }
}
LV.pola = pgStart;

/* ================= AKSI & MENU LEVEL ================= */
const LVD = {
  memory: ['Memori Bintang', '🧠', 'Cari pasangan yang sama. Pilih level:', ['Warna • kotak 5×5', 'Gambar • kotak 5×5', 'Angka • kotak 5×7', 'Huruf • kotak 5×8', 'Gabungan warna, gambar, angka, huruf • 5×10']],
  where: ['Dimana Aku?', '🥥', 'Ikuti tempurung yang bergerak lalu tebak bijinya!', ['3 tempurung • 1 biji', '3 tempurung • 2 biji, cari 1 warna', '4 tempurung • 2 biji, cari 1 warna', '4 tempurung • 3 biji, cari 1 warna', '5 tempurung • 4 biji, cari 2 warna']],
  maze: ['Labirin', '🌀', 'Tarik garis dari 🚀 sampai 🏁 tanpa menembus dinding.', ['Labirin sedang', 'Sedang • ambil ⭐ dulu', 'Labirin sulit', 'Sulit • ambil 2 ⭐', 'Sulit • jawab 3 pertanyaan ❓']],
  puz: ['Puzzle Geser', '🧩', 'Geser kotak ke tempat kosong sampai urutannya benar.', ['3×3 • angka 1-8', '4×4 • abjad', '4×4 • gambar', '5×5 • warna', '5×5 • angka, huruf, gambar, warna, bendera']],
  pola: ['Pola Bintang', '🌟', 'Lihat urutan bintang menyala, lalu ulangi!', ['Pola 2×2', 'Pola 3×3', 'Pola 4×4', 'Pola 5×5', 'Pola 5×6']]
};
const lvEntry = k => gate(() => { lvMenu(k, ...LVD[k]); });
Object.assign(A, {
  g_memory: lvEntry('memory'), g_where: lvEntry('where'), g_maze: lvEntry('maze'), g_puz: lvEntry('puz'), g_simon: lvEntry('pola'), g_pola: lvEntry('pola'),
  lvgo(d) { if (isLocked()) return screenLock(); const l = +d.l; if (!LV[d.g] || l > lvOf(d.g)) return; LV[d.g](l); },
  m3flip(d, b) { memFlip(+d.i, b); }, whpick(d) { whPick(+d.c); }, mzq(d, b) { mzAnswer(+d.n, b); },
  mzreset() { if (!Z3) return; Z3.path = [0]; Z3.items.forEach(o => { o.done = false; }); Z3.quiz = null; $('#qzb').innerHTML = ''; $('#mm').textContent = ''; mzDraw(); },
  pzmv(d) { puzzMove(+d.i); }, pgpad(d) { pgPad(+d.i); }
});
Object.assign(ACT_GAME, { g_where: 'Dimana Aku?', g_maze: 'Labirin', g_pola: 'Pola Bintang' });
