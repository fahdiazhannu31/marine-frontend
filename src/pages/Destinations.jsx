import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { boats } from "../data/boats.js";
import CircularGallery from "../components/CircularGallery";
import "../App.css";
import "./InnerPage.css";
import AuthNavSlot from "../components/AuthNavSlot.jsx";

const whatsappUrl = "https://linktr.ee/namamarine";

const fleetCategories = ["All Fleet", "Yacht", "Boat"];
const fleetItems = boats;

const menuItems = [
  { label: "Home", link: "/" },
  { label: "Our Yachts", link: "/fleet" },
  { label: "Destinations", link: "/destinations" },
  { label: "Experiences", link: "/experiences" },
  { label: "About Us", link: "/about" },
];

const destinationRoutes = [
  {
    id: "coastal-sunset",
    title: "Coastal / Sunset",
    season: "Best for short cruise and sunset trip",
    description:
      "A relaxed coastal route for sunset cruising, short private moments, and city-side sea views around North Jakarta.",
    places: ["Apartment Regatta", "Pantai Mutiara", "Baywalk"],
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1400&q=85",
    gallery: [
      {
        image: "/images/rute/sunset/Baywalk-sunset.jpg",
        text: "Baywalk Sunset",
      },
      {
        image: "/images/rute/sunset/pantaimutiara.jpg",
        text: "Pantai Mutiara",
      },
      {
        image: "/images/rute/sunset/regatta.jpg",
        text: "Regatta",
      },
    ],
  },
  {
    id: "south",
    title: "South",
    season: "Best for heritage island hopping",
    description:
      "A classic southern route for island hopping, heritage stops, and shorter private trips across nearby islands.",
    places: ["Bidadari", "Cipir", "Kelor", "Onrust", "Untung Jawa", "Ayer"],
    image:
      "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1400&q=85",
    gallery: [
      {
        image: "/images/rute/south/ayer.jpg",
        text: "Ayer Island",
      },
      {
        image: "/images/rute/south/bidadari.jpg",
        text: "Bidadari Island",
      },
      {
        image: "/images/rute/south/cipir.jpg",
        text: "Cipir Island",
      },
      {
        image: "/images/rute/south/kelor.png",
        text: "Kelor Island",
      },
      {
        image: "/images/rute/south/onrust.jpg",
        text: "Onrust Island",
      },
      {
        image: "/images/rute/south/untungjawa.webp",
        text: "Untung Jawa",
      },
    ],
  },
  {
    id: "west",
    title: "West",
    season: "Best for leisure escape and island stay",
    description:
      "A westward route for longer leisure escapes, resort-style stops, and clear-water island experiences.",
    places: ["Nirva / Tidung", "Asha", "Ponco", "Nusa Karamba", "Pari"],
    image:
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1400&q=85",
    gallery: [
      {
        image: "/images/rute/west/asha.jpeg",
        text: "Asha",
      },
      {
        image: "/images/rute/west/nirva.jpg",
        text: "Nirva",
      },
      {
        image: "/images/rute/west/nusakambangan.png",
        text: "Nusa Kambangan",
      },
      {
        image: "/images/rute/west/pari.jpg",
        text: "Pari Island",
      },
      {
        image: "/images/rute/west/ponco.jpg",
        text: "Ponco",
      },
    ],
  },
  {
    id: "north",
    title: "North",
    season: "Best for premium island journey",
    description:
      "A northern route for refined private journeys, premium island destinations, and longer sea experiences.",
    places: ["Sepa", "Dolphin", "Genteng", "Harapan", "Oba", "Pelangi"],
    image:
      "https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=1400&q=85",
    gallery: [
      {
        image: "/images/rute/north/dolphin.webp",
        text: "Dolphin Island",
      },
      {
        image: "/images/rute/north/genteng.webp",
        text: "Genteng Island",
      },
      {
        image: "/images/rute/north/harapan.webp",
        text: "Harapan Island",
      },
      {
        image: "/images/rute/north/oba.webp",
        text: "Oba Island",
      },
      {
        image: "/images/rute/north/pelangi.jpg",
        text: "Pelangi Island",
      },
      {
        image: "/images/rute/north/sepa.jpg",
        text: "Sepa Island",
      },
    ],
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

function Destinations() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [fleetMenuOpen, setFleetMenuOpen] = useState(false);
  const [fleetPanelCategory, setFleetPanelCategory] = useState("All Fleet");
  const [activeFleetIndex, setActiveFleetIndex] = useState(0);
  const [activeDestination, setActiveDestination] = useState(null);
  const [navScrolled, setNavScrolled] = useState(false);

  const fleetPanelItems = useMemo(() => {
    if (fleetPanelCategory === "All Fleet") return fleetItems;
    return fleetItems.filter((item) => item.category === fleetPanelCategory);
  }, [fleetPanelCategory]);

  const activeFleetItem =
    fleetPanelItems[activeFleetIndex] || fleetPanelItems[0] || fleetItems[0];

  useEffect(() => {
    setActiveFleetIndex(0);
  }, [fleetPanelCategory]);

  useEffect(() => {
    document.body.style.overflow =
      menuOpen || fleetMenuOpen || activeDestination ? "hidden" : "";

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
        setFleetMenuOpen(false);
        setActiveDestination(null);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen, fleetMenuOpen, activeDestination]);

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
              className="nama-logo-img"
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
            <span>Destinations</span>
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

              <Link to="/about">About Us</Link>
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
        className={`nama-staggered-panel ${
          menuOpen ? "nama-staggered-panel-open" : ""
        }`}
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
        className={`fleet-panel nama-azimut-fleet-panel ${
          fleetMenuOpen ? "fleet-panel-open" : ""
        }`}
        aria-hidden={!fleetMenuOpen}
      >
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

            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              Enquire
            </a>
          </div>

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

      <main className="destinations-page" id="top">
        <section className="destinations-hero">
          <h1>Destinations</h1>

          <div className="destinations-hero-copy">
            <p>
              NAMA Marine destination planning is divided into four simple route
              categories: Coastal / Sunset, South, West, and North. Each route
              can be adjusted based on the vessel, guest number, trip duration,
              and preferred island stop.
            </p>

            <a href="#routes">
              Explore Routes
              <ArrowIcon />
            </a>
          </div>
        </section>

        <section className="destinations-grid-section" id="routes">
          <div className="destinations-grid">
            {destinationRoutes.map((route) => (
              <article className="destination-card" key={route.id}>
                <button
                  className="destination-card-image"
                  type="button"
                  onClick={() => setActiveDestination(route)}
                  aria-label={`Open ${route.title} gallery`}
                >
                  <img src={route.image} alt={route.title} />
                </button>

                <div className="destination-card-copy">
                  <h2>{route.title}</h2>

                  <div className="destination-card-line"></div>

                  <p className="destination-season">✦ {route.season}</p>

                  <p>{route.description}</p>

                  <button
                    type="button"
                    onClick={() => setActiveDestination(route)}
                  >
                    Explore {route.title}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      {activeDestination && (
        <div
          className="destination-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`${activeDestination.title} gallery`}
        >
          <button
            className="destination-modal-backdrop"
            type="button"
            aria-label="Close gallery"
            onClick={() => setActiveDestination(null)}
          ></button>

          <div className="destination-modal-content">
            <button
              className="destination-modal-close"
              type="button"
              aria-label="Close gallery"
              onClick={() => setActiveDestination(null)}
            >
              <span></span>
              <span></span>
            </button>

            <div className="destination-modal-heading">
              <p>{activeDestination.season}</p>

              <h2>{activeDestination.title}</h2>

              <span>{activeDestination.description}</span>

              <ul>
                {activeDestination.places.map((place) => (
                  <li key={place}>{place}</li>
                ))}
              </ul>
            </div>

            <div className="destination-reactbits-gallery">
              <CircularGallery
                items={activeDestination.gallery}
                bend={3}
                textColor="#ffffff"
                borderRadius={0.05}
                scrollEase={0.05}
                fontUrl=""
                font="bold 30px Arial"
                scrollSpeed={2}
              />
            </div>
          </div>
        </div>
      )}

      <footer className="nama-footer">
        <div className="page-container nama-footer-grid">
          <div>
            <a className="nama-footer-logo" href="#top">
              <img
                className="nama-logo-img"
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

          <a href="#top">Back to top ↑</a>
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

export default Destinations;
