window.addEventListener('load', () => {
  const loader = document.getElementById('loader');
  if (loader) {
    sessionStorage.setItem('loaderShown', '1');
    setTimeout(() => {
      loader.classList.add('out');
      setTimeout(() => loader.remove(), 900);
    }, 1600);
  }
});

// ─── カスタムカーソル（タッチデバイスは除外）───
const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches;
const dot = document.getElementById('cursorDot');
const ring = document.getElementById('cursorRing');

if (!isTouch && (dot || ring)) {
  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let ringX = mouseX;
  let ringY = mouseY;
  let isMoving = false;

  document.addEventListener('mousemove', e => {
    if (!isMoving) {
      if (dot) dot.style.opacity = '1';
      if (ring) ring.style.opacity = '1';
      isMoving = true;
    }
    mouseX = e.clientX;
    mouseY = e.clientY;

    if (dot) {
      dot.style.transform = `translate3d(calc(${mouseX}px - 50%), calc(${mouseY}px - 50%), 0)`;
    }
  });

  function animateRing() {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;

    if (ring) {
      ring.style.transform = `translate3d(calc(${ringX}px - 50%), calc(${ringY}px - 50%), 0)`;
    }
    requestAnimationFrame(animateRing);
  }
  animateRing();

  const targetSelectors = 'a, button, .item_heart, .follow-pic, .SLU_product_img_frame_group, .Item_category_item, .News_Category_item';

  document.addEventListener('mouseover', e => {
    if (e.target.closest(targetSelectors)) {
      dot?.classList.add('hover');
      ring?.classList.add('hover');
    }
  });

  document.addEventListener('mouseout', e => {
    if (!e.relatedTarget || !e.relatedTarget.closest(targetSelectors)) {
      dot?.classList.remove('hover');
      ring?.classList.remove('hover');
    }
  });
}
