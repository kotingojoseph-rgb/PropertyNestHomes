import fs from "node:fs/promises";
import path from "node:path";
import { GUIDES } from "../src/content/guides.js";

const DIST = path.resolve(import.meta.dirname, "../dist");
const SITE = "https://propertynesthomes.com";

const esc = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

function content(guide) {
  return `
    <main>
      <article>
        <nav aria-label="Guide navigation">
          <a href="/guides">Property Guides</a>
        </nav>

        <header>
          <p>PropertyNestHomes Guide</p>
          <h1>${esc(guide.title)}</h1>
          <p>${esc(guide.intro)}</p>
        </header>

        ${guide.sections.map((section) => `
          <section>
            <h2>${esc(section.heading)}</h2>
            ${section.paragraphs.map((paragraph) =>
              `<p>${esc(paragraph)}</p>`
            ).join("")}
          </section>
        `).join("")}

        <section>
          <h2>Before you commit</h2>
          <p>
            PropertyNestHomes is a property discovery and communication
            platform. Always confirm current listing information and
            independently verify important ownership, legal, financial,
            inspection, and transaction details.
          </p>
        </section>

        <nav aria-label="Property navigation">
          <a href="/buy">Browse properties</a> |
          <a href="/contact">Contact PropertyNestHomes</a>
        </nav>
      </article>
    </main>
  `;
}

function replaceMeta(html, guide) {
  const canonical = `${SITE}/guides/${guide.slug}/`;

  html = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${esc(guide.title)} | PropertyNestHomes</title>`
  );

  html = html.replace(
    /<meta name="description"[^>]*>/i,
    `<meta name="description" content="${esc(guide.description)}">`
  );

  html = html.replace(
    /<link rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${canonical}">`
  );

  return html.replace(
    /<div id="root">[\s\S]*?<\/div>/i,
    `<div id="root">${content(guide)}</div>`
  );
}

async function main() {
  const template = await fs.readFile(path.join(DIST, "index.html"), "utf8");

  for (const guide of GUIDES) {
    const dir = path.join(DIST, "guides", guide.slug);
    await fs.mkdir(dir, { recursive: true });

    await fs.writeFile(
      path.join(dir, "index.html"),
      replaceMeta(template, guide),
      "utf8"
    );
  }

  const hubDir = path.join(DIST, "guides");
  await fs.mkdir(hubDir, { recursive: true });

  const hub = `
    <main>
      <article>
        <header>
          <p>PropertyNestHomes Guides</p>
          <h1>Practical property guides for buyers, renters, and sellers</h1>
          <p>
            Practical guides for researching property, comparing listings,
            inspecting properties, and making informed property decisions.
          </p>
        </header>

        ${GUIDES.map((guide) => `
          <section>
            <h2>
              <a href="/guides/${guide.slug}/">${esc(guide.title)}</a>
            </h2>
            <p>${esc(guide.description)}</p>
          </section>
        `).join("")}

        <nav>
          <a href="/">Home</a> |
          <a href="/buy">Browse properties</a> |
          <a href="/contact">Contact PropertyNestHomes</a>
        </nav>
      </article>
    </main>
  `;

  let hubHtml = template
    .replace(
      /<title>[\s\S]*?<\/title>/i,
      "<title>Property Guides | PropertyNestHomes</title>"
    )
    .replace(
      /<meta name="description"[^>]*>/i,
      '<meta name="description" content="Practical PropertyNestHomes guides for buying, renting, selling, and evaluating property listings.">'
    )
    .replace(
      /<link rel="canonical"[^>]*>/i,
      '<link rel="canonical" href="https://propertynesthomes.com/guides/">'
    )
    .replace(
      /<div id="root">[\s\S]*?<\/div>/i,
      `<div id="root">${hub}</div>`
    );

  await fs.writeFile(
    path.join(hubDir, "index.html"),
    hubHtml,
    "utf8"
  );

  console.log(`Generated ${GUIDES.length} guide articles plus /guides/`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
