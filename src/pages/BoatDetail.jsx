import { useEffect, useMemo, useState } from "react";
import { Link, Navigate, useParams } from "react-router";
import { boats, getBoatBySlug } from "../data/boats.js";
import "../App.css";
import "./BoatDetail.css";
import AuthNavSlot from "../components/AuthNavSlot.jsx";

const whatsappUrl = "https://linktr.ee/namamarine";

const fleetCategories = ["All Fleet", "Passenger", "Private", "Luxury"];
const fleetItems = boats;

const menuItems = [
  { label: "Home", link: "/" },
  { label: "Our Yachts", link: "/fleet" },
  { label: "Destinations", link: "/destinations" },
  { label: "Experiences", link: "/experiences" },
  { label: "About Us", link: "/about" },
];

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13" />
      <path d="m14 7 5 5-5 5" />
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

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.8" r="1" className="fill-icon" />
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

function BoatDetail() {
  const { slug } = useParams();
  const boat = getBoatBySlug(slug);

  const [activeImage, setActiveImage] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [fleetMenuOpen, setFleetMenuOpen] = useState(false);
  const [fleetPanelCategory, setFleetPanelCategory] = useState("All Fleet");
  const [activeFleetIndex, setActiveFleetIndex] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);

  const fleetPanelItems = useMemo(() => {
    if (fleetPanelCategory === "All Fleet") return fleetItems;
    return fleetItems.filter((item) => item.collection === fleetPanelCategory);
  }, [fleetPanelCategory]);

  const activeFleetItem =
    fleetPanelItems[activeFleetIndex] || fleetPanelItems[0] || fleetItems[0];

  const relatedBoats = useMemo(() => {
    if (!boat) return [];

    return boats
      .filter(
        (item) =>
          item.slug !== boat.slug && item.collection === boat.collection,
      )
      .slice(0, 3);
  }, [boat]);

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

  const closePanels = () => {
    setMenuOpen(false);
    setFleetMenuOpen(false);
  };

  const openFleetPanel = () => {
    setMenuOpen(false);
    setFleetMenuOpen(true);
  };

  if (!boat) return <Navigate to="/fleet" replace />;

  const gallery = Array.from(
    new Set([boat.image, ...(boat.gallery || [])].filter(Boolean)),
  );

  const specs =
    boat.specifications && boat.specifications.length > 0
      ? boat.specifications
      : [
          { label: "Type", value: boat.category },
          { label: "Capacity", value: boat.capacity },
          { label: "Cruising Area", value: "Kepulauan Seribu" },
        ];

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
            <span>{boat.collection}</span>
            <i>•</i>
            <span>{boat.capacity}</span>
            <i>•</i>
            <span>{boat.name}</span>
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
              href={`${whatsappUrl}?text=${encodeURIComponent(
                `Halo NAMA Marine, saya ingin bertanya tentang ${boat.name}.`,
              )}`}
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
                <p>{activeFleetItem.collection}</p>
                <h3>{activeFleetItem.name}</h3>
                <span>{activeFleetItem.subtitle}</span>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="simple-boat-detail" id="top">
        <section className="simple-boat-hero">
          <div className="simple-boat-copy">
            <Link className="simple-back-link" to="/fleet">
              ← Back to Fleet
            </Link>

            <p>[ {boat.category} ]</p>
            <h1>{boat.name}</h1>
            <span>{boat.description}</span>

            <div className="simple-boat-actions">
              <a
                href={`${whatsappUrl}?text=${encodeURIComponent(
                  `Halo NAMA Marine, saya ingin bertanya tentang ${boat.name}.`,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                Enquire Now
                <ArrowIcon />
              </a>

              <a href="#rates">
                View Rates
                <ArrowIcon />
              </a>
            </div>
          </div>

          <div className="simple-boat-media">
            <img src={gallery[activeImage] || boat.image} alt={boat.name} />
          </div>
        </section>

        <section className="simple-boat-mini-specs">
          <article>
            <span>Type</span>
            <strong>{boat.category}</strong>
          </article>

          <article>
            <span>Capacity</span>
            <strong>{boat.capacity}</strong>
          </article>

          <article>
            <span>Collection</span>
            <strong>{boat.collection}</strong>
          </article>
        </section>

        <section className="simple-boat-section">
          <div>
            <p>[ Overview ]</p>
            <h2>Simple, comfortable, and arranged for your journey.</h2>
          </div>

          <div className="simple-boat-text">
            <p>
              {boat.name} can be arranged for private charter, group transfer,
              island hopping, and selected route journeys across Kepulauan
              Seribu. The vessel choice can be adjusted based on guest number,
              trip duration, and preferred island stop.
            </p>

            <div className="simple-feature-list">
              {(boat.facilities || []).map((facility) => (
                <span key={facility}>{facility}</span>
              ))}
            </div>
          </div>
        </section>

        <section className="simple-boat-gallery">
          <div className="simple-boat-gallery-main">
            <img
              src={gallery[activeImage] || boat.image}
              alt={`${boat.name} preview`}
            />
          </div>

          <div className="simple-boat-gallery-thumbs">
            {gallery.map((image, index) => (
              <button
                type="button"
                className={activeImage === index ? "active" : ""}
                key={`${image}-${index}`}
                onClick={() => setActiveImage(index)}
              >
                <img src={image} alt={`${boat.name} thumbnail ${index + 1}`} />
              </button>
            ))}
          </div>
        </section>

        <section className="simple-boat-section simple-boat-data" id="rates">
          <div>
            <p>[ Data Summary ]</p>
            <h2>Vessel data and route rates.</h2>
          </div>

          <div className="simple-data-wrap">
            <div className="simple-spec-table">
              {specs.map((item) => (
                <div key={`${item.label}-${item.value}`}>
                  <span>{item.label}</span>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>

            <div className="simple-rate-table">
              <h3>Rates</h3>

              {boat.rates && boat.rates.length > 0 ? (
                boat.rates.map((rate) => (
                  <div key={rate.route}>
                    <span>{rate.route}</span>
                    <strong>{rate.price}</strong>
                  </div>
                ))
              ) : (
                <p>Rates are available by request.</p>
              )}

              <a
                href={`${whatsappUrl}?text=${encodeURIComponent(
                  `Halo NAMA Marine, saya ingin bertanya rate dan availability ${boat.name}.`,
                )}`}
                target="_blank"
                rel="noreferrer"
              >
                Ask Availability
                <ArrowIcon />
              </a>
            </div>
          </div>
        </section>

        {relatedBoats.length > 0 && (
          <section className="simple-related">
            <div className="simple-related-head">
              <p>[ Related ]</p>
              <h2>Similar vessels</h2>
            </div>

            <div className="simple-related-grid">
              {relatedBoats.map((item) => (
                <Link to={`/fleet/${item.slug}`} key={item.slug}>
                  <img src={item.image} alt={item.name} />
                  <span>{item.category}</span>
                  <h3>{item.name}</h3>
                  <p>{item.capacity}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

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
            <a href="mailto:hello@namamarine.id">Email</a>
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

            <a href="mailto:hello@namamarine.id" aria-label="Email">
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

export default BoatDetail;
