/*
Website System Name: DONORDOC-01 V1
Author: FRONTLENS LLC
License: For personal/business use only. Redistribution, resale, or sublicensing is strictly Copyright (c) 2026 FRONTLENS LLC. All rights reserved.
*/
import { throttle } from "../utilities/throttle.js";

export function initStickyHeader() {
  const header = document.getElementById("header");
  const hero = document.querySelector('[data-section="hero"]');

  if (!header) return;
  if (!hero) {
    document.documentElement.classList.add("is-no-hero");
    return;
  }

  const updateHeroPadding = () => {
    hero.style.paddingTop = `${header.offsetHeight}px`;
  };

  window.addEventListener("load", updateHeroPadding);

  // Use throttled version for scroll performance
  const throttledUpdate = throttle(updateHeroPadding, 100);

  const obs = new IntersectionObserver(
    (entries) => {
      const [entry] = entries;
      if (!entry) return;

      header.classList.toggle("sticky", !entry.isIntersecting);
      if (!entry.isIntersecting) throttledUpdate();
    },
    {
      root: null,
      threshold: 0,
      rootMargin: "-100px",
    },
  );

  obs.observe(hero);
}

export function initNavScroll() {
  const sectionToNavHash = {
    hero: "#hero",
    trust: "#hero",
    about: "#about",
    services: "#services",
    howItWorks: "#howItWorks",
    pricing: "#services",
    reviews: "#reviews",
    faq: "#faq",
    consultation: "#consultation",
    finalCta: "#finalCta",
  };

  const sections = Array.from(
    document.querySelectorAll("[data-section]"),
  ).filter((s) =>
    Object.prototype.hasOwnProperty.call(
      sectionToNavHash,
      s.getAttribute("data-section"),
    ),
  );

  const navLinks = document.querySelectorAll(
    '#navbarSupportedContent a[href^="#"]:not([href="#"]), #offcanvasNavbar a[href^="#"]:not([href="#"])',
  );

  const linkMap = {};
  navLinks.forEach((link) => {
    const href = link.getAttribute("href");
    if (!linkMap[href]) linkMap[href] = [];
    linkMap[href].push(link);
  });

  const sectionFromHash = (hash) => {
    const key = (hash || "").replace(/^#/, "");
    if (!key) return null;
    return document.querySelector('[data-section="' + key + '"]');
  };

  const scrollToHash = (hash, behavior) => {
    const key = (hash || "").replace(/^#/, "");
    if (!key || key === "hero") {
      window.scrollTo({ top: 0, behavior: behavior || "auto" });
      return true;
    }
    const el = sectionFromHash(hash);
    if (!el) return false;
    el.scrollIntoView({ behavior: behavior || "auto", block: "start" });
    return true;
  };

  const getScrollAnchorPx = () => {
    const raw = getComputedStyle(document.documentElement)
      .getPropertyValue("--purchase-scroll-offset")
      .trim();
    const offset = parseFloat(raw);
    if (!Number.isNaN(offset) && offset > 0) return offset;
    const header = document.getElementById("header");
    const h = header ? header.offsetHeight : 0;
    return h;
  };

  const updateActiveNav = () => {
    const anchorPx = getScrollAnchorPx();
    const docEl = document.documentElement;
    const scrollBottom = window.innerHeight + window.scrollY;

    let activeHash = "#hero";

    const atBottom = scrollBottom >= docEl.scrollHeight - 2;
    if (atBottom) {
      activeHash = "#consultation";
    } else {
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i];
        const rect = section.getBoundingClientRect();
        if (rect.top <= anchorPx + 1) {
          const key = section.getAttribute("data-section");
          activeHash = sectionToNavHash[key] || activeHash;
        }
      }
    }

    if (window.innerWidth > 768) {
      history.replaceState(null, null, activeHash);
    }

    navLinks.forEach((l) => l.classList.remove("active"));
    const group = linkMap[activeHash];
    if (group) {
      group.forEach((l) => l.classList.add("active"));
    }
  };

  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const href = link.getAttribute("href");
    if (!href || href === "#") return;
    if (!sectionFromHash(href) && href !== "#hero") return;
    document.dispatchEvent(new CustomEvent("purchasebar:request-close"));
    event.preventDefault();
    history.pushState(null, null, href);
    scrollToHash(href, "auto");
    onNavScroll();
  });

  window.addEventListener("popstate", () => {
    scrollToHash(location.hash, "auto");
    onNavScroll();
  });

  window.addEventListener("load", () => {
    if (location.hash === "#hero") window.scrollTo(0, 0);
  });

  if (location.hash) scrollToHash(location.hash, "auto");

  let scrollFrame = 0;
  const onNavScroll = () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      updateActiveNav();
    });
  };
  window.addEventListener("scroll", onNavScroll, { passive: true });
  window.addEventListener("resize", onNavScroll);
  updateActiveNav();
}

export function initMobileMenu() {
  const toggler = document.querySelector("[data-nav-toggle]");
  const offcanvas = document.getElementById("offcanvasNavbar");
  const header = document.getElementById("header");

  if (!toggler || !offcanvas) return;

  let isOpen = false;
  let isClosing = false;
  let closeFallback = null;

  const offcanvasLinks = offcanvas.querySelectorAll(
    'a[href^="#"]:not([href="#"])',
  );

  const setTogglerOpen = (open) => {
    toggler.classList.toggle("opened", open);
    toggler.setAttribute("aria-expanded", open ? "true" : "false");
    toggler.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Toggle navigation",
    );
  };

  const finishClose = () => {
    offcanvas.classList.remove("is-closing");
    isClosing = false;
    header?.classList.remove("mobile-nav__open");
    document.dispatchEvent(new CustomEvent("mobilenav:close"));
  };

  const primeLinkReveal = () => {
    offcanvas
      .querySelectorAll(
        ".mobile-nav__list > li, .mobile-nav__divider, .mobile-nav__advisor, .button--mobile",
      )
      .forEach((row, index) => {
        row.style.setProperty("--nav-stagger", String(index));
      });
  };

  const open = () => {
    if (isOpen || isClosing) return;

    document.dispatchEvent(new CustomEvent("purchasebar:request-close"));
    isOpen = true;
    offcanvas.classList.remove("is-closing");
    primeLinkReveal();
    offcanvas.classList.add("show");
    header?.classList.add("mobile-nav__open");
    setTogglerOpen(true);
    document.body.style.overflow = "hidden";
    document.dispatchEvent(new CustomEvent("mobilenav:open"));
  };

  const close = () => {
    if (!isOpen || isClosing) return;

    isClosing = true;
    isOpen = false;

    // Morph toggler back to burger immediately, before panel slide-out starts.
    setTogglerOpen(false);
    document.body.style.overflow = "";

    offcanvas.classList.remove("show");
    offcanvas.classList.add("is-closing");

    const onCloseEnd = (event) => {
      if (event && event.propertyName !== "transform") return;
      offcanvas.removeEventListener("transitionend", onCloseEnd);
      if (closeFallback) clearTimeout(closeFallback);
      finishClose();
    };

    closeFallback = setTimeout(() => onCloseEnd(null), 400);
    offcanvas.addEventListener("transitionend", onCloseEnd);
  };

  const toggle = () => {
    if (isOpen) close();
    else open();
  };

  document.addEventListener("purchasebar:before-open", () => {
    if (isOpen) close();
  });

  toggler.addEventListener("click", toggle);

  offcanvasLinks.forEach((link) => {
    link.addEventListener("click", close);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && isOpen) {
      close();
    }
  });
}
