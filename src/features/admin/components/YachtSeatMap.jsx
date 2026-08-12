import "./YachtSeatMap.css";

/**
 * Yacht seat layout component with per-boat visual floor plans.
 *
 * Supported boats:
 *  - id 6  : LABRISA       (116 seats, 4+4 per row, 15 rows, row 15 right-side only)
 *  - id 8  : LA VELA/SEPA4 (49 seats,  row 1=AB+CD, rows 2-8=ABC+DEF, row 9=toilet+DEF)
 *  - id 10 : LA LUNA       (49 seats,  rows vary per image)
 *
 * When boat_id matches a known layout the component renders that specific floor plan.
 * Otherwise it falls back to the generic grid renderer.
 */

// ---------------------------------------------------------------------------
// Layout definitions
// Each row entry: { row, left: [...col letters], right: [...col letters] }
// "left" = port side (A-side), "right" = starboard side (D/E-side)
// A cell can also be { type: 'special', label: 'Toilet' } for non-seat cells
// ---------------------------------------------------------------------------

const BOAT_LAYOUTS = {
  // ── LABRISA (id 6) ───────────────────────────────────────────────────────
  6: {
    name: "LABRISA",
    shape: "pointed", // bow shape
    captainArea: true,
    rows: [
      { row: 1, left: ["A", "B", "C", "D"], right: ["E", "F", "G", "H"] },
      { row: 2, left: ["A", "B", "C", "D"], right: ["E", "F", "G", "H"] },
      { row: 3, left: ["A", "B", "C", "D"], right: ["E", "F", "G", "H"] },
      { row: 4, left: ["A", "B", "C", "D"], right: ["E", "F", "G", "H"] },
      { row: 5, left: ["A", "B", "C", "D"], right: ["E", "F", "G", "H"] },
      { row: 6, left: ["A", "B", "C", "D"], right: ["E", "F", "G", "H"] },
      { row: 7, left: ["A", "B", "C", "D"], right: ["E", "F", "G", "H"] },
      { row: 8, left: ["A", "B", "C", "D"], right: ["E", "F", "G", "H"] },
      { row: 9, left: ["A", "B", "C", "D"], right: ["E", "F", "G", "H"] },
      { row: 10, left: ["A", "B", "C", "D"], right: ["E", "F", "G", "H"] },
      { row: 11, left: ["A", "B", "C", "D"], right: ["E", "F", "G", "H"] },
      { row: 12, left: ["A", "B", "C", "D"], right: ["E", "F", "G", "H"] },
      { row: 13, left: ["A", "B", "C", "D"], right: ["E", "F", "G", "H"] },
      { row: 14, left: ["A", "B", "C", "D"], right: ["E", "F", "G", "H"] },
      { row: 15, left: [], right: ["E", "F", "G", "H"] },
    ],
  },

  // ── LA VELA / SEPA 4 (id 8) ──────────────────────────────────────────────
  8: {
    name: "LA VELA / SEPA 4",
    shape: "pointed",
    captainArea: true, // small captain box top-right
    rows: [
      { row: 1, left: ["A", "B"], right: ["C", "D"] },
      { row: 2, left: ["A", "B", "C"], right: ["D", "E", "F"] },
      { row: 3, left: ["A", "B", "C"], right: ["D", "E", "F"] },
      { row: 4, left: ["A", "B", "C"], right: ["D", "E", "F"] },
      { row: 5, left: ["A", "B", "C"], right: ["D", "E", "F"] },
      { row: 6, left: ["A", "B"], right: [null, "E", "F"] }, // D kosong (ghost), E/F sejajar dengan row 5
      { row: 7, left: ["A", "B", "C"], right: ["D", "E", "F"] },
      { row: 8, left: ["A", "B", "C"], right: ["D", "E", "F"] },
      // Row 9: toilet left side, DEF right side
      {
        row: 9,
        left: [{ type: "special", label: "Toilet" }],
        right: ["D", "E", "F"],
      },
    ],
  },

  // ── LA LUNA (id 10) ──────────────────────────────────────────────────────
  10: {
    name: "LA LUNA",
    shape: "rounded", // rounded bow
    captainArea: true, // captain chair top-right
    rows: [
      { row: 1, left: ["A", "B", "C"], right: ["D", "E", "F"] },
      { row: 2, left: ["A", "B", "C"], right: ["D", "E", "F"] },
      { row: 3, left: ["A", "B", "C"], right: ["D", "E", "F"] },
      { row: 4, left: ["A", "B", "C"], right: ["D", "E", "F"] },
      { row: 5, left: ["A", "B", "C"], right: ["D", "E", "F"] },
      { row: 6, left: ["A", "B", null], right: [null, "E", "F"] },
      { row: 7, left: ["A", "B", "C"], right: ["D", "E", "F"] },
      { row: 8, left: ["A", "B", "C"], right: ["D", "E", "F"] },
      { row: 9, left: [], right: ["D", "E", "F"] }, // left side = storage/toilet
    ],
  },

  // ── MOLA-MOLA / MARINA SRIKANDI (id 14) ──────────────────────────────────
  // BAWAH deck: rows 1-14
  // - Row 1: ABC (left) | gap (center) | DEF (right) - 6 seats total
  // - Rows 2-13: ABCDE (left) | FGHIJ (right) - 10 seats per row
  // - Row 14: ABC (left) | gap | DEF (right) - 6 seats
  // ATAS deck: rows 15-22
  // - All rows: ABC (left) | DEF (right) - 6 seats per row
  14: {
    name: "MOLA-MOLA / MARINA SRIKANDI",
    shape: "pointed",
    captainArea: true,
    twoDecks: true, // custom flag used by renderer
    deckSplit: 15, // row >= 15 is ATAS deck
    rows: [
      // BAWAH DECK
      // Row 1: ABC | _ _ | DEF (ada gap di tengah seperti gambar)
      { row: 1, left: ["A", "B", "C"], right: [null, "D", "E", "F"] },
      // Rows 2-13: ABCDE | FGHIJ (full 10 seats)
      {
        row: 2,
        left: ["A", "B", "C", "D", "E"],
        right: ["F", "G", "H", "I", "J"],
      },
      {
        row: 3,
        left: ["A", "B", "C", "D", "E"],
        right: ["F", "G", "H", "I", "J"],
      },
      {
        row: 4,
        left: ["A", "B", "C", "D", "E"],
        right: ["F", "G", "H", "I", "J"],
      },
      {
        row: 5,
        left: ["A", "B", "C", "D", "E"],
        right: ["F", "G", "H", "I", "J"],
      },
      {
        row: 6,
        left: ["A", "B", "C", "D", "E"],
        right: ["F", "G", "H", "I", "J"],
      },
      {
        row: 7,
        left: ["A", "B", "C", "D", "E"],
        right: ["F", "G", "H", "I", "J"],
      },
      {
        row: 8,
        left: ["A", "B", "C", "D", "E"],
        right: ["F", "G", "H", "I", "J"],
      },
      {
        row: 9,
        left: ["A", "B", "C", "D", "E"],
        right: ["F", "G", "H", "I", "J"],
      },
      {
        row: 10,
        left: ["A", "B", "C", "D", "E"],
        right: ["F", "G", "H", "I", "J"],
      },
      {
        row: 11,
        left: ["A", "B", "C", "D", "E"],
        right: ["F", "G", "H", "I", "J"],
      },
      {
        row: 12,
        left: ["A", "B", "C", "D", "E"],
        right: ["F", "G", "H", "I", "J"],
      },
      {
        row: 13,
        left: ["A", "B", "C", "D", "E"],
        right: ["F", "G", "H", "I", "J"],
      },
      // Row 14: ABC | _ 14 _ | DEF (ada gap + row label di tengah)
      { row: 14, left: ["A", "B", "C"], right: [null, "D", "E", "F"] },
      // ATAS DECK (upper deck)
      { row: 15, left: ["A", "B", "C"], right: ["D", "E", "F"] },
      { row: 16, left: ["A", "B", "C"], right: ["D", "E", "F"] },
      { row: 17, left: ["A", "B", "C"], right: ["D", "E", "F"] },
      { row: 18, left: ["A", "B", "C"], right: ["D", "E", "F"] },
      { row: 19, left: ["A", "B", "C"], right: ["D", "E", "F"] },
      { row: 20, left: ["A", "B", "C"], right: ["D", "E", "F"] },
      { row: 21, left: ["A", "B", "C"], right: ["D", "E", "F"] },
      { row: 22, left: ["A", "B", "C"], right: ["D", "E", "F"] },
    ],
  },
};

// ---------------------------------------------------------------------------
// Bow brand color → CSS class mapping
// ---------------------------------------------------------------------------
const getBowClass = (boatId, boatName) => {
  const name = (boatName || "").toLowerCase();
  if (name.includes("la luna")) return "boat-la-luna";
  if (name.includes("la vela")) return "boat-la-vela";
  if (name.includes("la brisa")) return "boat-la-brisa";
  if (name.includes("mola")) return "boat-mola-mola";
  if (name.includes("la casa")) return "boat-la-casa";
  if (name.includes("alma")) return "boat-alma";
  // Fallback by id
  if (boatId === 10) return "boat-la-luna";
  if (boatId === 8) return "boat-la-vela";
  if (boatId === 6) return "boat-la-brisa";
  if (boatId === 14) return "boat-mola-mola";
  return "";
};
const makeSeatNumber = (row, col) => `${row}${col}`;

/**
 * SVG icon — top-down view of a seat.
 * color: CSS fill color string
 * label: seat number text (short, e.g. "1A")
 */
const SeatIcon = ({ color, borderColor, label }) => (
  <svg
    viewBox="0 0 40 46"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
    style={{ display: "block", width: "100%", height: "100%" }}
  >
    {/* Flip all shapes vertically so seat faces up (toward bow) */}
    <g transform="scale(1,-1) translate(0,-46)">
      {/* Headrest */}
      <rect
        x="6"
        y="2"
        width="28"
        height="10"
        rx="4"
        fill={color}
        stroke={borderColor}
        strokeWidth="1.8"
      />
      {/* Seat back */}
      <rect
        x="3"
        y="13"
        width="34"
        height="16"
        rx="4"
        fill={color}
        stroke={borderColor}
        strokeWidth="1.8"
      />
      {/* Seat base */}
      <rect
        x="6"
        y="30"
        width="28"
        height="12"
        rx="3"
        fill={color}
        stroke={borderColor}
        strokeWidth="1.8"
        opacity="0.75"
      />
      {/* Armrests */}
      <rect
        x="0"
        y="14"
        width="4"
        height="12"
        rx="2"
        fill={color}
        stroke={borderColor}
        strokeWidth="1.5"
      />
      <rect
        x="36"
        y="14"
        width="4"
        height="12"
        rx="2"
        fill={color}
        stroke={borderColor}
        strokeWidth="1.5"
      />
    </g>
    {/* Label text — rendered after flip so text stays readable */}
    <text
      x="20"
      y="26"
      textAnchor="middle"
      dominantBaseline="middle"
      fontSize="9"
      fontWeight="700"
      fontFamily="system-ui, sans-serif"
      fill="rgba(0,0,0,0.72)"
      letterSpacing="0.3"
    >
      {label}
    </text>
  </svg>
);

export default function YachtSeatMap({
  seats = [],
  selectedSeats = [],
  onSeatToggle = () => {},
  maxSeats = null,
  paymentId = null,
  bookedSeats = [],
  isLocked = false,
  boatId = null,
  highlightMode = false,
}) {
  const canSelectMore = !maxSeats || selectedSeats.length < maxSeats;

  // ── Status helpers (same MVC mirror logic as before) ────────────────────
  const getSeatBookingStatus = (seatId) => {
    const bookedSeat = bookedSeats.find((bs) => bs.seat_id === seatId);
    if (!bookedSeat) return "available";
    if (bookedSeat.payment_id === paymentId) return "booked-current";
    return "booked-other";
  };

  const handleSeatClick = (seatId, bookingStatus) => {
    if (isLocked) return;
    if (bookingStatus === "booked-current" || bookingStatus === "booked-other")
      return;
    const isSelected = selectedSeats.includes(seatId);
    if (!isSelected && !canSelectMore) return;
    onSeatToggle(seatId);
  };

  const getSeatClass = (seatId, bookingStatus) => {
    if (selectedSeats.includes(seatId))
      return highlightMode ? "seat-highlighted" : "seat-selected";
    if (bookingStatus === "booked-current") return "seat-booked-current";
    if (bookingStatus === "booked-other") return "seat-booked-other";
    return "seat-available";
  };

  // ── Resolve seat object by seat_number so we can map layout → real seat id
  const seatByNumber = {};
  seats.forEach((s) => {
    seatByNumber[s.seat_number] = s;
  });

  // ── Render a single seat button ─────────────────────────────────────────
  const SEAT_COLORS = {
    available: { fill: "#a8d5ba", border: "#7ec997" },
    selected: { fill: "#fdd835", border: "#f9a825" },
    highlighted: { fill: "#ba68c8", border: "#8e24aa" }, // Purple for group highlight
    "booked-current": { fill: "#64b5f6", border: "#1e88e5" },
    "booked-other": { fill: "#ef5350", border: "#c62828" },
    placeholder: { fill: "#e0e0e0", border: "#bdbdbd" },
  };

  const renderSeat = (seatNumber) => {
    const seat = seatByNumber[seatNumber];
    if (!seat) {
      const { fill, border } = SEAT_COLORS.placeholder;
      return (
        <div
          key={seatNumber}
          className="seat seat-icon-wrap seat-placeholder"
          title={seatNumber}
          aria-label={`Seat ${seatNumber} (unavailable)`}
        >
          <SeatIcon color={fill} borderColor={border} label={seatNumber} />
        </div>
      );
    }

    const bookingStatus = getSeatBookingStatus(seat.id);
    const isSelected = selectedSeats.includes(seat.id);
    const statusKey = isSelected
      ? highlightMode
        ? "highlighted"
        : "selected"
      : bookingStatus;
    const { fill, border } = SEAT_COLORS[statusKey] ?? SEAT_COLORS.available;
    const canClick = (bookingStatus === "available" || isSelected) && !isLocked;

    return (
      <button
        key={seat.id}
        className={`seat seat-icon-wrap ${canClick ? "clickable" : "disabled"}`}
        onClick={() => handleSeatClick(seat.id, bookingStatus)}
        disabled={!canClick}
        title={
          isLocked
            ? `${seatNumber} – LOCKED`
            : `${seatNumber} – ${bookingStatus}`
        }
        aria-label={`Seat ${seatNumber}`}
      >
        <SeatIcon color={fill} borderColor={border} label={seatNumber} />
      </button>
    );
  };

  // ── Render special cell (Toilet, etc.) ──────────────────────────────────
  const renderSpecial = (cell) => (
    <div key={cell.label} className="seat seat-special">
      <span className="seat-special-label">{cell.label}</span>
    </div>
  );

  // ── Generic fallback renderer (no known layout) ─────────────────────────
  const renderGenericGrid = () => {
    // Group by row number parsed from seat_number (e.g. "3A" → row 3, col "A")
    const rowMap = {};
    seats.forEach((s) => {
      const match = s.seat_number?.match(/^(\d+)([A-Z]+)$/);
      if (!match) return;
      const [, row, col] = match;
      if (!rowMap[row]) rowMap[row] = [];
      rowMap[row].push({ ...s, col });
    });

    return (
      <div className="floor-plan floor-plan-generic">
        {Object.keys(rowMap)
          .sort((a, b) => Number(a) - Number(b))
          .map((row) => (
            <div key={row} className="fp-row">
              <span className="fp-row-num">{row}</span>
              <div className="fp-seats">
                {rowMap[row]
                  .sort((a, b) => a.col.localeCompare(b.col))
                  .map((s) => renderSeat(s.seat_number))}
              </div>
            </div>
          ))}
      </div>
    );
  };

  // ── Per-boat layout renderer ─────────────────────────────────────────────
  const renderBoatLayout = (layout) => {
    // Hitung max kolom kiri dan kanan dari semua rows
    // (abaikan special cells seperti Toilet saat hitung kolom)
    const maxLeft = Math.max(
      ...layout.rows.map(
        ({ left }) => left.filter((c) => typeof c === "string").length,
      ),
    );
    const maxRight = Math.max(
      ...layout.rows.map(
        ({ right }) => right.filter((c) => typeof c === "string").length,
      ),
    );

    // Render ghost seat (disabled, ada tanda X)
    const renderGhost = (key) => (
      <div
        key={key}
        className="seat seat-icon-wrap seat-ghost"
        aria-hidden="true"
      >
        <SeatIcon color="#e8e8e8" borderColor="#cccccc" label="×" />
      </div>
    );

    // Render sisi kiri dengan padding ghost di KIRI (posisi A,B,C tetap di kanan/aisle)
    const renderLeftSide = (row, left) => {
      const hasExplicitGap = left.some((c) => c === null);

      let slots;
      if (hasExplicitGap) {
        // Posisi eksplisit: index di array = index slot, tidak di-reposisi otomatis
        slots = left.map((c) => {
          if (c === null) return null;
          if (typeof c === "string") return { type: "seat", col: c };
          return { type: "special", cell: c };
        });
        // Pad kalau arraynya lebih pendek dari maxLeft (jaga-jaga)
        while (slots.length < maxLeft) slots.unshift(null);
      } else {
        slots = Array(maxLeft).fill(null);
        const seats = left.filter((c) => typeof c === "string");
        const specials = left.filter((c) => c && typeof c !== "string");
        seats.forEach((col, i) => {
          slots[maxLeft - 1 - i] = { type: "seat", col };
        });
        specials.forEach((cell) => {
          const emptyIdx = slots.findIndex((s) => s === null);
          if (emptyIdx !== -1) slots[emptyIdx] = { type: "special", cell };
        });
      }

      return (
        <div className="fp-side fp-side-left">
          {slots.map((slot, i) => {
            if (slot === null) return renderGhost(`ghost-l-${row}-${i}`);
            if (slot.type === "special") return renderSpecial(slot.cell);
            return renderSeat(makeSeatNumber(row, slot.col));
          })}
        </div>
      );
    };

    const renderRightSide = (row, right) => {
      const hasExplicitGap = right.some((c) => c === null);

      let slots;
      if (hasExplicitGap) {
        slots = right.map((c) => {
          if (c === null) return null;
          if (typeof c === "string") return { type: "seat", col: c };
          return { type: "special", cell: c };
        });
        while (slots.length < maxRight) slots.push(null);
      } else {
        slots = Array(maxRight).fill(null);
        const seats = right.filter((c) => typeof c === "string");
        const specials = right.filter((c) => c && typeof c !== "string");
        seats.forEach((col, i) => {
          slots[i] = { type: "seat", col };
        });
        specials.forEach((cell) => {
          const emptyIdx = slots.findLastIndex((s) => s === null);
          if (emptyIdx !== -1) slots[emptyIdx] = { type: "special", cell };
        });
      }

      return (
        <div className="fp-side fp-side-right">
          {slots.map((slot, i) => {
            if (slot === null) return renderGhost(`ghost-r-${row}-${i}`);
            if (slot.type === "special") return renderSpecial(slot.cell);
            return renderSeat(makeSeatNumber(row, slot.col));
          })}
        </div>
      );
    };

    // For two-deck boats, split rows into BAWAH and ATAS
    const bawahRows = layout.twoDecks
      ? layout.rows.filter((r) => r.row < layout.deckSplit)
      : layout.rows;
    const atasRows = layout.twoDecks
      ? layout.rows.filter((r) => r.row >= layout.deckSplit)
      : [];

    const bowClass = getBowClass(boatId, layout.name);

    return (
      <div
        className={`floor-plan floor-plan-boat shape-${layout.shape} ${bowClass}`}
      >
        {/* Bow — always shows NAMA MARINE branding */}
        <div className="fp-bow">
          <div className="fp-bow-logo">
            <span className="fp-bow-brand-nama">NAMA</span>
            <span className="fp-bow-brand-dot" />
            <span className="fp-bow-brand-marine">Marine</span>
          </div>
        </div>

        {/* Captain area — positioned in same grid as seat rows */}
        {layout.captainArea && (
          <div className="fp-rows fp-captain-row-wrap">
            <div className="fp-row">
              <div className="fp-side fp-side-left" />
              <div className="fp-aisle fp-aisle-captain" />
              <div className="fp-side fp-side-right fp-captain-cell">
                <div className="fp-row-box">Captain</div>
              </div>
            </div>
          </div>
        )}

        {/* BAWAH Deck */}
        {layout.twoDecks && (
          <div
            style={{
              width: "100%",
              textAlign: "center",
              padding: "12px 0 8px",
              fontSize: "13px",
              fontWeight: 700,
              color: "rgba(17, 17, 17, 0.6)",
              letterSpacing: "1px",
              textTransform: "uppercase",
              background: "rgba(189, 189, 189, 0.15)",
              borderRadius: "6px 6px 0 0",
              marginTop: "8px",
            }}
          >
            🔻 Deck BAWAH (Main Deck)
          </div>
        )}

        {/* BAWAH seat rows */}
        <div className="fp-rows">
          {bawahRows.map(({ row, left, right }) => (
            <div key={row} className="fp-row">
              {renderLeftSide(row, left)}
              <div className="fp-aisle">
                <span className="fp-row-num">{row}</span>
              </div>
              {renderRightSide(row, right)}
            </div>
          ))}
        </div>

        {/* ATAS Deck separator and rows */}
        {atasRows.length > 0 && (
          <>
            <div
              style={{
                width: "100%",
                textAlign: "center",
                padding: "12px 0 8px",
                fontSize: "13px",
                fontWeight: 700,
                color: "rgba(17, 17, 17, 0.6)",
                letterSpacing: "1px",
                textTransform: "uppercase",
                background: "rgba(66, 165, 245, 0.15)",
                borderRadius: "6px 6px 0 0",
                marginTop: "16px",
                borderTop: "3px solid rgba(66, 165, 245, 0.5)",
              }}
            >
              🔺 Deck ATAS (Upper Deck)
            </div>
            <div className="fp-rows">
              {atasRows.map(({ row, left, right }) => (
                <div key={row} className="fp-row">
                  {renderLeftSide(row, left)}
                  <div className="fp-aisle">
                    <span className="fp-row-num">{row}</span>
                  </div>
                  {renderRightSide(row, right)}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Stern */}
        <div className="fp-stern" />
      </div>
    );
  };

  const layout = boatId ? BOAT_LAYOUTS[boatId] : null;

  return (
    <div className="yacht-seat-map">
      {/* Legend */}
      <div className="seat-legend">
        {[
          { label: "Available", fill: "#a8d5ba", border: "#7ec997" },
          ...(highlightMode
            ? [
                {
                  label: "Group Highlighted",
                  fill: "#ba68c8",
                  border: "#8e24aa",
                },
              ]
            : [{ label: "Selected", fill: "#fdd835", border: "#f9a825" }]),
          { label: "Booked (this order)", fill: "#64b5f6", border: "#1e88e5" },
          { label: "Booked (other)", fill: "#ef5350", border: "#c62828" },
        ].map(({ label, fill, border }) => (
          <div key={label} className="legend-item">
            <span className="legend-icon">
              <SeatIcon color={fill} borderColor={border} label="" />
            </span>
            <span>{label}</span>
          </div>
        ))}
      </div>

      {/* Floor plan */}
      {layout ? renderBoatLayout(layout) : renderGenericGrid()}

      {/* Selection counter */}
      {maxSeats && (
        <div className="selection-info">
          Selected:{" "}
          <strong>
            {selectedSeats.length} / {maxSeats}
          </strong>{" "}
          seats
        </div>
      )}
    </div>
  );
}
