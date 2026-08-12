import { useEffect, useState } from "react";
import { useParams } from "react-router";
import SiteChrome from "../../components/SiteChrome.jsx";
import { fetchPackageDetail } from "../../services/packagesService.js";
import { formatRupiah } from "./formatRupiah.js";
import BookingForm from "./BookingForm.jsx";
import "./Packages.css";
import { API_URL } from "../../config/BaseUrl";

export default function PackageDetail() {
  const { id } = useParams();
  const [pkg, setPkg] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");

    fetchPackageDetail(id)
      .then((data) => {
        if (!cancelled) {
          setPkg(data);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (status === "loading") {
    return (
      <SiteChrome breadcrumb={["NAMA Marine", "Packages"]}>
        <div className="nama-package-detail">
          <p className="nama-packages-loading">Loading package...</p>
        </div>
      </SiteChrome>
    );
  }

  if (status === "error" || !pkg) {
    return (
      <SiteChrome breadcrumb={["NAMA Marine", "Packages"]}>
        <div className="nama-package-detail">
          <p className="nama-packages-empty">Package not found.</p>
        </div>
      </SiteChrome>
    );
  }

  const photos = [pkg.photo1, pkg.photo2, pkg.photo3].filter(Boolean);

  return (
    <SiteChrome breadcrumb={["NAMA Marine", "Packages", pkg.title]}>
      <div className="nama-package-detail">
        <section className="nama-package-detail-hero">
          <div className="nama-package-detail-gallery">
            {photos.map((src, index) => (
              <img
                key={`${src}-${index}`}
                src={`${API_URL}/assets_users/images/${src}`}
                alt={pkg.title}
              />
            ))}
          </div>

          <div className="nama-package-detail-info">
            <p>[ {pkg.category || "Package"} ]</p>
            <h1>{pkg.title}</h1>
            <p>{pkg.description}</p>

            <div className="nama-package-price-box">
              <span>Price per person (weekday)</span>
              <strong>{formatRupiah(pkg.price_per_pax)}</strong>
              {pkg.price_per_pax_weekend && (
                <>
                  <span style={{ marginTop: 14 }}>
                    Price per person (weekend)
                  </span>
                  <strong>{formatRupiah(pkg.price_per_pax_weekend)}</strong>
                </>
              )}
              {pkg.pax_count && (
                <span style={{ marginTop: 14 }}>
                  Capacity: {pkg.pax_count} pax
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="nama-package-booking-section">
          <p>[ Make a Reservation ]</p>
          <h2>Secure your spot</h2>
          <BookingForm pkg={pkg} />
        </section>
      </div>
    </SiteChrome>
  );
}
