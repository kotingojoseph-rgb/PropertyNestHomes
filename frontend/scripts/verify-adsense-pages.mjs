import fs from "node:fs/promises";
import path from "node:path";

const DIST = path.resolve(import.meta.dirname, "../dist");

const pages = [
  "index.html",
  "buy/index.html",
  "about/index.html",
  "contact/index.html",
  "privacy-policy/index.html",
  "terms/index.html",
  "guides/index.html",
  "guides/buying-property-in-nigeria/index.html",
  "guides/property-due-diligence-before-paying/index.html",
  "guides/how-to-evaluate-a-property-listing/index.html",
  "guides/renting-a-home-in-nigeria/index.html",
  "guides/selling-a-property-online/index.html"
];

const failures = [];

for (const page of pages) {
  const file = path.join(DIST, page);

  try {
    const html = await fs.readFile(file, "utf8");

    if (!/<h1\b/i.test(html)) {
      failures.push(`${page}: missing H1`);
    }

    if (!/<meta\s+name=["']description["']/i.test(html)) {
      failures.push(`${page}: missing description`);
    }

    if (!/<link\s+rel=["']canonical["']/i.test(html)) {
      failures.push(`${page}: missing canonical`);
    }
  } catch {
    failures.push(`${page}: missing file`);
  }
}

for (const file of ["ads.txt", "robots.txt", "sitemap.xml"]) {
  try {
    await fs.access(path.join(DIST, file));
  } catch {
    failures.push(`${file}: missing from dist`);
  }
}

const index = await fs.readFile(path.join(DIST, "index.html"), "utf8");

if (!index.includes("ca-pub-4686348742499073")) {
  failures.push("index.html: AdSense publisher ID missing");
}

if (!index.includes("adsbygoogle.js")) {
  failures.push("index.html: AdSense script missing");
}

if (failures.length) {
  console.error("AdSense readiness verification FAILED");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("AdSense readiness verification PASSED");
