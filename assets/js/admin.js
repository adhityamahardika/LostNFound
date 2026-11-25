/**
 * Dashboard admin: auto-submit filter pencarian/status.
 * Filter tetap diproses server-side.
 */
(function () {
    const form = document.getElementById('admin-filter-form');
    if (!form) {
        return;
    }

    const search = document.getElementById('admin-search');
    const filter = document.getElementById('admin-filter');
    let timer = null;

    function kirim() {
        if (typeof form.requestSubmit === 'function') {
            form.requestSubmit();
        } else {
            form.submit();
        }
    }

    if (search) {
        search.addEventListener('input', function () {
            clearTimeout(timer);
            timer = setTimeout(kirim, 350);
        });

        // Setelah reload, lanjutkan mengetik di kolom pencarian.
        if (search.value !== '') {
            search.focus();
            const panjang = search.value.length;
            search.setSelectionRange(panjang, panjang);
        }
    }

    if (filter) {
        filter.addEventListener('change', kirim);
    }

    ['admin-start-date', 'admin-end-date'].forEach(function (id) {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('change', kirim);
        }
    });
})();
