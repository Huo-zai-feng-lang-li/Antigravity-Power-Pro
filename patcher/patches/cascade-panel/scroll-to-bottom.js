/**
 * Cascade Panel - scroll-to-bottom button.
 *
 * The Cascade DOM changes often and may be nested in Shadow DOM. Keep the
 * expensive scan behind a state lock, but only lock a genuinely scrollable
 * element so the button cannot disappear behind a stale early candidate.
 */

const BTN_ID = "cascade-scroll-bottom-btn";
const THRESHOLD = 150;
const MIN_SCROLLABLE_GAP = 50;

const SCROLLABLE_OVERFLOWS = new Set(["auto", "scroll", "overlay", "hidden"]);
const SCROLL_HINT_SELECTOR = [
  ".cascade-scrollbar",
  ".overflow-y-auto",
  ".overflow-y-scroll",
  ".overflow-auto",
  ".scrollbar-hide",
  "[style*='overflow']",
].join(", ");

const getClassText = (el) => {
  if (!el) return "";
  if (typeof el.className === "string") return el.className;
  return el.getAttribute?.("class") || "";
};

const hasScrollHint = (el) => {
  const classText = getClassText(el);
  return (
    el.matches?.(SCROLL_HINT_SELECTOR) ||
    /(^|\s)(cascade-scrollbar|scrollbar-hide|overflow-y-(auto|scroll)|overflow-auto)(\s|$)/.test(classText)
  );
};

const hasScrollableRange = (el) =>
  !!el &&
  el.nodeType === Node.ELEMENT_NODE &&
  el.id !== BTN_ID &&
  el.clientHeight > 50 &&
  el.clientWidth > 120 &&
  el.scrollHeight > el.clientHeight + MIN_SCROLLABLE_GAP;

const canScroll = (el) => {
  if (!hasScrollableRange(el)) return false;

  if (el === document.scrollingElement) return true;

  const overflowY = window.getComputedStyle(el).overflowY;
  return SCROLLABLE_OVERFLOWS.has(overflowY) || hasScrollHint(el);
};

/** Find the Cascade mount root without falling back to the whole workbench. */
const findRoot = () =>
  document.querySelector(".antigravity-agent-side-panel") ||
  document.getElementById("react-app") ||
  document.body;

/** Find the main scroll container, traversing Shadow DOM when needed. */
const findScrollEl = (root) => {
  if (!root) return null;

  const candidates = [];
  const seen = new Set();

  const push = (el) => {
    if (!el || seen.has(el) || !canScroll(el)) return;
    seen.add(el);
    candidates.push(el);
  };

  const traverse = (node) => {
    if (!node?.querySelectorAll) return;

    if (node.nodeType === Node.ELEMENT_NODE) push(node);
    if (node === document || node === document.body) push(document.scrollingElement);

    node.querySelectorAll("*").forEach((el) => {
      push(el);
      if (el.shadowRoot) traverse(el.shadowRoot);
    });
  };

  traverse(root === document.body ? document : root);

  if (candidates.length === 0) return null;

  return candidates.sort((a, b) => {
    const aHint = hasScrollHint(a) ? 100000 : 0;
    const bHint = hasScrollHint(b) ? 100000 : 0;
    return b.scrollHeight + bHint - (a.scrollHeight + aHint);
  })[0];
};

const createArrowSVG = () => {
  const ns = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(ns, "svg");
  const attrs = {
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    "stroke-width": "3",
    "stroke-linecap": "round",
    "stroke-linejoin": "round",
  };
  for (const [key, value] of Object.entries(attrs)) svg.setAttribute(key, value);

  for (const points of ["7 13 12 18 17 13", "7 6 12 11 17 6"]) {
    const poly = document.createElementNS(ns, "polyline");
    poly.setAttribute("points", points);
    svg.appendChild(poly);
  }
  return svg;
};

export const init = () => {
  let trackedEl = null;
  let btn = null;
  let rootWithCaptureListener = null;

  const isTrackedValid = () => trackedEl?.isConnected && hasScrollableRange(trackedEl);

  const update = () => {
    if (!trackedEl?.isConnected || !hasScrollableRange(trackedEl)) {
      btn?.classList.remove("visible");
      return;
    }

    const gap = trackedEl.scrollHeight - trackedEl.scrollTop - trackedEl.clientHeight;
    btn?.classList.toggle("visible", trackedEl.clientHeight > 0 && gap > THRESHOLD);
  };

  const bindRootCaptureScroll = (root) => {
    if (!root || root === rootWithCaptureListener) return;
    rootWithCaptureListener?.removeEventListener("scroll", update, true);
    root.addEventListener("scroll", update, true);
    rootWithCaptureListener = root;
  };

  const ensureButton = () => {
    const root = findRoot();
    if (!root) return;

    const el = isTrackedValid() ? trackedEl : findScrollEl(root);
    if (!el) {
      btn?.classList.remove("visible");
      trackedEl?.removeEventListener("scroll", update);
      trackedEl = null;
      return;
    }

    if (!btn || !btn.isConnected) {
      btn = document.getElementById(BTN_ID);
    }

    if (!btn) {
      btn = document.createElement("button");
      btn.type = "button";
      btn.id = BTN_ID;
      btn.title = "滚动到底部";
      btn.appendChild(createArrowSVG());
      root.appendChild(btn);
      btn.addEventListener("click", () => {
        const target = trackedEl || findScrollEl(findRoot());
        if (target) target.scrollTo({ top: target.scrollHeight, behavior: "instant" });
      });
    } else if (btn.parentElement !== root) {
      root.appendChild(btn);
    }

    btn.classList.toggle("body-root", root === document.body || root.id === "react-app");

    if (root !== document.body && window.getComputedStyle(root).position === "static") {
      root.style.position = "relative";
    }

    if (el !== trackedEl) {
      trackedEl?.removeEventListener("scroll", update);
      el.addEventListener("scroll", update, { passive: true });
      trackedEl = el;
    }

    bindRootCaptureScroll(root);
    update();
  };

  ensureButton();

  let timer = null;
  const observer = new MutationObserver(() => {
    clearTimeout(timer);
    timer = setTimeout(ensureButton, 300);
  });

  observer.observe(document.body, { childList: true, subtree: true });
  window.addEventListener("resize", ensureButton);
  console.log("[Cascade] 滚动到底部按钮已启动 (robust state lock)");
};
