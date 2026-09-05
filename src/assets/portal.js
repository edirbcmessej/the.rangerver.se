(() => {
  "use strict";

  let rangers = [];
  let current = 0;

  const shell = document.querySelector("#portal-shell");
  const frame = document.querySelector("#portal-frame");
  const title = document.querySelector("#portal-title");
  const urlLabel = document.querySelector("#portal-url");
  const loading = document.querySelector("#portal-loading");
  const external = document.querySelector("#portal-external");
  const controls = [...document.querySelectorAll("button.portal-button")];

  function requestedIndex() {
    const slug = new URLSearchParams(location.search).get("ranger");
    if (slug) {
      const index = rangers.findIndex((ranger) => ranger.slug === slug);
      if (index >= 0) return index;
    }
    return Math.floor(Math.random() * rangers.length);
  }

  function randomIndex() {
    let next = current;
    if (rangers.length > 1) {
      while (next === current) next = Math.floor(Math.random() * rangers.length);
    }
    return next;
  }

  function syncUrl(ranger) {
    const nextUrl = new URL(location.href);
    nextUrl.searchParams.set("ranger", ranger.slug);
    history.replaceState(null, "", `${nextUrl.pathname}${nextUrl.search}`);
  }

  function load(index) {
    current = (index + rangers.length) % rangers.length;
    const ranger = rangers[current];
    shell.classList.remove("is-loaded");
    loading.querySelector("span").textContent = `tuning into ${ranger.name}…`;
    title.textContent = ranger.name;
    urlLabel.textContent = ranger.url;
    external.href = ranger.url;
    external.setAttribute("aria-label", `Open ${ranger.name}'s site in a new tab`);
    frame.title = `${ranger.name}'s site`;
    frame.src = ranger.url;
    document.title = `${ranger.name} — Ranger Portal`;
    syncUrl(ranger);
  }

  function fail(error) {
    console.error(error);
    shell.classList.add("has-error");
    title.textContent = "Signal lost";
    urlLabel.textContent = "The ring missed its connection";
    loading.querySelector("span").textContent = "The Ranger Portal is temporarily out of orbit. Try refreshing.";
    controls.forEach((control) => { control.disabled = true; });
    external.removeAttribute("href");
    external.setAttribute("aria-disabled", "true");
  }

  async function start() {
    try {
      const response = await fetch("../data/rangers.json?v={{ASSET_VERSION}}");
      if (!response.ok) throw new Error("The Ranger directory could not be loaded.");
      rangers = await response.json();
      if (!rangers.length) throw new Error("The Ranger directory is empty.");
      load(requestedIndex());
    } catch (error) {
      fail(error);
    }
  }

  document.querySelector("#portal-previous").addEventListener("click", () => load(current - 1));
  document.querySelector("#portal-next").addEventListener("click", () => load(current + 1));
  document.querySelector("#portal-random").addEventListener("click", () => load(randomIndex()));
  frame.addEventListener("load", () => shell.classList.add("is-loaded"));
  addEventListener("popstate", () => {
    if (rangers.length) load(requestedIndex());
  });

  start();
})();
