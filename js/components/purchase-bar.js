/*
Website System Name: DONORDOC-01 V1
Author: FRONTLENS LLC
License: For personal/business use only. Redistribution, resale, or sublicensing is strictly Copyright (c) 2026 FRONTLENS LLC. All rights reserved.
*/

const CLOSE_GAP = 8;
const SCROLL_KEYS = new Set([
  " ",
  "PageUp",
  "PageDown",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
]);

let lockedY = null;

function panelOpen(details) {
  return !!(details && !details.hasAttribute("hidden"));
}

function blockScroll(event) {
  const details = document.querySelector("[data-purchase-details]");
  if (panelOpen(details) && details.contains(event.target)) {
    if (event.type !== "wheel") return;
    const atTop = details.scrollTop <= 0;
    const atBottom =
      details.scrollTop + details.clientHeight >= details.scrollHeight - 1;
    if (
      (event.deltaY < 0 && atTop) ||
      (event.deltaY > 0 && atBottom)
    ) {
      event.preventDefault();
    }
    return;
  }
  event.preventDefault();
}

function blockKeys(event) {
  if (!SCROLL_KEYS.has(event.key)) return;
  const details = document.querySelector("[data-purchase-details]");
  if (panelOpen(details) && details.contains(event.target)) return;
  event.preventDefault();
}

function lockPage() {
  if (lockedY !== null) return;
  lockedY = window.scrollY;
  const gap = window.innerWidth - document.documentElement.clientWidth;
  document.body.style.position = "fixed";
  document.body.style.top = `-${lockedY}px`;
  document.body.style.left = "0";
  document.body.style.right = "0";
  document.body.style.width = "100%";
  if (gap > 0) document.body.style.paddingRight = `${gap}px`;
  window.addEventListener("wheel", blockScroll, { passive: false });
  window.addEventListener("touchmove", blockScroll, { passive: false });
  window.addEventListener("keydown", blockKeys);
}

function unlockPage() {
  if (lockedY === null) return;
  const y = lockedY;
  lockedY = null;
  window.removeEventListener("wheel", blockScroll);
  window.removeEventListener("touchmove", blockScroll);
  window.removeEventListener("keydown", blockKeys);
  document.body.style.position = "";
  document.body.style.top = "";
  document.body.style.left = "";
  document.body.style.right = "";
  document.body.style.width = "";
  document.body.style.paddingRight = "";
  window.scrollTo({ top: y, left: 0, behavior: "instant" });
}

function sizeDetails(details, bar, room) {
  details.style.height = "auto";
  details.style.maxHeight = "none";
  details.style.overflowY = "hidden";
  const natural = Math.ceil(details.getBoundingClientRect().height);
  const used = Math.min(natural, Math.max(0, room));
  details.style.height = `${used}px`;
  details.style.maxHeight = "";
  bar.style.setProperty("--purchase-open-h", `${used}px`);
  details.style.overflowY = natural > used + 1 ? "auto" : "";
}

function clearDetails(details, bar) {
  bar.setAttribute("data-expand", "up");
  bar.style.removeProperty("--purchase-open-h");
  if (!details) return;
  details.style.height = "";
  details.style.maxHeight = "";
  details.style.overflowY = "";
}

function placeClosed(bar, sheet, header) {
  sheet.style.transform = "";
  bar.removeAttribute("data-pin");
  const headerBottom = header
    ? Math.max(0, header.getBoundingClientRect().bottom)
    : 0;
  bar.style.setProperty("--purchase-nav-hold", `${headerBottom}px`);
  const marker = document.querySelector("[data-purchase-marker]");
  const markerTop = marker ? marker.getBoundingClientRect().top : headerBottom;
  if (markerTop < headerBottom - 0.5) {
    if (bar.getAttribute("data-hold") !== "nav") {
      bar.style.height = `${bar.offsetHeight}px`;
    }
    bar.setAttribute("data-hold", "nav");
  } else {
    bar.style.height = "";
    bar.removeAttribute("data-hold");
  }
}

function placeBar() {
  const scope = document.querySelector("[data-purchase-scope]");
  const bar = document.querySelector("[data-purchase-bar]");
  const sheet = document.querySelector(".purchase-bar__sheet");
  const rail = document.querySelector("[data-purchase-rail]");
  const details = document.querySelector("[data-purchase-details]");
  const header = document.getElementById("header");
  const footer = document.getElementById("footer");
  if (!scope || !bar || !sheet || !rail) return;

  const headerBottom = header
    ? Math.max(0, header.getBoundingClientRect().bottom)
    : 0;
  const close = bar.querySelector("[data-purchase-close]");
  const open = bar.getAttribute("data-state") === "open" && panelOpen(details);
  let room = 0;

  if (!open) {
    clearDetails(details, bar);
    placeClosed(bar, sheet, header);
    return;
  }

  const savedState = bar.getAttribute("data-state");
  bar.setAttribute("data-state", "closed");
  const closedRail = rail.getBoundingClientRect();
  bar.setAttribute("data-state", savedState);

  const footerBottom = footer
    ? footer.getBoundingClientRect().bottom
    : window.innerHeight;
  const above = Math.max(0, closedRail.top - headerBottom);
  const below = Math.max(
    0,
    Math.min(window.innerHeight, footerBottom) - closedRail.bottom,
  );
  const dir = above >= below ? "up" : "down";
  const keepHold = bar.getAttribute("data-hold") === "nav" && dir === "down";
  if (!keepHold) {
    bar.removeAttribute("data-hold");
    bar.style.height = "";
  }

  sheet.style.transform = "translateY(0px)";
  if (keepHold) {
    bar.removeAttribute("data-pin");
  } else {
    const scopeBottom = scope.getBoundingClientRect().bottom;
    const release = scopeBottom <= window.innerHeight - 12;
    bar.setAttribute("data-pin", release ? "release" : "stick");
  }

  const chrome = (close ? close.offsetHeight : 36) + CLOSE_GAP;
  room = Math.max(0, Math.floor((dir === "up" ? above : below) - chrome));
  bar.setAttribute("data-expand", dir);
  sizeDetails(details, bar, room);

  const railTop = rail.getBoundingClientRect().top;
  const visualTop = Math.min(
    railTop,
    open ? details.getBoundingClientRect().top : railTop,
    open && close ? close.getBoundingClientRect().top : railTop,
  );
  if (visualTop >= headerBottom - 1) return;
  const shift = headerBottom - visualTop;
  sheet.style.transform = `translateY(${shift}px)`;
  if (open && bar.getAttribute("data-expand") === "down") {
    sizeDetails(details, bar, room - Math.ceil(shift));
  }
}

function syncMetrics() {
  const header = document.getElementById("header");
  const rail = document.querySelector("[data-purchase-rail]");
  const barH = rail ? rail.offsetHeight : 0;
  const overlapRaw = getComputedStyle(document.documentElement)
    .getPropertyValue("--header-top-overlap")
    .trim();
  const overlap = parseFloat(overlapRaw);
  const headerClear = header
    ? Math.max(0, header.offsetHeight - (Number.isNaN(overlap) ? 0 : overlap))
    : 0;
  const offset = headerClear;
  const root = document.documentElement;
  root.style.setProperty("--purchase-bar-h", `${barH}px`);
  root.style.setProperty("--purchase-scroll-offset", `${offset}px`);
  document
    .querySelectorAll("section[data-section], header, footer")
    .forEach((el) => {
      el.style.scrollMarginTop = `${offset}px`;
    });
}

export function collapsePurchaseBar() {
  const bar = document.querySelector("[data-purchase-bar]");
  const toggle = document.querySelector("[data-purchase-toggle]");
  const details = document.querySelector("[data-purchase-details]");
  const close = document.querySelector("[data-purchase-close]");
  if (!bar || bar.getAttribute("data-state") !== "open") return;
  const focused = document.activeElement;
  if (
    toggle &&
    focused &&
    ((details && details.contains(focused)) || focused === close)
  ) {
    toggle.focus();
  }
  unlockPage();
  paint(bar, toggle, details, false);
  syncMetrics();
  placeBar();
}

function paint(bar, toggle, details, open) {
  bar.setAttribute("data-state", open ? "open" : "closed");
  if (toggle) {
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute(
      "aria-label",
      open ? "Hide purchase details" : "Show purchase details",
    );
  }
  if (!details) return;
  if (open) details.removeAttribute("hidden");
  else details.setAttribute("hidden", "");
}

export function initPurchaseBar() {
  const bar = document.querySelector("[data-purchase-bar]");
  const toggle = document.querySelector("[data-purchase-toggle]");
  const details = document.querySelector("[data-purchase-details]");
  const close = document.querySelector("[data-purchase-close]");
  if (!bar || !toggle || !details) return;

  const setOpen = () => {
    paint(bar, toggle, details, true);
    lockPage();
    syncMetrics();
    placeBar();
  };

  const openBar = () => {
    const menu = document.getElementById("offcanvasNavbar");
    if (menu && menu.classList.contains("show")) {
      const onClose = () => setOpen();
      document.addEventListener("mobilenav:close", onClose, { once: true });
      document.dispatchEvent(new CustomEvent("purchasebar:before-open"));
      return;
    }
    setOpen();
  };

  toggle.addEventListener("click", () => {
    if (bar.getAttribute("data-state") === "open") collapsePurchaseBar();
    else openBar();
  });

  if (close) close.addEventListener("click", collapsePurchaseBar);

  document.addEventListener("purchasebar:request-close", collapsePurchaseBar);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") collapsePurchaseBar();
  });

  syncMetrics();
  placeBar();
  window.addEventListener("load", () => {
    syncMetrics();
    placeBar();
  });
  let frame = 0;
  const schedule = () => {
    if (frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      placeBar();
    });
  };
  window.addEventListener(
    "scroll",
    () => {
      const bar = document.querySelector("[data-purchase-bar]");
      if (!bar || bar.getAttribute("data-state") === "open") {
        schedule();
        return;
      }
      const sheet = document.querySelector(".purchase-bar__sheet");
      const header = document.getElementById("header");
      placeClosed(bar, sheet, header);
    },
    { passive: true },
  );
  window.addEventListener("resize", () => {
    syncMetrics();
    schedule();
  });
}
