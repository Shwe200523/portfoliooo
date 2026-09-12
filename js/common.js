/* ============================================
   全ページ共通の処理
   （ローディング / ヘッダー / メニュー / スクロール / フェード）
============================================ */
'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ------------------------------------------
     Loading → ヒーローの文字を出す
  ------------------------------------------ */
  const loading = document.getElementById('loading');

  const startSite = () => {
    loading.classList.add('is-hide');
    document.body.classList.add('is-ready');
  };

  // 画像の読み込みが終わったら閉じる（最低1.2秒は見せる）
  const minWait = new Promise(resolve => setTimeout(resolve, 1200));
  const pageLoad = new Promise(resolve => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve, { once: true });
  });
  // 万一読み込みが遅くても4秒で強制的に解除
  const failSafe = new Promise(resolve => setTimeout(resolve, 4000));

  Promise.race([Promise.all([minWait, pageLoad]), failSafe]).then(startSite);


  /* ------------------------------------------
     SP : ハンバーガーメニュー
  ------------------------------------------ */
  const menubtn = document.getElementById('menubtn');
  const gnav    = document.getElementById('gnav');

  const closeMenu = () => {
    menubtn.classList.remove('is-open');
    gnav.classList.remove('is-open');
    document.documentElement.classList.remove('is-locked');
  };

  menubtn.addEventListener('click', () => {
    const willOpen = !gnav.classList.contains('is-open');
    menubtn.classList.toggle('is-open', willOpen);
    gnav.classList.toggle('is-open', willOpen);
    document.documentElement.classList.toggle('is-locked', willOpen);
  });

  // メニュー内のリンクを押したら閉じる
  gnav.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', closeMenu);
  });

  // Escキーでも閉じる
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeMenu();
  });


  /* ------------------------------------------
     スムーススクロール（ヘッダー分ずらす）
  ------------------------------------------ */
  const header = document.getElementById('header');

  document.querySelectorAll('[data-scroll]').forEach(link => {
    link.addEventListener('click', e => {
      const id = link.getAttribute('href');
      if (!id || !id.startsWith('#')) return;

      const target = document.querySelector(id);
      if (!target) return;

      e.preventDefault();
      const offset = header.offsetHeight;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;

      window.scrollTo({ top, behavior: 'smooth' });
    });
  });


  /* ------------------------------------------
     スクロールで要素をふわっと表示
  ------------------------------------------ */
  const fadeItems = document.querySelectorAll('.js-fade');

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-show');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });

    fadeItems.forEach((el, i) => {
      // 同じ列に並ぶものは少しずつ遅らせる
      el.style.transitionDelay = `${(i % 3) * 0.09}s`;
      io.observe(el);
    });
  } else {
    fadeItems.forEach(el => el.classList.add('is-show'));
  }

});
