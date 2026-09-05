import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const STATUS = new Set(["online", "away", "offline", "demo"]);

function fail(file, problems) {
  const detail = problems.map((problem) => `  - ${problem}`).join("\n");
  throw new Error(`${file} has ${problems.length} problem${problems.length === 1 ? "" : "s"}:\n${detail}`);
}

function text(value, location, problems, { max = 240, optional = false } = {}) {
  if (optional && (value === undefined || value === null || value === "")) return "";
  if (typeof value !== "string" || value.trim() === "") {
    problems.push(`${location} must be a non-empty string`);
    return "";
  }
  const clean = value.trim();
  if (clean.length > max) problems.push(`${location} must be ${max} characters or fewer`);
  return clean;
}

function webUrl(value, location, problems, { optional = false } = {}) {
  const clean = text(value, location, problems, { max: 500, optional });
  if (!clean) return "";
  try {
    const parsed = new URL(clean);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      problems.push(`${location} must use http or https`);
    }
  } catch {
    problems.push(`${location} must be a valid URL`);
  }
  return clean;
}

export function validateSite(value, file = "data/site.yml") {
  const problems = [];
  if (!value || Array.isArray(value) || typeof value !== "object") fail(file, ["root must be a mapping"]);

  const site = {
    title: text(value.title, "title", problems, { max: 100 }),
    description: text(value.description, "description", problems, { max: 240 }),
    canonical_url: webUrl(value.canonical_url, "canonical_url", problems),
    cname: text(value.cname, "cname", problems, { max: 253, optional: true }),
    repository_url: webUrl(value.repository_url, "repository_url", problems, { optional: true }),
    submission_url: webUrl(value.submission_url, "submission_url", problems, { optional: true }),
    eyebrow: text(value.eyebrow, "eyebrow", problems, { max: 80 }),
    footer_note: text(value.footer_note, "footer_note", problems, { max: 100 }),
    ticker: Array.isArray(value.ticker)
      ? value.ticker.map((item, index) => text(item, `ticker[${index}]`, problems, { max: 80 }))
      : [],
  };

  if (!Array.isArray(value.ticker) || value.ticker.length === 0) {
    problems.push("ticker must contain at least one item");
  }
  if (site.cname && !/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,62}$/i.test(site.cname)) {
    problems.push("cname must be a hostname without a protocol or path");
  }
  if (problems.length) fail(file, problems);
  return site;
}

export function validateRangers(value, file = "data/rangers.yml") {
  const problems = [];
  if (!Array.isArray(value)) fail(file, ["root must be a list"]);
  if (value.length === 0) problems.push("add at least one Ranger");

  const slugs = new Set();
  const urls = new Set();
  const rangers = value.map((entry, index) => {
    const at = `rangers[${index}]`;
    if (!entry || Array.isArray(entry) || typeof entry !== "object") {
      problems.push(`${at} must be a mapping`);
      return {};
    }

    const slug = text(entry.slug, `${at}.slug`, problems, { max: 50 });
    if (slug && !SLUG.test(slug)) problems.push(`${at}.slug must use lowercase letters, numbers, and single hyphens`);
    if (slug && slugs.has(slug)) problems.push(`${at}.slug duplicates "${slug}"`);
    slugs.add(slug);

    const url = webUrl(entry.url, `${at}.url`, problems);
    const normalizedUrl = url.replace(/\/$/, "").toLowerCase();
    if (normalizedUrl && urls.has(normalizedUrl)) problems.push(`${at}.url duplicates "${url}"`);
    urls.add(normalizedUrl);

    const tags = Array.isArray(entry.tags)
      ? entry.tags.map((tag, tagIndex) => text(tag, `${at}.tags[${tagIndex}]`, problems, { max: 24 }))
      : [];
    if (!Array.isArray(entry.tags) || entry.tags.length === 0 || entry.tags.length > 6) {
      problems.push(`${at}.tags must contain 1–6 tags`);
    }

    const status = text(entry.status, `${at}.status`, problems, { max: 10 });
    if (status && !STATUS.has(status)) problems.push(`${at}.status must be online, away, offline, or demo`);

    return {
      slug,
      name: text(entry.name, `${at}.name`, problems, { max: 60 }),
      handle: text(entry.handle, `${at}.handle`, problems, { max: 60 }),
      url,
      era: text(entry.era, `${at}.era`, problems, { max: 100 }),
      description: text(entry.description, `${at}.description`, problems, { max: 240 }),
      tags,
      avatar: text(entry.avatar, `${at}.avatar`, problems, { max: 8 }),
      status,
    };
  });

  if (problems.length) fail(file, problems);
  return rangers;
}

async function readYaml(root, relativePath) {
  const source = await readFile(path.join(root, relativePath), "utf8");
  try {
    return parse(source);
  } catch (error) {
    throw new Error(`${relativePath} is not valid YAML: ${error.message}`);
  }
}

export async function loadContent(root = process.cwd()) {
  const [siteValue, rangerValue] = await Promise.all([
    readYaml(root, "data/site.yml"),
    readYaml(root, "data/rangers.yml"),
  ]);
  return {
    site: validateSite(siteValue),
    rangers: validateRangers(rangerValue),
  };
}
