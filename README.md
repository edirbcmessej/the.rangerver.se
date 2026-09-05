# the rangerver.se

A hand-built Techrangers webring. The site is plain static HTML, CSS, and JavaScript; YAML is the source of truth, and GitHub Actions validates and publishes every change to `main`.

## Add a Ranger

Open [`data/rangers.yml`](data/rangers.yml), copy one complete block, and change its values:

```yml
- slug: ada
  name: Ada
  handle: "@ada"
  url: https://ada.example
  era: systems · 2026
  description: Notes, experiments, and useful little tools.
  tags: [systems, web, music]
  avatar: A
  status: online
```

`slug` is the member's permanent ring ID. It must be unique, lowercase, and use only letters, numbers, and hyphens. `status` can be `online`, `away`, `offline`, or `demo`.

That member puts this on their own site, replacing `ada` with their slug:

```html
<nav class="rangerverse">
  <a href="https://the.rangerver.se/prev?from=ada">← prev</a>
  <a href="https://the.rangerver.se/random?from=ada">✦ rangerverse</a>
  <a href="https://the.rangerver.se/next?from=ada">next →</a>
</nav>
```

The redirect pages also try to identify members from the referring domain, but `?from=slug` is explicit and more reliable.

## Change site copy or links

Edit [`data/site.yml`](data/site.yml). This controls the title, description, ticker, custom domain, submission link, and footer note.

Once this repo exists on GitHub, create a join link from the included issue form and put it in `submission_url`:

```yml
repository_url: https://github.com/YOUR-ACCOUNT/rangever.se
submission_url: https://github.com/YOUR-ACCOUNT/rangever.se/issues/new?template=join.yml
```

## Work locally

Requires Node.js 22 or newer.

```sh
npm install
npm run dev
```

Open <http://127.0.0.1:4173>. The site rebuilds when files in `data/`, `src/`, or `templates/` change.

Useful commands:

```sh
npm run check    # validate YAML and run tests
npm run build    # create the publishable dist/ directory
npm run preview  # serve the latest build
```

Never edit `dist/`; it is generated and intentionally ignored.

## Publish with GitHub Pages

1. Create a GitHub repo and push this project to its `main` branch.
2. In the repo, open **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. Push to `main` or run **Check and publish** from the Actions tab.

Pull requests run the same validation and build without publishing. Merges to `main` deploy automatically.

The default custom domain is `the.rangerver.se`. Add the DNS records GitHub shows under Pages settings, then enable **Enforce HTTPS** after the certificate is ready. If you want the normal `github.io` address instead, set `cname: ""` and change `canonical_url` in `data/site.yml`.

The workflow follows GitHub's current Pages artifact/deployment pattern, with build and deploy separated and the deploy job restricted to the `github-pages` environment. Dependabot checks the npm package and GitHub Actions versions weekly.

## Project map

```text
data/                 editable site and Ranger YAML
src/                  browser-facing HTML, CSS, and JavaScript
templates/            generated webring redirect page
scripts/              validation, build, and local preview tools
test/                 content validation tests
.github/workflows/    pull request checks and Pages publishing
dist/                 generated output (not committed)
```
