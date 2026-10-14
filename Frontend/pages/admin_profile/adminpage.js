// ==========================================================================
// ADMIN PAGE: pencarian, filter status, dan aksi moderasi (front-end saja)
// ==========================================================================
(function () {
  const tbody = document.getElementById('admin-tbody');
  const search = document.getElementById('admin-search');
  const filter = document.getElementById('admin-filter');
  const emptyMsg = document.getElementById('admin-empty');

  const STATUS = {
    pending:  { label: 'Menunggu',  badge: 'badge-klaim' },
    approved: { label: 'Disetujui', badge: 'badge-ditemukan' },
    rejected: { label: 'Ditolak',   badge: 'badge-hilang' }
  };

  const BUTTONS = {
    pending:  '<button class="btn btn-primary btn-sm" data-action="approve">Setujui</button> <button class="btn btn-outline btn-sm" data-action="reject">Tolak</button>',
    approved: '<button class="btn btn-outline btn-sm" data-action="reject">Tarik</button>',
    rejected: '<button class="btn btn-primary btn-sm" data-action="approve">Pulihkan</button>'
  };

  function applyFilter() {
    const q = search.value.trim().toLowerCase();
    const status = filter.value;
    let visible = 0;

    tbody.querySelectorAll('tr').forEach(function (row) {
      const matchText = row.textContent.toLowerCase().includes(q);
      const matchStatus = status === 'all' || row.dataset.status === status;
      const show = matchText && matchStatus;
      row.hidden = !show;
      if (show) visible++;
    });

    emptyMsg.hidden = visible > 0;
  }

  function updateStats() {
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const count = function (s) {
      return rows.filter(function (r) { return r.dataset.status === s; }).length;
    };
    document.getElementById('stat-total').textContent = rows.length;
    document.getElementById('stat-pending').textContent = count('pending');
    document.getElementById('stat-approved').textContent = count('approved');
    document.getElementById('tab-count-laporan').textContent = count('pending');
  }

  function setStatus(row, status) {
    row.dataset.status = status;
    const badge = row.querySelector('.badge');
    badge.className = 'badge ' + STATUS[status].badge;
    row.querySelector('.status-text').textContent = STATUS[status].label;
    row.querySelector('.col-actions').innerHTML = BUTTONS[status];
  }

  tbody.addEventListener('click', function (e) {
    const btn = e.target.closest('button[data-action]');
    if (!btn) return;

    const row = btn.closest('tr');
    const name = row.querySelector('strong').textContent;

    if (btn.dataset.action === 'reject' && !confirm('Tolak / tarik laporan "' + name + '"?')) return;

    setStatus(row, btn.dataset.action === 'approve' ? 'approved' : 'rejected');
    updateStats();
    applyFilter();
  });

  search.addEventListener('input', applyFilter);
  filter.addEventListener('change', applyFilter);
})();

// ==========================================================================
// REPORT: abaikan / peringatkan / hapus laporan yang di-report pengguna
// ==========================================================================
(function () {
  const list = document.getElementById('report-list');
  if (!list) return;

  const tabBadge = document.getElementById('tab-count-report');
  const countText = document.getElementById('report-count-text');
  const summary = document.getElementById('report-summary');
  const emptyMsg = document.getElementById('report-empty');

  function refresh() {
    const n = list.querySelectorAll('.report-card:not(.is-resolved)').length;
    tabBadge.textContent = n;
    countText.textContent = n;
    summary.hidden = n === 0;
    emptyMsg.hidden = n > 0;
  }

  function resolve(card, message, deleted) {
    card.classList.add('is-resolved');
    card.textContent = '';
    const banner = document.createElement('div');
    banner.className = 'report-resolved' + (deleted ? ' is-deleted' : '');
    banner.textContent = message;
    card.appendChild(banner);
    refresh();
    setTimeout(function () { card.remove(); }, 2200);
  }

  list.addEventListener('click', function (e) {
    const btn = e.target.closest('button[data-report-action]');
    if (!btn) return;

    const card = btn.closest('.report-card');
    const title = card.querySelector('h3').textContent;
    const action = btn.dataset.reportAction;

    if (action === 'dismiss') {
      if (!confirm('Abaikan semua report untuk "' + title + '"?')) return;
      resolve(card, 'Report untuk "' + title + '" diabaikan.', false);
    } else if (action === 'delete') {
      if (!confirm('Hapus laporan "' + title + '" karena melanggar?')) return;
      resolve(card, 'Laporan "' + title + '" dihapus.', true);
    } else if (action === 'warn') {
      btn.textContent = 'Peringatan terkirim';
      btn.disabled = true;
    }
  });

  refresh();
})();