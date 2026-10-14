/* ============================================
   Works一覧ページ専用の処理
   （カテゴリで絞り込む）
============================================ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  const buttons = document.querySelectorAll('.filter__btn');
  const cards   = document.querySelectorAll('.card');
  if (!buttons.length || !cards.length) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {

      // 押したボタンだけを選択状態にする
      buttons.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      // 該当しないカードを隠す
      const target = btn.dataset.filter;
      cards.forEach(card => {
        const match = (target === 'all' || card.dataset.cat === target);
        card.classList.toggle('is-hide', !match);
      });
    });
  });

});

/* ============================================
   作品資料ビューア
   （カードを押すと資料の全ページを表示）
============================================ */
document.addEventListener('DOMContentLoaded', () => {

  const gallery = document.getElementById('gallery');
  const inner   = document.getElementById('galleryInner');
  const close   = document.getElementById('galleryClose');
  if (!gallery) return;

  const closeGallery = () => {
    gallery.hidden = true;
    document.documentElement.classList.remove('is-locked');
  };

  document.querySelectorAll('.js-gallery').forEach(btn => {
    btn.addEventListener('click', () => {
      inner.replaceChildren(...btn.dataset.images.split(',').map(src => {
        const img = document.createElement('img');
        img.src = src;
        return img;
      }));
      gallery.hidden = false;
      gallery.scrollTop = 0;
      document.documentElement.classList.add('is-locked');
    });
  });

  close.addEventListener('click', closeGallery);
  gallery.addEventListener('click', e => {
    if (e.target === gallery || e.target === inner) closeGallery();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !gallery.hidden) closeGallery();
  });

});
