import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDir = path.resolve(__dirname, "..");
const file = path.join(frontendDir, "dist", "index.html");

let html = fs.readFileSync(file, "utf8");

const hasGuides = html.includes('href="/guides/"');
const hasAbout = html.includes('href="/about/"');

if (hasGuides && hasAbout) {
  console.log("Public navigation already present in prerendered homepage.");
  process.exit(0);
}

const marker =
  /(<h1[^>]*>\s*Find Exceptional Homes Around The World\s*<\/h1>)/i;

if (!marker.test(html)) {
  console.error("ERROR: Homepage H1 marker not found.");
  process.exit(1);
}

const navigation = `
<nav aria-label="Explore PropertyNestHomes" class="mt-6 flex flex-wrap gap-4 text-sm">
  <a href="/buy/" class="underline">Browse Properties</a>
  <a href="/guides/" class="underline">Property Guides</a>
  <a href="/about/" class="underline">About PropertyNestHomes</a>
</nav>`;

html = html.replace(marker, `$1${navigation}`);

fs.writeFileSync(file, html);
console.log("Added prerendered public navigation to homepage.");
