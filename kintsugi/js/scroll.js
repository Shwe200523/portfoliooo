import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger.js';

// スクロールに合わせて、器の値（state）と SECTION 01・02 の文字を動かす
//
// 器は直接動かさず、state の値だけを 0 → 1 に変える（毎フレーム js/main.js が 3D に反映する）。
// スクロールを戻せば、そのまま逆に再生される。
// タイムライン全体の長さを 1 にしているので、下の数字は「全体のどこか」を表す。
//
//   0.00 – 0.03  割れた状態のまま
//   0.00 – 1/3   器が右（SECTION 01）から左（SECTION 02）へ移る          layout
//   0.03 – 0.40  破片がゆっくり集まり、裂け目が残る位置で止まる          assemble
//   0.40 – 0.50  裂け目の見える器のまま、少し保つ
//   0.50 – 0.82  裂け目に沿って、金が静かに流れ込む                       gold
//   0.70 – 0.84  金が入るのに合わせて、残りのすき間が閉じる               close
//   0.84 – 0.86  閉じきったら 1 つの器に切り替える（見た目は同じ）        merge
//   0.85 – 1.00  完成。ゆっくり回り、カメラが少し寄る                     spin
var createScrollTimeline = (function () {
  'use strict';

  var section = document.querySelector('.kintsugi'); // SECTION 02（スクロール中に画面に固定する）
  var scrollSign = document.querySelector('.scroll'); // SECTION 01 左下の「scroll」← 最初に消す
  var heroCopy = document.querySelector('.hero_copy'); // SECTION 01 の文字 ← 上へ消える
  var kintsugiText = document.querySelector('.kintsugi_text'); // SECTION 02 の文字 ← 下から出てくる
  var items = document.querySelectorAll('.kintsugi_item'); // 01 修復・02 継承・03 美 ← いま起きていることを濃くする
  var lineFill = document.querySelector('.kintsugi_line_fill'); // 3 つの項目の左の線 ← 上から下へ伸びる

  // ーーーーーーーーーーーーーーーーーーーー
  //   HTMLとのつながり done
  // ーーーーーーーーーーーーーーーーーーーー

  var PIN_START = 1 / 3; // SECTION 02 の固定が始まる位置
  var DIM = 0.3; // 進行中でない項目の濃さ

  // ーーーーーーーーーーーーーーーーーーーー
  //   データ入力 done
  // ーーーーーーーーーーーーーーーーーーーー

  // SECTION 02 を、画面 2 枚分スクロールするあいだ固定する
  function pinSection() {
    ScrollTrigger.create({
      trigger: section,
      start: 'top top',
      end: '+=200%',
      pin: true,
      anticipatePin: 1,
    });
  }

  // SECTION 02 が画面の下から入ってくるところ（= ページの一番上）から、固定の終わりまでのタイムライン
  function createTimeline() {
    return gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: section,
        start: 'top bottom',
        end: '+=300%',
        scrub: 1.5,
        invalidateOnRefresh: true,
      },
    });
  }

  // 器の値（state）を、上の表のとおりに変える
  function addBowlSteps(tl, state) {
    tl.to(state, { layout: 1, duration: PIN_START, ease: 'sine.inOut' }, 0)
      .to(state, { assemble: 1, duration: 0.37 }, 0.03)
      .to(state, { gold: 1, duration: 0.32 }, 0.5)
      .to(state, { close: 1, duration: 0.14, ease: 'sine.inOut' }, 0.7)
      .to(state, { merge: 1, duration: 0.02 }, 0.84)
      .to(state, { spin: 1, duration: 0.15, ease: 'sine.inOut' }, 0.85);
  }

  // SECTION 01 の文字を消して、SECTION 02 の文字を出す
  // （読み込み時の表示は中の要素、ここでは外側の要素を動かして、ぶつからないようにする）
  function addTextSteps(tl) {
    tl.to(scrollSign, { autoAlpha: 0, duration: 0.03 }, 0)
      .to(heroCopy, { autoAlpha: 0, y: -40, duration: 0.12, ease: 'power1.in' }, 0.02)
      .fromTo(kintsugiText, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 0.12, ease: 'power1.out' }, 0.21);
  }

  // 項目を濃くする
  function lightItem(tl, targets, at) {
    tl.to(targets, { opacity: 1, duration: 0.03 }, at);
  }

  // 項目を薄くする
  function dimItem(tl, targets, at) {
    tl.to(targets, { opacity: DIM, duration: 0.03 }, at);
  }

  // 器の変化に合わせて、いま起きている項目を濃くする
  //   01 修復：破片が集まる / 02 継承：裂け目に金が入る / 03 美：完成
  function addItemSteps(tl) {
    var repair = items[0];
    var inherit = items[1];
    var beauty = items[2];

    gsap.set([inherit, beauty], { opacity: DIM });
    dimItem(tl, repair, 0.5);
    lightItem(tl, inherit, 0.5);
    dimItem(tl, inherit, 0.72);
    lightItem(tl, beauty, 0.72);
    lightItem(tl, [repair, inherit], 0.92); // 完成したら 3 つとも濃くする
  }

  // 項目の左の線を、固定のあいだに上から下へ伸ばす（ここでタイムラインの長さがちょうど 1 になる）
  function addLineStep(tl) {
    tl.fromTo(lineFill, { scaleY: 0 }, { scaleY: 1, duration: 1 - PIN_START }, PIN_START);
  }

  // ここまでの動きをまとめて作る（js/main.js から呼ぶ）
  function createScrollTimeline(state) {
    pinSection();
    var tl = createTimeline();
    addBowlSteps(tl, state);
    addTextSteps(tl);
    addItemSteps(tl);
    addLineStep(tl);
  }

  // ーーーーーーーーーーーーーーーーーーーー
  //   コード（関数） done
  // ーーーーーーーーーーーーーーーーーーーー

  return createScrollTimeline;
})();

export { createScrollTimeline };
