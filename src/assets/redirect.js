(() => {
  "use strict";

  const mode = document.documentElement.dataset.mode;
  const message = document.querySelector("#message");
  const params = new URLSearchParams(window.location.search);

  function identifyCurrent(rangers) {
    const requestedSlug = params.get("from");
    const bySlug = rangers.findIndex((ranger) => ranger.slug === requestedSlug);
    if (bySlug >= 0) return bySlug;

    if (document.referrer) {
      try {
        const referringHost = new URL(document.referrer).hostname.replace(/^www\./, "");
        return rangers.findIndex((ranger) => new URL(ranger.url).hostname.replace(/^www\./, "") === referringHost);
      } catch {
        return -1;
      }
    }
    return -1;
  }

  function destination(rangers) {
    const current = identifyCurrent(rangers);
    if (mode === "random") {
      if (rangers.length === 1) return rangers[0];
      let index = current;
      while (index === current) index = Math.floor(Math.random() * rangers.length);
      return rangers[index];
    }
    if (current < 0) return rangers[mode === "prev" ? rangers.length - 1 : 0];
    const delta = mode === "prev" ? -1 : 1;
    return rangers[(current + delta + rangers.length) % rangers.length];
  }

  fetch("../data/rangers.json")
    .then((response) => {
      if (!response.ok) throw new Error("Could not load Ranger data");
      return response.json();
    })
    .then((rangers) => {
      const ranger = destination(rangers);
      if (!ranger) throw new Error("No Rangers are connected");
      message.textContent = `Opening ${ranger.name}'s site…`;
      window.location.replace(ranger.url);
    })
    .catch((error) => {
      console.error(error);
      message.textContent = "The ring missed a connection. Head back to the directory and try again.";
    });
})();
