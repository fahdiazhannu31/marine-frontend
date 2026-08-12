import { createContext, useCallback, useContext, useRef, useState } from "react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [dialog, setDialog] = useState(null); // { title, message, confirmLabel, danger }
  const resolver = useRef(null);

  const confirm = useCallback((options) => {
    const {
      title = "Are you sure?",
      message = "",
      confirmLabel = "Confirm",
      cancelLabel = "Cancel",
      danger = false,
    } = typeof options === "string" ? { message: options } : options;

    setDialog({ title, message, confirmLabel, cancelLabel, danger });

    return new Promise((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const handleResolve = (value) => {
    setDialog(null);
    if (resolver.current) {
      resolver.current(value);
      resolver.current = null;
    }
  };

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {dialog && (
        <div
          className="adm-confirm-backdrop"
          role="alertdialog"
          aria-modal="true"
          onClick={() => handleResolve(false)}
        >
          <div
            className="adm-confirm-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>{dialog.title}</h3>
            {dialog.message && <p>{dialog.message}</p>}
            <div className="adm-confirm-actions">
              <button
                type="button"
                className="adm-btn adm-btn-secondary"
                onClick={() => handleResolve(false)}
              >
                {dialog.cancelLabel}
              </button>
              <button
                type="button"
                className={`adm-btn ${dialog.danger ? "adm-btn-danger" : "adm-btn-primary"}`}
                onClick={() => handleResolve(true)}
              >
                {dialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

/** Usage: const confirm = useConfirm(); const ok = await confirm("Delete this?"); */
export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within a ConfirmProvider");
  }
  return ctx;
}
