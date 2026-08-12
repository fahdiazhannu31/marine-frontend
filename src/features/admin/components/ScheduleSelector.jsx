import "./ScheduleSelector.css";

/**
 * ScheduleSelector Component
 * Allows user to choose between Departure or Return schedule for round-trip bookings
 * Mirrors MVC flow where user must select which leg to assign seats to
 */
export default function ScheduleSelector({
  selectedType = "departure",
  onTypeChange = () => {},
}) {
  return (
    <div className="schedule-selector">
      <p className="selector-label">📅 Select Schedule</p>
      <div className="selector-buttons">
        <button
          className={`selector-btn ${selectedType === "departure" ? "active" : ""}`}
          onClick={() => onTypeChange("departure")}
        >
          <span className="btn-icon">🚢</span>
          <span className="btn-text">Departure</span>
          <span className="btn-desc">Outbound journey</span>
        </button>
        <button
          className={`selector-btn ${selectedType === "return" ? "active" : ""}`}
          onClick={() => onTypeChange("return")}
        >
          <span className="btn-icon">🚢↩️</span>
          <span className="btn-text">Return</span>
          <span className="btn-desc">Return journey</span>
        </button>
      </div>
      <p className="selector-hint">
        💡 Choose which leg of the journey to assign seats for
      </p>
    </div>
  );
}
