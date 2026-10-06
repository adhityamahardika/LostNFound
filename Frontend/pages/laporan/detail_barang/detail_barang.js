// Fungsi untuk mengganti gambar utama dari thumbnail
function changeImage(emojiSource, thumbnailElement) {
    // 1. Ubah konten di kotak gambar utama
    const mainImage = document.getElementById('main-image');
    mainImage.innerText = emojiSource;
    
    // Animasi fade in sederhana (opsional)
    mainImage.style.opacity = 0;
    setTimeout(() => {
        mainImage.style.opacity = 1;
    }, 50);

    // 2. Hapus class 'active' dari semua thumbnail
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach(thumb => {
        thumb.classList.remove('active');
    });

    // 3. Tambahkan class 'active' ke thumbnail yang baru saja diklik
    thumbnailElement.classList.add('active');
}