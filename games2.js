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

/* ---------- Saklar Lampu: 6 mini-game listrik ---------- */
const KC = [['Merah', '#ff4d4d'], ['Kuning', '#ffd23f'], ['Hijau', '#3ddc84'], ['Biru', '#4aa3ff']];
const SK = [['🌉', 'Jembatan Arus', 'Kenapa saklar dinding menyalakan lampu'], ['🎨', 'Sambung Kabel Warna', 'Cocokkan warna kabel dengan teliti'],
  ['🔀', 'Saklar Ganda', 'Cari saklar mana untuk lampu mana'], ['🚨', 'Pola Kedip', 'Tiru kedip lampu & latih memori'],
  ['🕵️', 'Detektif Saklar', 'Baca petunjuk, pikir dulu baru pencet'], ['🔧', 'Perbaiki Jalur', 'Cari kenapa lampu tidak menyala']];
let skRe = null;
const skShell = (t, b) => `<header class="bar"><button class="icon" data-act="skmenu" aria-label="Kembali">←</button><h2>${t}</h2></header><main class="game">${b}</main>`;
const skStars = f => f === 0 ? 3 : f <= 2 ? 2 : 1;
const skGo = f => () => { if (isLocked()) return screenLock(); skRe = null; lvl2Back = circMenu; f(); setLvl(3); };
function skEnd(n, title, stars, note, iq, aq) {
  reward('saklar' + n, { iq, aq, stars });
  result(title, stars, note, `<button class="btn big" data-act="sk${n}">Main lagi</button><button class="btn ghost" data-act="skmenu">Menu Saklar</button>`);
}
function circMenu() {
  skRe = null;
  render(shell('Saklar Lampu', `<div class="bigemoji">💡</div><p class="hint">Pilih permainan listrik:</p>
    <div class="opts col">${SK.map((g, i) => `<button class="opt wide" data-act="sk${i + 1}">${g[0]} <b>${g[1]}</b><br><small>${g[2]}</small></button>`).join('')}</div>`));
}
// gambar kabel 3D antar titik [data-k] di dalam #kb. list: [dari, ke, warna, mengalir?]
function skWire(list) {
  const kb = $('#kb'), br = kb.getBoundingClientRect();
  const pt = k => { const r = kb.querySelector(`[data-k="${k}"]`).getBoundingClientRect(); return [r.left - br.left + r.width / 2, r.top - br.top + r.height / 2]; };
  kb.querySelector('svg').innerHTML = list.map(([a, b, c, f]) => {
    const p = pt(a), q = pt(b), m = (p[0] + q[0]) / 2, d = `M${p[0]} ${p[1]} C${m} ${p[1]} ${m} ${q[1]} ${q[0]} ${q[1]}`;
    return `<path class="wb" d="${d}"/><path class="wc" d="${d}" style="stroke:${c}"/><path class="wh" d="${d}"/>${f ? `<path class="fl" d="${d}"/>` : ''}`;
  }).join('');
}

/* 1. ON/OFF & Jembatan Arus */
let J = null;
const skScene = on => `<svg viewBox="0 36 312 100" class="sk"><rect x="8" y="50" width="44" height="50" rx="12" fill="#4a4f72"/><text x="30" y="84" text-anchor="middle" font-size="26">🔋</text>
  <path class="w" d="M52 75H108"/><path class="w" d="M212 75H245"/>
  <g style="transform-origin:108px 75px;transform:rotate(${on ? 0 : -40}deg);transition:transform .35s"><rect x="108" y="68" width="104" height="14" rx="7" fill="#ffb347"/></g>
  <circle cx="108" cy="75" r="7" fill="#ddd"/><circle cx="212" cy="75" r="7" fill="#ddd"/>
  ${on ? '<path class="fl" d="M52 75H108"/><path class="fl" d="M108 75H212"/><path class="fl" d="M212 75H245"/>' : ''}
  <circle cx="275" cy="75" r="26" class="sb ${on ? 'on' : ''}"/><text x="110" y="130" class="ct" text-anchor="middle">Jembatan ${on ? 'tertutup' : 'terbuka'}</text></svg>`;
function sk1Start() { J = { on: false, step: 0, n: 5, busy: false, msg: 'Lihat jembatannya! Saat tertutup, titik cahaya (arus) mengalir.' }; render(skShell('Jembatan Arus', '<div id="js"></div>')); sk1Draw(); say2('Ikuti perintahnya. Tekan tombol ON atau OFF!'); }
function sk1Draw() {
  const goal = J.step % 2 === 0;
  $('#js').innerHTML = `<p class="hint">Tugas ${Math.min(J.step + 1, J.n)}/${J.n}: <b>${goal ? 'Nyalakan lampu!' : 'Matikan lampu!'}</b></p><div class="kb">${skScene(J.on)}</div>
    <button class="btn big" data-act="sk1t">${J.on ? '🔴 Tekan untuk OFF' : '🟢 Tekan untuk ON'}</button><p class="story">${esc(J.msg)}</p>`;
}
function sk1Toggle() {
  if (J.busy) return;
  J.on = !J.on; J.step++; beep(J.on ? 784 : 330, .15);
  J.msg = J.on ? 'ON: jembatan menutup, jalur tersambung. Arus mengalir dari baterai ke lampu, lampu menyala!' : 'OFF: jembatan terbuka, jalur terputus. Arus berhenti, lampu padam.';
  sk1Draw();
  if (J.step >= J.n) { J.busy = true; const tk = token; setTimeout(() => { if (tk === token) skEnd(1, 'Jembatan Arus selesai!', 3, 'Saklar di dinding bekerja seperti jembatan: ON menyambung jalur sehingga arus mengalir ke lampu, OFF memutusnya.', 2, 1); }, 2200); }
}

/* 2. Sambung Kabel Sesuai Warna (tahan jari, seret kabel) */
let Wc = null;
function sk2Start() { Wc = { rs: P().age < 7 ? [2, 3] : [2, 3, 4], i: 0, fails: 0, drag: null }; sk2Round(); }
function sk2Round() {
  const n = Wc.rs[Wc.i];
  Wc.cs = shuffle(KC).slice(0, n); Wc.r = shuffle([...Array(n).keys()]); Wc.m = Array(n).fill(-1); Wc.zap = -1; Wc.drag = null;
  Wc.msg = 'Tahan terminal, lalu seret kabelnya ke terminal yang warnanya sama.';
  render(skShell(`Sambung Kabel (${Wc.i + 1}/${Wc.rs.length})`, '<p class="hint">Tahan &amp; seret kabel. Salah warna = percikan ⚡</p><div id="kb" class="kb"><svg></svg></div><p id="km" class="fb"></p><div id="kx"></div>'));
  Wc.tk = token; skRe = sk2Draw; sk2Draw();
}
function sk2Draw() {
  const rows = Wc.cs.map((c, i) => {
    const rc = Wc.cs[Wc.r[i]];
    return `<div class="krow"><div class="ksw"><span class="lb">${c[0]}</span><button class="plug ${Wc.m[i] >= 0 ? 'ok' : ''}" data-d="s${i}" data-k="s${i}" style="--k:${c[1]}" aria-label="Kiri ${c[0]}"></button></div>
      <div class="kl"><button class="plug ${Wc.m.includes(i) ? 'ok' : ''} ${Wc.zap === i ? 'zap' : ''}" data-d="l${i}" data-k="l${i}" style="--k:${rc[1]}" aria-label="Kanan ${rc[0]}"></button><span class="lb">${rc[0]}</span></div></div>`;
  }).join('');
  $('#kb').innerHTML = '<svg></svg>' + rows;
  skWire(Wc.m.map((j, i) => j < 0 ? null : ['s' + i, 'l' + j, Wc.cs[i][1], true]).filter(Boolean));
  $('#km').textContent = Wc.msg;
  $('#kx').innerHTML = Wc.m.every(j => j >= 0) ? '<button class="btn big" data-act="sk2n">Lanjut ▶</button>' : '';
}
const sk2Xy = e => { const b = $('#kb').getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
function sk2Tw() {
  const d = Wc.drag, kb = $('#kb'), br = kb.getBoundingClientRect(), i = +d.k.slice(1);
  const r = kb.querySelector(`[data-k="${d.k}"]`).getBoundingClientRect(), p = [r.left - br.left + r.width / 2, r.top - br.top + r.height / 2], q = d.xy, m = (p[0] + q[0]) / 2;
  const c = d.k[0] === 's' ? Wc.cs[i][1] : Wc.cs[Wc.r[i]][1], path = `M${p[0]} ${p[1]} C${m} ${p[1]} ${m} ${q[1]} ${q[0]} ${q[1]}`;
  let g = kb.querySelector('#tw'); if (!g) { kb.querySelector('svg').insertAdjacentHTML('beforeend', '<g id="tw"></g>'); g = kb.querySelector('#tw'); }
  g.innerHTML = `<path class="wb" d="${path}"/><path class="wc" d="${path}" style="stroke:${c}"/><path class="wh" d="${path}"/>`;
}
function sk2Pair(k1, k2) {
  const a = k1[0] === 's' ? k1 : k2, b = k1[0] === 'l' ? k1 : k2, si = +a.slice(1), lj = +b.slice(1);
  if (Wc.r[lj] === si) { Wc.m[si] = lj; Wc.msg = `Cocok! Kabel ${Wc.cs[si][0]} tersambung rapi. ✨`; beep(784, .2); }
  else {
    Wc.fails++; Wc.zap = lj; beep(120, .3);
    Wc.msg = `⚡ Percikan! ${Wc.cs[si][0]} tidak boleh disambung ke ${Wc.cs[Wc.r[lj]][0]}. Kabel yang tertukar bisa korsleting.`;
    const tk = token; setTimeout(() => { if (tk === token) { Wc.zap = -1; sk2Draw(); } }, 800);
  }
}
const sk2Taken = k => (k[0] === 's' && Wc.m[+k.slice(1)] >= 0) || (k[0] === 'l' && Wc.m.includes(+k.slice(1)));
app.addEventListener('pointerdown', e => {
  const b = e.target.closest('[data-d]');
  if (!b || !Wc || Wc.tk !== token || Wc.m.every(j => j >= 0) || sk2Taken(b.dataset.d)) return;
  e.preventDefault(); Wc.drag = { k: b.dataset.d, xy: sk2Xy(e) }; b.classList.add('sel'); sk2Tw();
});
addEventListener('pointermove', e => { if (Wc && Wc.drag && Wc.tk === token) { Wc.drag.xy = sk2Xy(e); sk2Tw(); } });
function sk2Up(e) {
  if (!Wc || !Wc.drag) return;
  const d = Wc.drag; Wc.drag = null;
  if (Wc.tk !== token) return;
  let best = null, bd = 56;   // plug terdekat di sisi seberang (toleransi jari)
  app.querySelectorAll('[data-d]').forEach(p => {
    const k = p.dataset.d; if (k[0] === d.k[0] || sk2Taken(k)) return;
    const r = p.getBoundingClientRect(), dist = Math.hypot(e.clientX - (r.left + r.width / 2), e.clientY - (r.top + r.height / 2));
    if (dist < bd) { bd = dist; best = k; }
  });
  if (best) sk2Pair(d.k, best); else Wc.msg = 'Seret kabel sampai ke terminal di seberang ya.';
  sk2Draw();
}
addEventListener('pointerup', sk2Up); addEventListener('pointercancel', sk2Up);

/* 3. Saklar Ganda / Dua Arus */
const LAMP3 = [['A', '#4aa3ff'], ['B', '#ff8a3d']];
let D3 = null;
function sk3Start() { D3 = { i: 0, n: P().age < 7 ? 2 : 3, moves: 0 }; sk3Round(); }
function sk3Round() {
  const br = [[[0, 1], [1]], [[0], [0, 1]], [[0, 1], [0]]], combos = [[1, 0], [0, 1], [1, 1]];
  D3.map = D3.i < 2 ? shuffle([[0], [1]]) : br[rnd(3)];
  D3.lit = on => [0, 1].filter(j => on.some((v, s) => v && D3.map[s].includes(j)));
  D3.on = [false, false]; D3.done = false;
  D3.target = D3.lit(combos[rnd(3)]);
  D3.msg = 'Coba tekan saklar dan lihat lampu mana yang menyala. Arus terlihat lewat jalurnya!';
  const t = D3.target, goal = t.length === 2 ? 'Nyalakan <b>kedua lampu</b> (A dan B)' : `Nyalakan <b>Lampu ${LAMP3[t[0]][0]} saja</b>`;
  render(skShell(`Saklar Ganda (${D3.i + 1}/${D3.n})`, `<p class="hint">Misi: ${goal}. Jalur kabelnya tersembunyi, cari tahu!</p><div id="kb" class="kb"><svg></svg></div><p id="km" class="fb"></p><div id="kx"></div>`));
  skRe = sk3Draw; sk3Draw();
}
function sk3Draw() {
  const lit = D3.lit(D3.on);
  const rows = [0, 1].map(s => `<div class="krow"><div class="ksw" style="--k:#cfd3f5"><button class="lever ${D3.on[s] ? 'on' : ''}" data-act="sk3t" data-i="${s}" data-k="s${s}" aria-label="Saklar ${s + 1}"><i></i></button><span class="lb">Saklar ${s + 1}</span></div>
    <div class="kl"><span class="lb">Lampu ${LAMP3[s][0]}</span><div class="bulb ${lit.includes(s) ? 'lit' : ''}" data-k="l${s}" style="--k:${LAMP3[s][1]}"></div></div></div>`).join('');
  $('#kb').innerHTML = '<svg></svg>' + rows;
  skWire([0, 1].filter(s => D3.on[s]).flatMap(s => D3.map[s].map(j => ['s' + s, 'l' + j, '#ffe34a', true])));
  $('#km').textContent = D3.msg;
  $('#kx').innerHTML = D3.done ? '<button class="btn big" data-act="sk3n">Lanjut ▶</button>' : '';
}
function sk3Toggle(s) {
  if (D3.done) return;
  D3.on[s] = !D3.on[s]; D3.moves++; beep(D3.on[s] ? 700 : 350, .1);
  D3.msg = D3.on[s] ? `Saklar ${s + 1} ON. Lihat lampu mana yang menyala.` : `Saklar ${s + 1} OFF.`;
  if (D3.lit(D3.on).join() === D3.target.join()) {
    D3.done = true;
    D3.msg = D3.map.some(m => m.length === 2) ? 'Berhasil! Satu saklar bisa menyalakan dua lampu lewat jalur bercabang. 🎉' : 'Berhasil! Tiap saklar punya jalurnya sendiri, saklar 1 belum tentu untuk Lampu A. 🎉';
  }
  sk3Draw();
}

/* 4. Pola Kedip & Sinyal Cahaya */
let Bk = null;
function sk4Start() { const young = P().age < 7; Bk = { young, rs: young ? [1, 2, 3] : [3, 4, 5], i: 0, fails: 0 }; sk4Round(); }
const sk4Btn = d => app.querySelectorAll('[data-act="sk4b"]').forEach(b => { b.disabled = d; });
function sk4Round() {
  const len = Bk.rs[Bk.i];
  Bk.pat = Array.from({ length: len }, () => Bk.young || Math.random() < .5 ? 'S' : 'L'); Bk.inp = []; Bk.busy = true;
  render(skShell(`Pola Kedip (${Bk.i + 1}/${Bk.rs.length})`, `<p class="hint" id="bh">Perhatikan lampunya…</p><div class="lamp1"><div id="bb" class="bulb" style="--k:#ffe34a"></div></div>
    <p class="stars" id="bp">${'○'.repeat(len)}</p>
    <div class="opts" id="bbtn">${Bk.young ? '<button class="btn big" style="grid-column:1/-1" data-act="sk4b" data-s="S" disabled>💡 Kedip!</button>' : '<button class="opt" data-act="sk4b" data-s="S" disabled>● Pendek</button><button class="opt" data-act="sk4b" data-s="L" disabled>▬ Panjang</button>'}</div>
    <div id="bn"></div><p class="small">Seperti lampu sein mobil, lampu mercusuar, atau lampu peringatan: pola kedipnya punya arti.</p>`));
  sk4Play();
}
async function sk4Play() {
  const tk = token; Bk.busy = true; sk4Btn(true); await sleep(900);
  for (const s of Bk.pat) {
    if (tk !== token) return; $('#bb').classList.add('lit'); beep(660, .1); await sleep(s === 'S' ? 350 : 900);
    if (tk !== token) return; $('#bb').classList.remove('lit'); await sleep(400);
  }
  if (tk !== token) return;
  Bk.busy = false; $('#bh').textContent = 'Giliranmu! Tiru polanya.'; sk4Btn(false);
}
function sk4In(s) {
  if (Bk.busy) return;
  const tk = token, bb = $('#bb'), len = Bk.pat.length;
  bb.classList.add('lit'); beep(s === 'S' ? 660 : 440, s === 'S' ? .15 : .4);
  setTimeout(() => { if (tk === token) bb.classList.remove('lit'); }, s === 'S' ? 250 : 600);
  Bk.inp.push(s); $('#bp').textContent = '◉'.repeat(Bk.inp.length) + '○'.repeat(len - Bk.inp.length);
  if (Bk.inp.length < len) return;
  Bk.busy = true; sk4Btn(true);
  if (Bk.inp.join('') === Bk.pat.join('')) { $('#bh').textContent = '✅ Polanya sama! Ingatanmu hebat.'; $('#bn').innerHTML = '<button class="btn big" data-act="sk4n">Lanjut ▶</button>'; }
  else {
    Bk.fails++; $('#bh').textContent = 'Belum sama. Lihat polanya sekali lagi!'; Bk.inp = [];
    setTimeout(() => { if (tk === token) { $('#bp').textContent = '○'.repeat(len); sk4Play(); } }, 1300);
  }
}

/* 5. Detektif Saklar */
let Dt = null;
function sk5Start() { Dt = { i: 0, n: 3, fails: 0 }; sk5Round(); }
function sk5Round() {
  const n = P().age < 7 ? 2 : 3;
  Dt.cs = shuffle([KC[0], KC[2], KC[3]]).slice(0, n); Dt.t = rnd(n); Dt.disp = shuffle([...Array(n).keys()]);
  Dt.on = Array(n).fill(false); Dt.boom = false; Dt.done = false;
  Dt.msg = 'Baca petunjuk dulu. Pikir, baru tekan satu saklar!';
  render(skShell(`Detektif Saklar (${Dt.i + 1}/${Dt.n})`, '<div id="ds"></div>'));
  sk5Draw(); say2(`Nyalakan lampu ${Dt.cs[Dt.t][0]} saja. Baca petunjuknya dulu!`);
}
function sk5Draw() {
  const clues = Dt.cs.map((c, s) => s === Dt.t ? '' : `<li>Saklar ${s + 1} menyalakan lampu <b>${c[0]}</b>.</li>`).join('');
  const lev = Dt.cs.map((c, s) => `<div class="dsw"><button class="lever ${Dt.on[s] ? 'on' : ''}" style="--k:#cfd3f5" data-act="sk5p" data-i="${s}" aria-label="Saklar ${s + 1}"><i></i></button><b>${s + 1}</b></div>`).join('');
  const lamps = Dt.disp.map(s => `<div class="dsw"><div class="bulb ${Dt.on[s] ? (s === Dt.t ? 'lit' : 'lit warn') : ''}" style="--k:${Dt.cs[s][1]}"></div><b>${Dt.cs[s][0]}</b></div>`).join('');
  $('#ds').innerHTML = `<div class="card"><b>🔎 Petunjuk</b><ul class="clue">${clues}</ul></div>
    <p class="story">Misi: nyalakan lampu <b>${Dt.cs[Dt.t][0]}</b> saja. Lampu lain harus tetap mati!</p>
    <div class="drow">${lev}</div><div class="drow">${lamps}</div><p class="fb">${esc(Dt.msg)}</p>
    ${Dt.boom ? '<button class="btn" data-act="sk5r">Coba lagi 🔧</button>' : Dt.done ? '<button class="btn big" data-act="sk5n">Lanjut ▶</button>' : ''}`;
}
function sk5Press(s) {
  if (Dt.boom || Dt.done) return;
  Dt.on[s] = true;
  if (s === Dt.t) { Dt.done = true; beep(784, .3); Dt.msg = `Tepat! Karena saklar lain sudah diketahui, tersisa saklar ${s + 1}. Kamu berpikir dulu sebelum menekan. 🎉`; }
  else { Dt.boom = true; Dt.fails++; beep(150, .3); Dt.msg = `Oops! Lampu ${Dt.cs[s][0]} menyala padahal harus tetap mati. Baca petunjuk dan tahan dulu tanganmu sebelum menekan.`; }
  sk5Draw();
}

/* 6. Perbaiki Jalur Terputus */
let Fx = null;
const FXN = { W1: 'Kabel kiri', SW: 'Saklar', W2: 'Kabel kanan', L: 'Lampu' }, FXO = ['W1', 'SW', 'W2', 'L'];
const FXI = { W1: 'Kabel yang putus membuat arus berhenti di sana. Setelah disambung, arus mengalir lagi!', W2: 'Kabel yang putus membuat arus berhenti di sana. Setelah disambung, arus mengalir lagi!',
  SW: 'Kontak saklar yang longgar tidak menyambung walau tuasnya ON. Setelah dikencangkan, jalur tertutup.', L: 'Kawat di dalam lampu putus, jadi arus sampai tetapi lampu tidak menyala. Lampu harus diganti.' };
function sk6Start() { Fx = { fs: shuffle(FXO).slice(0, 3), i: 0, fails: 0 }; sk6Round(); }
function sk6Round() {
  Fx.f = Fx.fs[Fx.i]; Fx.fixed = false;
  Fx.msg = 'Saklar sudah ON tapi lampu mati! Lihat di mana arus berhenti, lalu ketuk bagian yang rusak.';
  render(skShell(`Perbaiki Jalur (${Fx.i + 1}/${Fx.fs.length})`, '<div id="fs"></div>')); sk6Draw(); say2('Lampu mati padahal saklar ON. Cari bagian yang rusak!');
}
function sk6Draw() {
  const f = Fx.fixed ? null : Fx.f, fi = f ? FXO.indexOf(f) : 99, fl = c => FXO.indexOf(c) < fi;
  const wire = (c, x1, x2) => f === c ? `<path class="w" d="M${x1} 75H${x1 + 18}"/><path class="w" d="M${x2 - 18} 75H${x2}"/><path class="fl" d="M${x1} 75H${x1 + 18}"/><text x="${(x1 + x2) / 2}" y="82" text-anchor="middle" font-size="22">⚡</text>`
    : `<path class="w" d="M${x1} 75H${x2}"/>${fl(c) ? `<path class="fl" d="M${x1} 75H${x2}"/>` : ''}`;
  const hit = (c, x, w) => `<rect data-act="sk6f" data-c="${c}" x="${x}" y="30" width="${w}" height="90" fill="transparent"/>`;
  const lit = !f;
  $('#fs').innerHTML = `<div class="kb"><svg viewBox="0 28 320 100" class="sk">
    <rect x="8" y="50" width="44" height="50" rx="12" fill="#4a4f72"/><text x="30" y="84" text-anchor="middle" font-size="26">🔋</text>
    ${wire('W1', 52, 108)}
    <rect x="108" y="52" width="60" height="46" rx="12" fill="#3a3f62" stroke="#aab" stroke-width="2"/>
    <line x1="118" y1="75" x2="${f === 'SW' ? 152 : 158}" y2="${f === 'SW' ? 56 : 75}" stroke="#ffb347" stroke-width="8" stroke-linecap="round"/>
    ${fl('SW') ? '<path class="fl" d="M108 75H168"/>' : ''}<text x="138" y="116" class="ct" text-anchor="middle">ON</text>
    ${wire('W2', 168, 238)}
    <circle cx="270" cy="75" r="27" class="sb ${lit ? 'on' : ''}" ${f === 'L' ? 'style="fill:#2b2d44"' : ''}/>${f === 'L' ? '<text x="270" y="86" text-anchor="middle" font-size="30">✖️</text>' : ''}
    ${hit('B', 4, 50)}${hit('W1', 52, 56)}${hit('SW', 108, 60)}${hit('W2', 168, 70)}${hit('L', 240, 60)}</svg></div>
    <p class="story">${esc(Fx.msg)}</p>${Fx.fixed ? '<button class="btn big" data-act="sk6n">Lanjut ▶</button>' : '<p class="small">Titik cahaya (arus) berhenti tepat sebelum bagian yang rusak.</p>'}`;
}
function sk6Fix(c) {
  if (Fx.fixed) return;
  if (c === Fx.f) { Fx.fixed = true; beep(784, .3); Fx.msg = `✅ ${FXN[c]} diperbaiki! ${FXI[c]}`; }
  else {
    Fx.fails++; beep(200, .1);
    const k = FXO.indexOf(c), fi = FXO.indexOf(Fx.f);
    Fx.msg = c === 'B' ? 'Baterai baik: arus keluar darinya. Ikuti arusnya, di mana ia berhenti?' : k < fi ? `${FXN[c]} baik-baik saja, arus lewat di sini. Cari tempat arus berhenti.` : `Arus belum sampai ke ${FXN[c].toLowerCase()}. Masalahnya ada sebelum ini.`;
  }
  sk6Draw();
}

/* ---------- Campur Warna ---------- */
const PN = { R: ['Merah', '#ff3b3b'], Y: ['Kuning', '#ffd23f'], B: ['Biru', '#2f80ff'], W: ['Putih', '#ffffff'] };
const MIX = { R: ['Merah', '#ff3b3b'], Y: ['Kuning', '#ffd23f'], B: ['Biru', '#2f80ff'], W: ['Putih', '#f4f4f4'], RY: ['Oranye', '#ff8a1f'], YB: ['Hijau', '#2fc46f'], RB: ['Ungu', '#8a4fe0'],
  RYB: ['Cokelat', '#7a4a2a'], RW: ['Merah muda', '#ff9bbd'], BW: ['Biru muda', '#9fd0ff'], YW: ['Kuning muda', '#fff0a0'], RYW: ['Krem', '#ffc59a'],
  YBW: ['Hijau muda', '#9ff0c0'], RBW: ['Ungu muda', '#c9a8ff'], RYBW: ['Cokelat muda', '#c8b8a8'] };
const mixKey = d => [...'RYBW'].filter(c => d.includes(c)).join('');
let Cx = null;
function mixStart() {
  const young = P().age < 7, total = 10;
  const pool = young ? ['RY', 'YB', 'RB', 'RYB'] : ['RY', 'YB', 'RB', 'RW', 'BW', 'YW', 'RYB', 'RYW', 'YBW', 'RBW', 'RYBW'];
  const rs = [];   // 10 misi; untuk anak kecil resep diulang, tapi tidak pernah sama dua kali berturut-turut
  while (rs.length < total) rs.push(...shuffle(pool).filter(k => k !== rs[rs.length - 1]));
  Cx = { young, rs: rs.slice(0, total), i: 0, fails: 0 };
  mixRound();
}
function mixRound() {
  Cx.d = []; Cx.tries = 0; Cx.done = false;
  const t = MIX[Cx.rs[Cx.i]], pal = Cx.young ? 'RYB' : 'RYBW';
  render(shell(`Campur Warna (${Cx.i + 1}/${Cx.rs.length})`, `<p class="hint">Misi: campurkan cat sampai menjadi warna <b>${t[0]}</b>!</p>
    <div class="mixrow"><div class="mixcol"><div class="swatch" style="background:${t[1]}"></div><span class="lb">Target</span></div>
    <div class="mixcol"><div class="cup"><div id="liq" class="liq"></div></div><span class="lb">Campuranmu</span></div></div>
    <p id="cn" class="small"></p>
    <div class="paints">${[...pal].map(c => `<button class="paint" style="--k:${PN[c][1]}" data-act="cmadd" data-c="${c}" aria-label="Cat ${PN[c][0]}"><i></i><b>${PN[c][0]}</b></button>`).join('')}</div>
    <p id="cm" class="fb">Ketuk cat untuk meneteskannya ke cangkir.</p>
    <div id="cx" class="opts"><button class="opt" data-act="cmclear">🗑 Kosongkan</button><button class="opt" data-act="cmcheck">✔ Cek warna</button></div>`));
  say2(`Buat warna ${t[0]}!`); mixUpdate();
}
function mixUpdate() {
  const d = Cx.d, m = MIX[mixKey(d)], l = $('#liq');
  l.style.height = d.length ? (14 + d.length * 13) + '%' : '0%'; if (m) l.style.background = m[1];
  $('#cn').textContent = d.length ? `Tetes: ${d.map(c => PN[c][0]).join(' + ')}` : 'Cangkir masih kosong';
}
function mixAdd(c) {
  if (Cx.done) return;
  if (Cx.d.length >= 6) { $('#cm').textContent = 'Cangkir penuh! Cek warnanya atau kosongkan dulu.'; return; }
  Cx.d.push(c); beep(400 + Cx.d.length * 60, .08); mixUpdate();
}
function mixCheck() {
  if (Cx.done) return;
  if (!Cx.d.length) { $('#cm').textContent = 'Teteskan cat dulu ya!'; return; }
  const want = Cx.rs[Cx.i], got = mixKey(Cx.d), t = MIX[want], recipe = [...want].map(c => PN[c][0]).join(' + ');
  if (got === want) {
    Cx.done = true; beep(784, .3);
    $('#cm').textContent = `Berhasil! ${recipe} = ${t[0]} 🎉` + (Cx.young ? ' Merah, kuning, dan biru adalah warna dasar.' : '');
    $('#cx').innerHTML = '<button class="btn big" style="grid-column:1/-1" data-act="cmnext">Lanjut ▶</button>';
  } else {
    Cx.fails++; Cx.tries++; beep(200, .15);
    $('#cm').textContent = `Campuranmu menjadi ${MIX[got][0]}, belum ${t[0]}. ` + (Cx.tries >= 2 ? `Petunjuk: ${t[0]} dibuat dari ${recipe}.` : 'Coba ubah campurannya!');
  }
}
function mixEnd() {
  const stars = Cx.fails === 0 ? 3 : Cx.fails <= 4 ? 2 : 1;   // 10 misi: toleransi salah lebih longgar
  reward('warna', { iq: 3, aq: Math.min(Cx.fails, 4) + 1, stars });
  result('Pelukis warna!', stars, 'Merah, kuning, dan biru adalah warna dasar. Dua warna dasar yang dicampur menghasilkan warna baru, dan putih membuat warna menjadi lebih muda.', '<button class="btn big" data-act="g_mix">Main lagi</button>');
}

/* ---------- Planetarium mini ---------- */
// Letakkan 9 gambarmu di folder ini: sun.svg, mercure.svg, venus.svg, earth.svg, mars.svg, jupiter.svg, saturn.svg, uranus.svg, neptune.svg
const PLAN_DIR = 'assets/planets/';
// r = jari-jari orbit, d = ukuran gambar, t = detik per putaran (animasi, bukan skala nyata), c = warna cadangan bila gambar belum ada
const BODY = [
  { f: 'sun.svg', n: 'Matahari', c: '#ffd54a', d: 52, tipe: 'Bintang', ord: 'Pusat tata surya',
    v: 'Matahari adalah bintang, bukan planet. Cahaya dan panasnya membuat kita bisa hidup.',
    i: 'Bintang terdekat dengan Bumi. Cahaya dan panasnya membuat kita bisa hidup.',
    rows: [['Jenis', 'Bintang (katai kuning)'], ['Suhu', 'Permukaan ±5.500 °C, bagian inti ±15 juta °C'], ['Ukuran', 'Diameter ±109× Bumi'], ['Jarak ke Bumi', '±150 juta km, cahayanya sampai dalam ±8 menit'],
      ['Satelit alami', 'Tidak ada, justru planet-planet yang mengelilinginya'], ['Orbit', 'Mengelilingi pusat galaksi Bima Sakti, ±230 juta tahun sekali putar']],
    ph: ['Bintik Matahari: bercak gelap karena suhunya lebih rendah dari sekitarnya', 'Lidah api (prominensa) dan semburan raksasa (flare) yang melontarkan partikel', 'Angin Matahari mengalir ke seluruh tata surya dan memicu aurora di Bumi'],
    fun: ['99,8% massa seluruh tata surya ada di Matahari', 'Sekitar 1,3 juta Bumi muat di dalamnya', 'Jangan melihat langsung ke Matahari tanpa pelindung mata'] },
  { f: 'mercure.svg', n: 'Merkurius', c: '#b5b5b5', d: 14, r: 38, t: 5, tipe: 'Planet berbatu', ord: 'Planet ke-1 dari Matahari',
    v: 'Merkurius planet terkecil dan terdekat dengan Matahari. Satu tahunnya hanya 88 hari Bumi!',
    i: 'Planet terkecil dan terdekat dengan Matahari.',
    rows: [['Jarak dari Matahari', '±58 juta km'], ['Orbit (1 tahun)', '88 hari Bumi. Orbitnya paling lonjong dibanding planet lain'], ['Rotasi (1 hari)', 'Berputar sekali ±59 hari Bumi; siang ke siang ±176 hari Bumi'],
      ['Suhu', 'Siang ±430 °C, malam ±−180 °C'], ['Satelit alami', 'Tidak punya'], ['Diameter', '4.879 km (±38% Bumi)']],
    ph: ['Hampir tanpa atmosfer, jadi suhu siang dan malamnya sangat jauh berbeda', 'Permukaannya penuh kawah tabrakan, mirip Bulan', 'Es air bisa bertahan di kawah dekat kutub yang tidak pernah terkena sinar Matahari'],
    fun: ['Satu tahunnya (88 hari) lebih pendek dari satu hari siang-malamnya (176 hari)!', 'Planet tercepat: ±47 km setiap detik', 'Planet terkecil di tata surya'] },
  { f: 'venus.svg', n: 'Venus', c: '#e8c27a', d: 20, r: 54, t: 8, tipe: 'Planet berbatu', ord: 'Planet ke-2 dari Matahari',
    v: 'Venus planet terpanas, sekitar 465 derajat. Venus berputar terbalik, jadi Matahari terbit dari barat.',
    i: 'Planet terpanas di tata surya, diselimuti awan tebal.',
    rows: [['Jarak dari Matahari', '±108 juta km'], ['Orbit (1 tahun)', '225 hari Bumi'], ['Rotasi (1 hari)', 'Berputar sekali ±243 hari Bumi, arahnya terbalik dari kebanyakan planet'],
      ['Suhu', '±465 °C di seluruh permukaan, cukup panas untuk melelehkan timbal'], ['Satelit alami', 'Tidak punya'], ['Diameter', '12.104 km (hampir sama dengan Bumi)']],
    ph: ['Awan tebal asam sulfat menyelimuti seluruh planet', 'Efek rumah kaca ekstrem: atmosfer karbon dioksida, tekanan permukaannya ±92× Bumi', 'Angin di atas awan berputar jauh lebih cepat daripada planetnya sendiri'],
    fun: ['Lebih panas dari Merkurius, padahal lebih jauh dari Matahari', 'Di Venus, Matahari terbit dari barat', 'Dijuluki bintang kejora karena sangat terang di langit'] },
  { f: 'earth.svg', n: 'Bumi', c: '#4aa3ff', d: 22, r: 70, t: 11, tipe: 'Planet berbatu', ord: 'Planet ke-3 dari Matahari',
    v: 'Bumi rumah kita! Satu-satunya planet yang kita tahu ada kehidupan. Bumi punya satu satelit alami, yaitu Bulan.',
    i: 'Rumah kita! Satu-satunya tempat yang kita tahu ada kehidupan.',
    rows: [['Jarak dari Matahari', '±150 juta km (1 satuan astronomi)'], ['Orbit (1 tahun)', '365,25 hari, makanya ada tahun kabisat'], ['Rotasi (1 hari)', '±24 jam'],
      ['Suhu', 'Rata-rata ±15 °C (dari ±−89 °C sampai ±57 °C)'], ['Satelit alami', '1: Bulan (diameternya ±¼ Bumi)'], ['Diameter', '12.742 km']],
    ph: ['Hujan, angin, dan badai petir karena ada atmosfer dan air', 'Aurora di dekat kutub saat angin Matahari menabrak medan magnet Bumi', 'Pasang surut laut akibat tarikan Bulan', 'Gempa bumi dan gunung berapi'],
    fun: ['±71% permukaannya tertutup air', 'Sumbu yang miring 23,5° menyebabkan adanya musim', 'Bulan selalu menunjukkan sisi yang sama ke Bumi'] },
  { f: 'mars.svg', n: 'Mars', c: '#ff6b4a', d: 18, r: 86, t: 16, tipe: 'Planet berbatu', ord: 'Planet ke-4 dari Matahari',
    v: 'Mars planet merah karena tanahnya berkarat. Punya dua satelit kecil, Phobos dan Deimos.',
    i: 'Planet merah karena debunya kaya karat besi.',
    rows: [['Jarak dari Matahari', '±228 juta km'], ['Orbit (1 tahun)', '687 hari Bumi (±1,9 tahun)'], ['Rotasi (1 hari)', '±24 jam 37 menit, hampir sama dengan Bumi'],
      ['Suhu', 'Rata-rata ±−63 °C, dari ±−140 °C sampai ±20 °C'], ['Satelit alami', '2: Phobos dan Deimos (kecil, bentuknya seperti kentang)'], ['Diameter', '6.779 km (±53% Bumi)']],
    ph: ['Badai debu bisa menyelimuti seluruh planet selama berbulan-bulan', 'Tudung es di kutub: es air dan es kering (karbon dioksida)', 'Langit siang berwarna oranye kemerahan, sedangkan senjanya kebiruan', 'Gunung Olympus Mons setinggi ±22 km, ±2,5× Gunung Everest'],
    fun: ['Dulu punya air mengalir. Para ilmuwan mencari tanda kehidupan masa lalu', 'Ngarai Valles Marineris panjangnya ±4.000 km', 'Phobos pelan-pelan mendekati Mars dan suatu saat akan hancur'] },
  { f: null, n: 'Sabuk Asteroid', c: '#9a8f86', d: 0, r: 109, t: 90, tipe: 'Sabuk batu angkasa', ord: 'Antara Mars dan Jupiter', belt: 1,
    v: 'Sabuk asteroid ada di antara Mars dan Jupiter. Isinya jutaan batu angkasa yang mengelilingi Matahari.',
    i: 'Cincin jutaan batu angkasa yang mengelilingi Matahari di antara Mars dan Jupiter.',
    rows: [['Jarak dari Matahari', '±330 sampai 480 juta km'], ['Orbit (1 tahun)', 'Tiap asteroid mengelilingi Matahari dalam ±3 sampai 6 tahun Bumi'], ['Rotasi (1 hari)', 'Beda-beda, ada yang berputar hanya dalam beberapa jam'],
      ['Suhu', 'Sangat dingin, kira-kira −70 °C sampai −110 °C'], ['Satelit alami', 'Sebagian asteroid punya bulan kecil, misalnya Ida dengan Dactyl'], ['Ukuran', 'Dari butiran debu sampai Ceres (±940 km)']],
    ph: ['Asteroid kadang bertabrakan dan pecah menjadi batu-batu kecil', 'Pecahannya bisa jatuh ke Bumi sebagai meteorit', 'Planet katai Ceres menyimpan es air dan garam'],
    fun: ['Seluruh massanya hanya ±3% massa Bulan', 'Antar asteroid sangat berjauhan, jadi wahana bisa lewat dengan aman, tidak seperti di film', 'Diduga sisa bahan planet yang gagal terbentuk karena tarikan gravitasi Jupiter'] },
  { f: 'jupiter.svg', n: 'Jupiter', c: '#e0a870', d: 40, r: 138, t: 26, tipe: 'Raksasa gas', ord: 'Planet ke-5 dari Matahari',
    v: 'Jupiter planet terbesar. Badai raksasanya, Bintik Merah Besar, sudah terlihat lebih dari 150 tahun.',
    i: 'Planet terbesar di tata surya.',
    rows: [['Jarak dari Matahari', '±778 juta km'], ['Orbit (1 tahun)', '±11,9 tahun Bumi'], ['Rotasi (1 hari)', '±9 jam 56 menit, hari tercepat di antara semua planet'],
      ['Suhu', 'Puncak awan ±−110 °C, makin ke dalam makin panas'], ['Satelit alami', 'Lebih dari 90. Empat terbesar: Io, Europa, Ganymede, Callisto'], ['Diameter', '±139.800 km (±11× Bumi)']],
    ph: ['Bintik Merah Besar: badai raksasa yang sudah terlihat lebih dari 150 tahun', 'Awan berpita cokelat dan putih yang ditiup angin kencang', 'Petir dan aurora raksasa di dekat kutubnya'],
    fun: ['Sekitar 1.300 Bumi muat di dalam Jupiter', 'Ganymede, satelitnya, lebih besar dari planet Merkurius', 'Io punya gunung berapi paling aktif di tata surya, Europa menyimpan lautan di bawah es'] },
  { f: 'saturn.svg', n: 'Saturnus', c: '#f0d98a', d: 44, r: 160, t: 34, tipe: 'Raksasa gas', ord: 'Planet ke-6 dari Matahari',
    v: 'Saturnus punya cincin indah dari es dan batu. Saturnus sangat ringan, kerapatannya lebih kecil dari air!',
    i: 'Planet bercincin indah yang sangat ringan.',
    rows: [['Jarak dari Matahari', '±1,43 miliar km'], ['Orbit (1 tahun)', '±29,5 tahun Bumi'], ['Rotasi (1 hari)', '±10 jam 33 menit'],
      ['Suhu', 'Puncak awan ±−140 °C'], ['Satelit alami', 'Lebih dari 270, terbanyak di tata surya. Terbesar: Titan'], ['Diameter', '±116.500 km (±9× Bumi)']],
    ph: ['Cincin dari kepingan es dan batu, lebarnya ratusan ribu km tetapi sangat tipis', 'Badai berbentuk segi enam di kutub utaranya', 'Titan punya atmosfer tebal dan danau metana cair; Enceladus menyemburkan geyser es dari lautan di bawah kulitnya'],
    fun: ['Kerapatannya lebih kecil dari air, jadi (kalau ada bak raksasa) ia akan mengapung', 'Cincinnya diperkirakan akan menghilang dalam ratusan juta tahun', 'Titan lebih besar dari planet Merkurius'] },
  { f: 'uranus.svg', n: 'Uranus', c: '#7fe0e6', d: 28, r: 176, t: 44, tipe: 'Raksasa es', ord: 'Planet ke-7 dari Matahari',
    v: 'Uranus berputar miring seperti bola menggelinding. Sangat dingin, sampai minus 224 derajat!',
    i: 'Planet miring yang sangat dingin.',
    rows: [['Jarak dari Matahari', '±2,87 miliar km'], ['Orbit (1 tahun)', '±84 tahun Bumi'], ['Rotasi (1 hari)', '±17 jam 14 menit, arahnya terbalik seperti Venus'],
      ['Suhu', 'Rata-rata ±−195 °C, terendah ±−224 °C (planet terdingin)'], ['Satelit alami', 'Sekitar 29, misalnya Titania, Oberon, Miranda, Ariel, Umbriel'], ['Diameter', '±50.700 km (±4× Bumi)']],
    ph: ['Sumbunya miring ±98°, sehingga tiap kutub mengalami ±42 tahun terang lalu ±42 tahun gelap', 'Warnanya biru kehijauan karena gas metana', '13 cincin tipis dan gelap mengelilinginya'],
    fun: ['Planet pertama yang ditemukan dengan teleskop (tahun 1781)', 'Satelit Miranda punya tebing setinggi ±20 km', 'Termasuk planet raksasa es, bukan raksasa gas'] },
  { f: 'neptune.svg', n: 'Neptunus', c: '#4a6bff', d: 28, r: 190, t: 52, tipe: 'Raksasa es', ord: 'Planet ke-8 dari Matahari',
    v: 'Neptunus planet terjauh dengan angin sangat kencang. Satu tahunnya sama dengan 165 tahun Bumi.',
    i: 'Planet terjauh dengan angin tercepat.',
    rows: [['Jarak dari Matahari', '±4,5 miliar km'], ['Orbit (1 tahun)', '±165 tahun Bumi. Baru sekali mengelilingi Matahari sejak ditemukan (2011)'], ['Rotasi (1 hari)', '±16 jam'],
      ['Suhu', 'Puncak awan ±−200 °C'], ['Satelit alami', 'Sekitar 16. Terbesar: Triton'], ['Diameter', '±49.200 km (±3,9× Bumi)']],
    ph: ['Angin tercepat di tata surya, bisa lebih dari 2.000 km per jam', 'Bintik Gelap: badai besar yang muncul lalu menghilang', 'Triton mengorbit berlawanan arah putaran Neptunus dan menyemburkan geyser nitrogen, suhunya ±−235 °C'],
    fun: ['Ditemukan lewat perhitungan matematika sebelum terlihat di teleskop (1846)', 'Warna birunya yang pekat berasal dari gas metana', 'Triton diduga tangkapan dari Sabuk Kuiper'] }
];
const planImg = (b, cx, cy, h) => `<image href="${PLAN_DIR}${b.f}" x="${cx - h}" y="${cy - h}" width="${h * 2}" height="${h * 2}" onerror="this.style.display='none';this.nextElementSibling.style.display=''"/>\
<circle cx="${cx}" cy="${cy}" r="${h * .85}" fill="${b.c}" style="display:none"/>`;
function beltDots(O, d0 = 100, span = 18) {
  let s = 7; const r = () => (s = s * 16807 % 2147483647) / 2147483647;
  return Array.from({ length: 120 }, () => {
    const a = r() * 6.2832, d = d0 + r() * span, z = .7 + r() * 1.3, g = 140 + Math.floor(r() * 90);
    return `<circle cx="${(O + d * Math.cos(a)).toFixed(1)}" cy="${(O + d * Math.sin(a)).toFixed(1)}" r="${z.toFixed(1)}" fill="rgb(${g},${g - 8},${g - 22})"/>`;
  }).join('');
}
let PL = null;
function planStart() {
  PL = { seen: new Set(), given: false, msg: '' };
  const O = 205, orbits = BODY.map((b, i) => {
    if (!b.r) return '';
    const ring = `<circle cx="${O}" cy="${O}" r="${b.r}" fill="none" stroke="#fff3"${b.belt ? ' stroke-dasharray="2 5"' : ''}/>`;
    const delay = `animation-delay:-${(b.t * ((i * 0.37) % 1)).toFixed(1)}s`;
    if (b.belt) return `${ring}<g class="orb" style="animation-duration:${b.t}s;${delay}">${beltDots(O)}</g>\
<circle cx="${O}" cy="${O}" r="${b.r}" fill="none" stroke="transparent" stroke-width="24" pointer-events="stroke" data-act="plansel" data-i="${i}"/>`;
    const h = b.d / 2, hit = Math.max(h + 8, 18);
    return `${ring}<g class="orb" style="animation-duration:${b.t}s;${delay}"><g class="upr" style="animation-duration:${b.t}s;${delay}">${planImg(b, O + b.r, O, h)}\
<circle cx="${O + b.r}" cy="${O}" r="${hit}" fill="transparent" data-act="plansel" data-i="${i}"/></g></g>`;
  }).join('');
  const sun = BODY[0];
  render(shell('Planetarium Mini', `<p class="hint">Ketuk Matahari, planet, atau sabuk asteroid untuk mengenalnya!</p>
    <svg viewBox="0 0 410 410" class="solar" id="solar"><g style="filter:drop-shadow(0 0 12px #ffb300)">${planImg(sun, O, O, sun.d / 2)}</g>
    <circle cx="${O}" cy="${O}" r="30" fill="transparent" data-act="plansel" data-i="0"/>${orbits}</svg>
    <div class="chips">${BODY.map((b, i) => `<button class="chip" data-act="plansel" data-i="${i}"><i style="background:${b.c}"></i>${b.n}</button>`).join('')}</div>
    <button class="btn ghost" data-act="planpause">⏸ Jeda / ▶ Putar</button>
    <div class="card" id="pi"></div><div id="pp"></div>`));
  planInfo();
}
function planInfo() {
  $('#pi').innerHTML = `<p>🔭 Sudah dikenali: <b>${PL.seen.size}</b> dari ${BODY.length} benda langit</p><p class="small">Kenali 4 benda langit untuk mendapat bintang!</p>${PL.msg}`;
}
function planSel(i) {
  const b = BODY[i]; PL.seen.add(i);
  if (PL.seen.size >= 4 && !PL.given) {
    PL.given = true;
    const got = reward('planetarium', { iq: 4, stars: 2 }), cap = lastCap; lastCap = false;
    PL.msg = cap ? '<p class="soft">⭐ Bintang Planetarium sudah kamu dapat hari ini. Besok bisa dapat lagi ya!</p>' : `<p class="good">⭐ +${got} bintang! Kamu sudah mengenal 4 benda langit.</p>`;
  }
  const img = b.f ? `<img src="${PLAN_DIR}${b.f}" alt="${esc(b.n)}" onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'ppfall'}))">`
    : `<svg viewBox="0 0 120 120" class="ppbelt" aria-hidden="true">${beltDots(60, 22, 34)}</svg>`;
  $('#pp').innerHTML = `<div class="pp" data-act="planclose"><article class="ppc" style="--c:${b.c}" role="dialog" aria-modal="true" aria-label="${esc(b.n)}" data-act="ppkeep">
    <button class="icon ppx" data-act="planclose" aria-label="Tutup">✕</button>
    <div class="ppimg">${img}</div><h3>${esc(b.n)}</h3><p class="small">${esc(b.tipe)} • ${esc(b.ord)}</p><p>${esc(b.i)}</p>
    <dl class="ppd">${b.rows.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
    <h4>🌦️ Fenomena alam</h4><ul>${b.ph.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    <h4>✨ Fun fact</h4><ul>${b.fun.map(x => `<li>${esc(x)}</li>`).join('')}</ul>${PL.msg}
    <button class="btn big" data-act="planclose">Tutup</button></article></div>`;
  app.querySelectorAll('.chip').forEach((c, k) => c.classList.toggle('on', k === i));
  planInfo(); say2(b.v);
}
function planClose() { const p = $('#pp'); if (p) p.innerHTML = ''; if ('speechSynthesis' in window) speechSynthesis.cancel(); }
addEventListener('keydown', e => { if (e.key === 'Escape' && $('#pp .pp')) planClose(); });

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

/* ---------- Buang sampah pintar (seret & lepas) ---------- */
// [ikon, nama, warna, penjelasan, keterangan singkat]
const BINS = {
  org: ['🍃', 'Organik', '#3ddc84', 'Organik berasal dari makhluk hidup dan bisa membusuk, jadi bisa dijadikan kompos.', 'sisa makanan, daun'],
  anorg: ['🧴', 'Anorganik', '#ffd23f', 'Anorganik sulit membusuk (plastik, kaleng, kaca) tetapi bisa didaur ulang.', 'plastik, kaleng, kaca'],
  kertas: ['📰', 'Kertas', '#4aa3ff', 'Kertas bisa didaur ulang menjadi kertas baru. Simpan dalam keadaan kering.', 'koran, kardus'],
  medis: ['⚠️', 'Lainnya', '#ff5b5b', 'Masker bekas (medis) dan baterai (B3, bahan berbahaya) bisa menular atau beracun. Jangan disentuh langsung, minta bantuan orang dewasa dan buang di tempat khusus.', 'medis & B3']
};
// 10 sampah yang sering kita temui sehari-hari
const TRASH = [['🍌', 'kulit pisang', 'org'], ['🍚', 'sisa nasi', 'org'], ['🥬', 'sisa sayur', 'org'],
  ['🥤', 'botol plastik', 'anorg'], ['🛍️', 'kantong plastik', 'anorg'], ['🥫', 'kaleng bekas', 'anorg'],
  ['📦', 'kardus', 'kertas'], ['📰', 'koran bekas', 'kertas'],
  ['😷', 'masker bekas', 'medis'], ['🔋', 'baterai bekas', 'medis']];
let W = null, TD = null;
function trashStart() {
  W = { items: shuffle(TRASH).map(t => ({ e: t[0], n: t[1], b: t[2], ok: true, gone: false })), placed: 0, ok: 0, wrong: 0, sel: null, done: false, noClick: false, cnt: { org: 0, anorg: 0, kertas: 0, medis: 0 } };
  render(shell('Buang Sampah', `<p class="hint">Seret setiap sampah ke tong yang tepat! Sisa: <b id="trl">${W.items.length}</b></p>
    <div class="tray">${W.items.map((t, i) => `<button class="titem" data-act="trsel" data-i="${i}" aria-label="${esc(t.n)}"><span>${t.e}</span><small>${esc(t.n)}</small></button>`).join('')}</div>
    <p id="fb" class="fb">Tahan sampahnya, lalu seret ke tong di bawah. (Bisa juga ketuk sampah, lalu ketuk tong.)</p>
    <div class="tbins">${Object.keys(BINS).map(k => `<button class="tbin" style="--bc:${BINS[k][2]}" data-act="trbin" data-b="${k}" aria-label="Tong ${BINS[k][1]}"><span class="lid"></span><span class="tb">${BINS[k][0]}<em class="cnt">0</em></span><b>${BINS[k][1]}</b><small>${BINS[k][4]}</small></button>`).join('')}</div>`));
  W.tk = token; say2('Seret setiap sampah ke tong sampah yang tepat!');
}
function trashDrop(i, b) {
  if (!W || W.done) return;
  const t = W.items[i]; if (!t || t.gone) return;
  const el = app.querySelector(`.titem[data-i="${i}"]`), bin = app.querySelector(`.tbin[data-b="${b}"]`), tk = W.tk;
  W.sel = null; app.querySelectorAll('.titem.sel').forEach(x => x.classList.remove('sel'));
  const flash = c => { bin.classList.add(c); setTimeout(() => bin.classList.remove(c), 600); };
  if (b === t.b) {
    if (t.ok) W.ok++;
    t.gone = true; W.placed++; el.classList.add('gone'); el.disabled = true;
    bin.querySelector('.cnt').textContent = ++W.cnt[b]; flash('right'); beep(784, .2);
    $('#trl').textContent = W.items.length - W.placed;
    $('#fb').textContent = `✅ ${t.n[0].toUpperCase() + t.n.slice(1)} masuk tong ${BINS[b][1]}. ${BINS[b][3]}`; say2(BINS[b][3]);
    if (W.placed === W.items.length) { W.done = true; setTimeout(() => { if (W && W.tk === tk && tk === token) trashEnd(); }, 3200); }
  } else {
    t.ok = false; W.wrong++; flash('wrong'); beep(200, .15);
    $('#fb').textContent = `Belum tepat. ${t.n} bukan sampah ${BINS[b][1]}. Coba tong lain 💪`;
  }
}
const trBinAt = (x, y) => { const e = document.elementFromPoint(x, y); return e && e.closest ? e.closest('.tbin') : null; };
app.addEventListener('pointerdown', e => {
  const b = e.target.closest('.titem');
  if (!b || !W || !W.items || W.tk !== token || W.done || b.disabled || e.button > 0) return;
  e.preventDefault();
  const r = b.getBoundingClientRect(), g = b.cloneNode(true);
  g.className = 'titem ghost'; g.removeAttribute('data-act');
  g.style.cssText = `width:${r.width}px;height:${r.height}px;left:${r.left}px;top:${r.top}px`;
  document.body.appendChild(g); b.classList.add('lift');
  TD = { i: +b.dataset.i, el: b, g, ox: e.clientX - r.left, oy: e.clientY - r.top, sx: e.clientX, sy: e.clientY, moved: false };
});
addEventListener('pointermove', e => {
  if (!TD) return;
  if (!TD.moved && Math.hypot(e.clientX - TD.sx, e.clientY - TD.sy) > 6) TD.moved = true;
  TD.g.style.left = (e.clientX - TD.ox) + 'px'; TD.g.style.top = (e.clientY - TD.oy) + 'px';
  const bin = trBinAt(e.clientX, e.clientY);
  app.querySelectorAll('.tbin').forEach(x => x.classList.toggle('hot', x === bin));
});
function trUp(e, cancel) {
  if (!TD) return;
  const d = TD; TD = null; d.g.remove(); d.el.classList.remove('lift');
  app.querySelectorAll('.tbin.hot').forEach(x => x.classList.remove('hot'));
  if (cancel || !d.moved || !W || W.tk !== token) return;      // ketukan biasa ditangani oleh 'click'
  W.noClick = true; setTimeout(() => { if (W) W.noClick = false; }, 60);
  const bin = trBinAt(e.clientX, e.clientY); if (bin) trashDrop(d.i, bin.dataset.b);
}
addEventListener('pointerup', e => trUp(e, false)); addEventListener('pointercancel', e => trUp(e, true));
function trashEnd() {
  const n = W.items.length, acc = W.ok / n, stars = acc >= .8 ? 3 : acc >= .5 ? 2 : 1;
  reward('sampah', { iq: 1, eq: W.ok, aq: Math.min(W.wrong, 4), stars });
  result('Bumi lebih bersih!', stars, `Benar di percobaan pertama: ${W.ok} dari ${n}. Memilah sampah membantu daur ulang dan menjaga kesehatan.`, '<button class="btn big" data-act="g_trash">Main lagi</button>');
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
  g_mix: gate(mixStart), cmadd(d) { mixAdd(d.c); }, cmclear() { if (!Cx.done) { Cx.d = []; $('#cm').textContent = 'Cangkir dikosongkan.'; mixUpdate(); } }, cmcheck: mixCheck,
  cmnext() { Cx.i++; if (Cx.i >= Cx.rs.length) mixEnd(); else mixRound(); },
  g_sak: gate(() => { lvl2Back = null; circMenu(); }),
  skmenu() { if (lvl > 2) history.go(2 - lvl); else circMenu(); },
  sk1: skGo(sk1Start), sk1t: sk1Toggle,
  sk2: skGo(sk2Start), sk2n() { Wc.i++; if (Wc.i >= Wc.rs.length) skEnd(2, 'Kabel rapi semua!', skStars(Wc.fails), 'Warna kabel menandai fungsinya. Mencocokkan dengan teliti membuat instalasi rapi dan aman, tidak tertukar.', 2, Math.min(Wc.fails, 4) + 1); else sk2Round(); },
  sk3: skGo(sk3Start), sk3t(d) { sk3Toggle(+d.i); }, sk3n() { D3.i++; if (D3.i >= D3.n) skEnd(3, 'Misi saklar ganda selesai!', D3.moves <= D3.n * 4 ? 3 : D3.moves <= D3.n * 7 ? 2 : 1, 'Di rumah, tiap saklar punya jalur terpisah, bahkan dua saklar bisa mengatur satu lampu (seperti di tangga). Mencoba dan mengamati membantu kita memahami jalurnya.', 3, 1); else sk3Round(); },
  sk4: skGo(sk4Start), sk4b(d) { sk4In(d.s); }, sk4n() { Bk.i++; if (Bk.i >= Bk.rs.length) skEnd(4, 'Pola kedip hafal!', skStars(Bk.fails), 'Lampu bisa diatur polanya: kedip pada lampu sein, lampu peringatan, mercusuar, dan lampu pintar. Meniru pola melatih memori kerja.', 3, Math.min(Bk.fails, 4) + 1); else sk4Round(); },
  sk5: skGo(sk5Start), sk5p(d) { sk5Press(+d.i); }, sk5r() { Dt.on = Dt.on.map(() => false); Dt.boom = false; Dt.msg = 'Ayo coba lagi, baca petunjuknya dengan teliti.'; sk5Draw(); },
  sk5n() { Dt.i++; if (Dt.i >= Dt.n) skEnd(5, 'Detektif Saklar hebat!', skStars(Dt.fails), 'Berpikir dulu sebelum menekan tombol adalah kontrol diri. Menalar dari petunjuk membuat kita tidak asal coba-coba.', 3, Math.min(Dt.fails, 4) + 2); else sk5Round(); },
  sk6: skGo(sk6Start), sk6f(d) { sk6Fix(d.c); }, sk6n() { Fx.i++; if (Fx.i >= Fx.fs.length) skEnd(6, 'Teknisi Cilik!', skStars(Fx.fails), 'Kalau lampu mati, periksa tiga hal: lampunya, saklarnya, dan jalur kabelnya. Ikuti arus sampai tempat ia berhenti. Listrik asli berbahaya, minta orang dewasa memperbaikinya.', 3, 2); else sk6Round(); },
  g_plan: gate(planStart),
  plansel(d) { planSel(+d.i); },
  planpause() { $('#solar').classList.toggle('paused'); },
  planclose: planClose, ppkeep() { },
  g_rain: gate(rainStart), rainnext: rainNext,
  g_tanam: gate(tanamStart),
  t_soil() { T.soil = 1; beep(300, .1); tanamDraw(); },
  t_seed() { T.seed = 1; beep(400, .1); tanamDraw(); },
  t_water() { T.w++; beep(500, .1); tanamDraw(); },
  t_sun() { T.s++; beep(600, .1); tanamDraw(); },
  t_done: tanamDone,
  g_trash: gate(trashStart),
  trsel(d, b) { if (!W || W.noClick || W.done || b.disabled) return; const on = W.sel === +d.i; W.sel = on ? null : +d.i; app.querySelectorAll('.titem').forEach(x => x.classList.toggle('sel', !on && x === b)); if (!on) $('#fb').textContent = 'Sekarang ketuk tong yang tepat 👇'; },
  trbin(d) { if (!W || W.done) return; if (W.sel == null) { $('#fb').textContent = 'Ketuk atau seret sampahnya dulu ya!'; return; } trashDrop(W.sel, d.b); },
  engsay() { say(E.qs[E.li].en, 'en-US'); },
  englnext() { if (E.li >= E.qs.length - 1) { E.li = 0; engQ(); } else { E.li++; engLearn(); } }
});

addEventListener('resize', () => { if (skRe && $('#kb')) skRe(); });