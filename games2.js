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
  const young = P().age < 7, pool = young ? ['RY', 'YB', 'RB'] : ['RY', 'YB', 'RB', 'RW', 'BW', 'RYB', 'YBW', 'RBW'];
  Cx = { young, rs: shuffle(pool).slice(0, young ? 3 : 5), i: 0, fails: 0 };
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
  const stars = skStars(Cx.fails);
  reward('warna', { iq: 3, aq: Math.min(Cx.fails, 4) + 1, stars });
  result('Pelukis warna!', stars, 'Merah, kuning, dan biru adalah warna dasar. Dua warna dasar yang dicampur menghasilkan warna baru, dan putih membuat warna menjadi lebih muda.', '<button class="btn big" data-act="g_mix">Main lagi</button>');
}

/* ---------- Planetarium mini ---------- */
/* Dilihat dari atas Tata Surya: semua planet MENGORBIT Matahari berlawanan arah jarum jam.
   ROTASI (berputar pada porosnya) juga berlawanan arah jarum jam, KECUALI Venus dan Uranus yang searah jarum jam (retrograde). */
const SUN = ['Matahari', '#ffd54a', 'Bintang terdekat dengan Bumi, bukan planet. Cahaya dan panasnya membuat kita bisa hidup. Matahari juga berputar pada porosnya, berlawanan arah jarum jam.'];
const PC = 230;   // titik pusat & setengah lebar viewBox (460 x 460)
// [nama, warna, radius, jari-jari orbit, detik 1 putaran orbit, info, arah rotasi (1 = ↺ berlawanan jarum jam, -1 = ↻ searah jarum jam), detik 1 putaran rotasi (dipercepat), posisi awal]
const PLN = [
  ['Merkurius', '#b5b5b5', 6.5, 44, 8, 'Planet terkecil dan terdekat dengan Matahari. Satu tahunnya hanya 88 hari Bumi!', 1, 7, .1],
  ['Venus', '#e8c27a', 10, 70, 12, 'Planet terpanas, sekitar 465°C, diselimuti awan tebal. Venus berputar terbalik, jadi di sana Matahari terbit dari barat!', -1, 5, .45],
  ['Bumi', '#4aa3ff', 10.5, 96, 17, 'Rumah kita! Satu-satunya planet yang kita tahu ada kehidupan. Sekitar 70% permukaannya air.', 1, 3, .75],
  ['Mars', '#ff6b4a', 8, 121, 24, 'Planet merah karena tanahnya berkarat. Punya gunung tertinggi di tata surya, Olympus Mons.', 1, 3.2, .25],
  ['Jupiter', '#e0a870', 18, 153, 39, 'Planet terbesar. Badai raksasanya, Bintik Merah, sudah terlihat lebih dari 150 tahun.', 1, 1.8, .6],
  ['Saturnus', '#f0d98a', 14, 183, 51, 'Punya cincin indah dari es dan batu. Saturnus sangat ringan, kerapatannya lebih kecil dari air!', 1, 2.1, .9],
  ['Uranus', '#7fe0e6', 11.5, 201, 66, 'Berputar miring seperti bola menggelinding, sumbunya hampir rebah. Arah putarnya juga terbalik. Sangat dingin.', -1, 4.5, .35],
  ['Neptunus', '#4a6bff', 11.5, 217, 78, 'Planet terjauh dengan angin sangat kencang. Satu tahunnya sama dengan 165 tahun Bumi.', 1, 2.6, .05]];
// gambar permukaan tiap planet (koordinat absolut; ikut berputar bersama planet)
const PFEAT = [
  (x, y, r) => `<circle cx="${x - r * .35}" cy="${y - r * .2}" r="${r * .22}" fill="#8a8a8a"/><circle cx="${x + r * .3}" cy="${y + r * .25}" r="${r * .3}" fill="#9a9a9a"/><circle cx="${x + r * .1}" cy="${y - r * .55}" r="${r * .15}" fill="#7d7d7d"/>`,
  (x, y, r) => `<path d="M${x - r} ${y - r * .3} Q${x - r * .3} ${y - r * .8} ${x + r * .2} ${y - r * .3} T${x + r} ${y - r * .2}" stroke="#fff6d0" stroke-width="${r * .28}" fill="none" opacity=".85"/><path d="M${x - r} ${y + r * .4} Q${x} ${y} ${x + r} ${y + r * .5}" stroke="#c99a4a" stroke-width="${r * .3}" fill="none" opacity=".8"/>`,
  (x, y, r) => `<path d="M${x - r * .7} ${y - r * .5} Q${x - r * .2} ${y - r * .9} ${x + r * .1} ${y - r * .4} Q${x - r * .1} ${y} ${x - r * .5} ${y + r * .1}Z" fill="#3fbf6a"/><path d="M${x + r * .2} ${y + r * .1} Q${x + r * .8} ${y} ${x + r * .6} ${y + r * .7} Q${x + r * .3} ${y + r * .6} ${x + r * .2} ${y + r * .1}Z" fill="#3fbf6a"/><ellipse cx="${x - r * .1}" cy="${y + r * .55}" rx="${r * .5}" ry="${r * .13}" fill="#fff" opacity=".8"/>`,
  (x, y, r) => `<path d="M${x - r * .6} ${y - r * .2} Q${x - r * .1} ${y - r * .6} ${x + r * .4} ${y - r * .1} Q${x} ${y + r * .3} ${x - r * .6} ${y - r * .2}Z" fill="#a8412a"/><circle cx="${x + r * .45}" cy="${y + r * .5}" r="${r * .28}" fill="#fff" opacity=".85"/>`,
  (x, y, r) => `<rect x="${x - r}" y="${y - r * .6}" width="${r * 2}" height="${r * .28}" fill="#b9733a"/><rect x="${x - r}" y="${y - r * .05}" width="${r * 2}" height="${r * .3}" fill="#f6dcb8"/><rect x="${x - r}" y="${y + r * .45}" width="${r * 2}" height="${r * .25}" fill="#b9733a"/><ellipse cx="${x + r * .35}" cy="${y + r * .2}" rx="${r * .26}" ry="${r * .15}" fill="#d9532c"/>`,
  (x, y, r) => `<rect x="${x - r}" y="${y - r * .55}" width="${r * 2}" height="${r * .25}" fill="#c9a85a"/><rect x="${x - r}" y="${y}" width="${r * 2}" height="${r * .3}" fill="#fff0b8"/><rect x="${x - r}" y="${y + r * .5}" width="${r * 2}" height="${r * .22}" fill="#c9a85a"/>`,
  (x, y, r) => `<rect x="${x - r}" y="${y - r * .35}" width="${r * 2}" height="${r * .25}" fill="#b8f5f8" opacity=".9"/><circle cx="${x + r * .45}" cy="${y + r * .4}" r="${r * .2}" fill="#4cc6cf"/><circle cx="${x - r * .5}" cy="${y - r * .55}" r="${r * .12}" fill="#fff" opacity=".8"/>`,
  (x, y, r) => `<ellipse cx="${x - r * .25}" cy="${y + r * .15}" rx="${r * .35}" ry="${r * .2}" fill="#27379f"/><path d="M${x - r} ${y - r * .4} Q${x} ${y - r * .75} ${x + r} ${y - r * .3}" stroke="#d7e2ff" stroke-width="${r * .18}" fill="none" opacity=".85"/>`
];
let PL = null;
function planStart() {
  PL = { seen: new Set(), given: false };
  const orbits = PLN.map(([n, c, r, R, t, , dir, st, f], i) => {
    const x = PC + R, y = PC, sp = `transform-origin:${x}px ${y}px`;
    return `<circle cx="${PC}" cy="${PC}" r="${R}" fill="none" stroke="#fff3"/>
    <g class="orb" style="animation-duration:${t}s;animation-delay:-${(t * f).toFixed(2)}s">
      <g class="keep" style="${sp};animation-duration:${t}s;animation-delay:-${(t * f).toFixed(2)}s">
        <circle id="sr${i}" class="selring" cx="${x}" cy="${y}" r="${r + 6}" fill="none" stroke="#ffd54a" stroke-width="2.5"/>
        <circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>
        <g clip-path="url(#pcl${i})"><g class="spin ${dir > 0 ? 'ccw' : 'cw'}" style="${sp};animation-duration:${st}s">${PFEAT[i](x, y, r)}</g></g>
        <circle cx="${x}" cy="${y}" r="${r}" fill="url(#pshade)"/>
        ${i === 5 ? `<ellipse cx="${x}" cy="${y}" rx="${r + 12}" ry="${r * .3}" fill="none" stroke="#e9d69a" stroke-width="3" transform="rotate(-18 ${x} ${y})"/>` : ''}
        <circle cx="${x}" cy="${y}" r="${r + 11}" fill="transparent" data-act="plansel" data-i="${i}"/>
      </g></g>`;
  }).join('');
  const clips = PLN.map(([n, c, r, R], i) => `<clipPath id="pcl${i}"><circle cx="${PC + R}" cy="${PC}" r="${r}"/></clipPath>`).join('');
  render(shell('Planetarium Mini', `<p class="hint">Ketuk planet atau namanya untuk mengenalnya!</p>
    <svg viewBox="0 0 ${PC * 2} ${PC * 2}" class="solar" id="solar"><defs>${clips}
      <radialGradient id="pshade" cx=".35" cy=".3" r=".85"><stop offset="0" stop-color="#fff" stop-opacity=".4"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient>
      <radialGradient id="sunG" cx=".38" cy=".32" r=".8"><stop offset="0" stop-color="#fff6b0"/><stop offset=".5" stop-color="#ffd54a"/><stop offset="1" stop-color="#ff9d00"/></radialGradient></defs>
    <circle cx="${PC}" cy="${PC}" r="24" fill="url(#sunG)" style="filter:drop-shadow(0 0 14px #ffb300)"/>
    <circle id="sr-1" class="selring" cx="${PC}" cy="${PC}" r="31" fill="none" stroke="#ffd54a" stroke-width="2.5"/>
    <circle cx="${PC}" cy="${PC}" r="34" fill="transparent" data-act="plansel" data-i="-1"/>${orbits}</svg>
    <p class="small plnote">Dilihat dari atas Tata Surya. Semua planet mengelilingi Matahari ke arah yang sama (↺). Yang berbeda adalah putaran pada porosnya: <b>Venus dan Uranus berputar ↻ terbalik</b>. Ukuran, jarak, dan kecepatan tidak sesuai skala.</p>
    <div class="chips"><button class="chip" data-act="plansel" data-i="-1"><i style="background:${SUN[1]}"></i>${SUN[0]}</button>${PLN.map((p, i) => `<button class="chip" data-act="plansel" data-i="${i}"><i style="background:${p[1]}"></i>${p[0]}</button>`).join('')}</div>
    <button class="btn ghost" data-act="planpause">⏸ Jeda / ▶ Putar</button>
    <div class="card" id="pi"><p>Pilih benda langit di atas 🔭</p></div>`));
}
function planSel(i) {
  const o = i < 0 ? SUN : PLN[i]; PL.seen.add(i);
  const order = i < 0 ? 'Pusat tata surya' : `Planet ke-${i + 1} dari Matahari`;
  const rot = i < 0 ? '' : o[6] > 0 ? '<p class="spinline">↺ Rotasi: berlawanan arah jarum jam, seperti kebanyakan planet.</p>' : '<p class="spinline rev">↻ Rotasi: searah jarum jam, kebalikan planet lain!</p>';
  let extra = '';
  if (PL.seen.size >= 4 && !PL.given) { PL.given = true; reward('planetarium', { iq: 4, stars: 2 }); extra = '<p class="good">⭐ +2 bintang! Kamu sudah mengenal 4 benda langit.</p>'; }
  $('#pi').innerHTML = `<h3 style="color:${o[1]}">${o[0]}</h3><p class="small">${order}</p>${rot}<p>${esc(o[i < 0 ? 2 : 5])}</p>${extra}`;
  app.querySelectorAll('.chip').forEach((c, k) => c.classList.toggle('on', k === i + 1));
  app.querySelectorAll('.selring').forEach(r => r.classList.toggle('on', r.id === 'sr' + i));
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
  g_rain: gate(rainStart), rainnext: rainNext,
  g_tanam: gate(tanamStart),
  t_soil() { T.soil = 1; beep(300, .1); tanamDraw(); },
  t_seed() { T.seed = 1; beep(400, .1); tanamDraw(); },
  t_water() { T.w++; beep(500, .1); tanamDraw(); },
  t_sun() { T.s++; beep(600, .1); tanamDraw(); },
  t_done: tanamDone,
  g_trash: gate(trashStart), trpick(d, b) { trashPick(d.b, b); }
});

addEventListener('resize', () => { if (skRe && $('#kb')) skRe(); });