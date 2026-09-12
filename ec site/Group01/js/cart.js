function addToCart(item) {
  const cart = JSON.parse(sessionStorage.getItem('selectCart') || '[]');
  cart.push(item);
  sessionStorage.setItem('selectCart', JSON.stringify(cart));
  showCartToast();
}

function showCartToast() {
  const toast = document.getElementById('cart-toast');
  if (!toast) return;
  toast.classList.add('show');
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('show'), 3000);
}
