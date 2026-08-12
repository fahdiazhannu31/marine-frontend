import { AnimatePresence, motion } from "motion/react";
import { Route, Routes, useLocation } from "react-router";

import Home from "./Home.jsx";
import Fleet from "./Fleet.jsx";

import BoatDetail from "./pages/BoatDetail.jsx";
import Destinations from "./pages/Destinations.jsx";
import Experiences from "./pages/Experiences.jsx";
import About from "./pages/About.jsx";
import Contact from "./pages/Contact.jsx";

import Login from "./features/auth/Login.jsx";
import Register from "./features/auth/Register.jsx";
import Profile from "./features/auth/Profile.jsx";
import Transactions from "./features/auth/Transactions.jsx";
import Packages from "./features/packages/Packages.jsx";
import PackageDetail from "./features/packages/PackageDetail.jsx";

import PaymentSuccess from "./pages/PaymentSuccess.jsx";
import PaymentFailure from "./pages/PaymentFailure.jsx";

import AdminLayout from "./features/admin/AdminLayout.jsx";
import YachtSeatBooking from "./features/admin/pages/YachtSeatBooking.jsx";
import CheckIn from "./features/admin/pages/CheckIn.jsx";
import Dashboard from "./features/admin/pages/Dashboard.jsx";
import Manifest from "./features/admin/pages/Manifest.jsx";
import ManifestUpload from "./features/admin/pages/ManifestUpload.jsx";
import ManifestFinal from "./features/admin/pages/ManifestFinal.jsx";
import DailyOps from "./features/admin/pages/DailyOps.jsx";
import MasterData from "./features/admin/pages/MasterData.jsx";

import PageCurtain from "./components/PageCurtain.jsx";
import ScrollReveal from "./components/ScrollReveal.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";

function App() {
  const location = useLocation();

  return (
    <>
      <ScrollToTop />

      <PageCurtain key={`curtain-${location.pathname}`} />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          className="route-stage"
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          <ScrollReveal />

          <Routes location={location}>
            <Route path="/" element={<Home />} />

            <Route path="/fleet" element={<Fleet />} />
            <Route path="/fleet/:slug" element={<BoatDetail />} />

            <Route path="/destinations" element={<Destinations />} />
            <Route path="/experiences" element={<Experiences />} />

            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<About />} />

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/transactions" element={<Transactions />} />

            <Route path="/packages" element={<Packages />} />
            <Route path="/packages/:id" element={<PackageDetail />} />

            <Route path="/payment-success" element={<PaymentSuccess />} />
            <Route path="/payment-failure" element={<PaymentFailure />} />

            {/* ── Admin Routes ─────────────────────────────────── */}
            <Route
              path="/admin/dashboard"
              element={
                <AdminLayout>
                  <Dashboard />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/daily-ops"
              element={
                <AdminLayout>
                  <DailyOps />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/yacht-seat-booking"
              element={
                <AdminLayout>
                  <YachtSeatBooking />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/checkin"
              element={
                <AdminLayout>
                  <CheckIn />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/manifest"
              element={
                <AdminLayout>
                  <Manifest />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/manifest-upload"
              element={
                <AdminLayout>
                  <ManifestUpload />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/manifest-final"
              element={
                <AdminLayout>
                  <ManifestFinal />
                </AdminLayout>
              }
            />
            <Route
              path="/admin/master-data"
              element={
                <AdminLayout>
                  <MasterData />
                </AdminLayout>
              }
            />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export default App;
