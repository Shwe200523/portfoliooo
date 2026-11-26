(function () {
  'use strict';

  var header = document.querySelector('.header'); // ヘッダー ← header.html の中身
  var footer = document.querySelector('.footer'); // フッター ← footer.html の中身
  var pageTop = document.querySelector('.hero, .pagehead'); // ページの一番上のセクション（ここを過ぎたらヘッダーに背景を付ける）
  var loaderNote = document.querySelector('.loader_note'); // 読み込み画面の案内文（TOP だけ）← ローカルサーバーで開くお願い
  var worksTop = document.getElementById('works'); // 作品と声：作品ギャラリーのセクション（ページを変えたら、ここまで戻る）
  var courseButtons = document.querySelectorAll('.works_course button'); // 作品と声：コースで絞り込むボタン
  var worksList = document.querySelector('.works_list'); // 作品と声：作品を並べる場所 ← works
  var worksPager = document.querySelector('.works_pager'); // 作品と声：ページ番号のボタンを入れる場所
  var voiceList = document.querySelector('.voice_list'); // 作品と声：生徒の声のカードの列
  var voiceButtons = document.querySelectorAll('.voice_arrows button'); // 作品と声：生徒の声の ← と → のボタン
  var voiceDots = document.querySelector('.voice_dots'); // 作品と声：いま何番目かを表す点を入れる場所
  var noticeButtons = document.querySelectorAll('.notice_category button'); // お知らせ・コラム：種類で絞り込むボタン
  var noticeList = document.querySelector('.notice_list'); // お知らせ・コラム：お知らせを並べる場所 ← notices
  var columnList = document.querySelector('.column_list'); // お知らせ・コラム：コラムのカードを並べる場所 ← columns
  var checkButtons = document.querySelectorAll('.check_select button'); // かんたん診断：器の状態のボタン
  var checkResult = document.querySelector('.check_result'); // かんたん診断：結果の枠 ← checkResults
  var spMenu = window.matchMedia('(max-width: 1100px)'); // 画面の幅が 1100px 以下（全画面メニューになる）なら true

  // Menu ボタンなど、ヘッダーの中の要素は header.html を読み込んだあとに取得する（setupMenu などの中）

  var hasPageTop = !!pageTop;
  var hasLoaderNote = !!loaderNote;
  var hasWorks = !!worksList;
  var hasVoice = !!voiceList;
  var hasNotice = !!noticeList;
  var hasColumn = !!columnList;
  var hasCheck = !!checkResult;

  // ーーーーーーーーーーーーーーーーーーーー
  //   HTMLとのつながり done
  // ーーーーーーーーーーーーーーーーーーーー

  // かんたん診断の結果（ボタンの文字ごとに 1 つ）
  //   title：結果の見出し
  //   text ：説明の文
  //   note ：おすすめのコースと期間の目安
  var checkResults = {
    '欠け': {
      title: '本漆 金継ぎ教室で直せます',
      text: '口元やふちの欠けは、錆漆（さびうるし）で形を埋めてから、金をのせて仕上げます。天然の漆だけで直すので、完成後も食器として使えます。',
      note: 'おすすめ　本漆 金継ぎ教室　／　期間の目安　約2〜3か月',
    },
    'ヒビ': {
      title: '本漆 金継ぎ教室で直せます',
      text: 'ヒビに漆をしみこませて固め、表面に細く金の線をのせます。水もれも止まり、完成後も食器として使えます。',
      note: 'おすすめ　本漆 金継ぎ教室　／　期間の目安　約2か月',
    },
    '割れ（2〜3つ）': {
      title: '本漆 金継ぎ教室で直せます',
      text: '2〜3つに割れた器は、漆で破片をつなぎ、継ぎ目に金をのせて仕上げます。天然の漆だけで直すので、完成後も食器として使えます。',
      note: 'おすすめ　本漆 金継ぎ教室　／　期間の目安　約3か月（全10回）',
    },
    '破片がない': {
      title: '本漆 金継ぎ教室で直せます',
      text: 'なくなった部分は、漆を少しずつ盛って形をつくり、金で仕上げます。大きさによって回数が変わるので、器を見てからご案内します。',
      note: 'おすすめ　本漆 金継ぎ教室　／　期間の目安　約3〜4か月',
    },
    'ガラス・金属': {
      title: 'まずはお電話でご相談ください',
      text: 'ガラスは材料を変えて対応できる場合があります。金属・木・プラスチックの器は、状態を見てからのご案内になります。',
      note: 'ご相談　090-2323-4771（受付 10:00 – 18:00）',
    },
  };

  // 作品ギャラリーの作品（上から順に並ぶ。新しい作品はここに書き足す）
  //   img   ：写真のファイル名（img フォルダの中）
  //   tag   ：割れ方
  //   title ：作品の名前
  //   course：コース（絞り込むボタンの文字と同じにする）
  //   time  ：かかった期間・時間
  var works = [
    { img: 'kintsugi_teal_bowl.jpg', tag: '割れ', title: '朝の湯のみ', course: '本漆 金継ぎ教室', time: '4か月' },
    { img: 'kintsugi_collection.jpg', tag: 'ヒビ', title: 'ふたすじの川', course: '本漆 金継ぎ教室', time: '3か月' },
    { img: 'kintsugi_plate.jpg', tag: '欠け', title: '小さな月', course: '一日体験', time: '2時間' },
    { img: 'kintsugi_white_bowl.jpg', tag: '割れ', title: '稲妻', course: '本漆 金継ぎ教室', time: '3か月' },
    { img: 'shards.jpg', tag: '陶片', title: '金のしずく', course: '金継ぎアクセサリー', time: '1.5時間' },
    { img: 'kintsugi_floral_bowl.jpg', tag: '呼び継ぎ', title: '祖母の茶碗', course: '本漆 金継ぎ教室', time: '6か月' },
    { img: 'bowl_01.jpg', tag: '割れ', title: '夜の川', course: '本漆 金継ぎ教室', time: '5か月' },
    { img: 'bowl_02.jpg', tag: '割れ', title: '白い石畳', course: '本漆 金継ぎ教室', time: '4か月' },
    { img: 'bowl_03.jpg', tag: 'ヒビ', title: '木漏れ日', course: '本漆 金継ぎ教室', time: '3か月' },
    { img: 'bowl_04.jpg', tag: '割れ', title: '手のひらの夜', course: '本漆 金継ぎ教室', time: '5か月' },
    { img: 'bowl_05.jpg', tag: 'ヒビ', title: '春の枝', course: '本漆 金継ぎ教室', time: '3か月' },
    { img: 'kintsugi_white_plate.jpg', tag: 'ヒビ', title: 'ひとすじ', course: '一日体験', time: '2時間' },
    { img: 'bowl_06.jpg', tag: '割れ', title: 'ふたりの器', course: '本漆 金継ぎ教室', time: '4か月' },
    { img: 'bowl_07.jpg', tag: '割れ', title: '並ぶ景色', course: '本漆 金継ぎ教室', time: '6か月' },
    { img: 'bowl_08.jpg', tag: '欠け', title: '三つの茶碗', course: '一日体験', time: '2時間' },
  ];

  var worksPerPage = 6; // 作品ギャラリー：1 ページに並べる作品の数

  // お知らせ（上から順に並ぶ。新しいお知らせは一番上に書き足す）
  //   date    ：日付
  //   category：種類（絞り込むボタンの文字と同じにする：お知らせ・イベント・休講）
  //   title   ：お知らせの文
  var notices = [
    { date: '2026.10.20', category: 'お知らせ', title: '11月の一日体験のご予約受付を開始しました' },
    { date: '2026.10.05', category: 'イベント', title: '中崎町クラフトマルシェに出店します（11/3）' },
    { date: '2026.09.18', category: 'お知らせ', title: '金継ぎアクセサリーに新しい陶片が入りました' },
    { date: '2026.09.01', category: '休講', title: '9月23日（水）は臨時休講となります' },
    { date: '2026.08.10', category: '休講', title: '夏季休講のお知らせ（8/13 – 8/16）' },
    { date: '2026.07.22', category: 'お知らせ', title: '木曜夜のクラスに空きが出ました' },
  ];

  // コラム（上から順に並ぶ。新しいコラムは一番上に書き足す）
  //   img     ：写真のファイル名（img フォルダの中）
  //   category：コラムの種類
  //   title   ：コラムの題名
  //   date    ：日付
  var columns = [
    { img: 'kintsugi_blue_bowl.jpg', category: '暮らし', title: '金継ぎした器の、毎日のお手入れ方法', date: '2026.10.12' },
    { img: 'kintsugi_goldline.jpg', category: '基礎知識', title: '本漆と簡易金継ぎ、なにが違う？', date: '2026.09.25' },
    { img: 'shards.jpg', category: '基礎知識', title: '割れた器、捨てる前に確認したい3つのこと', date: '2026.09.08' },
    { img: 'kintsugi_collection.jpg', category: '講師の日記', title: '骨董市で見つけた、欠けた器たち', date: '2026.08.20' },
    { img: 'kintsugi_white_bowl.jpg', category: '美意識', title: '「景色」の見立て方 ── 稲妻、川、月', date: '2026.08.02' },
    { img: 'kintsugi_white_plate.jpg', category: '暮らし', title: 'はじめての方が直しやすい器の選び方', date: '2026.07.15' },
  ];

  // ーーーーーーーーーーーーーーーーーーーー
  //   データ入力 done
  // ーーーーーーーーーーーーーーーーーーーー

  // header.html と footer.html を読み込んで、<header class="header"> と <div class="footer"> の中に入れる
  function loadParts() {
    Promise.all([
      fetch('./header.html').then(function (res) { return res.text(); }),
      fetch('./footer.html').then(function (res) { return res.text(); }),
    ]).then(function (html) {
      header.innerHTML = html[0];
      footer.innerHTML = html[1];
      markCurrent();
      setupMenu();
      setupMegaMenu();
      setupMenuLinks();
    });
  }

  // 今いるページのナビを金色にする（各ページの <header data-current="./about.html"> で指定）
  function markCurrent() {
    var current = header.querySelector('.header_link[href="' + header.dataset.current + '"]');
    if (current) current.classList.add('is-current');
  }

  // 画面が狭いときの全画面メニューを、開く（true）・閉じる（false）
  function setMenuState(isOpen) {
    header.classList.toggle('is-open', isOpen);
    document.documentElement.classList.toggle('is-menuOpen', isOpen);
  }

  // 開いている中のメニュー（PC のメガメニュー・SP の開いた項目）を、すべて閉じる
  function closePanels() {
    header.querySelectorAll('.header_parent').forEach(function (parent) {
      parent.classList.remove('is-open');
    });
    header.classList.remove('is-mega');
  }

  // 中のメニューを 1 つだけ開く（parent：景を知る・コース・料金・作品と声 の li）
  function openPanel(parent) {
    closePanels();
    parent.classList.add('is-open');
    header.classList.add('is-mega');
  }

  // Menu ボタン・Esc キー・画面幅の変化で、メニューを開け閉めする
  function setupMenu() {
    var toggle = header.querySelector('.header_toggle'); // Menu ボタン

    toggle.addEventListener('click', function () {
      setMenuState(!header.classList.contains('is-open'));
    });

    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      setMenuState(false);
      closePanels();
    });

    spMenu.addEventListener('change', function () {
      setMenuState(false);
      closePanels();
    });
  }

  // PC：ナビの項目にマウスをのせると、その項目のメガメニューを開く
  function setupMegaMenu() {
    var navLinks = header.querySelectorAll('.header_link'); // ナビの 5 つの項目

    navLinks.forEach(function (link) {
      var item = link.parentNode;

      item.addEventListener('mouseenter', function () {
        if (spMenu.matches) return;
        if (item.classList.contains('header_parent')) openPanel(item);
        else closePanels();
      });
    });

    // ヘッダーとメガメニューの外にマウスが出たら閉じる
    header.addEventListener('mouseleave', function () {
      if (!spMenu.matches) closePanels();
    });
  }

  // メニューの中のリンクを押したとき
  //   SP で中のメニューがある項目：その下に開く（もう一度押すと閉じる）
  //   それ以外：メニューを閉じて、リンク先へ移る
  function setupMenuLinks() {
    var links = header.querySelectorAll('.header_nav a'); // メニューの中のすべてのリンク

    links.forEach(function (link) {
      var item = link.parentNode;

      link.addEventListener('click', function (e) {
        var isParent = link.classList.contains('header_link') && item.classList.contains('header_parent');

        if (spMenu.matches && isParent) {
          e.preventDefault();
          if (item.classList.contains('is-open')) closePanels();
          else openPanel(item);
          return;
        }

        setMenuState(false);
        closePanels();
      });
    });
  }

  // ページの一番上のセクションを過ぎたら、ヘッダーに背景を付ける
  function updateHeader() {
    header.classList.toggle('is-scrolled', window.scrollY > pageTop.offsetHeight - header.offsetHeight);
  }

  // 作品ギャラリー：いま選んでいるコースと、いま見ているページ
  var selectedCourse = 'すべて';
  var currentPage = 1;

  // 作品ギャラリー：選んだコースに合う作品だけを集める
  function getSelectedWorks() {
    return works.filter(function (work) {
      return selectedCourse === 'すべて' || work.course === selectedCourse;
    });
  }

  // 作品ギャラリー：いまのページの作品（6 つ）を並べる
  function showWorks() {
    var selected = getSelectedWorks();
    var start = (currentPage - 1) * worksPerPage;
    var html = '';

    selected.slice(start, start + worksPerPage).forEach(function (work) {
      html += '<li>' +
        '<img src="./img/' + work.img + '" alt="">' +
        '<p class="works_p2">#' + work.tag + '</p>' +
        '<h3>「' + work.title + '」</h3>' +
        '<p>' + work.course + '　｜　' + work.time + '</p>' +
        '</li>';
    });

    worksList.innerHTML = html;
    showPager(Math.ceil(selected.length / worksPerPage));
  }

  // 作品ギャラリー：ページ番号のボタン（1・2・3・→）を作る。1 ページしかないときは出さない
  function showPager(pageCount) {
    var html = '';

    for (var i = 1; i <= pageCount; i++) {
      html += '<button' + (i === currentPage ? ' class="is-active"' : '') + '>' + i + '</button>';
    }

    if (currentPage < pageCount) html += '<button>→</button>';

    worksPager.innerHTML = pageCount > 1 ? html : '';
  }

  // 作品ギャラリー：コースのボタンとページ番号のボタンを押せるようにする
  function setupWorks() {
    courseButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        selectedCourse = button.textContent;
        currentPage = 1;
        courseButtons.forEach(function (other) {
          other.classList.toggle('is-active', other === button);
        });
        showWorks();
      });
    });

    // ページ番号のボタンはあとから作られるので、入れる場所（worksPager）でまとめて受け取る
    worksPager.addEventListener('click', function (e) {
      if (e.target.tagName !== 'BUTTON') return;
      currentPage = e.target.textContent === '→' ? currentPage + 1 : Number(e.target.textContent);
      showWorks();
      worksTop.scrollIntoView();
    });

    showWorks();
  }

  // 生徒の声：いま一番左に出ているカードの番号（0 から数える）
  var voiceIndex = 0;

  // 生徒の声：カード 1 枚分の幅＋すき間（ここまで動かすと、ちょうど 1 枚ずれる）
  function getVoiceStep() {
    return voiceList.children[1].offsetLeft - voiceList.children[0].offsetLeft;
  }

  // 生徒の声：最後のカードまで全部見えるのは、何枚動かしたときか
  function getVoiceLast() {
    var visibleWidth = voiceList.parentNode.clientWidth - voiceList.offsetLeft; // カードの列の左はしから、画面の右はしまでの幅
    return Math.max(0, Math.ceil((voiceList.scrollWidth - visibleWidth) / getVoiceStep()));
  }

  // 生徒の声：いま何番目かを表す点を作る（動かせないときは出さない）
  function showVoiceDots(last) {
    var html = '';

    for (var i = 0; i <= last; i++) {
      html += '<span' + (i === voiceIndex ? ' class="is-active"' : '') + '></span>';
    }

    voiceDots.innerHTML = last > 0 ? html : '';
  }

  // 生徒の声：カードの列を index 枚分、左へずらす（はみ出す番号にはしない）
  function moveVoice(index) {
    var last = getVoiceLast();

    voiceIndex = Math.min(Math.max(index, 0), last);
    voiceList.style.transform = 'translateX(' + (-getVoiceStep() * voiceIndex) + 'px)';
    showVoiceDots(last);
  }

  // 生徒の声：← → のボタンで 1 枚ずつ動かす。画面の幅が変わったら、位置を合わせ直す
  function setupVoice() {
    voiceButtons[0].addEventListener('click', function () {
      moveVoice(voiceIndex - 1);
    });

    voiceButtons[1].addEventListener('click', function () {
      moveVoice(voiceIndex + 1);
    });

    window.addEventListener('resize', function () {
      moveVoice(voiceIndex);
    });

    moveVoice(0);
  }

  // お知らせ：いま選んでいる種類
  var selectedCategory = 'すべて';

  // お知らせ：選んだ種類に合うお知らせだけを並べる
  function showNotices() {
    var html = '';

    notices.forEach(function (notice) {
      if (selectedCategory !== 'すべて' && notice.category !== selectedCategory) return;
      html += '<li>' +
        '<p class="notice_p1">' + notice.date + '</p>' +
        '<p class="notice_p2">' + notice.category + '</p>' +
        '<h3>' + notice.title + '</h3>' +
        '<span>→</span>' +
        '</li>';
    });

    noticeList.innerHTML = html;
  }

  // お知らせ：種類のボタンを押せるようにする
  function setupNotices() {
    noticeButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        selectedCategory = button.textContent;
        noticeButtons.forEach(function (other) {
          other.classList.toggle('is-active', other === button);
        });
        showNotices();
      });
    });

    showNotices();
  }

  // コラム：カードを並べる
  function showColumns() {
    var html = '';

    columns.forEach(function (column) {
      html += '<li>' +
        '<img src="./img/' + column.img + '" alt="">' +
        '<div>' +
        '<p class="column_p1">Column｜' + column.category + '</p>' +
        '<h3>' + column.title + '</h3>' +
        '<p>' + column.date + '</p>' +
        '</div>' +
        '</li>';
    });

    columnList.innerHTML = html;
  }

  // かんたん診断：押したボタンに合わせて、結果の文章を入れかえる
  function showCheckResult(button) {
    var data = checkResults[button.textContent];

    checkButtons.forEach(function (other) {
      other.classList.toggle('is-active', other === button);
    });

    checkResult.querySelector('h3').textContent = data.title;
    checkResult.querySelector('p:nth-of-type(2)').textContent = data.text;
    checkResult.querySelector('p:nth-of-type(3)').textContent = data.note;
  }

  // かんたん診断：器の状態のボタンを押せるようにする
  function setupCheck() {
    checkButtons.forEach(function (button) {
      button.addEventListener('click', function () {
        showCheckResult(button);
      });
    });
  }

  // ファイルを直接開いた（file://）ときは 3D が読み込めないので、ローカルサーバーで開くよう案内する
  function showLocalNote() {
    loaderNote.textContent = 'ローカルサーバー（Live Server / npx serve）で開いてください。';
    loaderNote.hidden = false;
    document.documentElement.classList.add('is-error');
  }

  // ーーーーーーーーーーーーーーーーーーーー
  //   コード（関数） done
  // ーーーーーーーーーーーーーーーーーーーー

  loadParts();

  if (hasPageTop) {
    window.addEventListener('scroll', updateHeader, { passive: true });
    updateHeader();
  }

  if (hasWorks) setupWorks();
  if (hasVoice) setupVoice();
  if (hasNotice) setupNotices();
  if (hasColumn) showColumns();
  if (hasCheck) setupCheck();
  if (hasLoaderNote && location.protocol === 'file:') showLocalNote();

})();
