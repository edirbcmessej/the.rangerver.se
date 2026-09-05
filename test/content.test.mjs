import test from "node:test";
import assert from "node:assert/strict";
import { validateRangers, validateSite } from "../scripts/lib/content.mjs";

const ranger = {
  slug: "ada-l",
  name: "Ada",
  handle: "@ada",
  url: "https://ada.example",
  era: "systems · forever",
  description: "Builds useful things.",
  tags: ["systems"],
  avatar: "A",
  status: "online",
};

test("accepts a complete Ranger", () => {
  assert.deepEqual(validateRangers([ranger]), [ranger]);
});

test("accepts a Ranger without invented profile copy", () => {
  const minimal = {
    slug: "shea",
    name: "Shea",
    handle: "sheasilverman.com",
    url: "https://sheasilverman.com/",
    avatar: "S",
    status: "online",
  };
  assert.deepEqual(validateRangers([minimal]), [{ ...minimal, era: "", description: "", tags: [] }]);
});

test("rejects duplicate slugs", () => {
  assert.throws(() => validateRangers([ranger, { ...ranger, url: "https://second.example" }]), /duplicates/);
});

test("rejects non-web URLs", () => {
  assert.throws(() => validateRangers([{ ...ranger, url: "mailto:ada@example.com" }]), /http or https/);
});

test("accepts blank optional publishing links", () => {
  const site = validateSite({
    title: "Rangerverse",
    description: "A webring.",
    canonical_url: "https://ring.example",
    cname: "ring.example",
    repository_url: "",
    submission_url: "",
    eyebrow: "Forever beta",
    footer_note: "Internet forever",
    ticker: ["{count} connected"],
  });
  assert.equal(site.submission_url, "");
});
