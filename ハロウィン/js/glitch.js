(function () {
  const target = document.querySelector(".main_var");
  if (!target) return;

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  const canvas = document.createElement("canvas");
  canvas.className = "main_var_glitch";
  target.prepend(canvas);

  const ctx = canvas.getContext("2d");
  const img = new Image();

  let imgW = 0;
  let imgH = 0;
  let rafId = null;
  let nextBurst = 0;
  let burstEnd = 0;

  function coverRect() {
    const scale = Math.max(canvas.width / imgW, canvas.height / imgH);
    const w = imgW * scale;
    const h = imgH * scale;
    return {
      x: (canvas.width - w) / 2,
      y: (canvas.height - h) / 2,
      w: w,
      h: h,
    };
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = target.clientWidth * dpr;
    canvas.height = target.clientHeight * dpr;
    canvas.style.width = target.clientWidth + "px";
    canvas.style.height = target.clientHeight + "px";
  }

  function drawBase() {
    const r = coverRect();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, r.x, r.y, r.w, r.h);
  }

  function drawGlitch() {
    drawBase();

    const sliceCount = 6 + Math.floor(Math.random() * 10);

    for (let i = 0; i < sliceCount; i++) {
      const y = Math.random() * canvas.height;
      const h = 4 + Math.random() * (canvas.height / 14);
      const shift = (Math.random() - 0.5) * canvas.width * 0.14;

      ctx.drawImage(canvas, 0, y, canvas.width, h, shift, y, canvas.width, h);

      if (Math.random() > 0.55) {
        ctx.globalCompositeOperation = "screen";
        ctx.fillStyle =
          Math.random() > 0.5
            ? "rgba(140, 0, 0, 0.28)"
            : "rgba(0, 60, 110, 0.22)";
        ctx.fillRect(shift, y, canvas.width, h);
        ctx.globalCompositeOperation = "source-over";
      }
    }

    if (Math.random() > 0.8) {
      ctx.globalCompositeOperation = Math.random() > 0.5 ? "multiply" : "screen";
      ctx.fillStyle = "rgba(90, 0, 0, 0.3)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "source-over";
    }
  }

  function loop(now) {
    if (now >= nextBurst) {
      if (now < burstEnd) {
        drawGlitch();
      } else {
        drawBase();
        nextBurst = now + 3000 + Math.random() * 6000;
        burstEnd = nextBurst + 120 + Math.random() * 380;
      }
    }
    rafId = requestAnimationFrame(loop);
  }

  img.onload = function () {
    imgW = img.naturalWidth;
    imgH = img.naturalHeight;
    resize();
    drawBase();
    target.classList.add("is_glitch_ready");

    nextBurst = performance.now() + 1800;
    burstEnd = nextBurst + 300;
    rafId = requestAnimationFrame(loop);
  };

  img.src = "img/02.png";

  let resizeTimer;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      resize();
      drawBase();
    }, 200);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      cancelAnimationFrame(rafId);
      rafId = null;
    } else if (rafId === null && imgW) {
      nextBurst = performance.now() + 2000;
      burstEnd = nextBurst + 300;
      rafId = requestAnimationFrame(loop);
    }
  });
})();
