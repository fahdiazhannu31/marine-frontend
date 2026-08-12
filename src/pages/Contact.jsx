import { Link } from 'react-router'
import './InnerPage.css'

const whatsappUrl = 'https://linktr.ee/namamarine'

function Contact() {
  return (
    <>
      <header className="nama-header nama-header-minimal">
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

  <a
    className="nama-center-logo"
    href="#home"
    aria-label="NAMA Marine home"
  >
<img
  className="nama-logo-img"
  src="/images/logo/nama-marine-logo.png"
  alt="NAMA Marine"
/>
  </a>

  <nav
    className="nama-header-right-links"
    aria-label="Quick navigation"
  >
    <button
      className="nama-header-yachts-button"
      type="button"
      onClick={openFleetPanel}
    >
      Yachts
    </button>

    <a href="#contact">Contacts</a>
  </nav>
</header>

      <aside
        className={`fleet-panel ${fleetMenuOpen ? 'fleet-panel-open' : ''}`}
        aria-hidden={!fleetMenuOpen}
      >
        <div className="fleet-panel-top">
          <a
            className="fleet-panel-brand"
            href="#home"
            aria-label="NAMA Marine home"
            onClick={closePanels}
          >
            <span className="fleet-panel-brand-main">NAMA</span>
            <span className="fleet-panel-brand-sub">MARINE</span>
          </a>

          <button
            className="fleet-panel-close"
            type="button"
            aria-label="Close yacht menu"
            onClick={() => setFleetMenuOpen(false)}
          >
            <i></i>
            <span>Close</span>
          </button>
        </div>

        <div className="fleet-panel-layout">
          <nav
            className="fleet-panel-categories"
            aria-label="Fleet categories"
          >
            {fleetCategories.map((category) => (
              <button
                key={category}
                type="button"
                className={
                  fleetPanelCategory === category
                    ? 'fleet-panel-category-active'
                    : ''
                }
                onClick={() => setFleetPanelCategory(category)}
              >
                {category}
              </button>
            ))}
          </nav>

          <div className="fleet-panel-content">
            <div className="fleet-panel-heading">
              <p>Selected Yacht Collection</p>

              <Link to="/fleet" onClick={closePanels}>
                Explore All Fleet
                <ArrowIcon />
              </Link>
            </div>

            <div className="fleet-panel-grid">
              {fleetPanelItems.map((item) => (
              <Link
                className="fleet-panel-card"
                to={`/fleet/${item.slug}`}
                key={item.name}
                onClick={closePanels}
              >
                  <div className="fleet-panel-image">
                    <img
                      src={item.image}
                      alt={`${item.name} charter vessel`}
                    />
                  </div>

                  <p>{item.category}</p>
                  <h3>{item.name}</h3>
                  <span>{item.subtitle}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </aside>

      <aside
        className={`nama-mobile-menu ${menuOpen ? 'nama-mobile-menu-open' : ''}`}
        aria-hidden={!menuOpen}
      >
        <div className="nama-mobile-menu-top">
          <a className="nama-mobile-logo" href="#home" onClick={closePanels}>
<img
  className="nama-logo-img"
  src="/images/logo/nama-marine-logo.png"
  alt="NAMA Marine"
/>
          </a>

          <button type="button" aria-label="Close menu" onClick={closePanels}>
            <CloseIcon />
          </button>
        </div>

        <nav className="nama-mobile-navigation" aria-label="Mobile navigation">
          <Link to="/" onClick={closePanels}>
            Home
          </Link>

          <button type="button" onClick={openFleetPanel}>
            Our Yachts
          </button>

          <Link to="/destinations" onClick={closePanels}>
            Destinations
          </Link>

          <Link to="/experiences" onClick={closePanels}>
            Experiences
          </Link>

          <Link to="/about" onClick={closePanels}>
            About Us
          </Link>

          <Link to="/contact" onClick={closePanels}>
            Contact
          </Link>
        </nav>
        
      </aside>

      <main className="inner-page">
        <p className="inner-page-kicker">Begin Your Journey</p>

        <h1>Contact</h1>

        <p className="inner-page-description">
          Tell us your preferred travel date, estimated number of guests and
          destination. Our team will help arrange the right journey.
        </p>

        <a
          className="boat-detail-button"
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
        >
          Chat via WhatsApp
        </a>
      </main>
    </>
  )
}

export default Contact