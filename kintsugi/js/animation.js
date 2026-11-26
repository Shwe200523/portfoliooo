(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)'); // 「動きを減らす」設定
  // 各セクションの中身 ← 見えたら is-show を付ける
  // （TOP の hero・kintsugi は GSAP で、ページ上の pagehead は CSS で、生徒の声のスライダーは script.js で動かしているので除く）
  var items = document.querySelectorAll('body > section:not(.hero):not(.kintsugi):not(.pagehead) > :not(.voice_list)');
  if (reducedMotion.matches || !items.length) return;

  // ーーーーーーーーーーーーーーーーーーーー
  //   HTMLとのつながり done
  // ーーーーーーーーーーーーーーーーーーーー

  // 中身の種類ごとに、どの動きを付けるか（上から順に調べて、最初に合ったものを使う。どれにも合わなければ、下からふわっと出るだけ）
  //   match：中身の種類（CSS と同じ書き方）
  //   name ：付けるクラス（動きは css/animation.css に書く）
  var motions = [
    { match: 'h2', name: 'fade_blur' }, // 見出し：にじむように出る
    { match: '[class$="_label"]', name: 'fade_line' }, // 英字のラベル：左から出て、金の線が伸びる
    { match: 'img', name: 'fade_zoom' }, // 写真：少し大きいところから、ゆっくり元の大きさへ
    { match: 'ul, ol', name: 'fade_list' }, // リスト：1つずつ順番に出る
  ];
  var LIST_MAX = 6; // 順番に出すリストの、項目の数の上限（これより多いリストは、まとめて出す）

  // ーーーーーーーーーーーーーーーーーーーー
  //   データ入力 done
  // ーーーーーーーーーーーーーーーーーーーー

  // 中身に合う動きのクラス名を返す（合うものがなければ、空の文字）
  function getMotion(item) {
    for (var i = 0; i < motions.length; i++) {
      if (!item.matches(motions[i].match)) continue;
      if (motions[i].name === 'fade_list' && item.children.length > LIST_MAX) return '';
      return motions[i].name;
    }
    return '';
  }

  // 画面に入った中身に is-show を付けて動かす（1回動いたら、もう見張らない）
  function showItems(entries, observer) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-show');
      observer.unobserve(entry.target);
    });
  }

  // リストの 2〜6 番目の項目に、少しずつ遅れて出るためのクラス（fade_delay2〜6）を付ける
  function addDelay(list) {
    for (var i = 1; i < list.children.length; i++) {
      list.children[i].classList.add('fade_delay' + (i + 1));
    }
  }

  // 中身に fade と動きのクラスを付けていったん隠し、画面に入るのを見張る
  // （画面の下 10% の手前で動かすので、出てくる動きがちゃんと見える）
  function setupFade() {
    var observer = new IntersectionObserver(showItems, { rootMargin: '0px 0px -10% 0px' });

    items.forEach(function (item) {
      var motion = getMotion(item);
      item.classList.add('fade');
      if (motion) item.classList.add(motion);
      if (motion === 'fade_list') addDelay(item);
      observer.observe(item);
    });
  }

  // ーーーーーーーーーーーーーーーーーーーー
  //   コード（関数） done
  // ーーーーーーーーーーーーーーーーーーーー

  setupFade();

})();
