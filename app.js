// ====== ISI BAGIAN INI ======
const CONFIG = {
  SUPABASE_URL: 'https://PROJECT_ID.supabase.co',
  SUPABASE_ANON_KEY: 'ISI_ANON_PUBLIC_KEY',   // anon key aman dipublikasikan jika RLS aktif
  WHATSAPP: '6281234567890',                  // nomor admin, format 62xxx
};
const PAYMENTS = ['QRIS', 'DANA', 'OVO', 'GoPay', 'Transfer Bank'];
// ============================

const db = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY);
const $ = s => document.querySelector(s);
const rp = n => 'Rp' + Number(n).toLocaleString('id-ID');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

let games = [], current = null, openedAt = 0;

async function loadGames() {
  const { data, error } = await db.from('games').select('*').eq('active', true).order('name');
  if (error) { $('#games').textContent = 'Game gagal dimuat. Muat ulang halaman.'; return; }
  games = data;
  renderGames();
}

function renderGames() {
  const q = $('#search').value.trim().toLowerCase();
  const list = games.filter(g => g.name.toLowerCase().includes(q));
  $('#games').innerHTML = list.length
    ? list.map(g => `
      <button class="tile" data-id="${esc(g.id)}" style="--c:${esc(g.color || '#3D4DFF')}">
        <span class="mark">${g.image_url ? `<img src="${esc(g.image_url)}" alt="" loading="lazy">` : esc(g.name[0])}</span>
        <b>${esc(g.name)}</b><small>${esc(g.publisher)}</small>
      </button>`).join('')
    : '<p>Game tidak ditemukan. Coba kata kunci lain.</p>';
}

async function openOrder(id) {
  current = games.find(g => g.id === id);
  openedAt = Date.now();
  $('#orderForm').reset();
  $('#oTitle').textContent = current.name;
  $('#zoneWrap').hidden = !current.needs_zone;
  $('#msg').textContent = '';
  $('#done').hidden = true;
  $('#fields').hidden = false;
  $('#products').textContent = 'Memuat nominal…';
  $('#order').showModal();

  const { data, error } = await db.from('products').select('*').eq('game_id', id).eq('active', true).order('price');
  if (error || !data.length) { $('#products').textContent = 'Belum ada nominal untuk game ini.'; return; }
  $('#products').innerHTML = data.map(p => `
    <label class="opt"><input type="radio" name="product" value="${esc(p.id)}" data-name="${esc(p.name)}" data-price="${p.price}" required>
      <span>${esc(p.name)}</span><b>${rp(p.price)}</b></label>`).join('');
}

function buildPayments() {
  $('#pay').innerHTML = PAYMENTS.map((p, i) =>
    `<label class="opt"><input type="radio" name="payment" value="${esc(p)}" ${i === 0 ? 'checked' : ''} required>${esc(p)}</label>`).join('');
}

const showMsg = t => { $('#msg').textContent = t; };

async function submitOrder(e) {
  e.preventDefault();
  const f = new FormData(e.target);
  // Anti-bot ringan: honeypot + jeda minimum
  if (f.get('website') || Date.now() - openedAt < 3000) return showMsg('Tunggu beberapa detik, lalu coba lagi.');

  const player = String(f.get('player')).trim();
  if (!/^[A-Za-z0-9._#-]{3,40}$/.test(player)) return showMsg('User ID tidak valid.');
  if (current.needs_zone && !String(f.get('zone')).trim()) return showMsg('Zone ID wajib diisi.');

  const picked = e.target.querySelector('input[name=product]:checked');
  const code = 'KK' + crypto.getRandomValues(new Uint32Array(1))[0].toString(36).toUpperCase().padStart(7, '0');

  $('#submit').disabled = true;
  const { error } = await db.from('orders').insert({
    code, game_id: current.id, product_id: picked.value, player_id: player,
    zone_id: String(f.get('zone') || '').trim() || null,
    contact: f.get('contact'), payment: f.get('payment'),
  });
  $('#submit').disabled = false;
  if (error) return showMsg('Pesanan gagal dibuat. Periksa data lalu coba lagi.');

  const text = `Halo, saya mau bayar pesanan ${code}: ${current.name} ${picked.dataset.name} (${rp(picked.dataset.price)}) via ${f.get('payment')}. User ID: ${player}`;
  $('#doneCode').textContent = code;
  $('#waLink').href = `https://wa.me/${CONFIG.WHATSAPP}?text=${encodeURIComponent(text)}`;
  $('#fields').hidden = true;
  $('#done').hidden = false;
}

async function cekPesanan(e) {
  e.preventDefault();
  const out = $('#cekOut');
  out.textContent = 'Memeriksa…';
  const { data, error } = await db.rpc('cek_pesanan', { p_code: $('#cekCode').value.trim().toUpperCase() });
  if (error || !data || !data.length) { out.textContent = 'Kode pesanan tidak ditemukan. Periksa kembali kodenya.'; return; }
  const o = data[0];
  const label = { pending: 'Menunggu pembayaran', paid: 'Dibayar, sedang diproses', done: 'Selesai', failed: 'Gagal' }[o.status] || o.status;
  out.textContent = `${o.code}: ${label} • ${rp(o.price)}`;
}

$('#games').addEventListener('click', e => { const t = e.target.closest('.tile'); if (t) openOrder(t.dataset.id); });
$('#search').addEventListener('input', renderGames);
$('#close').addEventListener('click', () => $('#order').close());
$('#orderForm').addEventListener('submit', submitOrder);
$('#cekForm').addEventListener('submit', cekPesanan);
buildPayments();
loadGames();
