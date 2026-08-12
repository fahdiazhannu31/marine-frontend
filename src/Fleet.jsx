import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { boats } from "./data/boats.js";
import "./App.css";
import "./Fleet.css";
import AuthNavSlot from "./components/AuthNavSlot.jsx";
import Header from "./components/Header.jsx";

const whatsappUrl = "https://linktr.ee/namamarine";

const collectionMap = {
  Passenger: ["la-vela", "la-brisa", "midas"],
  Private: ["la-casa", "jp-star"],
  Luxury: ["alma", "luwansa"],
};

const collectionDescriptions = {
  Passenger:
    "Passenger boats for group trips, island transfers, company outings, and larger journeys across Kepulauan Seribu.",
  Private:
    "Private boats for intimate escapes, sunset cruises, celebrations, and relaxed island experiences.",
  Luxury:
    "Premium yachts for refined sea journeys, special occasions, and curated private moments.",
};

const collectionHeroImages = {
  Passenger: "/images/fleet/reguler/Passenger.png",
  Private: "/images/fleet/private/Private.png",
  Luxury: "/images/fleet/luxury/Luxury.png",
};

const collectionOptions = ["All", "Passenger", "Private", "Luxury"];
const typeOptions = ["All", "Passenger boat", "Private boat", "Luxury yacht"];
const capacityOptions = ["All", "1–20 Pax", "21–50 Pax", "51+ Pax"];
const routeOptions = ["All", "Sunset", "South", "West", "North"];

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

function getBoatCollection(boat) {
  return boat.collection || "Passenger";
}

function getCapacityNumber(capacity) {
  if (!capacity) return 0;
  const match = capacity.match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function matchCapacity(boat, selectedCapacity) {
  if (selectedCapacity === "All") return true;

  const pax = getCapacityNumber(boat.capacity);

  if (!pax) return selectedCapacity === "All";
  if (selectedCapacity === "1–20 Pax") return pax >= 1 && pax <= 20;
  if (selectedCapacity === "21–50 Pax") return pax >= 21 && pax <= 50;
  if (selectedCapacity === "51+ Pax") return pax >= 51;

  return true;
}

function matchRoute(boat, selectedRoute) {
  if (selectedRoute === "All") return true;
  if (!boat.rates || boat.rates.length === 0) return false;

  return boat.rates.some(
    (rate) =>
      rate.route.toLowerCase() === selectedRoute.toLowerCase() &&
      rate.price !== "-",
  );
}

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

function Fleet() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [fleetMenuOpen, setFleetMenuOpen] = useState(false);
  const [fleetPanelCategory, setFleetPanelCategory] = useState("All Fleet");
  const [activeFleetIndex, setActiveFleetIndex] = useState(0);
  const [navScrolled, setNavScrolled] = useState(false);

  const [selectedCollection, setSelectedCollection] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedCapacity, setSelectedCapacity] = useState("All");
  const [selectedRoute, setSelectedRoute] = useState("All");
  const [viewMode, setViewMode] = useState("grid");

  const fleetPanelItems = useMemo(() => {
    if (fleetPanelCategory === "All Fleet") return fleetItems;
    return fleetItems.filter((item) => item.collection === fleetPanelCategory);
  }, [fleetPanelCategory]);

  const activeFleetItem =
    fleetPanelItems[activeFleetIndex] || fleetPanelItems[0] || fleetItems[0];

  const filteredBoats = useMemo(() => {
    return boats.filter((boat) => {
      const collection = getBoatCollection(boat);

      const collectionMatch =
        selectedCollection === "All" || collection === selectedCollection;

      const typeMatch =
        selectedType === "All" || boat.category === selectedType;

      return (
        collectionMatch &&
        typeMatch &&
        matchCapacity(boat, selectedCapacity) &&
        matchRoute(boat, selectedRoute)
      );
    });
  }, [selectedCollection, selectedType, selectedCapacity, selectedRoute]);

  const groupedBoats = useMemo(() => {
    return ["Passenger", "Private", "Luxury"]
      .map((collection) => ({
        collection,
        boats: filteredBoats.filter(
          (boat) => getBoatCollection(boat) === collection,
        ),
      }))
      .filter((group) => group.boats.length > 0);
  }, [filteredBoats]);

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

  const resetFilters = () => {
    setSelectedCollection("All");
    setSelectedType("All");
    setSelectedCapacity("All");
    setSelectedRoute("All");
  };

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

            <Link to="/about" onClick={closePanels}>
              About Us
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

      <main className="fleet-page" id="top">
        <section className="fleet-hero">
          <p>The Fleet</p>

          <h1>
            THE NAMA
            <span>MARINE FLEET</span>
          </h1>

          <div className="fleet-hero-copy">
            <p>
              Explore passenger boats, private charters, and luxury yachts for
              tailored sea journeys across Kepulauan Seribu.
            </p>

            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              Enquire Charter
              <ArrowIcon />
            </a>
          </div>
        </section>

        <section className="fleet-filter-section">
          <div className="fleet-filter-header">
            <p>Filter Selection</p>

            <button type="button" onClick={resetFilters}>
              Reset Filter
            </button>
          </div>

          <div className="fleet-filter-grid">
            <label>
              Collection
              <select
                value={selectedCollection}
                onChange={(event) => setSelectedCollection(event.target.value)}
              >
                {collectionOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label>
              Type
              <select
                value={selectedType}
                onChange={(event) => setSelectedType(event.target.value)}
              >
                {typeOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label>
              Capacity
              <select
                value={selectedCapacity}
                onChange={(event) => setSelectedCapacity(event.target.value)}
              >
                {capacityOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label>
              Route
              <select
                value={selectedRoute}
                onChange={(event) => setSelectedRoute(event.target.value)}
              >
                {routeOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="fleet-view-bar">
            <p>
              Showing <strong>{filteredBoats.length}</strong> vessel
              {filteredBoats.length !== 1 ? "s" : ""}
            </p>

            <div>
              <button
                type="button"
                className={viewMode === "grid" ? "fleet-view-active" : ""}
                onClick={() => setViewMode("grid")}
              >
                Grid View
              </button>

              <button
                type="button"
                className={viewMode === "list" ? "fleet-view-active" : ""}
                onClick={() => setViewMode("list")}
              >
                List View
              </button>
            </div>
          </div>
        </section>

        {groupedBoats.length > 0 ? (
          <section className="fleet-collection-list">
            {groupedBoats.map((group) => (
              <section
                className="fleet-collection-block"
                key={group.collection}
              >
                <div className="fleet-collection-intro">
                  <div>
                    <p>{group.collection} Collection</p>

                    <h2>{group.collection}</h2>

                    <span>{collectionDescriptions[group.collection]}</span>
                  </div>

                  <img
                    src={collectionHeroImages[group.collection]}
                    alt={`${group.collection} Collection`}
                  />
                </div>

                <div
                  className={
                    viewMode === "grid" ? "fleet-card-grid" : "fleet-card-list"
                  }
                >
                  {group.boats.map((boat) => (
                    <article className="fleet-card" key={boat.slug}>
                      <Link
                        className="fleet-card-image"
                        to={`/fleet/${boat.slug}`}
                      >
                        <img src={boat.image} alt={boat.name} />
                      </Link>

                      <div className="fleet-card-content">
                        <div>
                          <p>{getBoatCollection(boat)} Collection</p>

                          <h3>{boat.name}</h3>

                          <span>{boat.subtitle}</span>
                        </div>

                        <dl>
                          <div>
                            <dt>Type</dt>
                            <dd>{boat.category}</dd>
                          </div>

                          <div>
                            <dt>Capacity</dt>
                            <dd>{boat.capacity}</dd>
                          </div>

                          <div>
                            <dt>Routes</dt>
                            <dd>
                              {boat.rates && boat.rates.length > 0
                                ? boat.rates
                                    .filter((rate) => rate.price !== "-")
                                    .map((rate) => rate.route)
                                    .join(", ")
                                : "By request"}
                            </dd>
                          </div>
                        </dl>

                        <div className="fleet-card-actions">
                          <Link to={`/fleet/${boat.slug}`}>
                            View Details
                            <ArrowIcon />
                          </Link>

                          <a
                            href={`https://wa.me/6281288523907?text=${encodeURIComponent(
                              `Halo NAMA Marine, saya ingin bertanya tentang ${boat.name}.`,
                            )}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            WhatsApp
                          </a>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </section>
        ) : (
          <section className="fleet-empty">
            <h2>No vessels found</h2>

            <p>
              Try adjusting your collection, capacity, type, or route filter.
            </p>

            <button type="button" onClick={resetFilters}>
              Reset Filter
            </button>
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

export default Fleet;
