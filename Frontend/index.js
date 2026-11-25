// ==============================================================================
// Beranda (Homepage) - Muat Laporan Terbaru Secara Dinamis dari Backend MySQL
// ==============================================================================
(function () {
  const API_URL = '../Backend/api/laporan.php?limit=6';

  const FALLBACK_ITEMS = [
    { id: 1, nama: 'Dompet kulit', lokasi: 'Kantin Utama', tanggal: '2026-09-27', status: 'Hilang', foto: 'assets/items/dompet.jpg' },
    { id: 2, nama: 'Kunci motor', lokasi: 'Gedung B', tanggal: '2026-09-28', status: 'Ditemukan', foto: 'assets/items/kunci.jpg' },
    { id: 3, nama: 'Kartu Mahasiswa', lokasi: 'Perpustakaan', tanggal: '2026-09-28', status: 'Ditemukan', foto: 'assets/items/ktm.jpg' },
    { id: 4, nama: 'Botol minum hijau', lokasi: 'Lab Komputer', tanggal: '2026-09-26', status: 'Hilang', foto: 'assets/items/tumbler.jpg' },
    { id: 5, nama: 'Tas ransel hitam', lokasi: 'Parkiran Timur', tanggal: '2026-09-25', status: 'Ditemukan', foto: 'assets/items/tas.jpg' },
    { id: 6, nama: 'Charger Laptop', lokasi: 'Aula', tanggal: '2026-09-24', status: 'Dikembalikan', foto: 'assets/items/charger.jpg' }
  ];

  function esc(val) {
    return String(val ?? '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function resolveImgUrl(url) {
    if (!url) return 'assets/nowrite.jpg';
    if (url.startsWith('data:image') || url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    if (url.startsWith('Backend/')) {
      return '../' + url;
    }
    return url;
  }

  function formatDate(dateString) {
    if (!dateString) return '-';
    const parts = String(dateString).split('-');
    if (parts.length !== 3) return dateString;
    const [y, m, d] = parts.map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function badgeClassFor(status) {
    const s = String(status || '').toLowerCase();
    if (s === 'ditemukan') return 'badge--ditemukan';
    if (s === 'dikembalikan') return 'badge--kembali';
    if (s === 'diklaim') return 'badge--diklaim';
    return 'badge--hilang';
  }

  function renderLatestReports(items) {
    const grid = document.getElementById('latest-reports-grid');
    if (!grid) return;

    if (!items || items.length === 0) {
      grid.innerHTML = '<p style="color: var(--muted); grid-column: 1 / -1;">Belum ada laporan barang yang tercatat.</p>';
      return;
    }

    grid.innerHTML = items.slice(0, 6).map(function (item) {
      const title = item.nama || item.nama_barang || 'Barang';
      const status = item.status || 'Hilang';
      const img = resolveImgUrl(item.foto || item.img);
      const detailUrl = `pages/laporan/detail_barang/detail_barang.html?id=${encodeURIComponent(item.id)}`;

      return `
        <article class="item-card" data-detail-url="${esc(detailUrl)}" tabindex="0" role="link" style="cursor: pointer;">
          <div class="item-card__image">
            <img src="${esc(img)}" alt="${esc(title)}" loading="lazy">
          </div>
          <div class="item-card__body">
            <span class="badge ${badgeClassFor(status)}">${esc(status)}</span>
            <h3 class="item-card__title">${esc(title)}</h3>
            <p class="item-card__meta">${esc(item.lokasi || '-')} · ${esc(formatDate(item.tanggal))}</p>
          </div>
        </article>
      `;
    }).join('');
  }

  function loadFallbackReports() {
    let items = [...FALLBACK_ITEMS];
    try {
      const local = JSON.parse(localStorage.getItem('dataBarang')) || [];
      if (Array.isArray(local) && local.length > 0) {
        const mapped = local.map(function (it) {
          return {
            id: it.id,
            nama: it.namaBarang || it.nama,
            lokasi: it.lokasi,
            tanggal: it.tanggal,
            status: it.status || (it.tipe === 'Ditemukan' ? 'Ditemukan' : 'Hilang'),
            foto: it.foto || it.img
          };
        });
        items = mapped.concat(items);
      }
    } catch (_) {}
    renderLatestReports(items.slice(0, 6));
  }

  async function loadLatestReports() {
    try {
      const res = await fetch(API_URL, { credentials: 'include' });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const result = await res.json();
        if (result && result.success && Array.isArray(result.data)) {
          renderLatestReports(result.data);
          return;
        }
      }
    } catch (err) {
      console.warn('Backend API belum aktif di Beranda, menggunakan data fallback:', err);
    }

    loadFallbackReports();
  }

  document.addEventListener('DOMContentLoaded', function () {
    const grid = document.getElementById('latest-reports-grid');
    if (grid) {
      grid.addEventListener('click', function (e) {
        const card = e.target.closest('.item-card[data-detail-url]');
        if (card) {
          window.location.href = card.dataset.detailUrl;
        }
      });
      grid.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          const card = e.target.closest('.item-card[data-detail-url]');
          if (card) {
            e.preventDefault();
            window.location.href = card.dataset.detailUrl;
          }
        }
      });
    }

    loadLatestReports();
    window.addEventListener('lostnfound:modal-closed', loadLatestReports);
  });
})();
