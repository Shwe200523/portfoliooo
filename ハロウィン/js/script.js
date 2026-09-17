$(function () {
  $(".ham_menu").on("click", function () {
    $(this).toggleClass("active");
    $(".menu").toggleClass("active");
    $("body").toggleClass("menu-open");
  });

  $(".menu_list a").on("click", function () {
    $(".ham_menu").removeClass("active");
    $(".menu").removeClass("active");
    $("body").removeClass("menu-open");
  });
});

const scrollObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is_show");
        scrollObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll(".js_scroll").forEach((el) => {
  scrollObserver.observe(el);
});

function splitLetters(el) {
  if (el.dataset.typeReady) return;

  const speed = parseFloat(el.dataset.typeSpeed) || 0.03;
  const start = parseFloat(el.dataset.typeDelay) || 0;
  const parts = el.innerHTML.split(/(<br\s*\/?>)/i);

  el.innerHTML = "";
  let delay = start;

  parts.forEach((part) => {
    if (/<br\s*\/?>/i.test(part)) {
      el.insertAdjacentHTML("beforeend", part);
      return;
    }

    const tmp = document.createElement("div");
    tmp.innerHTML = part;

    tmp.textContent.split(/(\s+)/).forEach((word) => {
      if (!word) return;

      if (/^\s+$/.test(word)) {
        const sp = document.createElement("span");
        sp.className = "js_type_char";
        sp.textContent = "\u00A0";
        sp.style.animationDelay = delay.toFixed(3) + "s";
        el.appendChild(sp);
        delay += speed;
        return;
      }

      const wrap = document.createElement("span");
      wrap.className = /[A-Za-z0-9]/.test(word)
        ? "js_type_word"
        : "js_type_word is_wrap";

      [...word].forEach((char) => {
        const span = document.createElement("span");
        span.className = "js_type_char";
        span.textContent = char;
        span.style.animationDelay = delay.toFixed(3) + "s";
        wrap.appendChild(span);
        delay += speed;
      });

      el.appendChild(wrap);
    });
  });

  el.dataset.typeReady = "1";
}

const typeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      splitLetters(entry.target);
      entry.target.classList.add("is_typed");
      typeObserver.unobserve(entry.target);
    });
  },
  { threshold: 0.3 }
);

document.querySelectorAll(".js_type").forEach((el) => {
  typeObserver.observe(el);
});

const heroText = document.getElementById("main_var_paragraph");
if (heroText) {
  splitLetters(heroText);
  heroText.classList.add("is_typed");
}

(function () {
  if (typeof Swiper === "undefined") return;

  const mq = window.matchMedia("(max-width: 768px)");

  const setup = (sliderSel, pagerSel) => {
    const el = document.querySelector(sliderSel);
    if (!el) return;

    let swiper = null;

    const apply = () => {
      if (mq.matches) {
        if (swiper) return;
        swiper = new Swiper(el, {
          slidesPerView: 1,
          spaceBetween: 16,
          grabCursor: true,
          loop: true,
          pagination: { el: pagerSel, clickable: true },
        });
      } else if (swiper) {
        swiper.destroy(true, true);
        swiper = null;
      }
    };

    apply();
    mq.addEventListener("change", apply);
  };

  setup(".news_slider", ".news_pagination");
})();

(function () {
  const list = document.querySelector(".voice_list");
  if (!list) return;

  const panels = [...list.querySelectorAll(".voice_item")];
  const mq = window.matchMedia("(max-width: 768px)");

  const open = (el) => {
    panels.forEach((p) => p.classList.toggle("is_open", p === el));
  };

  panels.forEach((p) => {
    p.addEventListener("click", () => {
      if (mq.matches) open(p);
    });
    p.addEventListener("focus", () => {
      if (mq.matches) open(p);
    });
  });

  const reset = () => {
    if (!mq.matches) panels.forEach((p) => p.classList.remove("is_open"));
    else if (!panels.some((p) => p.classList.contains("is_open"))) open(panels[0]);
  };

  reset();
  mq.addEventListener("change", reset);
})();
