/* ============================================
   トップページ専用の処理
   （現在地に応じてナビをハイライト）
============================================ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  const gnav = document.getElementById('gnav');
  if (!gnav) return;

  const sections = document.querySelectorAll('main section[id]');
  const navLinks = gnav.querySelectorAll('a[href^="#"]');
  if (!sections.length || !navLinks.length) return;

  const update = () => {

    // 画面の中央にかかっているセクションを現在地にする
    const line = window.innerHeight / 2;
    let current = '';

    sections.forEach(sec => {
      const box = sec.getBoundingClientRect();
      if (box.top <= line && box.bottom >= line) {
        current = sec.id;
      }
    });

    // 現在地のリンクだけ線を出す
    navLinks.forEach(a => {
      const match = (a.getAttribute('href') === `#${current}`);
      a.classList.toggle('is-current', match);
    });
  };

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);

});
