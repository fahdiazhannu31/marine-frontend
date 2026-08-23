import { AnimatePresence, motion } from "motion/react";
import { Navigate, Route, Routes, useLocation } from "react-router";

import Login from "./features/auth/Login.jsx";

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
import Crew from "./features/admin/pages/Crew.jsx";
import MasterData from "./features/admin/pages/MasterData.jsx";

import ScrollToTop from "./components/ScrollToTop.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import { isUserAdmin } from "./utils/roleUtils.js";

// Smart root redirect — goes to dashboard if already logged in, else login page
function RootRedirect() {
  const { user, isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated && isUserAdmin(user)) {
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <Navigate to="/admin/login" replace />;
}

function App() {
  const location = useLocation();

  return (
    <>
      <ScrollToTop />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          className="route-stage"
          key={location.pathname}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28, ease: "easeOut" }}
        >
          <Routes location={location}>
            {/* Root — smart redirect based on auth state */}
            <Route path="/" element={<RootRedirect />} />

            {/* Admin login page */}
            <Route path="/admin/login" element={<Login />} />

            {/* Keep /login as alias */}
            <Route
              path="/login"
              element={<Navigate to="/admin/login" replace />}
            />

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
              path="/admin/crew"
              element={
                <AdminLayout>
                  <Crew />
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

            {/* Catch-all fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
    </>
  );
}

export default App;
