'use strict';
/* Bahasa (Inggris & Arab) dengan kartu bergambar + Roulette Harian.
   Dimuat setelah games4.js dan sebelum portal.js. Memakai render, shell1, reward-helper, A, gate, go1, P, save, snap, today, shuffle, rnd, esc dari app.js.
   Gambar kartu: letakkan file SVG di  assets/cards/<kategori>/<nama>.svg  (lihat DAFTAR_SVG.md).
   Selama file SVG belum ada, kartu otomatis memakai emoji cadangan. */

/* ---------- data kartu: 'nama-file|emoji|Inggris|Indonesia|Arab|Cara baca Arab' ---------- */
const CARD_RAW = {
  hewan: ['🐾', 'Hewan', [
    'cat|🐱|cat|kucing|قطة|qitta', 'dog|🐶|dog|anjing|كلب|kalb', 'bird|🐦|bird|burung|طائر|thair', 'fish|🐟|fish|ikan|سمكة|samaka',
    'horse|🐴|horse|kuda|حصان|hishan', 'cow|🐮|cow|sapi|بقرة|baqara', 'goat|🐐|goat|kambing|ماعز|ma\'iz', 'sheep|🐑|sheep|domba|خروف|kharuf',
    'chicken|🐔|chicken|ayam|دجاجة|dajaja', 'duck|🦆|duck|bebek|بطة|batta', 'rabbit|🐰|rabbit|kelinci|أرنب|arnab', 'elephant|🐘|elephant|gajah|فيل|fil',
    'lion|🦁|lion|singa|أسد|asad', 'tiger|🐯|tiger|harimau|نمر|nimr', 'monkey|🐒|monkey|monyet|قرد|qird', 'camel|🐪|camel|unta|جمل|jamal',
    'snake|🐍|snake|ular|ثعبان|tsu\'ban', 'frog|🐸|frog|katak|ضفدع|dhifda\'', 'butterfly|🦋|butterfly|kupu-kupu|فراشة|farasha', 'bee|🐝|bee|lebah|نحلة|nahla']],
  buah: ['🍎', 'Buah', [
    'apple|🍎|apple|apel|تفاحة|tuffaha', 'banana|🍌|banana|pisang|موزة|mawza', 'orange|🍊|orange|jeruk|برتقالة|burtuqala', 'mango|🥭|mango|mangga|مانجو|manjo',
    'grape|🍇|grapes|anggur|عنب|\'inab', 'watermelon|🍉|watermelon|semangka|بطيخ|battikh', 'pineapple|🍍|pineapple|nanas|أناناس|ananas', 'strawberry|🍓|strawberry|stroberi|فراولة|farawla',
    'coconut|🥥|coconut|kelapa|جوز الهند|jauz al-hind', 'lemon|🍋|lemon|lemon|ليمون|laimun', 'pear|🍐|pear|pir|كمثرى|kummatra', 'cherry|🍒|cherry|ceri|كرز|karaz',
    'peach|🍑|peach|persik|خوخ|khaukh', 'melon|🍈|melon|melon|شمام|shammam', 'kiwi|🥝|kiwi|kiwi|كيوي|kiwi', 'date|🌴|date|kurma|تمر|tamr',
    'fig|🟣|fig|ara|تين|tin', 'pomegranate|🔴|pomegranate|delima|رمان|rumman', 'avocado|🥑|avocado|alpukat|أفوكادو|afokado', 'guava|🍏|guava|jambu biji|جوافة|jawafa']],
  kendaraan: ['🚗', 'Kendaraan', [
    'car|🚗|car|mobil|سيارة|sayyara', 'bus|🚌|bus|bus|حافلة|hafila', 'truck|🚚|truck|truk|شاحنة|shahina', 'motorcycle|🏍️|motorcycle|sepeda motor|دراجة نارية|darraja nariyya',
    'bicycle|🚲|bicycle|sepeda|دراجة|darraja', 'train|🚆|train|kereta api|قطار|qitar', 'airplane|✈️|airplane|pesawat|طائرة|ta\'ira', 'helicopter|🚁|helicopter|helikopter|مروحية|marwahiyya',
    'ship|🚢|ship|kapal|سفينة|safina', 'boat|⛵|boat|perahu|قارب|qarib', 'rocket|🚀|rocket|roket|صاروخ|sarukh', 'taxi|🚕|taxi|taksi|تاكسي|taksi',
    'ambulance|🚑|ambulance|ambulans|سيارة إسعاف|sayyarat is\'af', 'firetruck|🚒|fire truck|mobil pemadam|سيارة إطفاء|sayyarat itfa\'', 'policecar|🚓|police car|mobil polisi|سيارة شرطة|sayyarat shurtha', 'tractor|🚜|tractor|traktor|جرار|jarrar',
    'scooter|🛴|scooter|skuter|سكوتر|skutar', 'submarine|🌊|submarine|kapal selam|غواصة|ghawwasa', 'balloon|🎈|hot air balloon|balon udara|منطاد|minthad', 'excavator|🏗️|excavator|ekskavator|حفارة|hafara']],
  benda: ['🏠', 'Benda di Sekitar', [
    'door|🚪|door|pintu|باب|bab', 'window|🪟|window|jendela|نافذة|nafidha', 'chair|🪑|chair|kursi|كرسي|kursi', 'table|🍽️|table|meja|طاولة|tawila',
    'bed|🛏️|bed|tempat tidur|سرير|sarir', 'lamp|💡|lamp|lampu|مصباح|misbah', 'book|📖|book|buku|كتاب|kitab', 'pencil|✏️|pencil|pensil|قلم رصاص|qalam rasas',
    'bag|🎒|bag|tas|حقيبة|haqiba', 'clock|🕒|clock|jam|ساعة|sa\'a', 'mirror|🪞|mirror|cermin|مرآة|mir\'a', 'bucket|🪣|bucket|ember|دلو|dalw',
    'dipper|🥣|dipper|gayung|مغرفة|maghrafa', 'spoon|🥄|spoon|sendok|ملعقة|mil\'aqa', 'fork|🍴|fork|garpu|شوكة|shawka', 'plate|🍽️|plate|piring|صحن|sahn',
    'glass|🥛|glass|gelas|كأس|ka\'s', 'pillow|🛌|pillow|bantal|وسادة|wisada', 'blanket|🧣|blanket|selimut|بطانية|bataniyya', 'towel|🧻|towel|handuk|منشفة|minshafa',
    'soap|🧼|soap|sabun|صابون|sabun', 'toothbrush|🪥|toothbrush|sikat gigi|فرشاة أسنان|furshat asnan', 'umbrella|☂️|umbrella|payung|مظلة|mizalla', 'key|🔑|key|kunci|مفتاح|miftah',
    'telephone|📞|telephone|telepon|هاتف|hatif', 'television|📺|television|televisi|تلفاز|tilfaz', 'fan|🌀|fan|kipas angin|مروحة|mirwaha', 'broom|🧹|broom|sapu|مكنسة|miknasa',
    'shoes|👟|shoes|sepatu|حذاء|hidha\'', 'scissors|✂️|scissors|gunting|مقص|miqass']],
  alam: ['🌿', 'Alam', [
    'sun|☀️|sun|matahari|شمس|syams', 'moon|🌙|moon|bulan|قمر|qamar', 'star|⭐|star|bintang|نجمة|najma', 'cloud|☁️|cloud|awan|سحابة|sahaba',
    'rain|🌧️|rain|hujan|مطر|matar', 'rainbow|🌈|rainbow|pelangi|قوس قزح|qaus quzah', 'wind|💨|wind|angin|رياح|riyah', 'snow|❄️|snow|salju|ثلج|tsalj',
    'mountain|⛰️|mountain|gunung|جبل|jabal', 'volcano|🌋|volcano|gunung berapi|بركان|burkan', 'sea|🌊|sea|laut|بحر|bahr', 'river|🏞️|river|sungai|نهر|nahr',
    'lake|🏞️|lake|danau|بحيرة|buhaira', 'waterfall|💦|waterfall|air terjun|شلال|syallal', 'beach|🏖️|beach|pantai|شاطئ|syathi\'', 'island|🏝️|island|pulau|جزيرة|jazira',
    'forest|🌲|forest|hutan|غابة|ghaba', 'tree|🌳|tree|pohon|شجرة|syajara', 'flower|🌸|flower|bunga|زهرة|zahra', 'leaf|🍃|leaf|daun|ورقة|waraqa',
    'grass|🌱|grass|rumput|عشب|\'usyb', 'sand|⏳|sand|pasir|رمل|raml', 'rock|🪨|rock|batu|صخرة|shakhra', 'desert|🏜️|desert|gurun|صحراء|shahra\'',
    'fire|🔥|fire|api|نار|nar', 'water|💧|water|air|ماء|ma\'', 'soil|🟤|soil|tanah|تراب|turab', 'sky|🌤️|sky|langit|سماء|sama\'',
    'lightning|⚡|lightning|petir|برق|barq', 'cave|🕳️|cave|gua|كهف|kahf']]
};
const CARD_CATS = Object.keys(CARD_RAW);
const CARDS = {};   // kategori -> [{f, e, en, id, ar, tr, cat}]
CARD_CATS.forEach(k => { CARDS[k] = CARD_RAW[k][2].map(s => { const [f, e, en, id, ar, tr] = s.split('|'); return { f, e, en, id, ar, tr, cat: k }; }); });
const CARD_ALL = [].concat(...CARD_CATS.map(k => CARDS[k]));
const cardImg = (c, cls = '') => `<span class="cimg ${cls}"><img src="assets/cards/${c.cat}/${c.f}.svg" alt="" loading="lazy" onerror="this.remove()"><em>${c.e}</em></span>`;

/* ---------- bahasa ---------- */
const LG = {
  en: { t: 'Bahasa Inggris', ic: '🔤', tts: 'en-US', ask: c => `Bahasa Inggrisnya <b>${esc(c.id)}</b> apa?`, askSay: c => `Bahasa Inggrisnya ${c.id} apa?`, w: c => c.en, s: () => '', rtl: false, dk: 'en' },
  ar: { t: 'Bahasa Arab', ic: '🕌', tts: 'ar-SA', ask: c => `Bahasa Arabnya <b>${esc(c.id)}</b> apa?`, askSay: c => `Bahasa Arabnya ${c.id} apa?`, w: c => c.ar, s: c => c.tr, rtl: true, dk: 'ar' }
};
const DAILY_Q = 20, DQ_KEEP = 7;

/* ---------- penyimpanan harian (p.dq[tanggal] = { en:{n,ok,seen,cur}, ar:{...}, rl:{n,ok,seen,pend} }) ---------- */
function dqDay() {
  const p = P(); p.dq = p.dq || {};
  const d = today(); p.dq[d] = p.dq[d] || {};
  const ks = Object.keys(p.dq).sort(); while (ks.length > DQ_KEEP) delete p.dq[ks.shift()];
  return p.dq[d];
}
function dqGet(kind) { const day = dqDay(); day[kind] = day[kind] || { n: 0, ok: 0, seen: [], cur: null, pend: null }; return day[kind]; }
function addStars(game, n) {   // tambah bintang + gabungkan ke log hari ini (agar grafik orang tua tetap benar)
  const p = P(); p.stars += n; p.iq += n; p.plays += 0; snap(p);
  const last = p.log[p.log.length - 1];
  if (last && last.d === today() && last.g === game) last.s += n; else { p.log.push({ d: today(), g: game, s: n }); if (p.log.length > 60) p.log.shift(); }
}

/* ---------- layar bahasa ---------- */
let LGS = { k: 'en', cat: null };
const lgShell = (title, body, back) => `<header class="bar"><button class="icon" data-act="${back}" aria-label="Kembali">←</button><h2>${title}</h2></header><main class="game">${body}</main>`;
function lgHome(k) {
  LGS = { k, cat: null }; const L = LG[k], st = dqGet(k), left = DAILY_Q - st.n;
  render(lgShell(L.t, `<section class="lgprog"><div><span>Soal hari ini</span><b>${st.n}/${DAILY_Q}</b></div><div><span>Bintang hari ini</span><b>⭐ ${st.ok}</b></div></section>
    <div class="bar2"><i style="width:${st.n / DAILY_Q * 100}%"></i></div>
    <p class="hint">${left > 0 ? 'Pilih kartu untuk belajar, lalu mulai kuis. Satu soal benar = 1 bintang!' : '🎉 Soal hari ini sudah selesai. Kamu bisa belajar kartu, dan kuis baru ada besok!'}</p>
    <div class="lgcats">${CARD_CATS.map(c => `<button class="lgcat" data-act="lgcat" data-c="${c}"><span>${CARD_RAW[c][0]}</span><b>${CARD_RAW[c][1]}</b><small>${CARDS[c].length} kartu</small></button>`).join('')}
    <button class="lgcat all" data-act="${left > 0 ? 'lgstart' : 'lgcat'}" data-c="all"><span>🎯</span><b>${left > 0 ? 'Kuis Acak' : 'Selesai'}</b><small>${left > 0 ? 'Semua kartu' : 'Besok lagi ya'}</small></button></div>`, 'hub'));
}
function lgCat(c) {
  const k = LGS.k, L = LG[k], st = dqGet(k), left = DAILY_Q - st.n; LGS.cat = c;
  if (c === 'all') return lgHome(k);
  render(lgShell(`${CARD_RAW[c][0]} ${CARD_RAW[c][1]}`, `<p class="hint">Ketuk kartu untuk mendengar ${L.t === 'Bahasa Arab' ? 'bahasa Arab' : 'bahasa Inggris'}-nya 🔊</p>
    <div class="cgrid">${CARDS[c].map((w, i) => `<button class="ccard ${L.rtl ? 'ar' : ''}" data-act="lgcard" data-c="${c}" data-i="${i}">${cardImg(w)}<b ${L.rtl ? 'dir="rtl" lang="ar"' : ''}>${esc(L.w(w))}</b>${L.s(w) ? `<small class="tr">${esc(L.s(w))}</small>` : ''}<small>${esc(w.id)}</small></button>`).join('')}</div>
    ${left > 0 ? `<button class="btn big" data-act="lgstart" data-c="${c}">🎯 Mulai kuis (${left} soal tersisa hari ini)</button>` : '<p class="good">Soal hari ini sudah selesai. Kembali lagi besok! 🌙</p>'}`, 'lghome'));
}
function lgPickCard(c) {
  const st = dqGet(LGS.k), pool = c === 'all' ? CARD_ALL : CARDS[c];
  let fresh = pool.filter(w => !st.seen.includes(w.cat + '/' + w.f));
  if (!fresh.length) fresh = CARD_ALL.filter(w => !st.seen.includes(w.cat + '/' + w.f));
  return fresh[rnd(fresh.length)];
}
function lgQuiz(c) {
  const k = LGS.k, L = LG[k], st = dqGet(k);
  if (st.n >= DAILY_Q) return lgDone();
  LGS.c = c;
  let w = st.cur && CARD_ALL.find(x => x.cat + '/' + x.f === st.cur);
  if (!w) { w = lgPickCard(c); st.cur = w.cat + '/' + w.f; save(['dq']); }
  const young = P().age < 7, others = shuffle(CARDS[w.cat].filter(x => x !== w)).slice(0, young ? 2 : 3);
  LGS.w = w; LGS.opts = shuffle([w, ...others]); LGS.done = false;
  render(lgShell(`${L.t} (${st.n + 1}/${DAILY_Q})`, `<div class="bar2"><i style="width:${st.n / DAILY_Q * 100}%"></i></div>
    <div class="qimg">${cardImg(w, 'big')}</div><p class="q">${L.ask(w)}</p>
    <div class="opts lgopts">${LGS.opts.map((o, i) => `<button class="opt ${L.rtl ? 'ar' : ''}" data-act="lgpick" data-i="${i}"><span ${L.rtl ? 'dir="rtl" lang="ar"' : ''}>${esc(L.w(o))}</span>${L.s(o) ? `<small>${esc(L.s(o))}</small>` : ''}</button>`).join('')}</div>
    <p id="fb" class="fb"></p><div id="nx"></div>`, 'lghome'));
  if (autoVoice()) say(L.askSay(w));
}
function lgPick(i, el) {
  if (!LGS.w || LGS.done) return; LGS.done = true;
  const k = LGS.k, L = LG[k], st = dqGet(k), w = LGS.w, o = LGS.opts[i], ok = o === w;
  st.n++; st.seen.push(w.cat + '/' + w.f); st.cur = null;
  if (ok) { st.ok++; addStars('lang_' + k, 1); beep(784, .25); }
  else beep(200, .2);
  save(['dq', 'stars', 'iq', 'log', 'hist']);
  const btns = app.querySelectorAll('.lgopts .opt'); btns.forEach(b => { b.disabled = true; });
  el.classList.add(ok ? 'right' : 'wrong'); if (!ok) btns[LGS.opts.indexOf(w)].classList.add('right');
  $('#fb').innerHTML = ok ? `Betul! ${esc(L.w(w))} = ${esc(w.id)} 🎉 <span class="good">+1 ⭐</span>` : `Belum tepat. Jawabannya <b ${L.rtl ? 'dir="rtl" lang="ar"' : ''}>${esc(L.w(w))}</b> = ${esc(w.id)}`;
  $('#nx').innerHTML = `<button class="btn big" data-act="lgnext">${st.n >= DAILY_Q ? 'Selesai 🎉' : 'Soal berikutnya ▶'}</button>`;
  say(L.w(w), L.tts);
}
function lgDone() {
  const k = LGS.k, L = LG[k], st = dqGet(k);
  render(lgShell(L.t, `<section class="card center"><div class="confetti">🎉</div>${kiki(96)}<h2>Soal hari ini selesai!</h2>
    <div class="stars">⭐ ${st.ok}</div><p><b>Benar ${st.ok} dari ${DAILY_Q} soal.</b></p>
    <p class="small">Soal tidak bisa diulang hari ini. Coba lagi besok untuk mengumpulkan bintang baru!</p>
    <button class="btn big" data-act="lghome">Kembali ke kartu</button><button class="btn ghost" data-act="hub">Kembali ke menu</button></section>`, 'hub'));
}

/* ---------- Roulette Harian ---------- */
const RL_SPINS = 3, RL_STARS = 2;
const RL_SEG = [
  { k: 'otak', e: '🧠', t: 'Game Otak', c: '#7b5cff' }, { k: 'mat', e: '➕', t: 'Matematika', c: '#ff7a59' }, { k: 'sains', e: '🔭', t: 'Sains', c: '#49a09d' },
  { k: 'bahasa', e: '🔤', t: 'Bahasa', c: '#17b890' }, { k: 'sosial', e: '🤝', t: 'Sosial', c: '#ff5d8f' }, { k: 'dunia', e: '🌏', t: 'Dunia', c: '#2193b0' }, { k: 'agama', e: '🕌', t: 'Agama Islam', c: '#8e6bd8' }];
// [pertanyaan, jawaban benar, salah 1, salah 2, tingkat (1 mudah, 2 lebih sulit)]
const RLQ = {
  otak: [['Hewan apa yang punya belalai?', 'Gajah', 'Singa', 'Kuda', 1], ['Berapa jumlah kaki kucing?', '4', '2', '6', 1], ['Lanjutkan pola: 🔴🔵🔴🔵 ...', '🔴', '🟢', '🟡', 1],
    ['Benda mana yang paling cocok untuk menulis?', 'Pensil', 'Sendok', 'Sisir', 1], ['Hari apa setelah hari Senin?', 'Selasa', 'Minggu', 'Rabu', 1],
    ['Aku punya tuts tapi bukan komputer, dan bisa mengeluarkan nada. Apa aku?', 'Piano', 'Gembok', 'Lemari', 2], ['Mana yang bukan buah?', 'Wortel', 'Apel', 'Mangga', 2],
    ['Jika hari ini Kamis, dua hari lagi hari apa?', 'Sabtu', 'Jumat', 'Minggu', 2], ['Pola 2, 4, 6, 8, ... angka berikutnya?', '10', '9', '12', 2], ['Apa yang makin diambil makin besar?', 'Lubang', 'Kue', 'Uang', 2]],
  mat: [['1 + 1 = ...', '2', '3', '1', 1], ['5 - 2 = ...', '3', '4', '2', 1], ['Berapa jumlah sisi segitiga?', '3', '4', '5', 1], ['10 + 5 = ...', '15', '14', '16', 1], ['Setengah dari 10 adalah ...', '5', '2', '4', 1],
    ['6 × 4 = ...', '24', '20', '28', 2], ['36 : 6 = ...', '6', '5', '7', 2], ['100 - 45 = ...', '55', '65', '45', 2], ['7 × 7 = ...', '49', '42', '56', 2], ['Bilangan genap setelah 18 adalah ...', '20', '19', '21', 2]],
  sains: [['Planet tempat kita tinggal adalah ...', 'Bumi', 'Mars', 'Venus', 1], ['Air yang membeku menjadi ...', 'Es', 'Uap', 'Asap', 1], ['Tumbuhan membutuhkan air dan ... untuk tumbuh', 'Sinar Matahari', 'Permen', 'Plastik', 1],
    ['Pelangi biasanya muncul setelah ...', 'Hujan', 'Gempa', 'Salju', 1], ['Benda langit yang menerangi bumi pada siang hari adalah ...', 'Matahari', 'Bulan', 'Bintang', 1],
    ['Planet terbesar di tata surya adalah ...', 'Jupiter', 'Bumi', 'Mars', 2], ['Air laut berubah menjadi uap air disebut ...', 'Penguapan', 'Pembekuan', 'Pencairan', 2],
    ['Planet yang punya cincin indah adalah ...', 'Saturnus', 'Merkurius', 'Mars', 2], ['Bagian tumbuhan yang menyerap air dari tanah adalah ...', 'Akar', 'Daun', 'Bunga', 2],
    ['Planet yang berputar terbalik (searah jarum jam) adalah ...', 'Venus', 'Bumi', 'Mars', 2]],
  bahasa: [['Bahasa Inggris "kucing" adalah ...', 'Cat', 'Dog', 'Cow', 1], ['Bahasa Inggris "apel" adalah ...', 'Apple', 'Banana', 'Orange', 1], ['"Red" artinya warna ...', 'Merah', 'Biru', 'Hijau', 1],
    ['Bahasa Inggris "satu" adalah ...', 'One', 'Two', 'Ten', 1], ['Bahasa Arab "buku" adalah ...', 'Kitab', 'Qalam', 'Bab', 1],
    ['"Bab" dalam bahasa Arab artinya ...', 'Pintu', 'Buku', 'Rumah', 2], ['Bahasa Inggris "bicycle" artinya ...', 'Sepeda', 'Sepatu', 'Sepeda motor', 2], ['"Water" dalam bahasa Indonesia adalah ...', 'Air', 'Api', 'Angin', 2],
    ['Lawan kata "besar" adalah ...', 'Kecil', 'Tinggi', 'Panjang', 2], ['Bahasa Arab "air" adalah ...', 'Maa', 'Naar', 'Syams', 2]],
  sosial: [['Kalau menerima hadiah, kita mengucapkan ...', 'Terima kasih', 'Maaf', 'Tolong', 1], ['Kalau tidak sengaja menabrak teman, kita bilang ...', 'Maaf', 'Selamat tidur', 'Sampai jumpa', 1],
    ['Kalau butuh bantuan, kita mengucapkan ...', 'Tolong', 'Maaf', 'Selamat pagi', 1], ['Teman menangis, sebaiknya kita ...', 'Menghibur', 'Menertawakan', 'Pergi begitu saja', 1], ['Sebelum makan kita sebaiknya ...', 'Cuci tangan', 'Main tanah', 'Berlari', 1],
    ['Gotong royong artinya ...', 'Bekerja bersama-sama', 'Bekerja sendiri', 'Bermain saja', 2], ['Sikap jujur artinya ...', 'Berkata apa adanya', 'Menyembunyikan salah', 'Berbohong kecil', 2],
    ['Antre artinya ...', 'Menunggu giliran dengan tertib', 'Menyerobot', 'Berlari', 2], ['Kalau berbeda pendapat dengan teman, sebaiknya ...', 'Berbicara baik-baik', 'Berteriak', 'Memukul', 2],
    ['Menjaga kebersihan kelas adalah tugas ...', 'Kita semua', 'Hanya guru', 'Tidak ada', 2]],
  dunia: [['Negara kita bernama ...', 'Indonesia', 'Malaysia', 'Jepang', 1], ['Bendera Indonesia berwarna ...', 'Merah dan putih', 'Biru dan kuning', 'Hijau dan putih', 1],
    ['Indonesia berada di benua ...', 'Asia', 'Afrika', 'Eropa', 1], ['Menara Eiffel ada di negara ...', 'Prancis', 'Jepang', 'Mesir', 1], ['Piramida yang terkenal ada di negara ...', 'Mesir', 'Brasil', 'Kanada', 1],
    ['Gunung Fuji ada di negara ...', 'Jepang', 'Korea', 'India', 2], ['Samudra terluas di dunia adalah ...', 'Pasifik', 'Hindia', 'Atlantik', 2], ['Kanguru berasal dari benua ...', 'Australia', 'Afrika', 'Eropa', 2],
    ['Tembok Besar yang sangat panjang ada di negara ...', 'Tiongkok', 'Peru', 'Italia', 2], ['Ibu kota Jepang adalah ...', 'Tokyo', 'Seoul', 'Bangkok', 2]],
  agama: [['Kitab suci umat Islam adalah ...', 'Al-Qur\'an', 'Komik', 'Kamus', 1], ['Salat wajib dalam sehari ada ...', '5 kali', '3 kali', '7 kali', 1], ['Tempat ibadah umat Islam disebut ...', 'Masjid', 'Stadion', 'Pasar', 1],
    ['Bulan puasa umat Islam adalah bulan ...', 'Ramadan', 'Rajab', 'Syawal', 1], ['Ucapan salam umat Islam adalah ...', 'Assalamualaikum', 'Selamat siang', 'Sampai jumpa', 1],
    ['Nabi terakhir adalah Nabi ...', 'Muhammad ﷺ', 'Musa', 'Isa', 2], ['Rukun Islam ada ...', '5', '4', '6', 2], ['Ibadah haji dilakukan di kota ...', 'Mekah', 'Madinah', 'Kairo', 2],
    ['Saat salat, kita menghadap ke ...', 'Kakbah', 'Timur', 'Utara', 2], ['Hari raya setelah puasa Ramadan adalah ...', 'Idulfitri', 'Iduladha', 'Maulid Nabi', 2]]
};
let RLS = { ang: 0, busy: false, q: null };
const rlPool = () => (P().age < 7 ? 1 : 2);
function rlSlicePath(i, n, R) {
  const a0 = (i * 360 / n - 90) * Math.PI / 180, a1 = ((i + 1) * 360 / n - 90) * Math.PI / 180, f = v => v.toFixed(2);
  return `M0 0 L${f(R * Math.cos(a0))} ${f(R * Math.sin(a0))} A${R} ${R} 0 0 1 ${f(R * Math.cos(a1))} ${f(R * Math.sin(a1))}Z`;
}
function rlWheel() {
  const n = RL_SEG.length, R = 140;
  return `<div class="rlbox"><div class="rlptr">▼</div><svg class="rlwheel" id="rlw" viewBox="-150 -150 300 300" style="transform:rotate(${RLS.ang}deg)">
    <circle r="148" fill="#ffd54a"/>${RL_SEG.map((s, i) => { const m = ((i + .5) * 360 / n - 90) * Math.PI / 180;
      return `<path d="${rlSlicePath(i, n, R)}" fill="${s.c}" stroke="#fff" stroke-width="2"/><text x="${(95 * Math.cos(m)).toFixed(1)}" y="${(95 * Math.sin(m)).toFixed(1)}" font-size="30" text-anchor="middle" dominant-baseline="central">${s.e}</text>`; }).join('')}
    <circle r="22" fill="#fff"/><text font-size="22" text-anchor="middle" dominant-baseline="central">⭐</text></svg></div>`;
}
function roulScreen() {
  const st = dqGet('rl'), left = RL_SPINS - st.n; RLS.busy = false;
  render(shell1('🎡 Roulette Harian', `<section class="lgprog"><div><span>Sisa putaran</span><b>${Math.max(0, left)}/${RL_SPINS}</b></div><div><span>Bintang hari ini</span><b>⭐ ${st.ok * RL_STARS}</b></div></section>
    ${rlWheel()}
    <p class="hint">${left > 0 ? `Putar rodanya! Jawab 1 soal wawasan umum dengan benar = +${RL_STARS} ⭐` : 'Putaran hari ini sudah habis. Besok putar lagi ya! 🌙'}</p>
    <button class="btn big" id="rlgo" data-act="rlspin" ${left > 0 ? '' : 'disabled'}>${left > 0 ? '🎡 PUTAR!' : 'Kembali besok 🌙'}</button>
    <div class="chips">${RL_SEG.map(s => `<span class="chip"><i style="background:${s.c}"></i>${s.e} ${s.t}</span>`).join('')}</div>`));
  if (st.pend) rlAsk(st.pend);   // soal yang belum dijawab tetap muncul (tidak bisa dihindari dengan menutup aplikasi)
}
function rlSpin() {
  const st = dqGet('rl'); if (RLS.busy || st.n >= RL_SPINS || st.pend) return;
  const lv = rlPool(), pick = RL_SEG[rnd(RL_SEG.length)], pool = RLQ[pick.k].map((q, i) => ({ q, i })).filter(o => o.q[4] <= lv && !st.seen.includes(pick.k + ':' + o.i));
  const cand = pool.length ? pool : RLQ[pick.k].map((q, i) => ({ q, i })).filter(o => o.q[4] <= lv), qi = cand[rnd(cand.length)].i;
  st.n++; st.pend = { k: pick.k, i: qi }; save(['dq']);
  RLS.busy = true; const idx = RL_SEG.indexOf(pick), n = RL_SEG.length, seg = 360 / n;
  const target = 360 - ((idx + .5) * seg + (Math.random() - .5) * seg * .6), cur = RLS.ang % 360;
  RLS.ang += 360 * 5 + ((target - cur) % 360 + 360) % 360;
  const w = $('#rlw'), go = $('#rlgo'); if (go) go.disabled = true;
  w.style.transition = 'transform 4.2s cubic-bezier(.12,.7,.1,1)'; w.style.transform = `rotate(${RLS.ang}deg)`;
  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].forEach(t => setTimeout(() => beep(300 + t * 30, .05), t * 380));
  const tk = token; setTimeout(() => { if (tk === token) rlAsk(st.pend); }, 4400);
}
function rlAsk(pd) {
  const seg = RL_SEG.find(s => s.k === pd.k), q = RLQ[pd.k][pd.i];
  RLS.q = { pd, opts: shuffle([q[1], q[2], q[3]]), ans: q[1], done: false };
  const m = document.createElement('div'); m.className = 'rlmodal'; m.id = 'rlm';
  m.innerHTML = `<div class="rlcard"><div class="rlseg" style="background:${seg.c}">${seg.e} ${seg.t}</div><p class="q">${esc(q[0])}</p>
    <div class="opts col">${RLS.q.opts.map((o, i) => `<button class="opt wide" data-act="rlpick" data-i="${i}">${esc(o)}</button>`).join('')}</div><p id="rfb" class="fb"></p><div id="rnx"></div></div>`;
  app.appendChild(m); if (autoVoice()) say(q[0]);
}
function rlPick(i, el) {
  const R = RLS.q; if (!R || R.done) return; R.done = true;
  const st = dqGet('rl'), ok = R.opts[i] === R.ans;
  st.pend = null; st.seen.push(R.pd.k + ':' + R.pd.i);
  if (ok) { st.ok++; addStars('roulette', RL_STARS); beep(784, .3); } else beep(200, .2);
  save(['dq', 'stars', 'iq', 'log', 'hist']);
  const btns = app.querySelectorAll('#rlm .opt'); btns.forEach(b => { b.disabled = true; });
  el.classList.add(ok ? 'right' : 'wrong'); if (!ok) btns[R.opts.indexOf(R.ans)].classList.add('right');
  $('#rfb').innerHTML = ok ? `Benar! 🎉 <span class="good">+${RL_STARS} ⭐</span>` : `Belum tepat. Jawabannya: <b>${esc(R.ans)}</b>`;
  $('#rnx').innerHTML = '<button class="btn big" data-act="rlclose">Lanjut ▶</button>';
}

/* ---------- daftar aksi ---------- */
Object.assign(ACT_GAME, { g_eng: 'Bahasa Inggris', g_ar: 'Bahasa Arab', g_roul: 'Roulette Harian' });
Object.assign(A, {
  g_eng: gate(() => lgHome('en')), g_ar: gate(() => lgHome('ar')),
  lghome() { lgHome(LGS.k); }, lgcat(d) { lgCat(d.c); },
  lgcard(d) { const w = CARDS[d.c][+d.i]; say(LG[LGS.k].w(w), LG[LGS.k].tts); },
  lgstart(d) { lgQuiz(d.c); }, lgpick(d, b) { lgPick(+d.i, b); }, lgnext() { lgQuiz(LGS.c || 'all'); },
  g_roul() { if (isLocked()) return screenLock(); go1(roulScreen); },
  rlspin: rlSpin, rlpick(d, b) { rlPick(+d.i, b); }, rlclose() { roulScreen(); }
});
