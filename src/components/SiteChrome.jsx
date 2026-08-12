import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { boats } from "../data/boats.js";
import AuthNavSlot from "./AuthNavSlot.jsx";
import "../App.css";

const whatsappUrl = "https://linktr.ee/namamarine";
const fleetCategories = ["All Fleet", "Yacht", "Boat"];

const menuItems = [
  { label: "Home", link: "/" },
  { label: "Our Yachts", link: "/fleet" },
  { label: "Packages", link: "/packages" },
  { label: "Destinations", link: "/destinations" },
  { label: "Experiences", link: "/experiences" },
  { label: "About Us", link: "/about" },
];

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

// Header + drawer menu + fleet quick-panel + footer, dipakai oleh halaman BARU
// (Login, Register, Profile, Packages, PackageDetail). Meniru persis pola yang
// sudah ada di About.jsx / Fleet.jsx / dst. — tidak mengubah file-file itu.
export default function SiteChrome({ breadcrumb = [], children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [fleetMenuOpen, setFleetMenuOpen] = useState(false);
  const [fleetPanelCategory, setFleetPanelCategory] = useState("All Fleet");
  const [activeFleetIndex, setActiveFleetIndex] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);

  const fleetPanelItems = useMemo(() => {
    if (fleetPanelCategory === "All Fleet") return boats;
    return boats.filter((item) => item.category === fleetPanelCategory);
  }, [fleetPanelCategory]);

  const activeFleetItem =
    fleetPanelItems[activeFleetIndex] || fleetPanelItems[0] || boats[0];

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
    const handleNavbarScroll = () => setNavScrolled(window.scrollY > 120);
    handleNavbarScroll();
    window.addEventListener("scroll", handleNavbarScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleNavbarScroll);
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
            <span>Nama Marine</span>
            <i>•</i>
            <span>Contact Us</span>
            <i>•</i>
            <span>Packages</span>
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

              <Link to="/packages">Packages</Link>
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

      <main id="top">{children}</main>

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
            <Link to="/packages">Packages</Link>
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
