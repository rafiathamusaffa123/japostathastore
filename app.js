const testimonials = [
  { name: "Budi Santoso", game: "Mobile Legends", text: "Diamond masuk dalam hitungan detik. Harga paling murah yang pernah saya coba." },
  { name: "Sari Anggraini", game: "Free Fire", text: "Prosesnya gampang banget, tinggal masukkan ID lalu bayar. Langsung masuk!" },
  { name: "Andi Pratama", game: "Genshin Impact", text: "Admin ramah dan responsif, sempat ada kendala langsung dibantu sampai beres." },
  { name: "Rina Putri", game: "Google Play", text: "Voucher dikirim cepat dan kodenya aman. Sudah langganan dari tahun lalu." },
  { name: "Dimas Alfarizi", game: "PUBG Mobile", text: "Pembayaran lengkap, ada QRIS dan e-wallet. Top up tengah malam pun tetap lancar." },
  { name: "Maya Lestari", game: "Steam Wallet", text: "Tampilan websitenya enak dan simpel. Promo flash sale-nya sering bikin hemat." },
  { name: "Fajar Nugroho", game: "Valorant", text: "Tidak pernah gagal transaksi. Recommended buat yang cari top up terpercaya." },
  { name: "Putri Ayu", game: "Honkai Star Rail", text: "Murah, cepat, dan resmi. Sekarang semua top up saya lewat sini." },
];

const stars = "★★★★★";

function esc(s) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function card(t) {
  const initials = t.name.split(" ").map((w) => w[0]).slice(0, 2).join("");
  return `
    <article class="card">
      <div class="stars" aria-label="Bintang 5">${stars}</div>
      <p>“${esc(t.text)}”</p>
      <div class="who">
        <div class="avatar" aria-hidden="true">${esc(initials)}</div>
        <div><b>${esc(t.name)}</b><small>${esc(t.game)}</small></div>
      </div>
    </article>`;
}

function fill(rowId, items) {
  const el = document.getElementById(rowId);
  const html = items.map(card).join("");
  // Diulang 4x agar loop mulus, bahkan di layar lebar
  el.innerHTML = html.repeat(4);
}

const half = Math.ceil(testimonials.length / 2);
fill("row1", testimonials.slice(0, half));
fill("row2", testimonials.slice(half));
