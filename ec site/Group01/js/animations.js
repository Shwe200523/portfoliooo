gsap.registerPlugin(ScrollTrigger);

// ─── ローダー終了後に開始 ───────────────────────────
function initAnimations() {
  heroAnimations();
  aboutAnimations();
  newsAnimations();
  sluAnimations();
  itemAnimations();
  mixMatchAnimations();
  followAnimations();
}

// ローダーが終わるまで待つ（1600ms + 900ms = 2500ms）
window.addEventListener('load', () => {
  setTimeout(initAnimations, 1700);
});

// ─── アダプティブヘッダー（背景に応じてナビ色変更） ──
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.header');
  if (!header) return;

  const navLinks = header.querySelectorAll('.header__nav a');

  // true = 白背景 → ナビを暗色に
  const sectionThemes = [
    { selector: '.hero',        isLight: false },
    { selector: '.about',       isLight: true  },
    { selector: '.News',        isLight: false },
    { selector: '.Set_Line_Up', isLight: true  },
    { selector: '.Item',        isLight: false },
    { selector: '.Mix_Match',   isLight: true  },
    { selector: '.follow',      isLight: true  },
  ];

  const sections = sectionThemes
    .map(({ selector, isLight }) => ({ el: document.querySelector(selector), isLight }))
    .filter(s => s.el);

  const DARK_COLOR  = '#ffffff';
  const LIGHT_COLOR = '#111111';

  let current = null;

  function update() {
    const mid = header.offsetHeight / 2;

    for (const { el, isLight } of sections) {
      const rect = el.getBoundingClientRect();
      if (rect.top <= mid && rect.bottom > mid) {
        if (current !== isLight) {
          current = isLight;
          const color = isLight ? LIGHT_COLOR : DARK_COLOR;
          navLinks.forEach(a => {
            a.style.color = color;
          });
          header.classList.toggle('is-light', isLight);
        }
        break;
      }
    }
  }

  window.addEventListener('scroll', update, { passive: true });
  update();
});

// ─── HERO ────────────────────────────────────────────
function heroAnimations() {
  // ヒーロー画像のゆっくりスケールイン
  gsap.from('.hero__bg img', {
    scale: 1.15,
    duration: 2,
    ease: 'power3.out',
    delay: 0.2,
  });

  // ヒーローロゴのフェードイン
  gsap.from('.hero__text', {
    opacity: 0,
    y: 30,
    duration: 1.2,
    ease: 'power3.out',
    delay: 0.5,
  });

  // スクロールでヒーロー画像がパララックス
  gsap.to('.hero__bg img', {
    yPercent: 20,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
}

// ─── ABOUT ───────────────────────────────────────────
function aboutAnimations() {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.about',
      start: 'top 75%',
      once: true,
    },
  });

  // 写真グループ：左からスライドイン
  tl.from('.about_left', {
    x: -80,
    opacity: 0,
    duration: 1.2,
    ease: 'power3.out',
  });

  // 大見出し：下からマスク reveal
  tl.from('.about_right_bigword', {
    y: 80,
    opacity: 0,
    duration: 1,
    ease: 'power3.out',
  }, '-=0.8');

  // キャッチコピー
  tl.from('.about_right_catchcopy', {
    y: 40,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out',
  }, '-=0.6');

  // 本文
  tl.from('.about_right_paragraph', {
    y: 30,
    opacity: 0,
    duration: 0.7,
    ease: 'power3.out',
  }, '-=0.5');

  // ボタン
  tl.from('.about_right_viewmore a', {
    y: 20,
    opacity: 0,
    duration: 0.6,
    ease: 'power3.out',
    immediateRender: false,
    clearProps: 'opacity,transform',
  }, '-=0.4');

  // 小さい写真：遅れてスライドイン
  tl.from('.about_left_photogroup_small', {
    x: 40,
    opacity: 0,
    duration: 1,
    ease: 'power3.out',
  }, '-=1.2');
}

// ─── NEWS ────────────────────────────────────────────
function newsAnimations() {
  // BIG WORD：左から右へ気持ちよくスライドイン
  gsap.fromTo('.News_Big_words',
    { xPercent: -40 },
    { xPercent: 0, ease: 'none',
      scrollTrigger: { trigger: '.News', start: 'top bottom', end: 'top center', scrub: 1.5 } }
  );

  // NEWSカード：ずらしてフェードイン
  gsap.from('.News_Category_item', {
    y: 60,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out',
    stagger: 0.15,
    scrollTrigger: {
      trigger: '.News_Category',
      start: 'top 80%',
      once: true,
    },
  });

  // カード画像：ズームアウト reveal
  gsap.from('.News_Category_item dt img', {
    scale: 1.2,
    duration: 1.2,
    ease: 'power3.out',
    stagger: 0.15,
    scrollTrigger: {
      trigger: '.News_Category',
      start: 'top 80%',
      once: true,
    },
  });
}

// ─── SET LINE UP ─────────────────────────────────────
function sluAnimations() {
  // 大見出し：左から右へスライドイン
  gsap.fromTo('.SLU_Big_word',
    { xPercent: -40 },
    { xPercent: 0, ease: 'none',
      scrollTrigger: { trigger: '.Set_Line_Up', start: 'top bottom', end: 'top center', scrub: 1.5 } }
  );

  // ボタン
  gsap.from('.SLU_button', {
    x: 40,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.Set_Line_Up',
      start: 'top 80%',
      once: true,
    },
  });

  // 商品カード：左からスライド
  gsap.from('.SLU_product_img_frame_group', {
    x: 80,
    opacity: 0,
    duration: 0.9,
    ease: 'power3.out',
    stagger: 0.1,
    scrollTrigger: {
      trigger: '.SLU_product_img_frame',
      start: 'top 85%',
      once: true,
    },
  });
}

// ─── ITEM ────────────────────────────────────────────
function itemAnimations() {
  // ITEM 大文字：左から右へスライドイン
  gsap.fromTo('.Item_Big_word',
    { xPercent: -40 },
    { xPercent: 0, ease: 'none',
      scrollTrigger: { trigger: '.Item', start: 'top bottom', end: 'top center', scrub: 1.5 } }
  );

  // 商品グリッド：ずらしてフェードアップ
  gsap.from('.Item_category_item', {
    y: 70,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out',
    stagger: 0.1,
    scrollTrigger: {
      trigger: '.Item_category',
      start: 'top 80%',
      once: true,
    },
  });

  // 商品画像：クリップ reveal
  gsap.from('.Item_category_item dt', {
    clipPath: 'inset(100% 0 0 0)',
    duration: 1,
    ease: 'power3.out',
    stagger: 0.1,
    scrollTrigger: {
      trigger: '.Item_category',
      start: 'top 80%',
      once: true,
    },
  });
}

// ─── MIX & MATCH ─────────────────────────────────────
function mixMatchAnimations() {
  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: '.Mix_Match',
      start: 'top 75%',
      once: true,
    },
  });

  // テキスト左から
  tl.from('.Mix_Match .header', {
    x: -80,
    opacity: 0,
    duration: 1.2,
    ease: 'power3.out',
  });

  tl.from('.Mix_Match .catchcopy', {
    x: -60,
    opacity: 0,
    duration: 0.9,
    ease: 'power3.out',
  }, '-=0.8');

  tl.from('.Mix_Match .paragraph', {
    x: -40,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out',
  }, '-=0.7');

  gsap.from('.Mix_Match .mix-btn', {
    y: 20,
    opacity: 0,
    duration: 0.7,
    ease: 'power3.out',
    clearProps: 'opacity',
    scrollTrigger: {
      trigger: '.Mix_Match',
      start: 'top 75%',
      once: true,
    },
  });

  // 写真：右からクリップ reveal
  tl.from('.Mix_Match .right', {
    clipPath: 'inset(0 100% 0 0)',
    duration: 1.4,
    ease: 'power3.out',
  }, '-=1.2');

  // 写真パララックス
  gsap.to('.Mix_Match .right img', {
    yPercent: -10,
    ease: 'none',
    scrollTrigger: {
      trigger: '.Mix_Match',
      start: 'top bottom',
      end: 'bottom top',
      scrub: 1,
    },
  });
}

// ─── FOLLOW ──────────────────────────────────────────
function followAnimations() {
  // ヘッダーテキスト
  gsap.from('.follow_left_header', {
    y: 40,
    opacity: 0,
    duration: 0.9,
    ease: 'power3.out',
    scrollTrigger: {
      trigger: '.follow',
      start: 'top 80%',
      once: true,
    },
  });

  // SNSアイコン
  gsap.from('.follow_left_icon a', {
    scale: 0,
    opacity: 0,
    duration: 0.5,
    ease: 'back.out(1.7)',
    stagger: 0.1,
    scrollTrigger: {
      trigger: '.follow',
      start: 'top 80%',
      once: true,
    },
  });

  // 写真：ずらしてスケールイン
  gsap.from('.follow_right_picture', {
    scale: 0.85,
    opacity: 0,
    duration: 0.8,
    ease: 'power3.out',
    stagger: 0.08,
    scrollTrigger: {
      trigger: '.follow_right',
      start: 'top 85%',
      once: true,
    },
  });
}

// ─── ホバー：マグネットボタン ─────────────────────────
document.querySelectorAll('.viewmore a, .about_right_viewmore a').forEach(btn => {
  btn.addEventListener('mousemove', e => {
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) * 0.3;
    const dy = (e.clientY - cy) * 0.3;
    gsap.to(btn, { x: dx, y: dy, duration: 0.4, ease: 'power2.out' });
  });
  btn.addEventListener('mouseleave', () => {
    gsap.to(btn, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.4)' });
  });
});
