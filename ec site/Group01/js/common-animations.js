gsap.registerPlugin(ScrollTrigger);

// ─── ページ入場フェードイン（全ページ共通） ───────────
gsap.from('body', { opacity: 0, duration: 0.6, ease: 'power2.out' });

// ─── ユーティリティ ────────────────────────────────────
function animateOnScroll(selector, vars, triggerEl) {
  const els = document.querySelectorAll(selector);
  if (!els.length) return;
  gsap.from(selector, {
    ...vars,
    scrollTrigger: {
      trigger: triggerEl || selector,
      start: 'top 85%',
      once: true,
    },
  });
}

// ─── タイトルセクション（.fixd_page_p h1） ─────────────
const pageTitle = document.querySelector('.fixd_page_p h1');
if (pageTitle) {
  gsap.from(pageTitle, {
    y: -40, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.2,
  });
}
const fixdPage = document.querySelector('.fixd_page_p');
if (fixdPage) {
  gsap.from(fixdPage, {
    scaleX: 0, transformOrigin: 'left center',
    duration: 0.8, ease: 'power3.out', delay: 0.05,
  });
}

// ─── 規約・ガイド系ページ（.terms h2 / p） ─────────────
animateOnScroll('.terms h2', {
  x: -30, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.08,
}, '.terms');
animateOnScroll('.terms p', {
  y: 20, opacity: 0, duration: 0.5, ease: 'power2.out', stagger: 0.05,
}, '.terms');

// ─── FAQ ──────────────────────────────────────────────
animateOnScroll('.faq-item', {
  x: -40, opacity: 0, duration: 0.5, ease: 'power3.out', stagger: 0.07,
}, '.faq-list');

// ─── 会社情報テーブル ──────────────────────────────────
animateOnScroll('.company-table tr', {
  y: 20, opacity: 0, duration: 0.5, ease: 'power2.out', stagger: 0.06,
}, '.company-table');

// ─── コンタクトフォーム ────────────────────────────────
animateOnScroll('.form-group', {
  y: 30, opacity: 0, duration: 0.55, ease: 'power3.out', stagger: 0.1,
}, '.contact-form');
const contactBtn = document.querySelector('.btn-wrap, .check-btn-wrap');
if (contactBtn) {
  gsap.from(contactBtn, {
    y: 20, opacity: 0, duration: 0.5, ease: 'power2.out', delay: 0.5,
    scrollTrigger: { trigger: contactBtn, start: 'top 90%', once: true },
  });
}

// ─── コンタクト確認・完了画面（check-item） ────────────
animateOnScroll('.check-item', {
  x: -30, opacity: 0, duration: 0.5, ease: 'power3.out', stagger: 0.08,
}, '.check-box, .contact-check');
const completeIcon = document.querySelector('.complete-icon, .complete-head');
if (completeIcon) {
  gsap.from(completeIcon, { scale: 0.7, opacity: 0, duration: 0.7, ease: 'back.out(1.5)', delay: 0.3 });
}
animateOnScroll('.complete-text', {
  y: 20, opacity: 0, duration: 0.5, ease: 'power2.out', stagger: 0.1,
}, '.contact-complete');

// ─── カートページ：タイトルとステップインジケーターのみ ──
// (ステップ切り替えアニメーションはcart.html内のshowStep/animateStepInが担当)
const cartTitle = document.querySelector('.cart-title');
if (cartTitle) {
  gsap.from(cartTitle, { y: -40, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.15 });
}
const cartStep = document.querySelector('.cart-step');
if (cartStep) {
  gsap.from(cartStep, { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out', delay: 0.35 });
}

// ─── MY PAGE ─────────────────────────────────────────
const mypageTitle = document.querySelector('.mypage__title');
if (mypageTitle) {
  // ページタイトル
  gsap.from('.mypage__title', {
    y: -50, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.15,
  });

  // プロフィール：画像←左から、テキスト→右から
  gsap.from('.mypage__profile-img', {
    x: -60, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.35,
  });
  gsap.from('.mypage__profile-right', {
    x: 60, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.5,
  });

  // ディバイダー：横に広がる
  gsap.from('.mypage__divider', {
    scaleX: 0, transformOrigin: 'left center', duration: 0.8, ease: 'power3.out',
    scrollTrigger: { trigger: '.mypage__divider', start: 'top 90%', once: true },
  });

  // FAVORITEセクション大タイトル
  gsap.from('.mypage__favorite .mypage__big-title', {
    y: 60, opacity: 0, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '.mypage__favorite', start: 'top 85%', once: true },
  });
  gsap.from('.mypage__favorite .mypage__section-ja', {
    y: 30, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.15,
    scrollTrigger: { trigger: '.mypage__favorite', start: 'top 85%', once: true },
  });

  // SETS / ITEMS サブタイトル＋グリッド
  gsap.from('.mypage__sub-title', {
    x: -30, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.12,
    scrollTrigger: { trigger: '.mypage__favorite', start: 'top 80%', once: true },
  });
  gsap.from('.mypage__grid', {
    y: 30, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.15,
    scrollTrigger: { trigger: '.mypage__favorite', start: 'top 75%', once: true },
  });

  // PURCHASE HISTORY セクション
  gsap.from('.mypage__history .mypage__big-title', {
    y: 60, opacity: 0, duration: 0.9, ease: 'power3.out',
    scrollTrigger: { trigger: '.mypage__history', start: 'top 85%', once: true },
  });
  gsap.from('.mypage__history .mypage__section-ja', {
    y: 30, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.15,
    scrollTrigger: { trigger: '.mypage__history', start: 'top 85%', once: true },
  });
  gsap.from('.mypage__history-nav', {
    opacity: 0, duration: 0.5, ease: 'power2.out', delay: 0.3,
    scrollTrigger: { trigger: '.mypage__history', start: 'top 85%', once: true },
  });
  gsap.from('.mypage__history-list', {
    y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
    scrollTrigger: { trigger: '.mypage__history-list', start: 'top 88%', once: true },
  });
}

// ─── NEWSおすすめ詳細ページ ────────────────────────────
const newsHeroTitle = document.querySelector('.news-hero__title');
if (newsHeroTitle) {
  gsap.from('.news-hero__title', { y: 50, opacity: 0, duration: 0.8, ease: 'power3.out', delay: 0.2 });
  gsap.from('.news-hero__desc',  { y: 30, opacity: 0, duration: 0.7, ease: 'power3.out', delay: 0.4 });
}
animateOnScroll('.news-detail', {
  y: 40, opacity: 0, duration: 0.8, ease: 'power3.out',
}, '.news-detail');
animateOnScroll('.newsitem_product_group', {
  y: 40, opacity: 0, duration: 0.6, ease: 'power3.out', stagger: 0.1,
}, '.newsitem_section');
