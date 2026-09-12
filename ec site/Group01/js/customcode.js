const tops = [
  { id: 'top1', name: 'ブラックラインスリーブグラフィックシャツ', price: 3980, thumb: 'img/item01.png', layer: 'img/change-top1.png' },
  { id: 'top2', name: 'ヴィンテージコンパスウォッシュシャツ',     price: 2990, thumb: 'img/item02.png', layer: 'img/change-top2.png' },
  { id: 'top3', name: 'テンポラリーウォッシュグラフィックシャツ', price: 3480, thumb: 'img/item03.png', layer: 'img/change-top3.png' },
  { id: 'top4', name: 'ゴシッククロスワンポイントシャツ',         price: 2980, thumb: 'img/item04.png', layer: 'img/change-top4.png' },
  { id: 'top5', name: 'ダークロゴオーバーサイズシャツ',           price: 3980, thumb: 'img/item05.png', layer: 'img/change-top5.png' },
];

const bottoms = [
  { id: 'bot1', name: 'ヴィンテージダメージワイドデニムパンツ',   price: 5980, thumb: 'img/item09.png', layer: 'img/change-bot1.png' },
  { id: 'bot2', name: 'ダークグラフィックワイドパンツ',           price: 5480, thumb: 'img/item10.png', layer: 'img/change-bot2.png' },
  { id: 'bot3', name: 'ナイロンバルーンワイドパンツ',             price: 5480, thumb: 'img/item11.png', layer: 'img/change-bot3.png' },
  { id: 'bot4', name: 'ヴィンテージカーゴワイドパンツ',           price: 5980, thumb: 'img/item12.png', layer: 'img/change-bot4.png' },
  { id: 'bot5', name: 'ブラックバルーンデニムパンツ',             price: 6480, thumb: 'img/item13.png', layer: 'img/change-bot5.png' },
];

let selectedTop = null;
let selectedBot = null;

function formatPrice(n) {
  return '¥' + n.toLocaleString();
}

function buildCard(item, category) {
  const card = document.createElement('div');
  card.className = 'item-card';
  card.dataset.id = item.id;
  card.dataset.category = category;

  const imgWrap = document.createElement('div');
  imgWrap.className = 'item-img-wrap';
  const img = document.createElement('img');
  img.src = item.thumb;
  img.alt = item.name;
  const check = document.createElement('div');
  check.className = 'check-mark';
  check.textContent = '✓';
  imgWrap.appendChild(img);
  imgWrap.appendChild(check);

  const info = document.createElement('div');
  info.className = 'item-info';
  const name = document.createElement('p');
  name.className = 'item-name';
  name.textContent = item.name;
  const price = document.createElement('p');
  price.className = 'item-price';
  price.textContent = formatPrice(item.price);
  info.appendChild(name);
  info.appendChild(price);

  card.appendChild(imgWrap);
  card.appendChild(info);
  return card;
}

function updateTotal() {
  const total = (selectedTop ? selectedTop.price : 0) + (selectedBot ? selectedBot.price : 0);
  document.getElementById('total-price-display').textContent = formatPrice(total);
}

function selectItem(card, item, category) {
  if (category === 'top') {
    document.querySelectorAll('#grid-tops .item-card').forEach(c => c.classList.remove('is-selected'));
    if (selectedTop && selectedTop.id === item.id) {
      selectedTop = null;
      document.getElementById('preview-top').src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
    } else {
      selectedTop = item;
      card.classList.add('is-selected');
      document.getElementById('preview-top').src = item.layer;
    }
  } else {
    document.querySelectorAll('#grid-bottoms .item-card').forEach(c => c.classList.remove('is-selected'));
    if (selectedBot && selectedBot.id === item.id) {
      selectedBot = null;
      document.getElementById('preview-bottom').src = 'data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
    } else {
      selectedBot = item;
      card.classList.add('is-selected');
      document.getElementById('preview-bottom').src = item.layer;
    }
  }
  updateTotal();
}

function renderGrids() {
  const gridTops = document.getElementById('grid-tops');
  const gridBottoms = document.getElementById('grid-bottoms');
  if (!gridTops || !gridBottoms) return;

  tops.forEach(item => {
    const card = buildCard(item, 'top');
    card.addEventListener('click', () => selectItem(card, item, 'top'));
    gridTops.appendChild(card);
  });

  bottoms.forEach(item => {
    const card = buildCard(item, 'bottom');
    card.addEventListener('click', () => selectItem(card, item, 'bottom'));
    gridBottoms.appendChild(card);
  });
}

function initTabs() {
  const tabs = document.querySelectorAll('.category-tabs .tab');
  const filterTitle = document.querySelector('.filter-bar .category-title');
  const gridTops = document.getElementById('grid-tops');
  const gridBottoms = document.getElementById('grid-bottoms');
  const sectionHeader = document.querySelector('.section-header');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const isTops = tab.textContent.trim() === 'TOPS';
      if (filterTitle) filterTitle.textContent = isTops ? 'TOPS' : 'BOTTOMS';
      if (gridTops) gridTops.style.display = isTops ? '' : 'none';
      if (gridBottoms) gridBottoms.style.display = isTops ? 'none' : '';
      if (sectionHeader) sectionHeader.style.display = isTops ? '' : 'none';
    });
  });
}

function initCartBtn() {
  const btn = document.getElementById('add-to-cart-btn');
  if (!btn) return;
  btn.addEventListener('click', (e) => {
    if (!selectedTop && !selectedBot) {
      e.preventDefault();
      alert('商品を選んでください');
      return;
    }
    if (selectedTop) {
      addToCart({ name: selectedTop.name, price: selectedTop.price, img: selectedTop.thumb, color: '-', size: '-', qty: 1 });
    }
    if (selectedBot) {
      addToCart({ name: selectedBot.name, price: selectedBot.price, img: selectedBot.thumb, color: '-', size: '-', qty: 1 });
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  renderGrids();
  initTabs();
  initCartBtn();

  // 初期選択：最初のトップス・ボトムスをデフォルトで着せる
  const firstTopCard = document.querySelector('#grid-tops .item-card');
  if (firstTopCard) selectItem(firstTopCard, tops[0], 'top');

  const firstBotCard = document.querySelector('#grid-bottoms .item-card');
  if (firstBotCard) selectItem(firstBotCard, bottoms[0], 'bottom');
});
