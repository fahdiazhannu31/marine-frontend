import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { boats } from "./data/boats.js";
import "./App.css";
import Silk from "./components/Silk";
import AuthNavSlot from "./components/AuthNavSlot.jsx";

const whatsappUrl = "https://linktr.ee/namamarine";

const fleetCategories = ["All Fleet", "Passenger", "Private", "Luxury"];
const fleetItems = boats;

const menuItems = [
  { label: "Home", link: "/" },
  { label: "Our Yachts", link: "/fleet" },
  { label: "Packages", link: "/packages" },
  { label: "Destinations", link: "/destinations" },
  { label: "Experiences", link: "/experiences" },
  { label: "About Us", link: "/about" },
];

const collections = [
  {
    title: "Passenger Collection",
    label: "Passenger Boat",
    subtitle: "GROUP CHARTER & ISLAND TRANSFER",
    category: "Passenger",
    description:
      "Passenger boats for group trips, island transfers, company outings, and large family journeys across Kepulauan Seribu.",
    image: "/images/fleet/reguler/Passenger.png",
  },
  {
    title: "Private Collection",
    label: "Private Charter",
    subtitle: "INTIMATE ESCAPE & SUNSET CRUISE",
    category: "Private",
    description:
      "Private boats and yachts for intimate trips, sunset cruises, celebrations, and relaxed island escapes.",
    image: "/images/fleet/private/Private.png",
  },
  {
    title: "Luxury Collection",
    label: "Luxury Yacht",
    subtitle: "PREMIUM JOURNEY & REFINED MOMENTS",
    category: "Luxury",
    description:
      "Selected premium yachts for refined sea experiences, special occasions, and curated private moments.",
    image: "/images/fleet/luxury/Luxury.png",
  },
];

const worldCards = [
  {
    title: "PRIVATE CHARTER PLANNING",
    description:
      "Plan your sea journey based on travel date, number of guests, preferred route, and selected destination across Kepulauan Seribu.",
    image:
      "https://images.pexels.com/photos/163236/luxury-yacht-boat-speed-water-163236.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    title: "BOAT & YACHT SELECTION",
    description:
      "Choose from passenger boats, private boats, and luxury yachts arranged for group transfers, private escapes, and special occasions.",
    image:
      "https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
  {
    title: "DESTINATION EXPERIENCE",
    description:
      "Enjoy island hopping, sunset cruise, family trips, resort access, and private events with routes tailored to your journey.",
    image:
      "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=1200",
  },
];

const homeHighlights = [
  {
    date: "ROUTES",
    tag: "DESTINATION",
    title: "Coastal, South, West, and North island routes",
    link: "/destinations",
    image:
      "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=1100",
  },
  {
    date: "PRIVATE",
    tag: "EXPERIENCE",
    title: "Island hopping, sunset cruise, private event, and family journey",
    link: "/experiences",
    image:
      "https://images.pexels.com/photos/163236/luxury-yacht-boat-speed-water-163236.jpeg?auto=compress&cs=tinysrgb&w=1100",
  },
  {
    date: "MARINE",
    tag: "ECOSYSTEM",
    title: "Connected with island travel, resort access, and marine leisure",
    link: "/about",
    image:
      "https://images.pexels.com/photos/1268855/pexels-photo-1268855.jpeg?auto=compress&cs=tinysrgb&w=1100",
  },
  {
    date: "CHARTER",
    tag: "ENQUIRE",
    title: "Tell us your date, destination, and number of guests",
    link: "/contact",
    image:
      "https://images.pexels.com/photos/144634/pexels-photo-144634.jpeg?auto=compress&cs=tinysrgb&w=1100",
  },
];

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13" />
      <path d="m14 7 5 5-5 5" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.8" r="1" className="fill-icon" />
    </svg>
  );
}

function WhatsappIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 11.7a8 8 0 0 1-11.8 7l-4.2 1.1 1.1-4a8 8 0 1 1 14.9-4.1Z" />
      <path d="M9.1 8.2c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.6c.1.3 0 .5-.1.7l-.5.6c.6 1.1 1.4 1.9 2.6 2.5l.6-.7c.2-.2.4-.3.7-.2l1.5.7c.3.1.4.3.4.5 0 .4-.1 1.3-.5 1.7-.5.5-1.3.7-2.5.3-1.4-.4-3.2-1.5-4.6-3-1.4-1.5-2.1-2.9-2.3-4-.2-.8.1-1.3.3-1.7Z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="1.5" />
      <path d="m4 7 8 6 8-6" />
    </svg>
  );
}

function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [fleetMenuOpen, setFleetMenuOpen] = useState(false);
  const [fleetPanelCategory, setFleetPanelCategory] = useState("All Fleet");
  const [navScrolled, setNavScrolled] = useState(false);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState(0);
  const [activeFleetIndex, setActiveFleetIndex] = useState(0);

  const fleetPanelItems = useMemo(() => {
    if (fleetPanelCategory === "All Fleet") return fleetItems;
    return fleetItems.filter((item) => item.collection === fleetPanelCategory);
  }, [fleetPanelCategory]);

  const activeFleetItem =
    fleetPanelItems[activeFleetIndex] || fleetPanelItems[0] || fleetItems[0];

  useEffect(() => {
    setActiveFleetIndex(0);
  }, [fleetPanelCategory]);

  useEffect(() => {
    document.body.style.overflow = menuOpen || fleetMenuOpen ? "hidden" : "";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setFleetMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen, fleetMenuOpen]);

  useEffect(() => {
    const handleNavbarScroll = () => {
      setNavScrolled(window.scrollY > 120);
    };

    handleNavbarScroll();
    window.addEventListener("scroll", handleNavbarScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleNavbarScroll);
    };
  }, []);

  useEffect(() => {
    const revealSelector = [
      ".nama-hero-editorial",
      ".nama-world-section",
      ".nama-world-card",
      ".nama-creations-head",
      ".nama-creations-showcase",
      ".nama-collection-row article",
      ".nama-home-highlights-title",
      ".nama-home-highlights-image",
      ".nama-home-highlights-list a",
      ".nama-footer-grid",
      ".nama-footer-bottom",
    ].join(", ");

    const observedElements = Array.from(
      document.querySelectorAll(revealSelector),
    );

    observedElements.forEach((element, index) => {
      element.classList.add("scroll-reveal");
      element.dataset.reveal = "up";
      element.style.setProperty("--reveal-delay", `${(index % 3) * 90}ms`);
    });

    if (!("IntersectionObserver" in window)) {
      observedElements.forEach((element) => {
        element.classList.add("is-visible");
      });

      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle("is-visible", entry.isIntersecting);
        });
      },
      {
        threshold: 0.12,
        rootMargin: "0px 0px -8% 0px",
      },
    );

    observedElements.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, []);

  const closePanels = () => {
    setMenuOpen(false);
    setFleetMenuOpen(false);
  };

  const openFleetPanel = () => {
    setMenuOpen(false);
    setFleetMenuOpen(true);
  };

  return (
    <>
      <header
        className={`nama-header nama-header-minimal nama-smart-navbar ${
          navScrolled ? "nama-smart-navbar-scrolled" : ""
        }`}
      >
        <button
          className="nama-menu-trigger"
          type="button"
          aria-label="Open navigation menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <span className="nama-menu-lines" aria-hidden="true">
            <i></i>
            <i></i>
          </span>
          <span>Menu</span>
        </button>

        <div className="nama-navbar-center-stage">
          <Link
            className="nama-center-logo nama-navbar-default-logo"
            to="/"
            aria-label="NAMA Marine home"
          >
            <img
              className="nama-logo-image"
              src="/images/logo/nama-marine-logo.png"
              alt="NAMA Marine"
            />
          </Link>

          <div
            className="nama-navbar-breadcrumb"
            aria-label="Current page section"
          >
            <span>Private Charter</span>
            <i>•</i>
            <span>Kepulauan Seribu</span>
            <i>•</i>
            <span>Boat & Yacht</span>
          </div>
        </div>

        <nav className="nama-header-right-links" aria-label="Quick navigation">
          <div className="nama-navbar-right-stage">
            <div className="nama-navbar-right-default">
              <button
                className="nama-header-yachts-button"
                type="button"
                onClick={openFleetPanel}
              >
                Yachts
              </button>

              <Link to="/contact">Contacts</Link>
            </div>

            <a
              className="nama-navbar-enquire"
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
            >
              Enquire
            </a>
          </div>

          <AuthNavSlot />
        </nav>
      </header>

      <aside
        className={`nama-staggered-panel ${menuOpen ? "nama-staggered-panel-open" : ""}`}
        aria-hidden={!menuOpen}
      >
        <button
          className="nama-staggered-backdrop"
          type="button"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        ></button>

        <div className="nama-staggered-drawer">
          <div className="nama-staggered-top">
            <button
              className="nama-staggered-close"
              type="button"
              aria-label="Close menu"
              onClick={() => setMenuOpen(false)}
            >
              Close +
            </button>
          </div>

          <nav
            className="nama-staggered-navigation"
            aria-label="Main navigation"
          >
            {menuItems.map((item, index) => (
              <Link
                to={item.link}
                key={item.label}
                onClick={closePanels}
                style={{ "--menu-delay": `${index * 72}ms` }}
              >
                <span>{item.label}</span>
                <small>{String(index + 1).padStart(2, "0")}</small>
              </Link>
            ))}
          </nav>

          <div className="nama-staggered-socials">
            <p>Socials</p>

            <div>
              <a
                href="https://www.instagram.com/nama.marine/"
                target="_blank"
                rel="noreferrer"
              >
                Instagram
              </a>

              <a href={whatsappUrl} target="_blank" rel="noreferrer">
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </aside>

      <aside
        className={`fleet-panel nama-azimut-fleet-panel ${fleetMenuOpen ? "fleet-panel-open" : ""}`}
        aria-hidden={!fleetMenuOpen}
      >
        {/* BAGIAN TOP BAR: Tabs Kategori, Logo Tengah, dan Navigasi Kanan */}
        <div className="nama-azimut-fleet-top">
          <div className="nama-azimut-fleet-tabs">
            {fleetCategories.map((category) => (
              <button
                key={category}
                type="button"
                className={
                  fleetPanelCategory === category
                    ? "nama-azimut-tab-active"
                    : ""
                }
                onClick={() => {
                  setFleetPanelCategory(category);
                  setActiveFleetIndex(0);
                }}
              >
                {category === "All Fleet" ? "The Fleet" : category}
              </button>
            ))}
          </div>

          <Link className="nama-azimut-fleet-logo" to="/" onClick={closePanels}>
            <img
              className="nama-logo-img"
              src="/images/logo/nama-marine-logo.png"
              alt="NAMA Marine"
            />
          </Link>

          <div className="nama-azimut-fleet-right">
            <Link to="/about" onClick={closePanels}>
              Company
            </Link>
            <Link to="/contact" onClick={closePanels}>
              Contact
            </Link>
          </div>

          {/* Tombol Close (X) */}
          <button
            className="nama-azimut-fleet-close"
            type="button"
            aria-label="Close yacht menu"
            onClick={() => setFleetMenuOpen(false)}
          >
            <span></span>
            <span></span>
          </button>
        </div>

        {/* BAGIAN BODY: Konten Kiri (Daftar Yacht) dan Kanan (Image Preview) */}
        <div className="nama-azimut-fleet-body">
          <nav className="nama-azimut-fleet-list" aria-label="Fleet menu">
            {fleetPanelItems.map((item, index) => (
              <Link
                to={`/fleet/${item.slug}`}
                key={item.name}
                className={
                  activeFleetIndex === index
                    ? "nama-azimut-fleet-item nama-azimut-fleet-item-active"
                    : "nama-azimut-fleet-item"
                }
                onMouseEnter={() => setActiveFleetIndex(index)}
                onFocus={() => setActiveFleetIndex(index)}
                onClick={closePanels}
              >
                <span>{item.name}</span>
                <small>{String(index + 1).padStart(2, "0")}</small>
              </Link>
            ))}

            <div className="nama-azimut-fleet-extra">
              <Link to="/fleet" onClick={closePanels}>
                All Vessels
              </Link>
              <a href={whatsappUrl} target="_blank" rel="noreferrer">
                Enquire Charter
              </a>
            </div>
          </nav>

          {/* Preview Komponen Gambar (Sisi Kanan) */}
          {activeFleetItem && (
            <div className="nama-azimut-fleet-preview">
              <img
                key={activeFleetItem.image}
                src={activeFleetItem.image}
                alt={activeFleetItem.name}
              />
              <div className="nama-azimut-preview-caption">
                <p>{activeFleetItem.category}</p>
                <h3>{activeFleetItem.name}</h3>
                <span>{activeFleetItem.subtitle}</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main>
        <section id="home" className="nama-hero-editorial">
          <p className="nama-hero-editorial-kicker">[ BOAT & YACHT CHARTER ]</p>

          <h1>
            The ART of
            <span> Sea Journey</span>
          </h1>

          <p>
            Experience a private portfolio of boat and yacht charter services
            designed for island escapes across Kepulauan Seribu.
          </p>

          <a className="nama-editorial-pill" href="#fleet">
            Discover More
          </a>
        </section>

        <section className="nama-world-section">
          <div className="nama-world-sticky">
            <h2>A PRIVATE SEA JOURNEY, CRAFTED AROUND YOU.</h2>
          </div>

          <div className="nama-world-scroll">
            {worldCards.map((card) => (
              <article className="nama-world-card" key={card.title}>
                <img src={card.image} alt={card.title} />

                <div>
                  <h3>{card.title}</h3>

                  <p>{card.description}</p>

                  <a href={whatsappUrl} target="_blank" rel="noreferrer">
                    → READ MORE
                  </a>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="fleet" className="nama-creations-section">
          <div className="nama-creations-head">
            <h2>
              MEET <em>our</em> COLLECTIONS
            </h2>

            <button type="button" onClick={openFleetPanel}>
              → VIEW ALL VESSELS
            </button>
          </div>

          <div className="nama-collection-scroll">
            {/* SLIDE 1 — SILK INTRO */}
            <article className="nama-collection-slide nama-collection-intro-slide">
              <div className="nama-collection-intro-silk" aria-hidden="true">
                <Silk
                  speed={8}
                  scale={0.95}
                  color="#c95b66"
                  noiseIntensity={0.08}
                  rotation={0}
                />
              </div>

              <div className="nama-collection-intro-overlay">
                <p>NAMA MARINE COLLECTIONS</p>

                <h3>
                  Passenger, Private,
                  <span>and Luxury Charter.</span>
                </h3>

                <small>
                  Explore selected vessels for group transfers, private escapes,
                  and refined sea journeys across Kepulauan Seribu.
                </small>

                <button type="button" onClick={openFleetPanel}>
                  View All Vessels
                </button>

                <strong>00 - 03</strong>
              </div>
            </article>

            {/* SLIDE 2–4 — COLLECTIONS */}
            {collections.map((collection, index) => (
              <article
                className="nama-collection-slide"
                key={collection.title}
                style={{ zIndex: index + 2 }}
              >
                <img src={collection.image} alt={collection.title} />

                <div className="nama-collection-slide-silk" aria-hidden="true">
                  <Silk
                    speed={7}
                    scale={0.95}
                    color="#c95b66"
                    noiseIntensity={0.08}
                    rotation={0}
                  />
                </div>

                <div className="nama-collection-slide-overlay">
                  <div className="nama-collection-slide-copy">
                    <p>{collection.label}</p>

                    <h3>{collection.title}</h3>

                    <span>{collection.subtitle}</span>

                    <small>{collection.description}</small>

                    <button
                      type="button"
                      onClick={() => {
                        setFleetPanelCategory(collection.category);
                        setFleetMenuOpen(true);
                      }}
                    >
                      Discover More
                    </button>
                  </div>

                  <strong>
                    {String(index + 1).padStart(2, "0")} -{" "}
                    {String(collections.length).padStart(2, "0")}
                  </strong>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="nama-home-highlights-section">
          <div className="nama-home-highlights-title">
            <h2>NAMA HIGHLIGHTS</h2>

            <div>
              <Link to="/destinations">→ DESTINATIONS</Link>
              <Link to="/experiences">→ EXPERIENCES</Link>
              <Link to="/about">→ PARTNERSHIP</Link>
            </div>
          </div>

          <div className="nama-home-highlights-layout">
            <div className="nama-home-highlights-image">
              <img
                key={homeHighlights[activeHighlightIndex].image}
                className="nama-home-highlight-preview"
                src={homeHighlights[activeHighlightIndex].image}
                alt={homeHighlights[activeHighlightIndex].title}
              />
            </div>

            <div className="nama-home-highlights-list">
              {homeHighlights.map((item, index) => (
                <Link
                  to={item.link}
                  key={item.title}
                  className={
                    activeHighlightIndex === index
                      ? "nama-highlight-row-active"
                      : ""
                  }
                  onMouseEnter={() => setActiveHighlightIndex(index)}
                  onFocus={() => setActiveHighlightIndex(index)}
                >
                  <span>{item.date}</span>
                  <small>{item.tag}</small>
                  <h3>{item.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="nama-footer">
        <div className="page-container nama-footer-grid">
          <div>
            <a className="nama-footer-logo" href="#top">
              <img
                className="nama-logo-image nama-footer-logo-image"
                src="/images/logo/nama-marine-logo.png"
                alt="NAMA Marine"
              />
            </a>

            <p>Boat & Yacht Charter Kepulauan Seribu</p>
          </div>

          <div>
            <h3>Explore</h3>
            <button type="button" onClick={openFleetPanel}>
              Our Yachts
            </button>
            <Link to="/destinations">Destinations</Link>
            <Link to="/experiences">Experiences</Link>
            <Link to="/about">About Us</Link>
          </div>

          <div>
            <h3>Contact</h3>
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
            <a
              href="https://www.instagram.com/nama.marine/"
              target="_blank"
              rel="noreferrer"
            >
              Instagram
            </a>
            <a href="mailto:bahteranamateam@gmail.com">Email</a>
          </div>

          <div className="nama-footer-social">
            <a
              href="https://www.instagram.com/nama.marine/"
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
            >
              <InstagramIcon />
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
            >
              <WhatsappIcon />
            </a>

            <a href="mailto:bahteranamateam@gmail.com" aria-label="Email">
              <MailIcon />
            </a>
          </div>
        </div>

        <div className="page-container nama-footer-bottom">
          <p>© {new Date().getFullYear()} NAMA Marine. All rights reserved.</p>

          <a href="#home">Back to top ↑</a>
        </div>
      </footer>

      <a
        className="nama-floating-whatsapp"
        href={whatsappUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Chat with NAMA Marine via WhatsApp"
      >
        <WhatsappIcon />
        <span>WhatsApp</span>
      </a>
    </>
  );
}

export default Home;
