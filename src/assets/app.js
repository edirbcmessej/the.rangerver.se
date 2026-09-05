(() => {
  "use strict";

  let rangers = [];
  let current = 0;
  let site = null;

  const cards = document.querySelector("#cards");
  const address = document.querySelector("#address");
  const hint = document.querySelector("#ringhint");

  const el = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };

  function renderOrbit() {
    const container = document.querySelector("#orbit-nodes");
    const names = rangers.slice(0, 3).map((ranger) => `${ranger.name.toUpperCase()}.HTML`);
    names.push("YOU?");
    container.replaceChildren(...names.map((name) => el("div", "node", name)));
  }

  function renderCards() {
    const fragment = document.createDocumentFragment();
    rangers.forEach((ranger) => {
      const card = el("a", "card");
      card.href = ranger.url;
      card.target = "_blank";
      card.rel = "noopener";
      card.setAttribute("aria-label", `Visit ${ranger.name}'s site`);

      const status = el("i", "status");
      status.dataset.status = ranger.status;
      status.title = `Site status: ${ranger.status}`;
      const avatar = el("div", "avatar", ranger.avatar);
      const heading = el("h3", "", ranger.name);
      const handle = el("div", "handle", `${ranger.handle} · ${ranger.era}`);
      const description = el("p", "", ranger.description);
      const tags = el("div", "tags");
      tags.append(...ranger.tags.map((tag) => el("span", "tag", tag)));
      const arrow = el("span", "card-arrow", "↗");
      arrow.setAttribute("aria-hidden", "true");

      card.append(status, avatar, heading, handle, description, tags, arrow);
      card.addEventListener("mouseenter", () => select(rangers.indexOf(ranger), false));
      card.addEventListener("focus", () => select(rangers.indexOf(ranger), false));
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

  function randomRanger(scroll = true) {
    let next = current;
    if (rangers.length > 1) {
      while (next === current) next = Math.floor(Math.random() * rangers.length);
    }
    select(next, scroll);
  }

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
        fetch("./data/site.json"),
        fetch("./data/rangers.json"),
      ]);
      if (!siteResponse.ok || !rangerResponse.ok) throw new Error("The generated data files could not be loaded.");
      [site, rangers] = await Promise.all([siteResponse.json(), rangerResponse.json()]);
      renderOrbit();
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
  document.querySelector("#random-ranger").addEventListener("click", () => randomRanger(false));
  document.querySelector("#enter-ring").addEventListener("click", () => randomRanger(true));
  start();
})();
