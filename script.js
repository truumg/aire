(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const root = document.documentElement;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Тема ---------- */

  const themeToggle = $("#themeToggle");
  const themeMeta = $('meta[name="theme-color"]');
  const storedTheme = localStorage.getItem("aire-theme");
  const forcedTheme = new URLSearchParams(window.location.search).get("theme");

  if (forcedTheme === "dark" || forcedTheme === "light") {
    root.dataset.theme = forcedTheme;
  } else if (storedTheme === "dark" || storedTheme === "light") {
    root.dataset.theme = storedTheme;
  }

  const syncTheme = () => {
    const dark = root.dataset.theme === "dark";
    if (themeToggle) {
      themeToggle.textContent = dark ? "☀" : "☾";
      themeToggle.setAttribute(
        "aria-label",
        dark ? "Включить светлую тему" : "Включить тёмную тему"
      );
    }
    if (themeMeta) themeMeta.setAttribute("content", dark ? "#070d18" : "#eef2f7");
  };

  syncTheme();

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
      localStorage.setItem("aire-theme", root.dataset.theme);
      syncTheme();
    });
  }

  /* ---------- Шапка, прогресс ---------- */

  const header = $("#header");
  const progress = $("#progress");

  const onScroll = () => {
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 12);
    if (progress) {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = max > 0 ? `${(window.scrollY / max) * 100}%` : "0%";
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Мобильное меню ---------- */

  const burger = $("#burger");
  const nav = $("#nav");

  const closeNav = () => {
    if (!nav || !burger) return;
    nav.classList.remove("is-open");
    header.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Открыть меню");
    document.body.classList.remove("nav-open");
  };

  if (burger && nav) {
    burger.addEventListener("click", () => {
      const open = !nav.classList.contains("is-open");
      nav.classList.toggle("is-open", open);
      header.classList.toggle("is-open", open);
      burger.setAttribute("aria-expanded", String(open));
      burger.setAttribute("aria-label", open ? "Закрыть меню" : "Открыть меню");
      document.body.classList.toggle("nav-open", open);
    });

    $$("#nav a").forEach((link) => link.addEventListener("click", closeNav));

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) closeNav();
    });
  }

  /* ---------- Появление при прокрутке ---------- */

  const revealEls = $$("[data-reveal]");

  revealEls.forEach((el) => {
    if (el.dataset.delay) el.style.transitionDelay = `${el.dataset.delay}ms`;
  });

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  if (new URLSearchParams(window.location.search).get("reveal") === "all") {
    revealEls.forEach((el) => el.classList.add("is-in"));
  }

  /* ---------- Счётчики ---------- */

  const counters = $$("[data-count]");

  const animateCount = (el) => {
    const target = parseFloat(el.dataset.count);
    if (Number.isNaN(target)) return;
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const duration = 1300;
    const started = performance.now();

    const format = (value) =>
      value.toFixed(decimals).replace(".", ",");

    const tick = (now) => {
      const p = Math.min((now - started) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = format(target * eased);
      if (p < 1) {
        requestAnimationFrame(tick);
      } else {
        el.textContent = format(target);
      }
    };

    requestAnimationFrame(tick);
  };

  if ("IntersectionObserver" in window) {
    const counterObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          animateCount(entry.target);
          counterObserver.unobserve(entry.target);
        });
      },
      { threshold: 0.6 }
    );
    counters.forEach((el) => counterObserver.observe(el));
  }

  /* ---------- Выбор квартиры → форма ---------- */

  const form = $("#bookingForm");
  const typeSelect = form ? form.querySelector('select[name="type"]') : null;
  const booking = $("#booking");

  const highlightForm = () => {
    if (!form) return;
    form.classList.add("is-highlight");
    window.setTimeout(() => form.classList.remove("is-highlight"), 1700);
  };

  $$("[data-type]").forEach((btn) => {
    btn.addEventListener("click", (event) => {
      const type = btn.dataset.type;

      if (typeSelect && type) {
        const option = Array.from(typeSelect.options).find((item) =>
          item.value.startsWith(type)
        );
        if (option) typeSelect.value = option.value;
      }

      if (btn.tagName === "BUTTON") {
        event.preventDefault();
        if (booking) {
          booking.scrollIntoView({
            behavior: reduced ? "auto" : "smooth",
            block: "start",
          });
        }
      }

      window.setTimeout(highlightForm, 550);
    });
  });

  /* ---------- Маска телефона ---------- */

  const phone = form ? form.querySelector('input[name="phone"]') : null;

  if (phone) {
    phone.addEventListener("focus", () => {
      if (!phone.value) phone.value = "+7 (";
    });

    phone.addEventListener("input", () => {
      let digits = phone.value.replace(/\D/g, "");
      if (digits.startsWith("8")) digits = "7" + digits.slice(1);
      if (!digits.startsWith("7")) digits = "7" + digits;
      digits = digits.slice(0, 11);

      let out = "+7";
      if (digits.length > 1) out += ` (${digits.slice(1, 4)}`;
      if (digits.length >= 5) out += `) ${digits.slice(4, 7)}`;
      if (digits.length >= 8) out += `-${digits.slice(7, 9)}`;
      if (digits.length >= 10) out += `-${digits.slice(9, 11)}`;

      phone.value = out;
    });
  }

  /* ---------- Форма ---------- */

  if (form) {
    const name = form.querySelector('input[name="name"]');
    const consent = form.querySelector('input[name="consent"]');
    const success = $("#formSuccess");
    const again = $("#formAgain");

    const markError = (field, on) => {
      if (!field) return;
      const wrap = field.closest(".field") || field.closest(".check");
      if (wrap) wrap.classList.toggle("is-error", on);
      field.setAttribute("aria-invalid", on ? "true" : "false");
    };

    [name, phone, consent].forEach((field) => {
      if (!field) return;
      field.addEventListener("input", () => markError(field, false));
      field.addEventListener("change", () => markError(field, false));
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      let valid = true;

      if (!name || name.value.trim().length < 2) {
        markError(name, true);
        valid = false;
      }

      const digits = phone ? phone.value.replace(/\D/g, "") : "";
      if (digits.length < 11) {
        markError(phone, true);
        valid = false;
      }

      if (consent && !consent.checked) {
        markError(consent, true);
        valid = false;
      }

      if (!valid) {
        const first = form.querySelector(".is-error input");
        if (first) first.focus();
        return;
      }

      if (success) success.hidden = false;
      form.reset();
      if (phone) phone.value = "";
    });

    if (again) {
      again.addEventListener("click", () => {
        if (success) success.hidden = true;
        if (name) name.focus();
      });
    }
  }

  /* ---------- Лайтбокс ---------- */

  const lightbox = $("#lightbox");
  const lightboxImg = $("#lightboxImg");
  const lightboxCap = $("#lightboxCap");
  const galleryItems = $$(".gallery__item");
  let lightboxIndex = 0;
  let lastFocus = null;

  const showLightbox = (index) => {
    if (!lightbox || !lightboxImg || !galleryItems.length) return;
    lightboxIndex = (index + galleryItems.length) % galleryItems.length;
    const item = galleryItems[lightboxIndex];
    const img = item.querySelector("img");

    lightboxImg.src = item.dataset.full || img.src;
    lightboxImg.alt = img.alt;
    if (lightboxCap) lightboxCap.textContent = item.dataset.caption || "";

    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lastFocus = document.activeElement;

    const closeBtn = $("#lightboxClose");
    if (closeBtn) closeBtn.focus();
  };

  const closeLightbox = () => {
    if (!lightbox || lightbox.hidden) return;
    lightbox.hidden = true;
    document.body.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  };

  galleryItems.forEach((item, index) => {
    item.addEventListener("click", () => showLightbox(index));
  });

  const lightboxClose = $("#lightboxClose");
  const lightboxPrev = $("#lightboxPrev");
  const lightboxNext = $("#lightboxNext");

  if (lightboxClose) lightboxClose.addEventListener("click", closeLightbox);
  if (lightboxPrev) lightboxPrev.addEventListener("click", () => showLightbox(lightboxIndex - 1));
  if (lightboxNext) lightboxNext.addEventListener("click", () => showLightbox(lightboxIndex + 1));

  if (lightbox) {
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox) closeLightbox();
    });
  }

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeNav();
      closeLightbox();
    }

    if (!lightbox || lightbox.hidden) return;

    if (event.key === "ArrowLeft") showLightbox(lightboxIndex - 1);
    if (event.key === "ArrowRight") showLightbox(lightboxIndex + 1);
  });

  /* ---------- Год ---------- */

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();
})();
