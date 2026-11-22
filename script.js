/* -------------------------------------------------------------------------- */
/* 01. DOM references and route configuration                                 */
/* -------------------------------------------------------------------------- */
const views = [...document.querySelectorAll(".spa-view")];
const menuToggle = document.querySelector(".menu-toggle");
const primaryNav = document.querySelector(".primary-nav");
const navLinks = [...primaryNav.querySelectorAll(".nav-link")];
const enquiryForm = document.querySelector("#enquiry-form");
const formStatus = document.querySelector("#form-status");
const enquiryInbox = "webweavers.freelance@gmail.com";
const enquiryEndpoint = "https://formspree.io/f/xljboepj";
const cards = [...document.querySelectorAll(".product-card")];
const filterButtons = document.querySelectorAll(".filter-button");
const curtain = document.querySelector(".page-curtain");
const collectionCount = document.querySelector(".collection-count");
const nameInput = enquiryForm.elements.name;
const namePattern = /^[A-Za-z]+(?: [A-Za-z]+)*$/;
const routeNames = new Set(views.map((view) => view.dataset.view));
const routeTitles = {
  home: "SD Furniture — Quiet forms for everyday living",
  collection: "Collection — SD Furniture",
  story: "Our story — SD Furniture",
  visit: "Get in touch — SD Furniture",
  product: "Product Study — SD Furniture Concept",
};
let activeRoute = "home";
let switchingRoute = false;
let queuedRoute = null;
let parallaxFrame = 0;

/* -------------------------------------------------------------------------- */
/* 02. Navigation and view routing                                            */
/* -------------------------------------------------------------------------- */
function routeFromHash() {
  const route = window.location.hash.slice(1);
  return routeNames.has(route) ? route : "home";
}

function isMenuOpen() {
  return menuToggle.getAttribute("aria-expanded") === "true";
}

function closeMenu({ restoreFocus = false } = {}) {
  if (!isMenuOpen() && primaryNav.inert) return;
  menuToggle.setAttribute("aria-expanded", "false");
  primaryNav.classList.remove("is-open");
  primaryNav.setAttribute("aria-hidden", "true");
  primaryNav.inert = true;
  document.body.classList.remove("menu-open");
  if (restoreFocus) menuToggle.focus();
}

function openMenu() {
  menuToggle.setAttribute("aria-expanded", "true");
  primaryNav.classList.add("is-open");
  primaryNav.setAttribute("aria-hidden", "false");
  primaryNav.inert = false;
  document.body.classList.add("menu-open");
  window.requestAnimationFrame(() => {
    const target =
      primaryNav.querySelector(".nav-link.is-active") || navLinks[0];
    target?.focus();
  });
}

function updateActiveNavIndicator(route) {
  navLinks.forEach((link) => {
    const isCurrent = link.dataset.route === route;
    link.classList.toggle("is-active", isCurrent);
    if (isCurrent) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

function initializeNavigationRoll() {
  primaryNav.querySelectorAll(".nav-link").forEach((link) => {
    const label = link.querySelector(".nav-label-roll");
    const originalLabel = label?.firstElementChild?.textContent;
    if (!label || !originalLabel) return;

    link.setAttribute("aria-label", originalLabel);
    label.replaceChildren();

    Array.from(originalLabel).forEach((character, index) => {
      const glyph = document.createElement("span");
      const track = document.createElement("span");
      const firstLine = document.createElement("span");
      const secondLine = document.createElement("span");
      const visibleCharacter = character === " " ? "\u00a0" : character;

      glyph.className = "nav-glyph";
      glyph.setAttribute("aria-hidden", "true");
      track.className = "nav-glyph-track";
      track.style.setProperty("--nav-roll-index", index);
      firstLine.textContent = visibleCharacter;
      secondLine.textContent = visibleCharacter;
      track.append(firstLine, secondLine);
      glyph.append(track);
      label.append(glyph);
    });
  });
}

initializeNavigationRoll();

function animateCurtainIn() {
  curtain.classList.add("is-covering");
  return new Promise((resolve) => window.setTimeout(resolve, 440));
}

function animateCurtainOut() {
  curtain.classList.remove("is-covering");
  curtain.classList.add("is-revealing");
  window.setTimeout(() => curtain.classList.remove("is-revealing"), 850);
}

async function showRoute(
  route,
  { updateHistory = true, onAfterSwitch = null } = {},
) {
  if (!routeNames.has(route)) return;
  closeMenu();

  if (switchingRoute) {
    queuedRoute = { route, updateHistory, onAfterSwitch };
    return;
  }

  if (route === activeRoute) {
    if (updateHistory && routeFromHash() !== route) {
      window.history.pushState({ route }, "", `#${route}`);
    }
    updateActiveNavIndicator(route);
    if (typeof onAfterSwitch === "function") onAfterSwitch();
    else window.scrollTo(0, 0);
    return;
  }

  switchingRoute = true;
  await animateCurtainIn();

  views.forEach((view) => {
    const active = view.dataset.view === route;
    view.hidden = !active;
    view.classList.toggle("is-active", active);
    view.setAttribute("aria-hidden", String(!active));
    view.inert = !active;
  });
  activeRoute = route;
  document.title = routeTitles[route];
  updateActiveNavIndicator(route);

  if (updateHistory && routeFromHash() !== route) {
    window.history.pushState({ route }, "", `#${route}`);
  }

  if (typeof onAfterSwitch === "function") onAfterSwitch();
  else window.scrollTo(0, 0);

  updateParallax();
  animateCurtainOut();
  switchingRoute = false;

  if (queuedRoute) {
    const next = queuedRoute;
    queuedRoute = null;
    showRoute(next.route, {
      updateHistory: next.updateHistory,
      onAfterSwitch: next.onAfterSwitch,
    });
  }
}

document.querySelectorAll("[data-route]").forEach((control) => {
  control.addEventListener("click", (event) => {
    event.preventDefault();
    const targetRoute = control.dataset.route;

    // Featured cards open the product study through their dedicated handler.
    if (control.classList.contains("home-feature")) return;

    showRoute(targetRoute);
  });
});

menuToggle.addEventListener("click", () => {
  if (isMenuOpen()) closeMenu({ restoreFocus: true });
  else openMenu();
});

document.addEventListener("keydown", (event) => {
  if (!isMenuOpen()) return;

  if (event.key === "Escape") {
    event.preventDefault();
    closeMenu({ restoreFocus: true });
    return;
  }

  if (event.key === "Tab") {
    const firstLink = navLinks[0];
    const lastLink = navLinks[navLinks.length - 1];

    if (document.activeElement === menuToggle) {
      event.preventDefault();
      (event.shiftKey ? lastLink : firstLink)?.focus();
    } else if (event.shiftKey && document.activeElement === firstLink) {
      event.preventDefault();
      lastLink.focus();
    } else if (!event.shiftKey && document.activeElement === lastLink) {
      event.preventDefault();
      firstLink.focus();
    }
  }
});

window.addEventListener("popstate", () =>
  showRoute(routeFromHash(), { updateHistory: false }),
);
window.addEventListener("hashchange", () => {
  if (routeFromHash() !== activeRoute)
    showRoute(routeFromHash(), { updateHistory: false });
});

/* -------------------------------------------------------------------------- */
/* 03. Collection filtering                                                   */
/* -------------------------------------------------------------------------- */
filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => {
      const active = item === button;
      item.classList.toggle("is-active", active);
      item.setAttribute("aria-pressed", String(active));
    });
    cards.forEach((card) => {
      card.classList.toggle(
        "is-hidden",
        filter !== "all" && card.dataset.category !== filter,
      );
    });
    const visibleCount = cards.filter(
      (card) => !card.classList.contains("is-hidden"),
    ).length;
    collectionCount.setAttribute("aria-live", "polite");
    collectionCount.textContent = `Showing ${visibleCount} ${visibleCount === 1 ? "piece" : "pieces"}`;
    updateParallax();
  });
});

document.querySelectorAll(".product-enquire").forEach((button) => {
  button.addEventListener("click", () => {
    const message = enquiryForm.elements.message;
    message.value = `I'm interested in ${button.dataset.product}. Please share more details.`;
    showRoute("visit");
    window.setTimeout(() => message.focus({ preventScroll: true }), 500);
  });
});

/* -------------------------------------------------------------------------- */
/* 03B. Architectural Spec-Sheet Product View                                 */
/* -------------------------------------------------------------------------- */
const productStudies = {
  "the sunday chair": {
    study: "STUDY NO. 01 · SEATING",
    title: "The Sunday Chair",
    image: "assets/chair.svg",
    dimensions: "W 74 × D 80 × H 76 cm (Example)",
    finishes: [
      { label: "Natural Oak", tint: "#dfd9cf" },
      { label: "Smoked Oak", tint: "#cfc6b8" },
    ],
    pins: [
      {
        x: 34,
        y: 38,
        code: "01",
        title: "Pitched Backrest",
        desc: "Angled for relaxed reading posture with softened edge profiles.",
      },
      {
        x: 56,
        y: 58,
        code: "02",
        title: "Unbleached Linen Cushion",
        desc: "Illustrative breathable weave paired with firm seat support.",
      },
      {
        x: 30,
        y: 76,
        code: "03",
        title: "Tapered Timber Frame",
        desc: "Concept joinery study balancing visual lightness with stability.",
      },
    ],
  },
  "the gather table": {
    study: "STUDY NO. 02 · TABLES",
    title: "The Gather Table",
    image: "assets/table.svg",
    dimensions: "L 210 × W 95 × H 75 cm (Example)",
    finishes: [
      { label: "Oiled Ash", tint: "#dfd9cf" },
      { label: "Warm Walnut", tint: "#d2c5b4" },
    ],
    pins: [
      {
        x: 50,
        y: 42,
        code: "01",
        title: "Chamfered Tabletop",
        desc: "Bevelled underside reduces visual mass across a generous span.",
      },
      {
        x: 28,
        y: 68,
        code: "02",
        title: "Inset Leg Stance",
        desc: "Positioned to allow comfortable seating along the full perimeter.",
      },
    ],
  },
  "the still pendant": {
    study: "STUDY NO. 03 · LIGHTING",
    title: "The Still Pendant",
    image: "assets/lamp.svg",
    dimensions: "Ø 42 × H 28 cm (Example)",
    finishes: [
      { label: "Raw Plaster", tint: "#e3ded4" },
      { label: "Brushed Brass", tint: "#d8cebe" },
    ],
    pins: [
      {
        x: 50,
        y: 26,
        code: "01",
        title: "Fabric-Wrapped Cord",
        desc: "Minimalist suspension detail designed for low-glare dining zones.",
      },
      {
        x: 50,
        y: 56,
        code: "02",
        title: "Diffused Shade",
        desc: "Softens downward illumination to create warm evening ambiance.",
      },
    ],
  },
  "the sunday sofa": {
    study: "STUDY NO. 04 · SEATING",
    title: "The Sunday Sofa",
    image: "assets/sofa.svg",
    dimensions: "W 220 × D 94 × H 74 cm (Example)",
    finishes: [
      { label: "Oat Bouclé", tint: "#dfd9cf" },
      { label: "Moss Wool", tint: "#cfd3c8" },
    ],
    pins: [
      {
        x: 38,
        y: 48,
        code: "01",
        title: "Low Architectural Profile",
        desc: "Keeps sightlines open in contemporary living spaces.",
      },
      {
        x: 68,
        y: 64,
        code: "02",
        title: "Deep Seat Proportions",
        desc: "Generous seat depth balanced by structured bolster arms.",
      },
    ],
  },
  "the pebble side table": {
    study: "STUDY NO. 05 · TABLES",
    title: "The Pebble Side Table",
    image: "assets/side-table.svg",
    dimensions: "W 42 × D 42 × H 48 cm (Example)",
    finishes: [
      { label: "Honed Travertine", tint: "#e0dad0" },
      { label: "Ebonized Oak", tint: "#ccc7be" },
    ],
    pins: [
      {
        x: 50,
        y: 36,
        code: "01",
        title: "Monolithic Top",
        desc: "Compact surface proportioned for books, ceramics, or a reading lamp.",
      },
      {
        x: 50,
        y: 70,
        code: "02",
        title: "Recessed Shadow Base",
        desc: "Creates a subtle floating silhouette against timber or stone floors.",
      },
    ],
  },
  "the arc stool": {
    study: "STUDY NO. 06 · SEATING",
    title: "The Arc Stool",
    image: "assets/stool.svg",
    dimensions: "W 40 × D 34 × H 45 cm (Example)",
    finishes: [
      { label: "Natural Beech", tint: "#dfd9cf" },
      { label: "Smoked Ash", tint: "#cfc6b8" },
    ],
    pins: [
      {
        x: 50,
        y: 38,
        code: "01",
        title: "Saddle-Carved Seat",
        desc: "Subtle contour engineered for short-stay seating or bedside use.",
      },
      {
        x: 36,
        y: 72,
        code: "02",
        title: "Splayed Through-Legs",
        desc: "Compact footprint that tucks neatly beneath desks or consoles.",
      },
    ],
  },
};

function openProductStudy(productName) {
  const key = productName.trim().toLowerCase();
  const data = productStudies[key] || productStudies["the sunday chair"];

  document.querySelector("#sheet-study-id").textContent = data.study;
  document.querySelector("#sheet-title").textContent = data.title;
  document.querySelector("#sheet-dimensions").textContent = data.dimensions;

  const sheetImg = document.querySelector("#sheet-image");
  sheetImg.src = data.image;
  sheetImg.alt = `${data.title} — conceptual furniture illustration`;

  const canvas = document.querySelector("#sheet-canvas");
  canvas.style.setProperty("--sheet-tint", data.finishes[0].tint);

  // Render finish swatches
  const swatchesWrap = document.querySelector("#sheet-swatches");
  swatchesWrap.replaceChildren();
  data.finishes.forEach((finish, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `sheet-swatch${idx === 0 ? " is-active" : ""}`;
    btn.textContent = finish.label;
    btn.addEventListener("click", () => {
      swatchesWrap
        .querySelectorAll(".sheet-swatch")
        .forEach((s) => s.classList.remove("is-active"));
      btn.classList.add("is-active");
      canvas.style.setProperty("--sheet-tint", finish.tint);
    });
    swatchesWrap.appendChild(btn);
  });

  // Render interactive callout pins
  const pinsWrap = document.querySelector("#sheet-pins");
  pinsWrap.replaceChildren();

  function selectPin(pin, buttonEl) {
    pinsWrap
      .querySelectorAll(".sheet-pin")
      .forEach((p) => p.classList.remove("is-active"));
    buttonEl.classList.add("is-active");
    document.querySelector("#pin-index").textContent =
      `${pin.code} · CONCEPT DETAIL`;
    document.querySelector("#pin-title").textContent = pin.title;
    document.querySelector("#pin-desc").textContent = pin.desc;
  }

  data.pins.forEach((pin, idx) => {
    const pinBtn = document.createElement("button");
    pinBtn.type = "button";
    pinBtn.className = `sheet-pin${idx === 0 ? " is-active" : ""}`;
    pinBtn.style.left = `${pin.x}%`;
    pinBtn.style.top = `${pin.y}%`;
    pinBtn.textContent = pin.code;
    pinBtn.setAttribute("aria-label", `Detail ${pin.code}: ${pin.title}`);
    pinBtn.addEventListener("click", () => selectPin(pin, pinBtn));
    pinsWrap.appendChild(pinBtn);
    if (idx === 0) selectPin(pin, pinBtn);
  });

  const enquireBtn = document.querySelector("#sheet-enquire-btn");
  enquireBtn.onclick = () => {
    const message = enquiryForm.elements.message;
    message.value = `I'm interested in ${data.title}. Please share more details.`;
    showRoute("visit", {
      onAfterSwitch: () =>
        window.setTimeout(() => message.focus({ preventScroll: true }), 120),
    });
  };

  showRoute("product");
}

// Connect homepage featured cards & collection cards to open the Spec-Sheet view
document.querySelectorAll(".home-feature").forEach((card) => {
  card.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    const name = card.querySelector("strong")?.textContent || "";
    openProductStudy(name);
  });
});

cards.forEach((card) => {
  const imageBox = card.querySelector(".product-image");
  const titleEl = card.querySelector("h2");
  [imageBox, titleEl].forEach((el) => {
    if (!el) return;
    el.style.cursor = "pointer";
    el.addEventListener("click", (event) => {
      if (event.target.closest(".product-enquire")) return;
      openProductStudy(titleEl?.textContent || "");
    });
  });
});

/* -------------------------------------------------------------------------- */
/* 04. Enquiry form submission                                                */
/* -------------------------------------------------------------------------- */
enquiryForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const submitButton = enquiryForm.querySelector('button[type="submit"]');
  const trimmedName = nameInput.value.trim();

  if (trimmedName.length < 2) {
    nameInput.setCustomValidity("Please enter at least 2 letters.");
  } else if (!namePattern.test(trimmedName)) {
    nameInput.setCustomValidity(
      "Name must contain letters only. Numbers and symbols are not allowed.",
    );
  } else {
    nameInput.setCustomValidity("");
  }

  if (!enquiryForm.checkValidity()) {
    enquiryForm.reportValidity();
    nameInput.focus();
    return;
  }

  nameInput.value = trimmedName;
  const submitLabel = submitButton.textContent.trim();
  const formData = Object.fromEntries(new FormData(enquiryForm));
  formData._subject = `Furniture enquiry from ${formData.name}`;
  formStatus.textContent = "Sending your enquiry…";
  submitButton.disabled = true;
  submitButton.textContent = "Sending your enquiry…";

  fetch(enquiryEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(formData),
  })
    .then(async (response) => {
      const responseText = await response.text();
      let result;
      try {
        result = JSON.parse(responseText);
      } catch {
        throw new Error(
          `The email service returned an unexpected response (${response.status}).`,
        );
      }

      if (!response.ok) {
        throw new Error(
          result.message || "The form service could not accept this enquiry.",
        );
      }
      if (
        result.ok !== true &&
        result.success !== true &&
        result.success !== "true"
      ) {
        throw new Error("The form service returned an unexpected response.");
      }

      enquiryForm.reset();
      formStatus.textContent =
        "Your enquiry was accepted. Thank you for contacting SD Furniture.";
    })
    .catch((error) => {
      console.error("Enquiry submission failed:", error);
      const reason =
        error instanceof Error
          ? error.message
          : "The email service could not be reached.";
      formStatus.textContent = `We couldn't send your enquiry. ${reason} Please email ${enquiryInbox} directly.`;
    })
    .finally(() => {
      submitButton.disabled = false;
      submitButton.textContent = submitLabel;
    });
});

formStatus.setAttribute("aria-live", "polite");
nameInput.addEventListener("input", () => {
  const originalValue = nameInput.value;
  const cleanedValue = originalValue
    .replace(/[^A-Za-z ]/g, "")
    .replace(/\s+/g, " ")
    .replace(/^ /, "");

  if (cleanedValue !== originalValue) {
    nameInput.value = cleanedValue;
  }
  nameInput.setCustomValidity("");
});
enquiryForm.addEventListener("input", () => {
  if (formStatus.textContent) formStatus.textContent = "";
});

const scrollTopButton = document.querySelector("[data-scroll-top]");
if (scrollTopButton) {
  scrollTopButton.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* -------------------------------------------------------------------------- */
/* 05. Parallax and reveal effects                                            */
/* -------------------------------------------------------------------------- */
function updateParallax() {
  if (parallaxFrame) return;
  parallaxFrame = requestAnimationFrame(() => {
    parallaxFrame = 0;
    const activeView = document.querySelector(".spa-view.is-active");
    if (!activeView) return;
    const hero = activeView.querySelector(".home-panel--hero");
    if (hero) {
      const start = activeView.getBoundingClientRect().top + window.scrollY;
      const progress = Math.max(
        0,
        Math.min(1, (window.scrollY - start) / Math.max(1, hero.offsetHeight)),
      );
      hero.style.setProperty("--hero-media-y", `${progress * 54}px`);
      hero.style.setProperty("--hero-copy-y", `${progress * -24}px`);
    }
    activeView.querySelectorAll(".parallax-mask").forEach((mask) => {
      const image = mask.querySelector(".parallax-image");
      if (!image) return;
      const bounds = mask.getBoundingClientRect();
      const travel = window.innerHeight + bounds.height;
      const progress =
        (bounds.top + bounds.height / 2 - window.innerHeight / 2) / travel;
      image.style.setProperty(
        "--parallax-y",
        `${-progress * bounds.height * 0.5}px`,
      );
    });
  });
}

window.addEventListener("scroll", updateParallax, { passive: true });
window.addEventListener("resize", updateParallax);
window.addEventListener("load", updateParallax);

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 },
  );

  document
    .querySelectorAll(".home-reveal")
    .forEach((element) => revealObserver.observe(element));
} else {
  document
    .querySelectorAll(".home-reveal")
    .forEach((element) => element.classList.add("is-visible"));
}

const initialRoute = routeFromHash();
views.forEach((view) => {
  const active = view.dataset.view === initialRoute;
  view.hidden = !active;
  view.classList.toggle("is-active", active);
  view.setAttribute("aria-hidden", String(!active));
  view.inert = !active;
});
activeRoute = initialRoute;
document.title = routeTitles[initialRoute];
updateActiveNavIndicator(initialRoute);
closeMenu();
updateParallax();
