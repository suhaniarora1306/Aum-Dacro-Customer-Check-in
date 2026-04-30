"use client";
import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    // Initial check
    if (typeof navigator !== "undefined") {
      setIsOffline(!navigator.onLine);
    }
    
    const goOffline = () => setIsOffline(true);
    const goOnline  = () => setIsOffline(false);
    
    window.addEventListener("offline", goOffline);
    window.addEventListener("online",  goOnline);
    
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online",  goOnline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div style={{
      position: "fixed",
      top: 0, left: 0, right: 0,
      zIndex: 99999,
      background: "#C53030",
      color: white,
      padding: "10px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "8px",
      fontSize: "13px",
      fontWeight: "600",
      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
    }}>
      <WifiOff size={16} />
      No internet connection — please check WiFi
    </div>
  );
}
