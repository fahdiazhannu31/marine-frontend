import React from "react";
import { Link } from "react-router";
import AuthNavSlot from "./AuthNavSlot";

export default function Header({
  breadcrumb,
  rightLinks,
  navScrolled,
  menuOpen,
  setMenuOpen,
  openFleetPanel,
  whatsappUrl,
}) {
  return (
    <header
      className={`nama-header nama-header-minimal nama-smart-navbar ${
        navScrolled ? "nama-smart-navbar-scrolled" : ""
      }`}
    >
      {/* Menu */}
      <button
        className="nama-menu-trigger"
        type="button"
        onClick={() => setMenuOpen(true)}
      >
        Menu
      </button>

      {/* Logo + Breadcrumb */}
      <div className="nama-navbar-center-stage">
        <Link className="nama-center-logo" to="/">
          <img src="/images/logo/nama-marine-logo.png" alt="NAMA Marine" />
        </Link>

        <div className="nama-navbar-breadcrumb">
          {breadcrumb.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <i>•</i>}
              <span>{item}</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Menu kanan */}
      <nav className="nama-header-right-links">
        <div className="nama-navbar-right-stage">
          <div className="nama-navbar-right-default">
            {rightLinks.map((item) =>
              item.action ? (
                <button
                  key={item.label}
                  className="nama-header-yachts-button"
                  onClick={item.action}
                >
                  {item.label}
                </button>
              ) : (
                <Link key={item.label} to={item.to}>
                  {item.label}
                </Link>
              ),
            )}
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
  );
}
