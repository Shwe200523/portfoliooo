gsap.registerPlugin(ScrollTrigger);

// ─── ページ入場アニメ（共通） ───────────────────
gsap.from('body', { opacity: 0, duration: 0.5, ease: 'power2.out' });

// ─── ユーティリティ：要素があれば実行 ───────────
function animate(selector, vars, triggerVars = {}) {
  const els = document.querySelectorAll(selector);
  if (!els.length) return;
  gsap.from(selector, {
    ...vars,
    scrollTrigger: {
      trigger: selector,
      start: 'top 85%',
      once: true,
      ...triggerVars,
    },
  });
}

// ─── NEWS ページ ────────────────────────────────
// ヒーロー
gsap.from('.bijyuaru h1', { y: 60, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.2 });
gsap.from('.bijyuaru h2', { y: 40, opacity: 0, duration: 0.9, ease: 'power3.out', delay: 0.45 });

// カードのstagger
gsap.from('.card', {
  y: 60,
  opacity: 0,
  duration: 0.7,
  ease: 'power3.out',
  stagger: 0.1,
  scrollTrigger: { trigger: '.grid', start: 'top 85%', once: true },
});

// ─── ITEM ページ ────────────────────────────────
// フィルタータブ
gsap.from('.item-filter', { y: -20, opacity: 0, duration: 0.35, ease: 'power2.out', delay: 0.1 });

// カード（初期表示のみ）
gsap.from('.item-card', {
  y: 30, opacity: 0, duration: 0.35, ease: 'power2.out', stagger: 0.05, delay: 0.15,
});

// ─── 商品詳細ページ ─────────────────────────────
// 左：画像エリア
gsap.from('.shouhinshouzai_left', {
  x: -60, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.2,
});

// 右：テキストエリア
gsap.from('.shouhinshouzai_right', {
  x: 60, opacity: 0, duration: 1, ease: 'power3.out', delay: 0.4,
});

// 詳細・返品アコーディオン
animate('.shouzaiwomiru', { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' });
animate('.henpin', { y: 20, opacity: 0, duration: 0.6, ease: 'power2.out' });

// レビューカード
gsap.from('.review-card', {
  y: 40, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.12,
  scrollTrigger: { trigger: '.review-section', start: 'top 85%', once: true },
});

// PICKUPカード
gsap.from('.pickup_img_frame_group', {
  y: 50, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1,
  scrollTrigger: { trigger: '.pickup', start: 'top 85%', once: true },
});

// FOLLOWセクション
gsap.from('.follow_left', {
  x: -50, opacity: 0, duration: 0.9, ease: 'power3.out',
  scrollTrigger: { trigger: '.follow', start: 'top 85%', once: true },
});
gsap.from('.follow_right_picture', {
  scale: 0.85, opacity: 0, duration: 0.7, ease: 'power3.out', stagger: 0.1,
  scrollTrigger: { trigger: '.follow', start: 'top 85%', once: true },
});
