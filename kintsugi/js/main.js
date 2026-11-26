import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger.js';
import { createStage } from './stage.js';
import { loadBowl } from './bowl.js';
import { createScrollTimeline } from './scroll.js';

// TOP ページの SECTION 01・02：3D の器を用意して、読み込みが終わったら表示する
(function () {
  'use strict';

  var html = document.documentElement; // <html> ← 読み込み中・エラーのクラス（is-loading / is-error）
  var canvas = document.querySelector('.webgl'); // 3D の器を描くキャンバス
  var heroSlot = document.querySelector('.hero_visual'); // SECTION 01 で器を置く場所
  var kintsugiSlot = document.querySelector('.kintsugi_visual'); // SECTION 02 で器を置く場所
  var loader = document.querySelector('.loader'); // 読み込み画面
  var loaderFill = document.querySelector('.loader_fill'); // 読み込みバー ← 読み込みの進み具合
  var loaderNote = document.querySelector('.loader_note'); // 読み込み画面の案内文 ← エラーの文
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)'); // パソコンの「動きを減らす」設定
  if (!canvas) return;

  // ーーーーーーーーーーーーーーーーーーーー
  //   HTMLとのつながり done
  // ーーーーーーーーーーーーーーーーーーーー

  // 器の 3D モデル
  var MODEL_URL = 'assets/models/kintsugi_site.glb';

  // スクロールに合わせて 0 → 1 に変わる値（js/scroll.js が変え、毎フレーム 3D に反映する）
  //   layout  ：器の位置（0 = SECTION 01 の右 / 1 = SECTION 02 の左）
  //   assemble：破片が集まる（継ぎ目に裂け目が残る位置まで）
  //   gold    ：裂け目に金が流れ込む
  //   close   ：残りのすき間が閉じる
  //   merge   ：1 つの器に切り替える
  //   spin    ：完成後にゆっくり回る
  var state = { layout: 0, assemble: 0, close: 0, merge: 0, gold: 0, spin: 0 };

  // ーーーーーーーーーーーーーーーーーーーー
  //   データ入力 done
  // ーーーーーーーーーーーーーーーーーーーー

  // 3D の準備をして、器のモデルを読み込む
  function start() {
    createScrollTimeline(state);

    var stage;
    try {
      stage = createStage(canvas, { getSlots: getSlots });
    } catch (error) {
      showError('WebGL を利用できないため、3D を表示できません。', error);
      return;
    }

    // フォントが読み込まれると文字の高さが変わるので、器の位置を計算し直す
    document.fonts.ready.then(function () {
      stage.refit();
      ScrollTrigger.refresh();
    });

    loadBowl(MODEL_URL, function (ratio) {
      loaderFill.style.transform = 'scaleX(' + ratio + ')';
    }).then(
      function (bowl) {
        showBowl(stage, bowl);
      },
      function (error) {
        showError('3D モデルを読み込めませんでした（' + MODEL_URL + '）。', error);
      },
    );
  }

  // 読み込んだ器をステージに置いて、表示を始める
  function showBowl(stage, bowl) {
    stage.add(bowl.object);
    stage.setSubject(bowl.samplePoints());

    // 金などの見た目を先に準備して、スクロールの途中でカクつかないようにする
    bowl.showAll();
    stage.renderer.compile(stage.scene, stage.camera);

    var intro = { value: reducedMotion.matches ? 1 : 0 };
    startLoop(stage, bowl, intro);
    playIntro(intro);

    // 器の読み込みが終わったら、スクロールの位置を計算し直す
    ScrollTrigger.refresh();
  }

  // 毎フレーム、スクロールの値（state）を器とカメラに反映して描く
  function startLoop(stage, bowl, intro) {
    stage.renderer.setAnimationLoop(function (now) {
      var time = now / 1000;
      var floatY = bowl.update(state, time, intro.value, reducedMotion.matches);
      stage.update(state, time, floatY, reducedMotion.matches);
      stage.render();
    });
  }

  // 読み込み画面を消して、器・ヘッダー・文字をゆっくり表示する
  function playIntro(intro) {
    var offset = reducedMotion.matches ? 0 : 18;

    gsap
      .timeline({ defaults: { ease: 'power2.out' } })
      .to(loader, { autoAlpha: 0, duration: 0.5 })
      .fromTo(canvas, { opacity: 0 }, { opacity: 1, duration: 1.8 }, 0.2)
      .to(intro, { value: 1, duration: 2.4, ease: 'power3.out' }, 0.2)
      // ヘッダーは透明度だけ変える（動かすとスマホのメニューが画面いっぱいに広がらない）
      .fromTo('.header, .float', { autoAlpha: 0 }, { autoAlpha: 1, duration: 1.4 }, 0.5)
      .fromTo(
        '.hero_copy > *, .scroll > *',
        { autoAlpha: 0, y: offset },
        { autoAlpha: 1, y: 0, duration: 1.4, stagger: 0.14 },
        0.5,
      );

    // 上で先に透明にしているので、クラスを外しても一瞬見えてしまうことはない
    html.classList.remove('is-loading');
  }

  // 器を置く場所（各セクションが画面の一番上にあるときの位置と大きさ）
  function getSlots() {
    return [heroSlot, kintsugiSlot].map(function (slot) {
      var section = slot.closest('section').getBoundingClientRect();
      var rect = slot.getBoundingClientRect();
      return new DOMRect(rect.left - section.left, rect.top - section.top, rect.width, rect.height);
    });
  }

  // 3D が表示できないときに、読み込み画面に理由を出す
  function showError(message, error) {
    console.error(error);
    loaderNote.textContent = message;
    loaderNote.hidden = false;
    html.classList.add('is-error');
    html.classList.remove('is-loading');
  }

  // ーーーーーーーーーーーーーーーーーーーー
  //   コード（関数） done
  // ーーーーーーーーーーーーーーーーーーーー

  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  start();
})();
