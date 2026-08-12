import { useEffect, useState } from "react";
import { API_URL } from "../../../config/BaseUrl.js";
import {
  fetchBoats,
  createBoat,
  updateBoat,
  deleteBoat,
  fetchSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  fetchPackagesAdmin,
  createPackage,
  updatePackage,
  deletePackage,
} from "../services/masterDataService.js";
import { formatRupiah } from "../../packages/formatRupiah.js";
import { useToast } from "../ui/ToastContext.jsx";
import { useConfirm } from "../ui/ConfirmContext.jsx";

const TABS = [
  { key: "boats", label: "Boats" },
  { key: "packages", label: "Packages" },
  { key: "schedules", label: "Schedules" },
];

// ── Boats tab ──────────────────────────────────────────────────────

function emptyBoatForm() {
  return { id: null, boat_name: "", capacity: "", photo1: null };
}

function BoatsTab() {
  const toast = useToast();
  const confirm = useConfirm();

  const [boats, setBoats] = useState([]);
  const [status, setStatus] = useState("loading");
  const [form, setForm] = useState(emptyBoatForm());
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setStatus("loading");
    fetchBoats()
      .then((data) => {
        setBoats(data);
        setStatus("ready");
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg("Failed to load boats");
        setStatus("error");
      });
  };

  useEffect(load, []);

  const startCreate = () => {
    setForm(emptyBoatForm());
    setShowForm(true);
    setErrorMsg("");
  };

  const startEdit = (boat) => {
    setForm({
      id: boat.id,
      boat_name: boat.boat_name,
      capacity: boat.capacity,
      photo1: null,
    });
    setShowForm(true);
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    try {
      if (form.id) {
        await updateBoat(form.id, form);
        toast.success("Boat updated.");
      } else {
        await createBoat(form);
        toast.success("Boat created.");
      }
      setShowForm(false);
      load();
    } catch (err) {
      setErrorMsg(err.message || "Failed to save boat");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (boat) => {
    const ok = await confirm({
      title: `Delete boat "${boat.boat_name}"?`,
      message: "This can't be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteBoat(boat.id);
      toast.success("Boat deleted.");
      load();
    } catch (err) {
      toast.error(err.message || "Failed to delete boat");
    }
  };

  if (status === "loading") return <div className="adm-loading">Loading boats...</div>;
  if (status === "error")
    return <div className="adm-alert adm-alert-danger">{errorMsg}</div>;

  return (
    <div>
      <div className="adm-page-header-actions" style={{ marginBottom: 16, justifyContent: "flex-end" }}>
        <button className="adm-btn adm-btn-primary" onClick={startCreate}>
          + Add Boat
        </button>
      </div>

      {showForm && (
        <form className="adm-form" onSubmit={handleSubmit}>
          <h3>{form.id ? "Edit Boat" : "New Boat"}</h3>
          {errorMsg && <p className="adm-alert adm-alert-danger" style={{ marginBottom: 16 }}>{errorMsg}</p>}
          <div className="adm-form-row">
            <div className="adm-field">
              <label>Boat Name</label>
              <input
                type="text"
                value={form.boat_name}
                onChange={(e) => setForm({ ...form, boat_name: e.target.value })}
                required
              />
            </div>
            <div className="adm-field">
              <label>Capacity</label>
              <input
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="adm-field">
            <label>Photo</label>
            <input
              type="file"
              accept="image/jpeg,image/png"
              onChange={(e) =>
                setForm({ ...form, photo1: e.target.files?.[0] || null })
              }
            />
          </div>
          <p className="adm-field-hint">
            Leave empty to keep the existing photo when editing. This photo
            is only used internally (admin panel); the public Fleet page
            uses its own separate content.
          </p>
          <div className="adm-form-actions">
            <button
              type="button"
              className="adm-btn adm-btn-secondary"
              onClick={() => setShowForm(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Boat Name</th>
              <th>Capacity</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {boats.map((b) => (
              <tr key={b.id}>
                <td>
                  {b.photo1 ? (
                    <img
                      className="adm-thumb"
                      src={`${API_URL}/assets_users/images/${b.photo1}`}
                      alt={b.boat_name}
                    />
                  ) : (
                    <span className="adm-cell-muted">-</span>
                  )}
                </td>
                <td>{b.boat_name}</td>
                <td>{b.capacity}</td>
                <td className="adm-row-actions">
                  <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => startEdit(b)}>
                    Edit
                  </button>
                  <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => handleDelete(b)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Packages tab ───────────────────────────────────────────────────

function emptyPackageForm() {
  return {
    id: null,
    title: "",
    description: "",
    price_per_pax: "",
    price_per_pax_weekend: "",
    pax_count: "",
    status: "active",
    photo1: null,
    photo2: null,
    photo3: null,
  };
}

function PackagesTab() {
  const toast = useToast();
  const confirm = useConfirm();

  const [packages, setPackages] = useState([]);
  const [status, setStatus] = useState("loading");
  const [form, setForm] = useState(emptyPackageForm());
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setStatus("loading");
    fetchPackagesAdmin()
      .then((data) => {
        setPackages(data);
        setStatus("ready");
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg("Failed to load packages");
        setStatus("error");
      });
  };

  useEffect(load, []);

  const startCreate = () => {
    setForm(emptyPackageForm());
    setShowForm(true);
    setErrorMsg("");
  };

  const startEdit = (pkg) => {
    setForm({
      id: pkg.id,
      title: pkg.title,
      description: pkg.description || "",
      price_per_pax: pkg.price_per_pax,
      price_per_pax_weekend: pkg.price_per_pax_weekend || "",
      pax_count: pkg.pax_count,
      status: pkg.status || "active",
      photo1: null,
      photo2: null,
      photo3: null,
    });
    setShowForm(true);
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    try {
      if (form.id) {
        await updatePackage(form.id, form);
        toast.success("Package updated.");
      } else {
        await createPackage(form);
        toast.success("Package created.");
      }
      setShowForm(false);
      load();
    } catch (err) {
      setErrorMsg(err.message || "Failed to save package");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (pkg) => {
    const ok = await confirm({
      title: `Delete package "${pkg.title}"?`,
      message: "This can't be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await deletePackage(pkg.id);
      toast.success("Package deleted.");
      load();
    } catch (err) {
      toast.error(err.message || "Failed to delete package");
    }
  };

  if (status === "loading")
    return <div className="adm-loading">Loading packages...</div>;
  if (status === "error")
    return <div className="adm-alert adm-alert-danger">{errorMsg}</div>;

  return (
    <div>
      <div className="adm-page-header-actions" style={{ marginBottom: 16, justifyContent: "flex-end" }}>
        <button className="adm-btn adm-btn-primary" onClick={startCreate}>
          + Add Package
        </button>
      </div>

      {showForm && (
        <form className="adm-form" onSubmit={handleSubmit}>
          <h3>{form.id ? "Edit Package" : "New Package"}</h3>
          {errorMsg && <p className="adm-alert adm-alert-danger" style={{ marginBottom: 16 }}>{errorMsg}</p>}

          <div className="adm-field">
            <label>Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>

          <div className="adm-field">
            <label>Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </div>

          <div className="adm-form-row">
            <div className="adm-field">
              <label>Price / Pax</label>
              <input
                type="number"
                min={0}
                value={form.price_per_pax}
                onChange={(e) =>
                  setForm({ ...form, price_per_pax: e.target.value })
                }
                required
              />
            </div>
            <div className="adm-field">
              <label>Price / Pax (Weekend)</label>
              <input
                type="number"
                min={0}
                value={form.price_per_pax_weekend}
                onChange={(e) =>
                  setForm({ ...form, price_per_pax_weekend: e.target.value })
                }
              />
            </div>
          </div>

          <div className="adm-form-row">
            <div className="adm-field">
              <label>Pax Count (slot)</label>
              <input
                type="number"
                min={0}
                value={form.pax_count}
                onChange={(e) => setForm({ ...form, pax_count: e.target.value })}
                required
              />
            </div>
            <div className="adm-field">
              <label>Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="adm-form-row">
            {["photo1", "photo2", "photo3"].map((key) => (
              <div className="adm-field" key={key}>
                <label>
                  {key === "photo1" ? "Photo 1" : key === "photo2" ? "Photo 2" : "Photo 3"}
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={(e) =>
                    setForm({ ...form, [key]: e.target.files?.[0] || null })
                  }
                />
              </div>
            ))}
          </div>
          <p className="adm-field-hint">
            Leave a photo field empty to keep the existing image when editing.
          </p>

          <div className="adm-form-actions">
            <button
              type="button"
              className="adm-btn adm-btn-secondary"
              onClick={() => setShowForm(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Photo</th>
              <th>Title</th>
              <th>Price/Pax</th>
              <th>Slots</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {packages.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.photo1 ? (
                    <img
                      className="adm-thumb"
                      src={`${API_URL}/assets_users/images/${p.photo1}`}
                      alt={p.title}
                    />
                  ) : (
                    <span className="adm-cell-muted">-</span>
                  )}
                </td>
                <td>{p.title}</td>
                <td>{formatRupiah(p.price_per_pax)}</td>
                <td>{p.pax_count}</td>
                <td>
                  <span
                    className={`adm-badge ${
                      p.status === "active" ? "adm-badge-success" : "adm-badge-neutral"
                    }`}
                  >
                    {p.status}
                  </span>
                </td>
                <td className="adm-row-actions">
                  <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => startEdit(p)}>
                    Edit
                  </button>
                  <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => handleDelete(p)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Schedules tab ──────────────────────────────────────────────────

function emptyScheduleForm() {
  return { id: null, boat_id: "", type: "DEPARTURE", date: "", total_pax: "" };
}

function toDatetimeLocal(value) {
  if (!value) return "";
  const d = new Date(value.replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

function toMysqlDatetime(value) {
  return value ? value.replace("T", " ") + ":00" : "";
}

function SchedulesTab() {
  const toast = useToast();
  const confirm = useConfirm();

  const [schedules, setSchedules] = useState([]);
  const [boats, setBoats] = useState([]);
  const [status, setStatus] = useState("loading");
  const [form, setForm] = useState(emptyScheduleForm());
  const [showForm, setShowForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [saving, setSaving] = useState(false);

  const load = () => {
    setStatus("loading");
    Promise.all([fetchSchedules(), fetchBoats()])
      .then(([sch, bt]) => {
        setSchedules(sch);
        setBoats(bt);
        setStatus("ready");
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg("Failed to load schedules");
        setStatus("error");
      });
  };

  useEffect(load, []);

  const startCreate = () => {
    setForm(emptyScheduleForm());
    setShowForm(true);
    setErrorMsg("");
  };

  const startEdit = (s) => {
    setForm({
      id: s.id,
      boat_id: s.boat_id,
      type: s.type,
      date: toDatetimeLocal(s.date),
      total_pax: s.total_pax,
    });
    setShowForm(true);
    setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg("");
    try {
      const payload = {
        boat_id: Number(form.boat_id),
        type: form.type,
        date: toMysqlDatetime(form.date),
        total_pax: form.total_pax === "" ? undefined : Number(form.total_pax),
      };
      if (form.id) {
        await updateSchedule(form.id, payload);
        toast.success("Schedule updated.");
      } else {
        await createSchedule(payload);
        toast.success("Schedule created.");
      }
      setShowForm(false);
      load();
    } catch (err) {
      setErrorMsg(err.message || "Failed to save schedule");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (s) => {
    const ok = await confirm({
      title: `Delete this ${s.type.toLowerCase()} schedule?`,
      message: "This can't be undone.",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await deleteSchedule(s.id);
      toast.success("Schedule deleted.");
      load();
    } catch (err) {
      toast.error(err.message || "Failed to delete schedule");
    }
  };

  if (status === "loading")
    return <div className="adm-loading">Loading schedules...</div>;
  if (status === "error")
    return <div className="adm-alert adm-alert-danger">{errorMsg}</div>;

  return (
    <div>
      <div className="adm-page-header-actions" style={{ marginBottom: 16, justifyContent: "flex-end" }}>
        <button className="adm-btn adm-btn-primary" onClick={startCreate}>
          + Add Schedule
        </button>
      </div>

      {showForm && (
        <form className="adm-form" onSubmit={handleSubmit}>
          <h3>{form.id ? "Edit Schedule" : "New Schedule"}</h3>
          {errorMsg && <p className="adm-alert adm-alert-danger" style={{ marginBottom: 16 }}>{errorMsg}</p>}

          <div className="adm-form-row">
            <div className="adm-field">
              <label>Boat</label>
              <select
                value={form.boat_id}
                onChange={(e) => setForm({ ...form, boat_id: e.target.value })}
                required
              >
                <option value="">Select boat…</option>
                {boats.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.boat_name} (cap. {b.capacity})
                  </option>
                ))}
              </select>
            </div>
            <div className="adm-field">
              <label>Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
              >
                <option value="DEPARTURE">Departure</option>
                <option value="RETURN">Return</option>
              </select>
            </div>
          </div>

          <div className="adm-form-row">
            <div className="adm-field">
              <label>Date &amp; Time</label>
              <input
                type="datetime-local"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
            <div className="adm-field">
              <label>Available Slots</label>
              <input
                type="number"
                min={0}
                placeholder="Defaults to boat capacity"
                value={form.total_pax}
                onChange={(e) =>
                  setForm({ ...form, total_pax: e.target.value })
                }
              />
            </div>
          </div>

          <div className="adm-form-actions">
            <button
              type="button"
              className="adm-btn adm-btn-secondary"
              onClick={() => setShowForm(false)}
              disabled={saving}
            >
              Cancel
            </button>
            <button type="submit" className="adm-btn adm-btn-primary" disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </form>
      )}

      <div className="adm-table-wrap">
        <table className="adm-table">
          <thead>
            <tr>
              <th>Boat</th>
              <th>Type</th>
              <th>Date</th>
              <th>Slots Left</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {schedules.map((s) => (
              <tr key={s.id}>
                <td>{s.boat_name || "N/A"}</td>
                <td>{s.type === "RETURN" ? "Return" : "Departure"}</td>
                <td>
                  {s.date
                    ? new Date(s.date).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </td>
                <td>
                  {s.total_pax}/{s.capacity}
                </td>
                <td className="adm-row-actions">
                  <button className="adm-btn adm-btn-secondary adm-btn-sm" onClick={() => startEdit(s)}>
                    Edit
                  </button>
                  <button className="adm-btn adm-btn-danger adm-btn-sm" onClick={() => handleDelete(s)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────

export default function MasterData() {
  const [activeTab, setActiveTab] = useState("boats");

  return (
    <div className="adm-page">
      <div className="adm-page-header">
        <div>
          <h1>Master Data</h1>
          <p>
            Manage boats, packages, and schedules used throughout the
            booking flow.
          </p>
        </div>
      </div>

      <div className="adm-tabs">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            className={`adm-tab ${activeTab === tab.key ? "adm-tab-active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="adm-tab-content">
        {activeTab === "boats" && <BoatsTab />}
        {activeTab === "packages" && <PackagesTab />}
        {activeTab === "schedules" && <SchedulesTab />}
      </div>
    </div>
  );
}
