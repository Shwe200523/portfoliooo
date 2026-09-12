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
