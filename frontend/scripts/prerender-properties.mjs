import fs from "node:fs/promises";
import path from "node:path";

const DIST_DIR = path.resolve(import.meta.dirname, "..", "dist");
const TEMPLATE_FILE = path.join(DIST_DIR, "index.html");

const API_URL =
  process.env.VITE_API_URL ||
  "https://propertynesthomes.onrender.com";

const PROPERTIES_URL = `${API_URL}/api/properties`;

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function locationText(property) {
  return [
    property.city,
    property.state_province,
    property.country,
  ]
    .filter(Boolean)
    .join(", ") ||
    property.location ||
    "Location unavailable";
}

function formatPrice(property) {
  const currency = property.currency || "NGN";
  const price = Number(property.price || 0);

  return `${currency} ${price.toLocaleString("en-US")}`;
}

function propertyDescription(property) {
  return [
    property.description,
    property.property_type
      ? `Property type: ${property.property_type}.`
      : "",
    property.bedrooms != null
      ? `Bedrooms: ${property.bedrooms}.`
      : "",
    property.bathrooms != null
      ? `Bathrooms: ${property.bathrooms}.`
      : "",
    property.area
      ? `Area: ${property.area}.`
      : "",
    property.garage
      ? `Garage / parking: ${property.garage}.`
      : "",
    property.year_built
      ? `Year built: ${property.year_built}.`
      : "",
  ]
    .filter(Boolean)
    .join(" ")
    .slice(0, 160);
}

function publicPropertyHtml(property) {
  const title = escapeHtml(
    property.title || "Property Listing"
  );

  const location = escapeHtml(locationText(property));
  const price = escapeHtml(formatPrice(property));
  const description = escapeHtml(
    property.description ||
      "View this verified property listing on PropertyNestHomes."
  );

  const type = escapeHtml(
    property.property_type || "Property"
  );

  const bedrooms =
    property.bedrooms != null
      ? escapeHtml(property.bedrooms)
      : "Not specified";

  const bathrooms =
    property.bathrooms != null
      ? escapeHtml(property.bathrooms)
      : "Not specified";

  const area = property.area
    ? escapeHtml(property.area)
    : "";

  const garage = property.garage
    ? escapeHtml(property.garage)
    : "";

  const yearBuilt = property.year_built
    ? escapeHtml(property.year_built)
    : "";

  const propertyUrl =
    `https://propertynesthomes.com/property/${property.id}`;

  const imageUrl =
    property.cover_image ||
    property.image ||
    "";

  const imageMeta = imageUrl
    ? `<meta property="og:image" content="${escapeHtml(imageUrl)}">`
    : "";

  const areaHtml = area
    ? `<p><strong>Area:</strong> ${area}</p>`
    : "";

  const garageHtml = garage
    ? `<p><strong>Garage / Parking:</strong> ${garage}</p>`
    : "";

  const yearBuiltHtml = yearBuilt
    ? `<p><strong>Year Built:</strong> ${yearBuilt}</p>`
    : "";

  return `
    <main>
      <article>
        <header>
          <p>PropertyNestHomes — Verified Property</p>
          <h1>${title}</h1>
          <p><strong>Location:</strong> ${location}</p>
          <p><strong>Price:</strong> ${price}</p>
        </header>

        <section>
          <h2>Property Details</h2>
          <p><strong>Type:</strong> ${type}</p>
          <p><strong>Bedrooms:</strong> ${bedrooms}</p>
          <p><strong>Bathrooms:</strong> ${bathrooms}</p>
          ${areaHtml}
          ${garageHtml}
          ${yearBuiltHtml}
        </section>

        <section>
          <h2>Description</h2>
          <p>${description}</p>
        </section>

        <p>
          <a href="${propertyUrl}">
            View this property on PropertyNestHomes
          </a>
        </p>
      </article>
    </main>
  `;
}

async function fetchProperties() {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(
        `Fetching public properties (attempt ${attempt}/3)...`
      );

      const response = await fetch(PROPERTIES_URL, {
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `API returned HTTP ${response.status}`
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        throw new Error(
          "Public properties API did not return an array."
        );
      }

      return data;
    } catch (error) {
      lastError = error;
      console.warn(
        `Property API attempt ${attempt} failed: ${error.message}`
      );

      if (attempt < 3) {
        await new Promise((resolve) =>
          setTimeout(resolve, 3000)
        );
      }
    }
  }

  throw lastError;
}

async function main() {
  console.log("========== PROPERTY PRERENDER ==========");

  const template = await fs.readFile(
    TEMPLATE_FILE,
    "utf8"
  );

  const properties = await fetchProperties();

  const verifiedProperties = properties.filter(
    (property) =>
      String(
        property.verification_status || ""
      ).toLowerCase() === "verified"
  );

  console.log(
    `Public properties returned: ${properties.length}`
  );

  console.log(
    `Verified properties to prerender: ${verifiedProperties.length}`
  );

  if (verifiedProperties.length === 0) {
    throw new Error(
      "No verified public properties were returned. Aborting build so an empty prerender deployment cannot occur."
    );
  }

  for (const property of verifiedProperties) {
    if (!property.id) {
      console.warn(
        "Skipping property without an ID."
      );
      continue;
    }

    const directory = path.join(
      DIST_DIR,
      "property",
      String(property.id)
    );

    await fs.mkdir(directory, {
      recursive: true,
    });

    const location = locationText(property);

    const pageTitle =
      `${property.title || "Property"} | ${location} | PropertyNestHomes`;

    const metaDescription =
      propertyDescription(property);

    let html = template;

    html = html.replace(
      /<title>[\s\S]*?<\/title>/i,
      `<title>${escapeHtml(pageTitle)}</title>`
    );

    html = html.replace(
      /<meta name="description"[^>]*>/i,
      `<meta name="description" content="${escapeHtml(metaDescription)}">`
    );

    html = html.replace(
      /<link rel="canonical"[^>]*>/i,
      `<link rel="canonical" href="https://propertynesthomes.com/property/${property.id}">`
    );

    html = html.replace(
      /<div id="root">[\s\S]*?<\/div>/i,
      `<div id="root">${publicPropertyHtml(property)}</div>`
    );

    html = html.replace(
      "</head>",
      `
        <meta property="og:title" content="${escapeHtml(pageTitle)}">
        <meta property="og:description" content="${escapeHtml(metaDescription)}">
        <meta property="og:url" content="https://propertynesthomes.com/property/${property.id}">
        ${property.cover_image || property.image
          ? `<meta property="og:image" content="${escapeHtml(property.cover_image || property.image)}">`
          : ""}
      </head>`
    );

    const outputFile = path.join(
      directory,
      "index.html"
    );

    await fs.writeFile(
      outputFile,
      html,
      "utf8"
    );

    console.log(
      `Generated /property/${property.id}/index.html`
    );
  }

  console.log(
    "========== PROPERTY PRERENDER COMPLETE =========="
  );
}

main().catch((error) => {
  console.error(
    "Property prerender failed:",
    error
  );
  process.exit(1);
});
