/**
 * Detail barang: ganti foto utama saat thumbnail diklik.
 */
(function () {
    const main = document.getElementById('main-image');
    if (!main) {
        return;
    }

    const gambarUtama = main.querySelector('img');
    const thumbnails = document.querySelectorAll('.thumbnail');

    if (!gambarUtama) {
        return;
    }

    thumbnails.forEach(function (thumbnail) {
        thumbnail.addEventListener('click', function () {
            const src = thumbnail.dataset.img;
            if (!src) {
                return;
            }

            gambarUtama.src = src;

            thumbnails.forEach(function (item) {
                const aktif = item === thumbnail;
                item.classList.toggle('active', aktif);
                item.setAttribute('aria-pressed', String(aktif));
            });
        });
    });
})();
