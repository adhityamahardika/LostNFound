// ==============================================================================
// Profile Page Manager
// Memuat laporan & klaim khusus milik pengguna yang sedang login dari MySQL API.
// ==============================================================================
(function () {
  const STORAGE_USER_KEY = 'lostnfound_demo_user';
  const STORAGE_CLAIMS_KEY = 'lostnfound_user_claims_v1';
  const API_AUTH = '../../../Backend/api/auth.php';
  const API_LAPORAN = '../../../Backend/api/laporan.php';
  const API_STATUS = '../../../Backend/api/update_status.php';
  const API_CHAT = '../../../Backend/api/chat.php';

  function esc(val) {
    return String(val ?? '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const parts = String(dateStr).split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts.map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function formatKode(item) {
    const tgl = (item.tanggal || '2026-10-01').replace(/-/g, '');
    return `LF-${tgl}-${String(item.id).padStart(3, '0')}`;
  }

  function statusBadgeInfo(status) {
    const s = String(status || 'Hilang').toLowerCase();
    if (s === 'dikembalikan') return { cls: 'badge-kembali', label: 'Dikembalikan (Selesai)' };
    if (s === 'diklaim') return { cls: 'badge-klaim', label: 'Sedang Diklaim' };
    if (s === 'ditemukan') return { cls: 'badge-ditemukan', label: 'Ditemukan' };
    return { cls: 'badge-hilang', label: 'Hilang (Aktif Dicari)' };
  }

  function buildStepper(status) {
    const s = String(status || 'Hilang').toLowerCase();
    const isReturned = s === 'dikembalikan';
    const isClaimed = s === 'diklaim';
    const isFound = s === 'ditemukan';

    const steps = s === 'hilang'
      ? ['Dilaporkan', 'Ditemukan', 'Verifikasi', 'Dikembalikan']
      : ['Dilaporkan', 'Klaim Masuk', 'Serah Terima', 'Dikembalikan'];

    let activeStep = 1;
    if (isFound) activeStep = 2;
    else if (isClaimed) activeStep = 3;
    else if (isReturned) activeStep = 4;

    return `
      <div class="status-stepper" aria-label="Alur Status Barang">
        ${steps.map(function (label, idx) {
          const stepNum = idx + 1;
          if (isReturned || stepNum < activeStep) {
            return `<div class="step-node completed"><span class="step-marker">✓</span><span>${esc(label)}</span></div>`;
          }
          if (stepNum === activeStep) {
            return `<div class="step-node current"><span class="step-marker">${stepNum}</span><span>${esc(label)}</span></div>`;
          }
          return `<div class="step-node"><span class="step-marker">${stepNum}</span><span>${esc(label)}</span></div>`;
        }).join('')}
      </div>
    `;
  }

  function resolveThumbUrl(foto) {
    if (!foto) return '../../assets/nowrite.jpg';
    if (foto.startsWith('data:image') || foto.startsWith('http://') || foto.startsWith('https://')) {
      return foto;
    }
    if (foto.startsWith('Backend/')) return '../../../' + foto;
    if (foto.startsWith('assets/')) return '../../' + foto;
    return foto;
  }

  async function resolveCurrentUser() {
    try {
      const res = await fetch(API_AUTH + '?action=me', { credentials: 'include' });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.authenticated && data.user) {
          return data.user;
        }
        return null;
      }
    } catch (_) {
      // Backend offline -> fallback ke localStorage
    }

    try {
      return JSON.parse(localStorage.getItem(STORAGE_USER_KEY) || 'null');
    } catch (_) {
      return null;
    }
  }

  async function fetchUserReports(email) {
    if (!email) return [];

    // 1. Ambil dari MySQL via API dengan filter pelapor_email
    try {
      const url = `${API_LAPORAN}?pelapor_email=${encodeURIComponent(email)}`;
      const res = await fetch(url, { credentials: 'include' });
      const contentType = res.headers.get('content-type') || '';
      if (res.ok && contentType.includes('application/json')) {
        const result = await res.json();
        if (result && result.success && Array.isArray(result.data)) {
          return result.data;
        }
      }
    } catch (err) {
      console.warn('Gagal mengambil laporan user dari backend, mencoba cache lokal:', err);
    }

    // 2. Fallback offline: filter dataBarang di localStorage berdasarkan pelapor_email
    try {
      const local = JSON.parse(localStorage.getItem('dataBarang')) || [];
      return local
        .filter(function (item) {
          return item.pelapor_email && item.pelapor_email.toLowerCase() === email.toLowerCase();
        })
        .map(function (item) {
          return {
            id: item.id,
            tipe: item.tipe || 'Hilang',
            nama: item.namaBarang || item.nama,
            jenis: item.jenis || item.jenis_barang || 'Lainnya',
            tanggal: item.tanggal,
            lokasi: item.lokasi,
            penitipan: item.penitipan || '',
            deskripsi: item.deskripsi || '',
            ciri_rahasia: item.ciriRahasia || item.ciri_rahasia || '',
            foto: item.foto || '',
            status: item.status || (item.tipe === 'Ditemukan' ? 'Ditemukan' : 'Hilang'),
            pelapor_email: item.pelapor_email
          };
        });
    } catch (_) {
      return [];
    }
  }

  function loadUserClaims(email) {
    if (!email) return [];
    const results = [];
    const seen = new Set();

    try {
      const list = JSON.parse(localStorage.getItem(STORAGE_CLAIMS_KEY) || '[]');
      if (Array.isArray(list)) {
        list.forEach(function (c) {
          if (c && c.pengklaimEmail && c.pengklaimEmail.toLowerCase() === email.toLowerCase()) {
            const key = String(c.idBarang || c.kodeLaporan);
            if (!seen.has(key)) {
              seen.add(key);
              results.push(c);
            }
          }
        });
      }
    } catch (_) {}

    try {
      const latest = JSON.parse(localStorage.getItem('klaim_terbaru') || 'null');
      if (latest && latest.pengklaimEmail && latest.pengklaimEmail.toLowerCase() === email.toLowerCase()) {
        const key = String(latest.idBarang || latest.kodeLaporan);
        if (!seen.has(key)) {
          results.unshift(latest);
        }
      }
    } catch (_) {}

    return results;
  }

  function updateStats(reports, claims) {
    const hilangAktif = reports.filter(function (r) { return r.status === 'Hilang'; }).length;
    const temuanCount = reports.filter(function (r) { return r.tipe === 'Ditemukan' || r.status === 'Ditemukan'; }).length;
    const kembaliCount = reports.filter(function (r) { return r.status === 'Dikembalikan'; }).length;
    const klaimCount = claims.length;

    const elHilang = document.getElementById('stat-hilang');
    const elDitemukan = document.getElementById('stat-ditemukan');
    const elKembali = document.getElementById('stat-kembali');
    const elKlaim = document.getElementById('stat-klaim');
    const badgeLap = document.getElementById('badge-count-laporan');
    const badgeKlaim = document.getElementById('badge-count-klaim');

    if (elHilang) elHilang.textContent = String(hilangAktif);
    if (elDitemukan) elDitemukan.textContent = String(temuanCount);
    if (elKembali) elKembali.textContent = String(kembaliCount);
    if (elKlaim) elKlaim.textContent = String(klaimCount);
    if (badgeLap) badgeLap.textContent = String(reports.length);
    if (badgeKlaim) badgeKlaim.textContent = String(klaimCount);
  }

  function renderReports(reports, chatCountsByLaporan) {
    const container = document.getElementById('profile-laporan-list');
    if (!container) return;

    if (!reports.length) {
      container.innerHTML = `
        <article class="item-report-card" style="text-align: center; padding: 2.5rem 1.5rem; align-items: center;">
          <h3 style="margin: 0; color: var(--brand-navy);">Belum Ada Laporan</h3>
          <p style="margin: 0; color: var(--text-muted); max-width: 440px;">
            Anda belum pernah membuat laporan barang hilang atau temuan dengan akun ini.
          </p>
          <a href="../laporan/laporan_pop_up/laporan_pop_up.html" class="btn btn-primary btn-sm">+ Lapor Barang Baru</a>
        </article>
      `;
      return;
    }

    container.innerHTML = reports.map(function (item) {
      const badge = statusBadgeInfo(item.status);
      const kode = formatKode(item);
      const thumb = resolveThumbUrl(item.foto || item.img);
      const isReturned = String(item.status || '').toLowerCase() === 'dikembalikan';
      const chatCount = (chatCountsByLaporan && chatCountsByLaporan[item.id]) || 0;

      const secretHtml = item.ciri_rahasia ? `
        <div class="secret-trait-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2"></rect>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
          </svg>
          <div>
            <strong>Ciri Rahasia Tercatat:</strong>
            ${esc(item.ciri_rahasia)}
          </div>
        </div>
      ` : '';

      const chatBtn = chatCount > 0
        ? `<a href="../chat/chat.html?laporan_id=${encodeURIComponent(item.id)}" class="btn btn-primary btn-sm">Chat Masuk (${chatCount})</a>`
        : '';

      const actionStatusBtn = !isReturned
        ? `<button type="button" class="btn btn-outline btn-sm" data-action="mark-returned" data-id="${esc(item.id)}">Tandai Dikembalikan</button>`
        : '';

      return `
        <article class="item-report-card" data-report-id="${esc(item.id)}">
          <div class="card-top-row">
            <div class="card-main-meta">
              <div class="item-category-icon" style="overflow: hidden; padding: 0;">
                <img src="${esc(thumb)}" alt="${esc(item.nama)}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
              </div>
              <div class="card-title-group">
                <h3>${esc(item.nama)}</h3>
                <div class="card-meta-inline">
                  <span>${esc(item.lokasi)}</span>
                  <span>${esc(formatDate(item.tanggal))}</span>
                  <span>Kode: <strong>${esc(kode)}</strong></span>
                </div>
              </div>
            </div>
            <span class="badge ${badge.cls}">
              <span class="badge-dot"></span>
              ${esc(badge.label)}
            </span>
          </div>

          ${buildStepper(item.status)}
          ${secretHtml}

          <div class="card-actions-row">
            <span style="font-size: 0.86rem; color: var(--text-muted);">
              ${esc(item.penitipan ? 'Dititipkan di: ' + item.penitipan : (item.deskripsi || ''))}
            </span>
            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
              ${chatBtn}
              <a href="../laporan/detail_barang/detail_barang.html?id=${encodeURIComponent(item.id)}" class="btn btn-outline btn-sm">Lihat Detail</a>
              ${actionStatusBtn}
              <button type="button" class="btn btn-danger btn-sm" data-action="delete-report" data-id="${esc(item.id)}" data-name="${esc(item.nama)}">Hapus</button>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  function renderClaims(claims) {
    const container = document.getElementById('profile-klaim-list');
    if (!container) return;

    if (!claims.length) {
      container.innerHTML = `
        <article class="item-report-card" style="text-align: center; padding: 2.5rem 1.5rem; align-items: center;">
          <h3 style="margin: 0; color: var(--brand-navy);">Belum Ada Klaim Barang</h3>
          <p style="margin: 0; color: var(--text-muted); max-width: 440px;">
            Anda belum mengajukan klaim kepemilikan pada barang temuan mana pun.
          </p>
          <a href="../laporan/laporan_page/laporan.html" class="btn btn-outline btn-sm">Cari di Daftar Barang</a>
        </article>
      `;
      return;
    }

    container.innerHTML = claims.map(function (c) {
      const chatParams = new URLSearchParams({
        item: c.kodeLaporan || ('LF-' + c.idBarang),
        title: c.namaBarang || 'Barang',
        finder: c.pelapor || 'Penemu Anonim',
        id: c.idBarang || ''
      });

      return `
        <article class="item-report-card">
          <div class="card-top-row">
            <div class="card-main-meta">
              <div class="item-category-icon" style="overflow: hidden; padding: 0;">
                <img src="${esc(c.img || '../../assets/nowrite.jpg')}" alt="${esc(c.namaBarang)}" style="width: 100%; height: 100%; object-fit: cover; display: block;">
              </div>
              <div class="card-title-group">
                <h3>${esc(c.namaBarang || 'Barang Temuan')}</h3>
                <div class="card-meta-inline">
                  <span>Lokasi: ${esc(c.lokasi || '-')}</span>
                  <span>Kode: <strong>${esc(c.kodeLaporan || '-')}</strong></span>
                  <span>Diajukan: ${esc(c.waktuKlaim || '-')}</span>
                </div>
              </div>
            </div>
            <span class="badge badge-klaim">
              <span class="badge-dot"></span>
              Menunggu Verifikasi
            </span>
          </div>

          <div class="secret-trait-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <div>
              <strong>Jawaban Ciri Rahasia yang Anda Kirimkan:</strong>
              ${esc(c.ciriRahasia || '-')}
            </div>
          </div>

          <div class="card-actions-row">
            <span style="font-size: 0.85rem; color: var(--text-muted);">
              Lanjutkan komunikasi dengan penemu atau lihat detail laporan.
            </span>
            <div style="display: flex; gap: 0.5rem;">
              <a href="../laporan/detail_barang/detail_barang.html?id=${encodeURIComponent(c.idBarang)}" class="btn btn-outline btn-sm">Detail Barang</a>
              <a href="../chat/chat.html?${chatParams.toString()}" class="btn btn-primary btn-sm">Buka Chat</a>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  async function fetchUserChatCounts() {
    const counts = {};
    try {
      const res = await fetch(API_CHAT, { credentials: 'include' });
      const ct = res.headers.get('content-type') || '';
      if (res.ok && ct.includes('application/json')) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.data)) {
          data.data.forEach(function (c) {
            if (c.isOwner && c.laporanId) {
              counts[c.laporanId] = (counts[c.laporanId] || 0) + 1;
            }
          });
        }
      }
    } catch (_) {}
    return counts;
  }

  async function initProfile() {
    const user = await resolveCurrentUser();
    if (!user || !user.email) return;

    const [reports, claims, chatCounts] = await Promise.all([
      fetchUserReports(user.email),
      Promise.resolve(loadUserClaims(user.email)),
      fetchUserChatCounts()
    ]);

    updateStats(reports, claims);
    renderReports(reports, chatCounts);
    renderClaims(claims);

    const listEl = document.getElementById('profile-laporan-list');
    if (listEl) {
      listEl.addEventListener('click', async function (e) {
        const btn = e.target.closest('button[data-action]');
        if (!btn) return;

        const action = btn.dataset.action;
        const id = btn.dataset.id;

        if (action === 'mark-returned') {
          if (!confirm('Tandai barang ini sudah berhasil dikembalikan ke pemiliknya?')) return;
          btn.disabled = true;
          btn.textContent = 'Memproses...';
          try {
            const res = await fetch(API_STATUS, {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: Number(id), status: 'Dikembalikan' })
            });
            const data = await res.json().catch(function () { return null; });
            if (!res.ok || !data || !data.success) {
              alert((data && data.message) || 'Gagal memperbarui status.');
              btn.disabled = false;
              btn.textContent = 'Tandai Dikembalikan';
              return;
            }
            initProfile();
          } catch (err) {
            alert('Tidak dapat terhubung ke server: ' + err.message);
            btn.disabled = false;
            btn.textContent = 'Tandai Dikembalikan';
          }
        } else if (action === 'delete-report') {
          const name = btn.dataset.name || 'laporan ini';
          if (!confirm(`Hapus laporan "${name}" secara permanen?`)) return;
          btn.disabled = true;
          btn.textContent = 'Menghapus...';
          try {
            const res = await fetch(`${API_LAPORAN}?id=${encodeURIComponent(id)}`, {
              method: 'DELETE',
              credentials: 'include'
            });
            const data = await res.json().catch(function () { return null; });
            if (!res.ok || !data || !data.success) {
              alert((data && data.message) || 'Gagal menghapus laporan.');
              btn.disabled = false;
              btn.textContent = 'Hapus';
              return;
            }
            initProfile();
          } catch (err) {
            alert('Tidak dapat terhubung ke server: ' + err.message);
            btn.disabled = false;
            btn.textContent = 'Hapus';
          }
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initProfile);
})();
