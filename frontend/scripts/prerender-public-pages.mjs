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

          <section>
            <p>How It Works</p>
            <h2>A practical way to explore real estate online</h2>
            <p>
              PropertyNestHomes brings public property listings and real estate
              communication into one place. Visitors can begin with a location,
              property type, budget, or other requirement, review available
              listings, and then open individual properties for more details.
            </p>
            <p>
              The information shown for a property can help you decide which
              listings deserve a closer look. When you are ready to ask
              questions, you can use the available contact and communication
              features to continue the conversation with the relevant property
              contact.
            </p>
          </section>

          <section>
            <h2>How to Use PropertyNestHomes</h2>

            <h3>1. Search</h3>
            <p>
              Start with the place and type of property you need. Compare
              available listings using information such as location, price,
              bedrooms, bathrooms, area, and listing status.
            </p>

            <h3>2. Review</h3>
            <p>
              Open a listing to review its description, available images,
              property details, and other information supplied with the
              listing. Look for the details that matter most to your decision.
            </p>

            <h3>3. Connect</h3>
            <p>
              Contact the appropriate property representative to ask
              questions, arrange the next step, and confirm information that
              may have changed since the listing was published.
            </p>
          </section>

          <section>
            <h2>Before You Make a Property Decision</h2>
            <p>
              Online listing information is a starting point for research, not
              a substitute for property due diligence. Before paying money or
              signing an agreement, confirm the current price and availability,
              inspect the property where appropriate, verify ownership and
              relevant documents, and obtain professional legal, financial,
              valuation, or inspection advice when needed.
            </p>
            <p>
              Sellers, landlords, and authorized representatives should keep
              their listing information accurate and current so visitors can
              make better-informed decisions.
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
      "Explore homes, apartments, villas, duplexes, rental properties, and other real estate listings on PropertyNestHomes.",
    content: `
      <main>
        <article>
          <header>
            <h1>Find Your Dream Property</h1>
            <p>
              Explore homes, apartments, villas, duplexes, rental properties,
              and other real estate listings available through PropertyNestHomes.
              Search by location or listing status to find properties that match
              what you are looking for.
            </p>
          </header>

          <section>
            <h2>Explore Property Listings</h2>
            <p>
              PropertyNestHomes helps buyers, renters, and property seekers
              compare available listings in one place. Each listing can provide
              information such as location, price, property type, bedrooms,
              bathrooms, area, availability, and other details supplied with
              the property.
            </p>
            <p>
              Open a property listing to review its available information,
              photographs, location details, and contact options. Where a
              property has been marked as verified on the platform, that status
              is displayed on the listing.
            </p>
          </section>

          <section>
            <h2>How to Evaluate a Property Listing</h2>
            <p>
              Finding a suitable property is only the first step. Before
              making a purchase, rental commitment, or investment decision,
              review the listing information carefully and ask the relevant
              property contact for any details that are important to you.
            </p>

            <h3>Review the Details</h3>
            <p>
              Compare the property's location, price, type, bedrooms,
              bathrooms, size, availability, photographs, and description.
              Make sure the information meets your requirements before
              arranging the next step.
            </p>

            <h3>Ask Questions</h3>
            <p>
              Contact the appropriate property contact when you need more
              information about ownership, availability, viewing arrangements,
              documents, pricing, fees, or other matters that are not fully
              covered by the listing.
            </p>

            <h3>Complete Your Due Diligence</h3>
            <p>
              PropertyNestHomes provides a platform for property discovery
              and connections. Users should independently verify important
              property, ownership, legal, financial, and transaction
              information before entering into an agreement or sending funds.
            </p>
          </section>

          <section>
            <h2>Buying or Renting With PropertyNestHomes</h2>
            <p>
              Whether you are looking for a home, rental property, investment
              opportunity, or another type of real estate, start by defining
              the location, property type, budget, and features that matter to
              you. Use the available search tools to narrow the listings, then
              review individual properties before contacting the relevant
              property contact.
            </p>
            <p>
              Property availability and listing information can change.
              Always confirm the current price, status, availability, and
              transaction requirements directly with the appropriate property
              contact before making a decision.
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
    content: `            <main>
              <section>
                <h1>Contact PropertyNestHomes</h1>
                <p>
                  We'd love to hear from you. Whether you're buying, selling,
                  investing, listing a property, or need help using the
                  platform, our team is available to help with your enquiry.
                </p>
              </section>

              <section>
                <h2>How We Can Help</h2>
                <p>
                  PropertyNestHomes helps visitors discover property listings
                  and connect with relevant property contacts. We can assist
                  with questions about the platform, account access, listings,
                  and general use of our real estate services.
                </p>
                <p>
                  For a property enquiry, include the listing title or property
                  ID, location, and the information you need. Providing clear
                  details helps us understand your request and respond more
                  efficiently.
                </p>
                <p>
                  For a technical problem, describe the page, feature, or
                  action that caused the issue and explain what happened. This
                  helps our support team investigate the problem.
                </p>
              </section>

              <section>
                <h2>Contact Information</h2>
                <p>
                  Email:
                  <a href="mailto:Propertynesthomes.app@gmail.com">
                    Propertynesthomes.app@gmail.com
                  </a>
                </p>
                <p>
                  Phone:
                  <a href="tel:+2349068936306">+234 906 893 6306</a>
                </p>
                <p>Office: Lagos, Nigeria</p>
              </section>

              <section>
                <h2>Before Making a Property Decision</h2>
                <p>
                  Property listings and availability can change. Before
                  sending money or entering an agreement, independently verify
                  the property's ownership, documents, current price,
                  availability, inspection findings, and transaction terms
                  with the relevant parties.
                </p>
                <p>
                  PropertyNestHomes is a property discovery and communication
                  platform. For important legal, financial, or ownership
                  matters, use qualified professional advice appropriate to
                  your circumstances.
                </p>
              </section>

              <p>
                You can also browse our
                <a href="/guides/">property guides</a>
                for practical information about buying, renting, selling, and
                evaluating property listings.
              </p>
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
              PropertyNestHomes and certain service providers may use
              cookies, web storage, pixels, or similar technologies to
              support website functionality, understand usage, improve the
              service, maintain security, and provide advertising where
              applicable. These technologies may be used by PropertyNestHomes
              and by third-party service providers operating on our behalf
              or providing services through the platform.
            </p>
          </section>

          <section>
            <h2>6. Advertising and Google Advertising Services</h2>
            <p>
              PropertyNestHomes may display advertisements provided by
              third-party advertising services, including Google AdSense.
              Third-party vendors, including Google, may use cookies or
              similar technologies to serve advertisements based on a user's
              prior visits to PropertyNestHomes or other websites.
            </p>
            <p>
              Google's use of advertising cookies enables Google and its
              partners to serve advertisements to users based on their visits
              to PropertyNestHomes and/or other websites on the Internet.
              Advertising may be personalized or non-personalized depending
              on applicable settings, consent, and legal requirements.
            </p>
            <p>
              Users may manage or opt out of personalized advertising through
              Google's Ads Settings. Users may also learn about additional
              choices for personalized advertising from participating
              third-party vendors and advertising networks through
              industry opt-out resources such as AboutAds.info.
            </p>
  <p className="mt-3">
    For more information about how Google uses information from sites and apps that use its
    services, please see{" "}
    <a
      href="https://policies.google.com/technologies/partner-sites"
      target="_blank"
      rel="noopener noreferrer"
      className="font-medium text-blue-700 underline"
    >
      How Google uses information from sites or apps that use its services
    </a>.
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
    `https://propertynesthomes.com${
      page.route === "/" ? "/" : `${page.route}/`
    }`;

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
    /<link\b[^>]*\brel=["\']canonical["\'][^>]*>/is,
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
    /<meta\b[^>]*\bproperty=["\']og:url["\'][^>]*>/is,
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
