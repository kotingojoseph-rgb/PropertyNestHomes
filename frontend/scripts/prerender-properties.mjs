import fs from "node:fs/promises";
import path from "node:path";

const DIST_DIR = path.resolve(import.meta.dirname, "..", "dist");
const TEMPLATE_FILE = path.join(DIST_DIR, "index.html");

const API_URL =
  process.env.VITE_API_URL ||
  "https://api.propertynesthomes.com";

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
          <p><strong>Status:</strong> ${escapeHtml(property.status || "Available")}</p>
          ${areaHtml}
          ${garageHtml}
          ${yearBuiltHtml}
        </section>

        <section>
          <h2>About This Property</h2>
          <p>${description}</p>
          <p>
            This ${type.toLowerCase()} is located in ${location}.
            The property has ${bedrooms} bedrooms and ${bathrooms}
            bathrooms and is currently listed as
            ${escapeHtml(property.status || "Available").toLowerCase()}.
            The listing price is ${price}.
          </p>
        </section>

        <section>
          <h2>Key Property Facts</h2>
          <ul>
            <li><strong>Property type:</strong> ${type}</li>
            <li><strong>Bedrooms:</strong> ${bedrooms}</li>
            <li><strong>Bathrooms:</strong> ${bathrooms}</li>
            <li><strong>Status:</strong> ${escapeHtml(property.status || "Available")}</li>
            ${area ? `<li><strong>Area:</strong> ${area}</li>` : ""}
            ${garage ? `<li><strong>Garage / Parking:</strong> ${garage}</li>` : ""}
            ${yearBuilt ? `<li><strong>Year built:</strong> ${yearBuilt}</li>` : ""}
          </ul>
        </section>

        <section>
          <h2>Location and Listing Information</h2>
          <p>
            <strong>Location:</strong> ${location}
          </p>
          <p>
            <strong>Country:</strong>
            ${escapeHtml(property.country || "Not specified")}
          </p>
          ${property.address
            ? `<p><strong>Address:</strong> ${escapeHtml(property.address)}</p>`
            : ""}
          ${property.postal_code
            ? `<p><strong>Postal code:</strong> ${escapeHtml(property.postal_code)}</p>`
            : ""}
          <p><strong>Listing price:</strong> ${price}</p>
          <p>
            <strong>Verification:</strong>
            ${escapeHtml(property.verification_status || "Verified")}
          </p>
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

    const propertyUrl =
      `https://propertynesthomes.com/property/${property.id}`;

    const propertyImage =
      property.cover_image ||
      property.image ||
      "";

    const structuredData = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": `${propertyUrl}#webpage`,
      "url": propertyUrl,
      "name": pageTitle,
      "description": metaDescription
    };

    if (propertyImage) {
      structuredData.primaryImageOfPage = {
        "@type": "ImageObject",
        "url": propertyImage,
        "contentUrl": propertyImage,
        "caption": pageTitle
      };
    }

    const structuredDataJson =
      JSON.stringify(structuredData).replace(/</g, "\\u003c");

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
      /<link\b[^>]*\brel=["']canonical["'][^>]*>/is,
      `<link rel="canonical" href="${propertyUrl}">`
    );

    html = html.replace(
      /<div id="root">[\s\S]*?<\/div>/i,
      `<div id="root">${publicPropertyHtml(property)}</div>`
    );

    html = html.replace(
      /<meta\s+property=["']og:title["'][^>]*>/i,
      `<meta property="og:title" content="${escapeHtml(pageTitle)}">`
    );

    html = html.replace(
      /<meta\s+property=["']og:description["'][^>]*>/i,
      `<meta property="og:description" content="${escapeHtml(metaDescription)}">`
    );

    html = html.replace(
      /<meta\s+property=["']og:url["'][^>]*>/i,
      `<meta property="og:url" content="${propertyUrl}">`
    );

    html = html.replace(
      /<meta\s+property=["']og:image["'][^>]*>/i,
      propertyImage
        ? `<meta property="og:image" content="${escapeHtml(propertyImage)}">`
        : ""
    );

    html = html.replace(
      /<meta\s+property=["']og:image:alt["'][^>]*>/i,
      propertyImage
        ? `<meta property="og:image:alt" content="${escapeHtml(pageTitle)}">`
        : ""
    );

    html = html.replace(
      /<meta\s+name=["']twitter:title["'][^>]*>/i,
      `<meta name="twitter:title" content="${escapeHtml(pageTitle)}">`
    );

    html = html.replace(
      /<meta\s+name=["']twitter:description["'][^>]*>/i,
      `<meta name="twitter:description" content="${escapeHtml(metaDescription)}">`
    );

    html = html.replace(
      /<meta\s+name=["']twitter:image["'][^>]*>/i,
      propertyImage
        ? `<meta name="twitter:image" content="${escapeHtml(propertyImage)}">`
        : ""
    );

    html = html.replace(
      /<meta\s+name=["']twitter:image:alt["'][^>]*>/i,
      propertyImage
        ? `<meta name="twitter:image:alt" content="${escapeHtml(pageTitle)}">`
        : ""
    );

    html = html.replace(
      /<script\s+type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/i,
      `<script type="application/ld+json">${structuredDataJson}</script>`
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
