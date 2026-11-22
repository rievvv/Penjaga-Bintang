'use strict';
/* Game Matematika (5 level per game): Penjumlahan, Pengurangan, Perkalian, Pembagian, Pecahan.
   Dimuat setelah games3.js (memakai lvMenu, lvWin, lvOf, LV, LVD, lvEntry, say3). Seret & lepas benda ke wadah, atau ketuk sebagai cadangan.
   Mesin: tiap level = fungsi (putaran, anakKecil) -> spec {text, zones, tap, onMove, check, asks, draw, btns, onBtn}. */
let IDC = 0, MD = null, DG = null;
const RN = (a, b) => a + rnd(b - a + 1);
const mk = (n, e, t, v) => Array.from({ length: n }, () => ({ id: 'i' + (++IDC), e, t: t || 'x', v: v == null ? 1 : v }));
const zone = (id, label, o) => Object.assign({ id, label, items: [], cap: null, row: 0 }, o);
const cnt = z => (z.base || 0) + z.items.filter(i => !i.lk).length;
const sm = z => (z.base || 0) + z.items.reduce((a, i) => a + (i.lk ? 0 : i.v), 0);
const nOf = (z, t) => z.items.filter(i => i.t === t).length;
const IK = '<span class="ik">🎁<small>10</small></span>';
function opts(ans) {
  const c = new Set([ans]);
  for (const d of shuffle([-1, 1, 2, -2, 10, -10, 3])) { if (c.size >= 3) break; if (ans + d > 0) c.add(ans + d); }
  return shuffle([...c]).map(String);
}
const ASK = (q, ans, why, o) => Object.assign({ q, opts: opts(ans), ans: String(ans), why }, o || {});
const ASKS = (q, ans, wrong, why, o) => Object.assign({ q, opts: shuffle([...new Set([ans, ...wrong])].slice(0, 3)), ans, why }, o || {});
const bars = (rows) => rows.map(([l, n, d, c2]) => `<div class="frow"><span>${l}</span><div class="fbar">${Array.from({ length: d }, (_, k) => `<i class="${k < n ? 'on' : c2 && k < n + c2 ? 'on2' : ''}"></i>`).join('')}</div></div>`).join('');
function pizza(n, set) {
  const p = k => { const a = k * 2 * Math.PI / n - Math.PI / 2; return [100 + 90 * Math.cos(a), 100 + 90 * Math.sin(a)]; };
  return `<svg viewBox="0 0 200 200" class="pizza">${Array.from({ length: n }, (_, i) => { const a = p(i), b = p(i + 1);
    return `<path data-act="mdseg" data-i="${i}" d="M100 100 L${a[0]} ${a[1]} A90 90 0 0 1 ${b[0]} ${b[1]} Z" class="${set.has(i) ? 'on' : ''}"/>`; }).join('')}</svg>`;
}

/* ---------- Penjumlahan ---------- */
const ADD = {
  1: (r, y) => { const a = RN(3, y ? 6 : 8), b = RN(3, y ? 5 : 8); return { text: `Ada ${a} apel dan ${b} apel di meja. Seret semua apel ke keranjang!`,
    zones: [zone('a', 'Meja kiri', { items: mk(a, '🍎') }), zone('b', 'Meja kanan', { items: mk(b, '🍎') }), zone('bk', 'Keranjang', { show: 'count', row: 1 })],
    tap: (it, f) => f === 'bk' ? null : 'bk', check: S => S.z.a.items.length || S.z.b.items.length ? 'Masih ada apel di meja. Pindahkan semuanya!' : true,
    asks: [ASK(`${a} + ${b} = ?`, a + b, `${a} + ${b} = ${a + b}. Dua kelompok digabung jadi satu.`)] }; },
  2: (r, y) => { const a = RN(y ? 5 : 6, 9), b = RN(2, y ? 3 : 5);
    return { text: `Kotak ini sudah berisi ${a} kue. Seret ${b} kue satuan ke keranjang sambil meneruskan hitungan!`,
      zones: [zone('t', 'Kue satuan', { items: mk(b, '🍪') }), zone('bk', 'Keranjang', { show: 'count', base: a, row: 1, items: [{ id: 'box' + (++IDC), e: `<span class="box">📦<b>${a}</b></span>`, lk: true, v: 0, t: 'box' }] })],
      tap: (it, f) => f === 't' ? 'bk' : null,
      onMove: (it, f, t, S) => { if (t !== 'bk') return ''; const n = cnt(S.z.bk); say3(String(n)); return `Terus hitung: ${a}… ${Array.from({ length: n - a }, (_, i) => a + 1 + i).join(', ')}`; },
      check: S => S.z.t.items.length ? 'Masih ada kue di luar. Hitung terus ya!' : true,
      asks: [ASK(`${a} + ${b} = ?`, a + b, `Mulai dari ${a}, lanjut ${b} kali: hasilnya ${a + b}. Tidak perlu menghitung dari 1!`)] }; },
  3: (r, y) => { const a = RN(y ? 7 : 6, 9), b = RN(11 - a, 9), rest = a + b - 10;
    const f1 = zone('f1', 'Wadah 1 (10 kotak)', { cls: 'tf', cap: 10, items: mk(a, '🔵').map(i => (i.lk = true, i)) });
    const f2 = zone('f2', 'Wadah 2', { cls: 'tf', cap: 10, row: 1, accept: (it, S) => S.z.f1.items.length >= 10, reject: 'Isi Wadah 1 sampai penuh (10) dulu!' });
    return { text: `${a} + ${b}: seret ${10 - a} 🔴 dulu untuk memenuhi Wadah 1, sisanya ke Wadah 2.`, zones: [f1, f2, zone('t', 'Sisa', { row: 2, items: mk(b, '🔴') })],
      tap: (it, f, S) => f !== 't' ? null : S.z.f1.items.length < 10 ? 'f1' : 'f2',
      onMove: (it, f, t, S) => S.z.f1.items.length >= 10 ? (S.z.f2.items.length ? `10 + ${S.z.f2.items.length}` : 'Wadah 1 penuh = 10! Sisanya ke Wadah 2.') : '',
      check: S => S.z.t.items.length ? 'Masih ada sisa. Isi Wadah 1 dulu, lalu Wadah 2.' : true,
      asks: [ASK(`${a} + ${b} = 10 + ${rest} = ?`, a + b, `Genapkan ke 10 dulu, lalu tambah ${rest}: 10 + ${rest} = ${a + b}.`)] }; },
  4: (r, y) => { const ta = RN(1, y ? 2 : 3), oa = RN(2, 9), tb = RN(1, y ? 2 : 3), ob = RN(2, 9), A = ta * 10 + oa, B = tb * 10 + ob;
    const mkN = (t, o) => [...mk(t, IK, 't', 10), ...mk(o, '🔵', 'o', 1)];
    return { text: `${A} + ${B}: seret semua ikatan 🎁 (10) dan satuan 🔵 ke wadah hasil. Kalau satuan sudah 10, ikat dulu!`,
      zones: [zone('a', `Angka ${A}`, { items: mkN(ta, oa) }), zone('b', `Angka ${B}`, { items: mkN(tb, ob) }), zone('res', 'Wadah hasil', { show: 'sum', row: 1 })],
      tap: (it, f) => f === 'res' ? null : 'res',
      btns: S => nOf(S.z.res, 'o') >= 10 ? [{ b: 'bundle', t: '🎀 Ikat 10 satuan' }] : [],
      onBtn: (b, S) => { const z = S.z.res; for (let k = 0; k < 10; k++) z.items.splice(z.items.findIndex(i => i.t === 'o'), 1); z.items.push(...mk(1, IK, 't', 10)); say3('Diikat!'); return 'Sepuluh satuan diikat jadi satu ikatan 🎁!'; },
      check: S => S.z.a.items.length || S.z.b.items.length ? 'Pindahkan semua ke wadah hasil.' : nOf(S.z.res, 'o') >= 10 ? 'Ada 10 satuan atau lebih. Ikat dulu!' : true,
      asks: [ASK(`${A} + ${B} = ?`, A + B, `${ta + tb} ikatan + ${oa + ob > 9 ? 'satuan setelah diikat' : 'satuan'}: ${A + B}.`)] }; },
  5: (r, y) => { const x = y ? RN(12, 29) : RN(25, 49), z = y ? RN(12, 29) : RN(25, 49), p = y ? RN(110, 150) : RN(110, 190), q = RN(25, 60), n1 = RN(y ? 12 : 20, 40), n2 = RN(15, 35), n3 = RN(10, 25);
    const v = (a, b) => `<div class="vs">${String(a).padStart(4, '\u00a0')}<br>+${String(b).padStart(3, '\u00a0')}<hr></div>`;
    return { text: 'Hitung penjumlahan bersusun dan soal cerita!', asks: [
      ASK(`${x} + ${z} = ?`, x + z, `Satuan dijumlah dulu, lalu puluhan: ${x + z}.`, { html: v(x, z) }), ASK(`${p} + ${q} = ?`, p + q, `Jumlahkan dari satuan, puluhan, lalu ratusan: ${p + q}.`, { html: v(p, q) }),
      ASK(`Pesanan pagi ${n1} kue, siang ${n2} kue. Berapa kue sampai siang?`, n1 + n2, `${n1} + ${n2} = ${n1 + n2}.`), ASK(`Sore dipesan ${n3} kue lagi. Total semuanya?`, n1 + n2 + n3, `${n1 + n2} + ${n3} = ${n1 + n2 + n3}. Dua langkah penjumlahan!`)] }; }
};

/* ---------- Pengurangan ---------- */
const tensOnes = (t, o) => [...mk(t, IK, 't', 10), ...mk(o, '🔵', 'o', 1)];
const SUB = {
  1: (r, y) => { const n = y ? 8 : 10, k = RN(2, y ? 3 : 4);
    return { text: `Di keranjang ada ${n} jeruk. Ambilkan ${k} jeruk ke piring!`, zones: [zone('bk', 'Keranjang', { show: 'count', items: mk(n, '🍊') }), zone('pl', 'Piring', { show: 'count', row: 1 })],
      tap: (it, f) => f === 'bk' ? 'pl' : 'bk', check: S => S.z.pl.items.length === k ? true : `Piring harus berisi ${k} jeruk.`,
      asks: [ASK(`${n} − ${k} = ?`, n - k, `Diambil ${k}, tersisa ${n - k} di keranjang.`)] }; },
  2: (r, y) => { const n = RN(y ? 8 : 9, 12), t = RN(2, y ? 4 : 5), rem = n - t;
    return { text: `Ada ${n} koin. Setelah diambil, sisanya harus ${rem}. Pindahkan koin ke "Terambil" sampai sisa ${rem}!`,
      zones: [zone('bk', 'Wadah awal', { show: 'count', items: mk(n, '🪙') }), zone('tk', 'Terambil', { show: 'count', row: 1 })],
      tap: (it, f) => f === 'bk' ? 'tk' : 'bk', check: S => cnt(S.z.bk) === rem ? true : `Sisa di wadah awal harus ${rem}.`,
      asks: [ASK(`${n} − ? = ${rem}`, t, `Kamu mengambil ${t} koin: ${n} − ${t} = ${rem}.`)] }; },
  3: (r, y) => { const a = RN(y ? 5 : 6, 9), b = RN(2, a - 1);
    const top = Array.from({ length: a }, (_, i) => zone('u' + i, null, { cls: 'cell', row: 0, accept: () => false, reject: 'Taruh di kotak bawahnya ya.', items: mk(1, '🔵').map(x => (x.lk = true, x)) }));
    const bot = Array.from({ length: a }, (_, i) => zone('s' + i, null, { cls: 'cell', row: 1, cap: 1, accept: (it, S) => i === 0 || S.z['s' + (i - 1)].items.length > 0, reject: 'Pasangkan dari kiri ya.' }));
    return { text: `Ada ${a} bintang biru dan ${b} bintang merah. Pasangkan tiap 🔴 di bawah 🔵, dari kiri!`, zones: [...top, ...bot, zone('t', 'Bintang merah', { row: 2, items: mk(b, '🔴') })],
      tap: (it, f, S) => { if (f !== 't') return null; const k = bot.findIndex(z => !z.items.length); return k < 0 ? null : 's' + k; },
      check: S => S.z.t.items.length ? 'Pasangkan semua bintang merah.' : true,
      asks: [ASK(`Bintang biru lebih banyak berapa dari bintang merah?`, a - b, `${a} − ${b} = ${a - b}. Selisih = bintang biru yang tidak punya pasangan.`)] }; },
  4: (r, y) => { const ta = RN(2, y ? 3 : 5), oa = RN(3, 9), tb = RN(1, ta - 1), ob = RN(1, oa - 1), A = ta * 10 + oa, B = tb * 10 + ob;
    return { text: `${A} − ${B}: pindahkan ${tb} ikatan 🎁 dan ${ob} satuan 🔵 ke "Dikurangi".`, zones: [zone('bk', `Kantong ${A}`, { show: 'sum', items: tensOnes(ta, oa) }), zone('tk', 'Dikurangi', { show: 'sum', row: 1 })],
      tap: (it, f, S) => f === 'bk' ? (nOf(S.z.tk, it.t) < (it.t === 't' ? tb : ob) ? 'tk' : null) : 'bk', check: S => nOf(S.z.tk, 't') === tb && nOf(S.z.tk, 'o') === ob ? true : `Ambil tepat ${tb} ikatan dan ${ob} satuan.`,
      asks: [ASK(`${A} − ${B} = ?`, A - B, `Puluhan dikurangi puluhan, satuan dikurangi satuan: ${A - B}.`)] }; },
  5: (r, y) => { const ta = RN(1, y ? 2 : 3), oa = RN(1, 6), B = RN(oa + 1, 9), A = ta * 10 + oa;
    return { text: `${A} − ${B}: satuannya kurang! Seret 1 ikatan 🎁 ke "Buka ikatan", lalu ambil ${B} satuan 🔵 ke "Dikurangi".`,
      zones: [zone('bk', `Kantong ${A}`, { show: 'sum', items: tensOnes(ta, oa) }), zone('op', 'Buka ikatan', { row: 1, accept: it => it.t === 't', reject: 'Hanya ikatan yang bisa dibuka.' }),
        zone('tk', 'Dikurangi', { show: 'count', row: 1, accept: it => it.t === 'o', reject: 'Ikatan tidak bisa langsung dikurangi. Buka ikatan dulu!' })],
      onMove: (it, f, t, S) => { if (t !== 'op') return ''; S.z.op.items = []; S.z.bk.items.push(...mk(10, '🔵', 'o', 1)); say3('Ikatan dibuka!'); return 'Ikatan dibuka! Sekarang ada 10 satuan baru 🔵'; },
      tap: (it, f, S) => f === 'bk' ? (it.t === 't' ? 'op' : 'tk') : f === 'tk' ? 'bk' : null,
      check: S => cnt(S.z.tk) === B ? true : `Ambil tepat ${B} satuan.`,
      asks: [ASK(`${A} − ${B} = ?`, A - B, `Ikatan dibuka jadi 10 satuan, lalu diambil ${B}: ${A - B}.`)] }; }
};

/* ---------- Perkalian ---------- */
const MUL = {
  1: (r, y) => { const g = RN(2, y ? 3 : 4), p = RN(2, y ? 3 : 4);
    const bs = Array.from({ length: g }, (_, i) => zone('b' + i, `Keranjang ${i + 1}`, { show: 'count', cap: p }));
    return { text: `Isi tiap keranjang dengan ${p} apel (${g} keranjang).`, zones: [...bs, zone('t', 'Apel', { row: 1, items: mk(g * p, '🍎') })],
      tap: (it, f, S) => { const z = bs.find(x => x.items.length < p); return f === 't' && z ? z.id : null; },
      check: S => S.z.t.items.length || bs.some(z => z.items.length !== p) ? `Tiap keranjang harus berisi ${p} apel.` : true,
      asks: [ASK(`${g} keranjang × ${p} apel: ${g} × ${p} = ?`, g * p, `${g} kelompok yang sama banyak, masing-masing ${p}: ${g * p}.`)] }; },
  2: (r, y) => { const rw = RN(2, y ? 3 : 4), c = RN(2, y ? 3 : 4);
    const cells = Array.from({ length: rw * c }, (_, i) => zone('c' + i, null, { cls: 'cell', row: (i / c) | 0, cap: 1 }));
    return { text: `Susun balok menjadi ${rw} baris × ${c} kolom.`, zones: [...cells, zone('t', 'Balok', { row: rw, items: mk(rw * c, '🟦') })],
      tap: (it, f) => { const z = cells.find(x => !x.items.length); return f === 't' && z ? z.id : null; },
      check: S => cells.every(z => z.items.length) ? true : 'Isi semua kotak di papan.',
      asks: [ASK(`${rw} baris × ${c} kolom = ?`, rw * c, `${rw} × ${c} = ${rw * c} balok.`), ASK(`Kalau diputar jadi ${c} baris × ${rw} kolom, jumlahnya?`, rw * c, `${c} × ${rw} = ${rw * c} juga! Urutan tidak mengubah hasil.`)] }; },
  3: (r, y) => { const k = [2, 3, 4, 5][rnd(y ? 2 : 4)], N = 5, vals = Array.from({ length: N }, (_, i) => k * (i + 1));
    const tok = v => ({ id: 'i' + (++IDC), e: `<b class="tok">${v}</b>`, t: 'n', v });
    const slots = vals.map((v, i) => zone('s' + i, `Lompat ${i + 1}`, { cls: 'cell lg', row: 0, cap: 1, accept: it => it.v === v, reject: `Bukan kelipatan ${k} berikutnya. Coba angka lain!` }));
    return { text: `Kereta melompat ${k}-${k}. Isi gerbong dengan kelipatan ${k}: ${k}, ${k * 2}, ${k * 3}…`, zones: [...slots, zone('t', 'Angka', { row: 1, items: shuffle([...vals, k * 6 + 1, k * 2 + 1].map(tok)) })],
      tap: (it, f, S) => { const z = slots.find(x => !x.items.length); return f === 't' && z && z.accept(it) ? z.id : null; },
      check: S => slots.every(z => z.items.length) ? true : 'Isi semua gerbong.',
      asks: [ASK(`Lima lompatan, tiap lompatan ${k}. ${k} × 5 = ?`, k * 5, `Melompat ${k}-${k} sebanyak 5 kali sampai ${k * 5}.`)] }; },
  4: (r, y) => { const T = y ? [2, 5, 10] : [2, 3, 4, 5, 10];
    return { text: 'Jawab perkalian. Tidak ada batas waktu, santai saja! Kalau ragu, pakai bantuan gambar.', asks: Array.from({ length: 5 }, () => { const a = T[rnd(T.length)], b = RN(2, y ? 5 : 9);
      return ASK(`${a} × ${b} = ?`, a * b, `${a} × ${b} = ${a * b}.`, { hint: `<div class="grps">${Array.from({ length: a }, () => `<span class="grp">${'🍎'.repeat(b)}</span>`).join('')}</div><p class="small">${a} kelompok, tiap kelompok ${b}.</p>` }); }) }; },
  5: (r, y) => { const mkP = () => { const t = y ? 1 : RN(1, 2), o = RN(2, 6), B = RN(2, 4), A = t * 10 + o;
      const vis = `<div class="grps">${Array.from({ length: B }, () => `<span class="grp">${IK}${'🔵'.repeat(o)}</span>`).join('')}</div>`;
      return [ASK(`${A} × ${B}: berapa ${t * 10} × ${B}?`, t * 10 * B, `${t * 10} × ${B} = ${t * 10 * B}.`, { html: vis }), ASK(`Lalu berapa ${o} × ${B}?`, o * B, `${o} × ${B} = ${o * B}.`), ASK(`${t * 10 * B} + ${o * B} = ?`, A * B, `${A} × ${B} = ${t * 10 * B} + ${o * B} = ${A * B}.`)]; };
    const A2 = RN(12, 18), B2 = RN(2, 4);
    return { text: 'Pecah dulu puluhan dan satuannya, lalu gabungkan!', asks: [...mkP(), ASK(`Satu paket berisi ${A2} permen. Ibu membeli ${B2} paket. Total permen?`, A2 * B2, `${A2} × ${B2} = ${(A2 - A2 % 10) * B2} + ${(A2 % 10) * B2} = ${A2 * B2}.`)] }; }
};

/* ---------- Pembagian ---------- */
const DIV = {
  1: (r, y) => { const n = RN(3, y ? 4 : 5) * 2;
    return { text: `Bagi ${n} biskuit sama rata ke 2 piring.`, zones: [zone('p0', 'Piring 1', { show: 'count' }), zone('p1', 'Piring 2', { show: 'count' }), zone('t', 'Biskuit', { row: 1, items: mk(n, '🍪') })],
      tap: (it, f, S) => f !== 't' ? null : S.z.p0.items.length <= S.z.p1.items.length ? 'p0' : 'p1',
      check: S => S.z.t.items.length ? 'Masih ada biskuit. Bagikan semuanya!' : S.z.p0.items.length !== S.z.p1.items.length ? 'Belum sama rata. Pindahkan agar sama banyak.' : true,
      asks: [ASK(`${n} : 2 = ?`, n / 2, `Dibagi rata, tiap piring dapat ${n / 2}.`)] }; },
  2: (r, y) => { const per = RN(2, y ? 3 : 4), q = RN(3, 4), n = per * q;
    const bs = Array.from({ length: q + 1 }, (_, i) => zone('b' + i, `Keranjang ${i + 1}`, { show: 'count', cap: per }));
    return { text: `Ada ${n} bola. Tiap keranjang muat ${per} bola. Isi keranjang sampai bola habis!`, zones: [...bs, zone('t', 'Bola', { row: 1, items: mk(n, '⚽') })],
      tap: (it, f) => { const z = bs.find(x => x.items.length < per); return f === 't' && z ? z.id : null; },
      check: S => S.z.t.items.length ? 'Masih ada bola yang belum masuk keranjang.' : true,
      asks: [ASK('Berapa keranjang yang terisi penuh?', q, `${n} : ${per} = ${q} keranjang.`)] }; },
  3: (r, y) => { const mkR = () => { const a = RN(2, y ? 5 : 9), b = RN(2, y ? 5 : 9), p = a * b;
      const tri = h => `<div class="tri"><b>${p}</b><div><b>${a}</b><b>${h ? '?' : b}</b></div></div>`;
      return [ASK(`Angka yang hilang di segitiga? ${a} × ? = ${p}`, b, `${a} × ${b} = ${p}.`, { html: tri(true) }), ASK(`${p} : ${b} = ?`, a, `Dari ${a} × ${b} = ${p} kita tahu ${p} : ${b} = ${a}.`, { html: tri(false) }), ASK(`${p} : ${a} = ?`, b, `${p} : ${a} = ${b}. Satu keluarga angka!`, { html: tri(false) })]; };
    return { text: 'Keluarga angka: perkalian dan pembagian saling berhubungan.', asks: mkR() }; },
  4: (r, y) => { const L = y ? [[36, 3], [48, 4]] : [[36, 3], [48, 4], [55, 5], [62, 2], [84, 4], [93, 3]], [n, d] = L[rnd(L.length)], t = (n / 10) | 0, o = n % 10;
    const ps = Array.from({ length: d }, (_, i) => zone('p' + i, `Piring ${i + 1}`, { show: 'sum' }));
    return { text: `Bagi ${n} sama rata ke ${d} piring. Bagi dulu ikatan 🎁, lalu satuan 🔵.`, zones: [...ps, zone('t', `${n}`, { row: 1, items: tensOnes(t, o) })],
      tap: (it, f, S) => f !== 't' ? null : ps.reduce((m, z) => nOf(z, it.t) < nOf(m, it.t) ? z : m, ps[0]).id,
      check: S => S.z.t.items.length ? 'Masih ada yang belum dibagi.' : ps.every(z => nOf(z, 't') === t / d && nOf(z, 'o') === o / d) ? true : 'Belum sama rata. Tiap piring harus sama.',
      asks: [ASK(`${n} : ${d} = ?`, n / d, `Tiap piring dapat ${t / d} ikatan dan ${o / d} satuan: ${n / d}.`)] }; },
  5: (r, y) => { const d = RN(2, y ? 3 : 4), q = RN(2, 3), rm = RN(1, d - 1), n = d * q + rm;
    const ps = Array.from({ length: d }, (_, i) => zone('p' + i, `Anak ${i + 1}`, { show: 'count' }));
    return { text: `Bagi ${n} permen sama rata ke ${d} anak. Permen yang tidak habis dibagi masuk "Kotak sisa".`, zones: [...ps, zone('s', 'Kotak sisa', { row: 1, show: 'count' }), zone('t', 'Permen', { row: 2, items: mk(n, '🍬') })],
      tap: (it, f, S) => f !== 't' ? null : S.z.t.items.length > rm ? ps.reduce((m, z) => z.items.length < m.items.length ? z : m, ps[0]).id : 's',
      check: S => S.z.t.items.length ? 'Masih ada permen yang belum dibagi.' : ps.every(z => z.items.length === q) && S.z.s.items.length === rm ? true : `Tiap anak harus dapat ${q} dan sisanya ${rm}.`,
      asks: [ASKS(`${n} : ${d} = ?`, `${q} sisa ${rm}`, [`${q + 1} sisa 0`, `${q} sisa ${rm + 1}`], `${q} permen untuk tiap anak, sisa ${rm}.`)] }; }
};

/* ---------- Pecahan ---------- */
const FRAC = {
  1: (r) => { const [n, k] = [[2, 1], [4, 1], [4, 2]][r % 3], word = n === 2 ? 'dua' : 'empat';
    return { text: `Pizza dipotong jadi ${n} bagian sama besar. Ketuk dan warnai ${k} bagian!`, draw: S => pizza(n, S.seg), seg: true,
      check: S => S.seg.size === k ? true : `Warnai tepat ${k} bagian.`,
      asks: [ASKS('Bagian yang kamu warnai disebut…', `${k}/${n}`, [`${n}/${k}`, `${k}/${n + 2}`], `${k} dari ${n} bagian sama besar = ${k}/${n}.`)] }; },
  2: (r, y) => { const L = y ? [[6, 1, 2], [6, 1, 3], [8, 1, 2]] : [[6, 1, 2], [6, 1, 3], [8, 1, 4], [8, 2, 4], [9, 1, 3], [10, 1, 5], [6, 2, 3]], [n, num, den] = L[rnd(L.length)], tg = n / den * num;
    return { text: `Ada ${n} apel. Seret ${num}/${den}-nya ke keranjang!`, zones: [zone('s', 'Apel', { items: mk(n, '🍎') }), zone('bk', 'Keranjang', { show: 'count', row: 1 })],
      tap: (it, f) => f === 's' ? 'bk' : 's', check: S => cnt(S.z.bk) === tg ? true : `Bagi ${n} jadi ${den} kelompok sama banyak, lalu ambil ${num} kelompok.`,
      asks: [ASK(`${num}/${den} dari ${n} adalah?`, tg, `${n} : ${den} = ${n / den}${num > 1 ? `, dikali ${num} = ${tg}` : ''}.`)] }; },
  3: (r, y) => ({ text: 'Bandingkan potongannya dengan melihat gambar.', asks: shuffle([[2, 4], [2, 3], [4, 8], [3, 6], [3, 4], [4, 6]].filter(p => !y || p[1] <= 4)).slice(0, 3).map(([d1, d2]) =>
    ASKS('Mana yang lebih besar?', `1/${d1}`, [`1/${d2}`, 'Sama besar'], 'Makin sedikit potongannya, makin besar tiap potongan.', { html: bars([[`1/${d1}`, 1, d1], [`1/${d2}`, 1, d2]]) })) }),
  4: () => { const C = [[1, 2, 2, 4, 'n'], [1, 2, 3, 6, 'd'], [2, 4, 1, 2, 'n'], [1, 3, 2, 6, 'n'], [1, 4, 2, 8, 'd'], [1, 2, 4, 8, 'n'], [3, 4, 6, 8, 'n']];
    return { text: 'Pecahan yang berbeda bisa sama besarnya!', asks: shuffle(C).slice(0, 4).map(([n1, d1, n2, d2, h]) => ASK(`${n1}/${d1} = ${h === 'n' ? '?' : n2}/${h === 'd' ? '?' : d2}`, h === 'n' ? n2 : d2,
      `${n1}/${d1} sama besar dengan ${n2}/${d2} pada loyang yang sama.`, { html: bars([[`${n1}/${d1}`, n1, d1], [`${n2}/${d2}`, n2, d2]]) })) }; },
  5: () => { const asks = [];
    for (let i = 0; i < 4; i++) { const d = [4, 3, 5, 6, 8][rnd(5)], sub = i % 2 === 1; let a, b;
      if (sub) { a = RN(2, d - 1); b = RN(1, a - 1); } else { a = RN(1, d - 2); b = RN(1, d - a - 1); }
      const x = sub ? a - b : a + b;
      asks.push(ASKS(`${a}/${d} ${sub ? '−' : '+'} ${b}/${d} = ?`, `${x}/${d}`, [`${x}/${d * 2}`, `${x + 1}/${d}`], `Penyebutnya sama, jadi hanya ${sub ? 'kurangi' : 'jumlahkan'} pembilangnya: ${x}/${d}.`,
        { html: sub ? bars([[`${a}/${d}`, a, d]]) : bars([[`${a}/${d} + ${b}/${d}`, a, d, b]]) })); }
    return { text: 'Pecahan berpenyebut sama: jumlahkan atau kurangi bagian yang diambil.', asks }; }
};

/* ---------- mesin ---------- */
const RD = { add: [0, 2, 2, 2, 2, 1], sub: [0, 2, 2, 2, 2, 2], mul: [0, 2, 2, 2, 1, 1], div: [0, 2, 2, 2, 2, 2], frac: [0, 3, 2, 1, 1, 1] };
const MT = { add: ['Penjumlahan', ADD], sub: ['Pengurangan', SUB], mul: ['Perkalian', MUL], div: ['Pembagian', DIV], frac: ['Pecahan', FRAC] };
function mdStart(k, L) { MD = { k, L, round: 0, rounds: k === 'div' && L === 3 ? 2 : RD[k][L], fails: 0, lock: false }; mdRound(); }
function mdRound() {
  const m = MD, sp = MT[m.k][1][m.L](m.round, P().age < 7);
  m.sp = sp; m.z = {}; (sp.zones || []).forEach(z => { m.z[z.id] = z; });
  m.phase = (sp.zones && sp.zones.length) || sp.draw ? 'task' : 'ask'; m.ai = 0; m.msg = ''; m.hint = false; m.lock = false; m.seg = new Set();
  render(shell(`${MT[m.k][0]} • Level ${m.L}`, `<p class="hint">Soal ${m.round + 1} dari ${m.rounds}</p><p class="story">${sp.text || ''}</p><div id="md"></div><p class="fb" id="mdm"></p><div id="mdx"></div>`));
  m.tk = token; mdDraw(); say3(sp.text || '');
}
function zoneHtml(z) {
  const lab = z.label == null ? '' : `<span class="zl">${z.label}${z.show ? ' • ' + (z.show === 'sum' ? sm(z) : cnt(z)) : ''}</span>`;
  return `<div class="dz ${z.cls || ''}" data-zone="${z.id}">${lab}<div class="zi">${z.items.map(i => `<span class="di${i.lk ? ' lk' : ''}" data-item="${i.id}" data-from="${z.id}">${i.e}</span>`).join('')}</div></div>`;
}
function mdDraw() {
  const m = MD, sp = m.sp; if (!$('#md')) return;
  if (sp.draw) $('#md').innerHTML = sp.draw(m);
  else {
    const rows = {}; (sp.zones || []).forEach(z => { (rows[z.row] = rows[z.row] || []).push(z); });
    $('#md').innerHTML = Object.keys(rows).sort((a, b) => a - b).map(k => { const zs = rows[k], cells = zs.every(z => /cell/.test(z.cls || ''));
      return `<div class="zrow${cells ? ' cells' : ''}" ${cells ? `style="--cn:${zs.length}"` : ''}>${zs.map(zoneHtml).join('')}</div>`; }).join('');
  }
  $('#mdm').textContent = m.msg || '';
  if (m.phase === 'task') {
    const bt = sp.btns ? sp.btns(m) : [];
    $('#mdx').innerHTML = bt.map(b => `<button class="btn" data-act="mdbtn" data-b="${b.b}">${b.t}</button>`).join('') + (sp.check ? '<button class="btn big" data-act="mdchk">Periksa ✔</button>' : '');
  } else {
    const a = sp.asks[m.ai];
    $('#mdx').innerHTML = `${a.html || ''}<p class="q">${a.q}</p><div class="opts">${a.opts.map((o, i) => `<button class="opt" data-act="mdans" data-n="${i}">${o}</button>`).join('')}</div>
      ${a.hint ? `<button class="btn ghost" data-act="mdhint">💡 Bantuan gambar</button>${m.hint ? `<div class="card">${a.hint}</div>` : ''}` : ''}`;
  }
}
function mdDone() {
  const m = MD;
  if (m.sp.asks && m.sp.asks.length) { m.phase = 'ask'; m.ai = 0; m.msg = '👍 Mantap! Satu pertanyaan lagi.'; beep(784, .2); mdDraw(); say3(m.sp.asks[0].q); } else mdNext();
}
function mdNext() {
  const m = MD, tk = m.tk; m.round++;
  if (m.round < m.rounds) { m.lock = true; $('#mdm').textContent = '🎉 Hebat! Soal berikutnya…'; setTimeout(() => { if (tk === token && MD === m) mdRound(); }, 1000); }
  else lvWin(m.k, m.L, MT[m.k][0] + ' selesai!', 'Kamu menyelesaikan semua soal level ini.', 2 + m.L, 1 + Math.min(m.fails, 3));
}
function mdMove(id, from, to) {
  const m = MD; if (!m || m.phase !== 'task') return;
  const zf = m.z[from], zt = m.z[to], it = zf && zf.items.find(x => x.id === id);
  if (!zf || !zt || from === to || !it || it.lk) return mdDraw();
  if (zt.cap != null && zt.items.length >= zt.cap) { m.msg = 'Tempat itu sudah penuh.'; beep(200, .1); return mdDraw(); }
  if (zt.accept && !zt.accept(it, m)) { m.msg = zt.reject || 'Tidak bisa ditaruh di sini.'; beep(200, .1); return mdDraw(); }
  zf.items.splice(zf.items.indexOf(it), 1); zt.items.push(it); beep(520, .06); m.msg = '';
  if (m.sp.onMove) { const r = m.sp.onMove(it, from, to, m); if (r) m.msg = r; }
  mdDraw(); if (m.sp.check && m.sp.check(m) === true) mdDone();
}
app.addEventListener('pointerdown', e => {
  const it = e.target.closest('.di'); if (!it || it.classList.contains('lk') || !MD || MD.tk !== token || MD.phase !== 'task') return;
  e.preventDefault(); DG = { id: it.dataset.item, from: it.dataset.from, x: e.clientX, y: e.clientY, moved: false, el: it, clone: null };
  try { it.setPointerCapture(e.pointerId); } catch (_) { /* abaikan */ }
});
app.addEventListener('pointermove', e => {
  if (!DG) return;
  if (!DG.moved && Math.hypot(e.clientX - DG.x, e.clientY - DG.y) > 8) { DG.moved = true; DG.clone = DG.el.cloneNode(true); DG.clone.className = 'di dclone'; document.body.appendChild(DG.clone); DG.el.classList.add('ghost'); }
  if (DG.moved) { DG.clone.style.left = e.clientX + 'px'; DG.clone.style.top = e.clientY + 'px'; }
});
function dgUp(e) {
  if (!DG) return; const d = DG; DG = null; if (d.clone) d.clone.remove();
  if (!MD || MD.tk !== token || MD.phase !== 'task') return;
  if (!d.moved) { const z = MD.z[d.from], it = z && z.items.find(x => x.id === d.id), to = it && MD.sp.tap ? MD.sp.tap(it, d.from, MD) : null; return to ? mdMove(d.id, d.from, to) : undefined; }
  const el = document.elementFromPoint(e.clientX, e.clientY), zn = el && el.closest('.dz');
  if (zn) mdMove(d.id, d.from, zn.dataset.zone); else mdDraw();
}
addEventListener('pointerup', dgUp); addEventListener('pointercancel', dgUp);

Object.keys(MT).forEach(k => { LV[k] = L => mdStart(k, L); });
Object.assign(LVD, {
  add: ['Penjumlahan', '➕', 'Menggabungkan jumlah. Pilih level:', ['Gabung objek: seret ke keranjang', 'Mulai dari angka terbesar (counting on)', 'Genapkan ke 10 (make ten)', 'Puluhan + satuan', 'Bersusun & soal cerita dua langkah']],
  sub: ['Pengurangan', '➖', 'Mengambil bagian dan mencari selisih. Pilih level:', ['Ambil & keluarkan', 'Cari berapa yang diambil', 'Selisih: lebih banyak berapa?', 'Puluhan & satuan tanpa pinjam', 'Membuka ikatan (meminjam)']],
  mul: ['Perkalian', '✖️', 'Kelompok sama banyak. Pilih level:', ['Kelompok sama banyak', 'Susunan baris & kolom', 'Lompat kelipatan (skip counting)', 'Fakta perkalian terarah', 'Dua digit × satu digit & soal cerita']],
  div: ['Pembagian', '➗', 'Membagi rata. Pilih level:', ['Bagi rata satu per satu', 'Masukkan per paket', 'Keluarga angka (kali & bagi)', 'Membagi puluhan & satuan', 'Pembagian bersisa']],
  frac: ['Pecahan', '🍕', 'Bagian dari satu utuh. Pilih level:', ['Setengah & seperempat', 'Bagian dari kumpulan', 'Membandingkan pecahan', 'Pecahan senilai', 'Tambah & kurang pecahan']]
});
Object.assign(A, {
  g_add: lvEntry('add'), g_sub: lvEntry('sub'), g_mul: lvEntry('mul'), g_div: lvEntry('div'), g_frac: lvEntry('frac'),
  mdchk() { const m = MD; if (!m || m.phase !== 'task') return; const r = m.sp.check(m); if (r === true) return mdDone(); m.fails++; m.msg = r; beep(200, .15); mdDraw(); },
  mdbtn(d) { const m = MD; if (!m || m.phase !== 'task' || !m.sp.onBtn) return; const r = m.sp.onBtn(d.b, m); if (r) m.msg = r; mdDraw(); if (m.sp.check && m.sp.check(m) === true) mdDone(); },
  mdseg(d) { const m = MD; if (!m || m.phase !== 'task') return; const i = +d.i; if (m.seg.has(i)) m.seg.delete(i); else m.seg.add(i); beep(500, .05); mdDraw(); },
  mdhint() { if (MD) { MD.hint = !MD.hint; mdDraw(); } },
  mdans(d, b) {
    const m = MD; if (!m || m.phase !== 'ask' || m.lock) return; const a = m.sp.asks[m.ai];
    if (a.opts[+d.n] === a.ans) {
      m.lock = true; b.classList.add('right'); beep(784, .2); $('#mdm').textContent = '✅ ' + (a.why || 'Benar!'); say3(a.why || 'Benar!'); const tk = m.tk;
      setTimeout(() => { if (tk !== token || MD !== m) return; m.ai++; m.lock = false; m.msg = ''; if (m.ai < m.sp.asks.length) { mdDraw(); say3(m.sp.asks[m.ai].q); } else mdNext(); }, a.why && a.why.length > 50 ? 2200 : 1500);
    } else { m.fails++; b.disabled = true; b.classList.add('wrong'); beep(200, .15); $('#mdm').textContent = 'Hampir! Coba jawaban lain 💪'; }
  }
});
Object.assign(ACT_GAME, { g_add: 'Penjumlahan', g_sub: 'Pengurangan', g_mul: 'Perkalian', g_div: 'Pembagian', g_frac: 'Pecahan' });
