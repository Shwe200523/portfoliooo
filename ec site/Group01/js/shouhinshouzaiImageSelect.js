

const mainImg = document.getElementById('display-img');
const thumbs = document.querySelectorAll('.thumbnails-container .thumb');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');

let currentIndex = 0;

// 画像を更新する共通関数
function updateGallery(index) {
    if (index < 0) index = thumbs.length - 1;
    if (index >= thumbs.length) index = 0;
    
    currentIndex = index;
    
    // メイン画像とサムネイルのクラスを更新
    mainImg.src = thumbs[currentIndex].src;
    document.querySelector('.thumbnails-container .thumb.active')?.classList.remove('active');
    thumbs[currentIndex].classList.add('active');
}

// サムネイルクリック時のイベント
thumbs.forEach((thumb, index) => {
    thumb.addEventListener('click', () => {
        updateGallery(index);
    });
});

// 戻るボタン
prevBtn.addEventListener('click', () => {
    updateGallery(currentIndex - 1);
});

// 進むボタン
nextBtn.addEventListener('click', () => {
    updateGallery(currentIndex + 1);
});