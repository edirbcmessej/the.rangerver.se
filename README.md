# the rangerver.se

A webring for pals. The site is plain static HTML, CSS, and JavaScript; YAML is the source of truth, and GitHub Actions validates and publishes every change to `main`.

## Add a Ranger

Use the signup form with your name, site URL, and an optional description. Ring controls are optional.

To add a Ranger directly, append this small entry to [`data/rangers.yml`](data/rangers.yml):

```yml
- slug: ada
  name: Ada
  url: https://ada.example
  description: Notes, experiments, and useful little tools.
```

Only `slug`, `name`, and `url` are required. `description` is optional. `slug` is the member's permanent ring ID. It must be unique, lowercase, and use only letters, numbers, and hyphens.

The avatar defaults to the first letter of the name, and status defaults to `online`. Existing optional profile fields remain supported: `handle`, `era`, `tags`, `avatar`, and `status` (`online`, `away`, `offline`, or `demo`). Only add profile copy that the Ranger supplied; never infer or invent personal descriptions or labels from their website.

Members can optionally put this on their own site, replacing `ada` with their slug:

```html
<nav class="rangerverse">
  <a href="https://the.rangerver.se/prev?from=ada">← prev</a>
  <a href="https://the.rangerver.se/random?from=ada">✦ rangerverse</a>
  <a href="https://the.rangerver.se/next?from=ada">next →</a>
</nav>
```

The redirect pages also try to identify members from the referring domain, but `?from=slug` is explicit and more reliable.

The dedicated portal at `https://the.rangerver.se/portal/` opens a random Ranger inside the full-screen browser. Link to a specific Ranger with their slug, for example `https://the.rangerver.se/portal/?ranger=ada`. Moving between Rangers keeps that URL synchronized.

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

The site publishes at `https://the.rangerver.se`, served by GitHub Pages via the `cname` setting in `data/site.yml`. Make sure the DNS records GitHub shows under Pages settings point here and that **Enforce HTTPS** stays enabled.

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
