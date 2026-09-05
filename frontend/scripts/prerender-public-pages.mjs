import fs from "node:fs/promises";
import path from "node:path";

const DIST_DIR = path.resolve(import.meta.dirname, "..", "dist");
const TEMPLATE_FILE = path.join(DIST_DIR, "index.html");

const PAGES = [
  {
    route: "/",
    title: "PropertyNestHomes | Buy, Sell & Discover Properties",
    description:
      "Discover homes, apartments, villas, and investment properties from trusted sellers and agents on PropertyNestHomes.",
    content: `
      <main>
        <article>
          <header>
            <p>PropertyNestHomes • Global Real Estate Marketplace</p>
            <h1>Find Exceptional Homes Around The World</h1>
            <p>
              Discover luxury homes, apartments, villas, and investment
              properties from trusted sellers.
            </p>
          </header>

          <section>
            <h2>Find Your Dream Property</h2>
            <p>
              Explore verified homes, apartments, villas, duplexes,
              and investment properties worldwide.
            </p>
            <p>
              <a href="/buy">Explore Properties</a>
              |
              <a href="/contact">Contact an Expert</a>
            </p>
          </section>

          <section>
            <h2>Why Choose PropertyNestHomes?</h2>
            <ul>
              <li>Verified Property Listings</li>
              <li>Trusted Sellers &amp; Agents</li>
              <li>Secure Property Discovery</li>
              <li>Local &amp; International Homes</li>
            </ul>
          </section>

          <section>
            <h2>Featured Properties</h2>
            <p>
              Explore verified homes and properties from trusted sellers
              and agents.
            </p>
            <p>
              <a href="/buy">View All Properties</a>
            </p>
          </section>
        </article>
      </main>
    `,
  },

  {
    route: "/buy",
    title: "Buy Properties | PropertyNestHomes",
    description:
      "Explore homes, apartments, villas, duplexes, and investment properties available for sale on PropertyNestHomes.",
    content: `
      <main>
        <article>
          <header>
            <h1>Find Your Dream Property</h1>
            <p>
              Explore premium homes, apartments, villas, duplexes,
              and investment properties worldwide.
            </p>
          </header>

          <section>
            <h2>Properties for Sale</h2>
            <p>
              Browse property listings from sellers, landlords, and
              real estate professionals on PropertyNestHomes.
            </p>
            <p>
              Property listings include residential homes, apartments,
              villas, duplexes, condos, and other real estate opportunities.
            </p>
          </section>

          <nav aria-label="Property navigation">
            <a href="/">Home</a> |
            <a href="/about">About PropertyNestHomes</a> |
            <a href="/contact">Contact Us</a>
          </nav>
        </article>
      </main>
    `,
  },

  {
    route: "/about",
    title: "About PropertyNestHomes | Global Real Estate Marketplace",
    description:
      "Learn about PropertyNestHomes, a modern real estate platform connecting buyers, sellers, landlords, investors, and trusted professionals.",
    content: `
      <main>
        <article>
          <header>
            <h1>About PropertyNestHomes</h1>
            <p>
              PropertyNestHomes is a modern real estate platform connecting
              buyers, sellers, landlords, investors, and trusted real estate
              professionals across the world.
            </p>
          </header>

          <section>
            <h2>Our Mission</h2>
            <p>
              Our mission is to make buying, selling, investing in,
              and managing properties simple, secure, transparent,
              and accessible.
            </p>
          </section>

          <section>
            <h2>Why Choose PropertyNestHomes?</h2>
            <ul>
              <li>
                <strong>Verified Property Listings:</strong>
                Discover property opportunities with a focus on trustworthy
                and useful listing information.
              </li>
              <li>
                <strong>Trusted Real Estate Professionals:</strong>
                Connect with sellers, landlords, agents, and other
                property professionals.
              </li>
              <li>
                <strong>Worldwide Property Listings:</strong>
                Explore real estate opportunities across local and
                international markets.
              </li>
              <li>
                <strong>Secure Property Transactions:</strong>
                PropertyNestHomes is designed to support secure and
                transparent property discovery and transactions.
              </li>
            </ul>
          </section>

          <p>
            <a href="/buy">Explore Properties</a>
            |
            <a href="/contact">Contact PropertyNestHomes</a>
          </p>
        </article>
      </main>
    `,
  },

  {
    route: "/contact",
    title: "Contact PropertyNestHomes | Real Estate Support",
    description:
      "Contact PropertyNestHomes for help with buying, selling, investing, property listings, and real estate questions.",
    content: `
      <main>
        <article>
          <header>
            <h1>Contact PropertyNestHomes</h1>
            <p>
              We'd love to hear from you. Whether you're buying, selling,
              investing, or just have a question, our team is here to help.
            </p>
          </header>

          <section>
            <h2>Get in Touch</h2>
            <p>
              <strong>Email:</strong>
              <a href="mailto:Propertynesthomes.app@gmail.com">
                Propertynesthomes.app@gmail.com
              </a>
            </p>
            <p>
              <strong>Phone:</strong>
              +234 906 893 6306
            </p>
            <p>
              <strong>Office:</strong>
              Lagos, Nigeria
            </p>
          </section>

          <section>
            <h2>How We Can Help</h2>
            <ul>
              <li>Buying and finding properties</li>
              <li>Selling and listing properties</li>
              <li>Real estate investment questions</li>
              <li>PropertyNestHomes account and platform support</li>
            </ul>
          </section>

          <p>
            <a href="/buy">Browse Properties</a>
            |
            <a href="/">Return Home</a>
          </p>
        </article>
      </main>
    `,
  },

  {
    route: "/privacy-policy",
    title: "Privacy Policy | PropertyNestHomes",
    description:
      "Read the PropertyNestHomes Privacy Policy covering information collection, property listings, advertising, cookies, security, and user choices.",
    content: `
      <main>
        <article>
          <header>
            <h1>Privacy Policy</h1>
            <p>Last updated: September 4, 2026</p>
          </header>

          <section>
            <h2>1. Introduction</h2>
            <p>
              PropertyNestHomes respects your privacy and is committed
              to protecting information provided when you use our platform.
            </p>
          </section>

          <section>
            <h2>2. Information We Collect</h2>
            <p>
              We may collect account information, property listing information,
              contact information, usage information, and technical information
              needed to operate and improve the service.
            </p>
          </section>

          <section>
            <h2>3. How We Use Information</h2>
            <p>
              Information may be used to provide platform services, manage
              accounts, process transactions, communicate with users,
              improve our services, maintain security, and comply with
              applicable requirements.
            </p>
          </section>

          <section>
            <h2>4. Property Listings</h2>
            <p>
              Information submitted as part of a public property listing
              may be displayed to other users and visitors of the platform.
            </p>
          </section>

          <section>
            <h2>5. Cookies and Similar Technologies</h2>
            <p>
              PropertyNestHomes may use cookies and similar technologies
              to support functionality, preferences, analytics, security,
              and advertising.
            </p>
          </section>

          <section>
            <h2>6. Advertising</h2>
            <p>
              We may display advertising through third-party advertising
              services, including Google AdSense. Advertising providers
              may use cookies or similar technologies subject to their
              own policies.
            </p>
          </section>

          <section>
            <h2>7. Third-Party Services</h2>
            <p>
              Our platform may integrate with third-party services for
              payments, hosting, communications, analytics, advertising,
              authentication, and other functionality.
            </p>
          </section>

          <section>
            <h2>8. Data Security</h2>
            <p>
              We use reasonable technical and organizational measures
              designed to protect information against unauthorized access,
              loss, misuse, or disclosure.
            </p>
          </section>

          <section>
            <h2>9. Your Choices</h2>
            <p>
              Depending on the service and applicable law, users may have
              choices regarding account information, communications,
              cookies, and certain personal information.
            </p>
          </section>

          <section>
            <h2>10. Children's Privacy</h2>
            <p>
              PropertyNestHomes is not intended for children who are below
              the applicable legal age to use the service.
            </p>
          </section>

          <section>
            <h2>11. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time.
              Updated versions will be published on this page.
            </p>
          </section>

          <section>
            <h2>12. Contact Us</h2>
            <p>
              For privacy questions, contact
              <a href="mailto:Propertynesthomes.app@gmail.com">
                Propertynesthomes.app@gmail.com
              </a>.
            </p>
          </section>

          <p>
            <a href="/">Return to PropertyNestHomes</a>
          </p>
        </article>
      </main>
    `,
  },

  {
    route: "/terms",
    title: "Terms of Service | PropertyNestHomes",
    description:
      "Read the PropertyNestHomes Terms of Service covering accounts, property listings, payments, investments, communications, and platform use.",
    content: `
      <main>
        <article>
          <header>
            <h1>Terms of Service</h1>
            <p>Last updated: September 4, 2026</p>
          </header>

          <section>
            <h2>1. Acceptance</h2>
            <p>
              By accessing or using PropertyNestHomes, you agree to
              these Terms of Service and applicable laws and regulations.
            </p>
          </section>

          <section>
            <h2>2. About PropertyNestHomes</h2>
            <p>
              PropertyNestHomes provides an online platform for discovering
              properties and connecting buyers, sellers, landlords,
              investors, tenants, and real estate professionals.
            </p>
          </section>

          <section>
            <h2>3. User Accounts</h2>
            <p>
              Users are responsible for maintaining accurate account
              information and protecting their login credentials.
            </p>
          </section>

          <section>
            <h2>4. Property Listings</h2>
            <p>
              Users who submit property listings are responsible for ensuring
              that listing information is accurate, lawful, and not misleading.
            </p>
          </section>

          <section>
            <h2>5. Property Information</h2>
            <p>
              PropertyNestHomes provides a platform for property information.
              Users should independently verify important property details,
              ownership, legal status, pricing, and other transaction
              information before making decisions.
            </p>
          </section>

          <section>
            <h2>6. Investments and Payments</h2>
            <p>
              Where investment or payment functionality is provided,
              transactions may be subject to additional terms, payment
              provider requirements, verification procedures, and applicable
              laws.
            </p>
          </section>

          <section>
            <h2>7. Prohibited Activities</h2>
            <p>
              Users may not use the platform for unlawful activities,
              fraud, abuse, unauthorized access, misleading listings,
              or activities that compromise the security or operation
              of PropertyNestHomes.
            </p>
          </section>

          <section>
            <h2>8. Communications</h2>
            <p>
              Users may communicate through platform features where available.
              Users are responsible for the content of communications they send.
            </p>
          </section>

          <section>
            <h2>9. Intellectual Property</h2>
            <p>
              Platform software, branding, design, and other original
              materials may be protected by applicable intellectual property
              laws.
            </p>
          </section>

          <section>
            <h2>10. Third-Party Services and Links</h2>
            <p>
              PropertyNestHomes may use or link to third-party services.
              Third-party services are governed by their own terms and policies.
            </p>
          </section>

          <section>
            <h2>11. Availability</h2>
            <p>
              We aim to keep the platform available and reliable but do not
              guarantee uninterrupted or error-free operation.
            </p>
          </section>

          <section>
            <h2>12. Changes</h2>
            <p>
              These Terms may be updated from time to time. Continued use
              of the platform after changes are published may constitute
              acceptance of the updated terms.
            </p>
          </section>

          <section>
            <h2>13. Contact</h2>
            <p>
              For questions about these Terms, contact
              <a href="mailto:Propertynesthomes.app@gmail.com">
                Propertynesthomes.app@gmail.com
              </a>.
            </p>
          </section>

          <p>
            <a href="/">Return to PropertyNestHomes</a>
          </p>
        </article>
      </main>
    `,
  },
];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value);
}

function buildPageHtml(template, page) {
  const canonicalUrl =
    `https://propertynesthomes.com${page.route === "/" ? "/" : page.route}`;

  let html = template;

  html = html.replace(
    /<title>[\s\S]*?<\/title>/i,
    `<title>${escapeHtml(page.title)}</title>`
  );

  html = html.replace(
    /<meta name="description"[^>]*>/i,
    `<meta name="description" content="${escapeAttribute(page.description)}">`
  );

  html = html.replace(
    /<link rel="canonical"[^>]*>/i,
    `<link rel="canonical" href="${canonicalUrl}">`
  );

  html = html.replace(
    /<meta property="og:title"[^>]*>/i,
    `<meta property="og:title" content="${escapeAttribute(page.title)}">`
  );

  html = html.replace(
    /<meta property="og:description"[^>]*>/i,
    `<meta property="og:description" content="${escapeAttribute(page.description)}">`
  );

  html = html.replace(
    /<meta property="og:url"[^>]*>/i,
    `<meta property="og:url" content="${canonicalUrl}">`
  );

  html = html.replace(
    /<meta name="twitter:title"[^>]*>/i,
    `<meta name="twitter:title" content="${escapeAttribute(page.title)}">`
  );

  html = html.replace(
    /<meta name="twitter:description"[^>]*>/i,
    `<meta name="twitter:description" content="${escapeAttribute(page.description)}">`
  );

  html = html.replace(
    /<div id="root">[\s\S]*?<\/div>/i,
    `<div id="root">${page.content}</div>`
  );

  return html;
}

async function main() {
  console.log("========== PUBLIC PAGE PRERENDER ==========");

  const template = await fs.readFile(
    TEMPLATE_FILE,
    "utf8"
  );

  for (const page of PAGES) {
    const html = buildPageHtml(template, page);

    const directory =
      page.route === "/"
        ? DIST_DIR
        : path.join(
            DIST_DIR,
            page.route.replace(/^\/+/, "")
          );

    await fs.mkdir(directory, {
      recursive: true,
    });

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
      `Generated ${page.route === "/" ? "/index.html" : `${page.route}/index.html`}`
    );
  }

  console.log("========== PUBLIC PAGE PRERENDER COMPLETE ==========");
}

main().catch((error) => {
  console.error(
    "Public page prerender failed:",
    error
  );
  process.exit(1);
});
