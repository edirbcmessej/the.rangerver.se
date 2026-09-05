(() => {
  "use strict";

  let rangers = [];
  let current = 0;
  let site = null;

  const cards = document.querySelector("#cards");
  const address = document.querySelector("#address");
  const hint = document.querySelector("#ringhint");
  const themeToggle = document.querySelector("#theme-toggle");
  const themeMedia = matchMedia("(prefers-color-scheme: dark)");
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const viewer = document.querySelector("#ranger-viewer");
  const viewerFrame = document.querySelector("#viewer-frame");
  const viewerTitle = document.querySelector("#viewer-title");
  const viewerUrl = document.querySelector("#viewer-url");
  const viewerExternal = document.querySelector("#viewer-external");
  const heroArt = document.querySelector("#hero-art");
  let closeTimer;

  function setTheme(theme, persist = false) {
    document.documentElement.dataset.theme = theme;
    const dark = theme === "dark";
    themeToggle.setAttribute("aria-pressed", String(dark));
    themeToggle.setAttribute("aria-label", `Use ${dark ? "light" : "dark"} mode`);
    themeToggle.querySelector(".theme-icon").textContent = dark ? "☀" : "☾";
    themeToggle.querySelector(".theme-label").textContent = dark ? "light" : "dark";
    document.querySelector('meta[name="theme-color"]').content = dark ? "#071a28" : "#0797e3";
    const artSource = dark ? heroArt.dataset.darkSrc : heroArt.dataset.lightSrc;
    if (heroArt.getAttribute("src") !== artSource) heroArt.src = artSource;
    if (persist) {
      try {
        localStorage.setItem("rangerverse-theme", theme);
      } catch {}
    }
  }

  function hasSavedTheme() {
    try {
      return ["light", "dark"].includes(localStorage.getItem("rangerverse-theme"));
    } catch {
      return false;
    }
  }

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function renderCards() {
    const fragment = document.createDocumentFragment();
    rangers.forEach((ranger, index) => {
      const card = el("button", "card");
      card.type = "button";
      card.setAttribute("aria-label", `Browse ${ranger.name}'s site in the Rangerverse viewer`);

      const status = el("i", "status");
      status.dataset.status = ranger.status;
      status.title = `Site status: ${ranger.status}`;
      const avatar = el("div", "avatar", ranger.avatar);
      const heading = el("h3", "", ranger.name);
      const handle = el("div", "handle", `${ranger.handle} · ${ranger.era}`);
      const description = el("p", "", ranger.description);
      const tags = el("div", "tags");
      tags.append(...ranger.tags.map((tag) => el("span", "tag", tag)));

      card.append(status, avatar, heading, handle, description, tags);
      card.addEventListener("click", (event) => openViewer(index, event));
      fragment.append(card);
    });
    cards.replaceChildren(fragment);
  }

  function update() {
    const ranger = rangers[current];
    if (!ranger) return;
    address.textContent = `${ranger.url} ↗`;
    address.href = ranger.url;
    address.target = "_blank";
    address.rel = "noopener";
    hint.textContent = `currently orbiting: ${ranger.slug}.html · click the address to visit`;
  }

  function select(index, scroll = true) {
    current = (index + rangers.length) % rangers.length;
    update();
    if (scroll) document.querySelector("#ring").scrollIntoView({ behavior: "smooth" });
  }

  function step(direction) {
    select(current + direction, false);
  }

  function randomIndex() {
    let next = current;
    if (rangers.length > 1) {
      while (next === current) next = Math.floor(Math.random() * rangers.length);
    }
    return next;
  }

  function loadViewer(index) {
    current = (index + rangers.length) % rangers.length;
    const ranger = rangers[current];
    update();
    viewer.classList.remove("is-loaded");
    viewerTitle.textContent = ranger.name;
    viewerUrl.textContent = ranger.url;
    viewerExternal.href = ranger.url;
    viewerExternal.setAttribute("aria-label", `Open ${ranger.name}'s site in a new tab`);
    viewerFrame.title = `${ranger.name}'s site`;
    viewerFrame.src = ranger.url;
  }

  function openViewer(index, event) {
    if (!rangers.length) return;
    clearTimeout(closeTimer);
    const x = event?.clientX || window.innerWidth / 2;
    const y = event?.clientY || window.innerHeight / 2;
    viewer.style.setProperty("--bloom-x", `${x}px`);
    viewer.style.setProperty("--bloom-y", `${y}px`);
    loadViewer(index);
    document.body.classList.add("viewer-open");
    if (!viewer.open) viewer.showModal();
    requestAnimationFrame(() => requestAnimationFrame(() => viewer.classList.add("is-open")));
  }

  function closeViewer() {
    viewer.classList.remove("is-open");
    clearTimeout(closeTimer);
    closeTimer = setTimeout(() => {
      viewer.close();
      viewer.classList.remove("is-loaded");
      viewerFrame.removeAttribute("src");
      document.body.classList.remove("viewer-open");
    }, reducedMotion.matches ? 0 : 360);
  }

  function openRandomViewer(event) {
    openViewer(randomIndex(), event);
  }

  function randomViewerRanger() { loadViewer(randomIndex()); }

  function configureJoin() {
    const submit = document.querySelector("#submit-site");
    if (site.submission_url) {
      submit.href = site.submission_url;
      submit.target = "_blank";
      submit.rel = "noopener";
    } else {
      submit.textContent = "submission portal → coming next";
      submit.setAttribute("aria-disabled", "true");
      submit.addEventListener("click", (event) => event.preventDefault());
    }

    const base = site.canonical_url.replace(/\/$/, "");
    document.querySelector("#ring-snippet").textContent = `<nav class="rangerverse">\n  <a href="${base}/prev?from=YOUR_SLUG">← prev</a>\n  <a href="${base}/random?from=YOUR_SLUG">✦ rangerverse</a>\n  <a href="${base}/next?from=YOUR_SLUG">next →</a>\n</nav>`;
  }

  async function start() {
    try {
      const [siteResponse, rangerResponse] = await Promise.all([
        fetch("./data/site.json?v={{ASSET_VERSION}}"),
        fetch("./data/rangers.json?v={{ASSET_VERSION}}"),
      ]);
      if (!siteResponse.ok || !rangerResponse.ok) throw new Error("The generated data files could not be loaded.");
      [site, rangers] = await Promise.all([siteResponse.json(), rangerResponse.json()]);
      renderCards();
      configureJoin();
      update();
    } catch (error) {
      console.error(error);
      cards.replaceChildren(el("p", "notice", "The Ranger directory missed its connection. Try refreshing in a moment."));
      hint.textContent = "The ring is temporarily out of orbit.";
    }
  }

  document.querySelector("#previous-ranger").addEventListener("click", () => step(-1));
  document.querySelector("#next-ranger").addEventListener("click", () => step(1));
  document.querySelector("#random-ranger").addEventListener("click", openRandomViewer);
  document.querySelector("#enter-ring").addEventListener("click", openRandomViewer);
  address.addEventListener("click", (event) => {
    event.preventDefault();
    openViewer(current, event);
  });
  document.querySelector("#viewer-close").addEventListener("click", closeViewer);
  document.querySelector("#viewer-previous").addEventListener("click", () => loadViewer(current - 1));
  document.querySelector("#viewer-next").addEventListener("click", () => loadViewer(current + 1));
  document.querySelector("#viewer-random").addEventListener("click", randomViewerRanger);
  viewerFrame.addEventListener("load", () => viewer.classList.add("is-loaded"));
  viewer.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeViewer();
  });
  themeToggle.addEventListener("click", () => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark", true);
  });
  themeMedia.addEventListener("change", (event) => {
    if (!hasSavedTheme()) setTheme(event.matches ? "dark" : "light");
  });
  setTheme(document.documentElement.dataset.theme || (themeMedia.matches ? "dark" : "light"));
  start();
})();
