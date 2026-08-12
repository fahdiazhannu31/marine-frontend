import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import "./QRScanner.css";

/**
 * QR Scanner Component
 * Uses device camera to scan QR codes
 * Calls onScan(data) when QR code is detected
 * 
 * QR data format: "NAMA_MARINE_TICKET_{booking_id}"
 */
export default function QRScannerComponent({
  onScan = () => {},
  onError = () => {},
  onClose = () => {},
}) {
  const videoRef = useRef(null);
  const [scanner, setScanner] = useState(null);
  const [isScanning, setIsScanning] = useState(true);
  const [error, setError] = useState("");
  const [lastScanned, setLastScanned] = useState("");

  useEffect(() => {
    if (!videoRef.current) return;

    // Debounce to avoid multiple scans of same QR in quick succession
    let scanTimeout;

    const handleScan = (result) => {
      if (!result) return;

      const scannedData = result.data;
      
      // Check if it's a booking ticket QR code
      if (scannedData.includes("NAMA_MARINE_TICKET_")) {
        // Prevent duplicate scans within 2 seconds
        if (lastScanned === scannedData) {
          return;
        }

        setLastScanned(scannedData);
        clearTimeout(scanTimeout);

        // Extract booking ID from QR data
        const bookingId = scannedData.replace("NAMA_MARINE_TICKET_", "");
        
        console.log("[QRScanner] Scanned booking ID:", bookingId);
        onScan(parseInt(bookingId));

        // Reset last scanned after 2 seconds to allow re-scanning same ticket
        scanTimeout = setTimeout(() => {
          setLastScanned("");
        }, 2000);
      }
    };

    const handleError = (error) => {
      console.error("[QRScanner] Error:", error);
      // Don't show error for common issues like no camera permission immediately
      if (error.name !== "PermissionDeniedError") {
        setError(error.message);
        onError(error);
      }
    };

    try {
      // Create scanner instance
      const qrScanner = new QrScanner(
        videoRef.current,
        handleScan,
        {
          onDecodeError: () => {
            // Silent - no QR found in frame
          },
          maxScansPerSecond: 5,
          preferredCamera: "environment", // Use back camera on mobile
        }
      );

      setScanner(qrScanner);

      // Start scanning
      qrScanner.start().catch((err) => {
        console.error("[QRScanner] Failed to start:", err);
        setError("Camera access denied. Please allow camera permission.");
        onError(err);
      });

      return () => {
        qrScanner.destroy();
      };
    } catch (err) {
      console.error("[QRScanner] Setup error:", err);
      setError(err.message);
      onError(err);
    }
  }, [onScan, onError, lastScanned]);

  const toggleScanning = () => {
    if (scanner) {
      if (isScanning) {
        scanner.stop();
      } else {
        scanner.start();
      }
      setIsScanning(!isScanning);
    }
  };

  const handleClose = () => {
    if (scanner) {
      scanner.stop();
    }
    onClose();
  };

  return (
    <div className="qr-scanner-container">
      <div className="qr-scanner-header">
        <h2>Scan Ticket QR Code</h2>
        <button className="btn-close-scanner" onClick={handleClose}>
          ✕
        </button>
      </div>

      <div className="qr-scanner-wrapper">
        <video ref={videoRef} className="qr-scanner-video"></video>
        <div className="qr-scanner-overlay">
          <div className="qr-scanner-frame"></div>
          <p className="qr-scanner-hint">Position QR code in frame</p>
        </div>
      </div>

      {error && (
        <div className="qr-scanner-error">
          <p>{error}</p>
        </div>
      )}

      {lastScanned && (
        <div className="qr-scanner-success">
          <p>✓ QR Code detected!</p>
        </div>
      )}

      <div className="qr-scanner-actions">
        <button
          className={`btn-toggle-scan ${isScanning ? "active" : "paused"}`}
          onClick={toggleScanning}
        >
          {isScanning ? "⏸ Pause" : "▶ Resume"}
        </button>
        <button className="btn-close" onClick={handleClose}>
          Close Scanner
        </button>
      </div>
    </div>
  );
}
