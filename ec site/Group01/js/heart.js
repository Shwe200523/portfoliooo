const FAVORITES_KEY = 'selectFavorites';

function getFavorites() {
  return JSON.parse(sessionStorage.getItem(FAVORITES_KEY) || '[]');
}

function saveFavorites(favs) {
  sessionStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
}

function extractItemData(heart) {
  // item.html
  const itemCard = heart.closest('.item-card');
  if (itemCard) {
    const href = itemCard.querySelector('.item-card__img-wrap')?.getAttribute('href') || '';
    return {
      type:  'item',
      name:  itemCard.querySelector('.item-card__name')?.textContent?.trim()  || '',
      price: itemCard.querySelector('.item-card__price')?.textContent?.trim() || '',
      img:   itemCard.querySelector('img')?.getAttribute('src')               || '',
      link:  href && href !== '#' ? href : ''
    };
  }

  // set.html
  const setCard = heart.closest('.set-card');
  if (setCard) {
    return {
      type:  'set',
      name:  setCard.querySelector('.set-card__name')?.textContent?.trim()  || '',
      price: setCard.querySelector('.set-card__price')?.textContent?.trim() || '',
      img:   setCard.querySelector('img')?.getAttribute('src')              || '',
      link:  setCard.getAttribute('href') || ''
    };
  }

  // index.html: Item section
  const indexItem = heart.closest('.Item_category_item');
  if (indexItem) {
    return {
      type:  'item',
      name:  indexItem.querySelector('p')?.textContent?.trim()           || '',
      price: indexItem.querySelector('.Item_price')?.textContent?.trim() || '',
      img:   indexItem.querySelector('img')?.getAttribute('src')         || '',
      link:  indexItem.querySelector('a')?.getAttribute('href')          || ''
    };
  }

  // index.html: Set Line Up
  const sluItem = heart.closest('.SLU_product_img_frame_group');
  if (sluItem) {
    return {
      type:  'set',
      name:  sluItem.querySelector('h2')?.textContent?.trim()  || '',
      price: sluItem.querySelector('h3')?.textContent?.trim()  || '',
      img:   sluItem.querySelector('img')?.getAttribute('src') || '',
      link:  sluItem.querySelector('dt a')?.getAttribute('href') || ''
    };
  }

  // pickup section
  const pickupItem = heart.closest('.pickup_img_frame_group');
  if (pickupItem) {
    return {
      type:  'item',
      name:  pickupItem.querySelector('h2')?.textContent?.trim()  || '',
      price: pickupItem.querySelector('h3')?.textContent?.trim()  || '',
      img:   pickupItem.querySelector('img')?.getAttribute('src') || '',
      link:  pickupItem.querySelector('a')?.getAttribute('href')  || ''
    };
  }

  // item / set detail page
  if (heart.closest('.productNameAndHeart') || heart.closest('.shouhinshouzai_right')) {
    const page = document.title.includes('SET') ? 'set' : 'item';
    return {
      type:  page,
      name:  document.getElementById('detail-name')?.textContent?.trim()  || '',
      price: document.getElementById('detail-price')?.textContent?.trim() || '',
      img:   document.getElementById('display-img')?.getAttribute('src')  || '',
      link:  window.location.href
    };
  }

  return { type: 'item', name: '', price: '', img: '', link: '' };
}

function restoreHearts() {
  const favs = getFavorites();
  if (!favs.length) return;
  const favNames = new Set(favs.map(f => f.name));
  document.querySelectorAll('.item_heart').forEach(heart => {
    const data = extractItemData(heart);
    if (data.name && favNames.has(data.name)) {
      heart.classList.add('is-active');
    }
  });
}

document.addEventListener('DOMContentLoaded', restoreHearts);

document.addEventListener('click', (e) => {
  const heart = e.target.closest('.item_heart');
  if (!heart) return;
  e.preventDefault();
  e.stopPropagation();

  heart.classList.toggle('is-active');
  const isActive = heart.classList.contains('is-active');
  const data = extractItemData(heart);
  if (!data.name) return;

  let favs = getFavorites();
  if (isActive) {
    if (!favs.find(f => f.name === data.name)) favs.push(data);
  } else {
    favs = favs.filter(f => f.name !== data.name);
  }
  saveFavorites(favs);
});
