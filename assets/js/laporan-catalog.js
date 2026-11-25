/**
 * Katalog laporan: buka/tutup modal detail tanpa fetch.
 * Data modal sudah dirender server di dalam <template> tiap kartu.
 */
(function () {
    const modal = document.getElementById('detail-modal');
    const body = document.getElementById('modal-body');
    const closeBtn = document.getElementById('modal-close');
    const container = document.getElementById('card-container');

    if (!modal || !body || !closeBtn || !container) {
        return;
    }

    let lastFocused = null;

    function closeModal() {
        modal.hidden = true;
        body.innerHTML = '';
        document.body.style.overflow = '';

        if (lastFocused && typeof lastFocused.focus === 'function') {
            lastFocused.focus();
        }
    }

    function openModal(card) {
        const template = card.querySelector('template.modal-template');
        if (!template) {
            return;
        }

        body.innerHTML = '';
        body.appendChild(template.content.cloneNode(true));

        lastFocused = document.activeElement;
        modal.hidden = false;
        document.body.style.overflow = 'hidden';

        const back = body.querySelector('[data-modal-close]');
        if (back) {
            back.addEventListener('click', closeModal);
        }

        closeBtn.focus();
    }

    container.addEventListener('click', function (event) {
        const button = event.target.closest('.btn-detail');
        if (!button) {
            return;
        }

        const card = button.closest('.card');
        if (card) {
            openModal(card);
        }
    });

    closeBtn.addEventListener('click', closeModal);

    modal.addEventListener('click', function (event) {
        if (event.target === modal) {
            closeModal();
        }
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && !modal.hidden) {
            closeModal();
        }
    });
})();
