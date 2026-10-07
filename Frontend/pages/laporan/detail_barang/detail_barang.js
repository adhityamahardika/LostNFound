const mainImage = document.getElementById('main-image');
const thumbnails = document.querySelectorAll('.thumbnail');

thumbnails.forEach(thumb => {
    thumb.addEventListener('click', () => {
        mainImage.textContent = thumb.dataset.emoji;
        thumbnails.forEach(t => {
            t.classList.toggle('active', t === thumb);
            t.setAttribute('aria-pressed', String(t === thumb));
        });
    });
});

const klaimBtn = document.getElementById('btn-klaim');
if (klaimBtn) {
    klaimBtn.addEventListener('click', () => {
        // TODO: ganti dengan form verifikasi klaim saat backend siap
        klaimBtn.textContent = 'Form verifikasi segera tersedia';
        klaimBtn.disabled = true;
    });
}
