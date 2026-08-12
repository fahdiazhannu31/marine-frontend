import { useEffect, useState } from "react";
import { Link } from "react-router";
import SiteChrome from "../../components/SiteChrome.jsx";
import { fetchPackages } from "../../services/packagesService.js";
import { formatRupiah } from "./formatRupiah.js";
import "./Packages.css";
import { API_URL } from "../../config/BaseUrl.js";

export default function Packages() {
  const [packages, setPackages] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    let cancelled = false;

    fetchPackages()
      .then((data) => {
        if (!cancelled) {
          setPackages(Array.isArray(data) ? data : []);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <SiteChrome breadcrumb={["NAMA Marine", "Packages"]}>
      <div className="nama-packages-page">
        <section className="nama-packages-intro">
          <p className="nama-packages-kicker">[ Curated Journeys ]</p>
          <h1>Packages</h1>
        </section>

        {status === "loading" && (
          <p className="nama-packages-loading">Loading packages...</p>
        )}
        {status === "error" && (
          <p className="nama-packages-empty">
            Failed to load packages. Please reload the page.
          </p>
        )}
        {status === "ready" && packages.length === 0 && (
          <p className="nama-packages-empty">
            No packages available at this time.
          </p>
        )}

        {status === "ready" && packages.length > 0 && (
          <section className="nama-packages-grid-section">
            <div className="nama-packages-grid">
              {packages.map((pkg) => (
                <Link
                  className="nama-package-card"
                  to={`/packages/${pkg.id}`}
                  key={pkg.id}
                >
                  <div className="nama-package-card-image">
                    <img
                      src={`${API_URL}/assets_users/images/${pkg.photo1}`}
                      alt={pkg.title}
                    />
                  </div>
                  <div className="nama-package-card-body">
                    <h3>{pkg.title}</h3>
                    <p className="nama-package-card-desc">{pkg.description}</p>
                    <p className="nama-package-card-price">
                      {formatRupiah(pkg.price_per_pax)} <span>/ pax</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </SiteChrome>
  );
}
