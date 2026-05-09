"use client";

import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { LOGO_BASE64 } from "@/config/logo-data";

const TYPE_COLORS: Record<string, string> = {
  "Key Speaker": "#B8860B",
  "OEM": "#0D47A1",
  "Customer": "#1B5E20",
  "Vendor": "#4A148C",
  "Partner": "#004D40",
  "Press/Media": "#B71C1C",
  "Internal Team": "#37474F",
  "Walk-In Guest": "#E65100",
  "Chief Guest": "#8B0000",
  "Guest": "#1565C0",
};

function getTypeColor(customerType: string | undefined): string {
  if (!customerType) return "#1565C0";
  if (TYPE_COLORS[customerType]) return TYPE_COLORS[customerType];
  const normalized = customerType.trim().toLowerCase();
  const match = Object.keys(TYPE_COLORS).find(
    key => key.toLowerCase() === normalized
  );
  return match ? TYPE_COLORS[match] : "#1565C0";
}

function BadgeFront({ guest }: { guest: any }) {
  const typeColor = getTypeColor(guest?.customerType);

  return (
    <div className="badge-container" style={{
      width: "85mm",
      height: "128mm",
      borderRadius: "3mm",
      background: "white",
      fontFamily: "Arial, sans-serif",
      overflow: "hidden",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      border: "0.1mm solid #eee",
      boxSizing: "border-box"
    }}>
      {/* TOP HEADER */}
      <div style={{
        background: "#0C2D5A",
        height: "38mm",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 6mm",
        flexShrink: 0
      }}>
        <div style={{ position: "absolute", top: "-20mm", right: "-15mm", width: "50mm", height: "50mm", borderRadius: "50%", border: "8mm solid rgba(255,255,255,0.05)" }}/>
        <div style={{ position: "absolute", bottom: "-15mm", left: "-10mm", width: "35mm", height: "35mm", borderRadius: "50%", border: "6mm solid rgba(255,255,255,0.05)" }}/>
        <div style={{ position: "absolute", top: "5mm", left: "5mm", width: "20mm", height: "20mm", borderRadius: "50%", border: "4mm solid rgba(255,255,255,0.06)" }}/>

        <div style={{ display: "flex", alignItems: "center", gap: "3mm", zIndex: 1, marginBottom: "2mm" }}>
          <div style={{ background: "white", borderRadius: "4mm", padding: "1mm 2mm", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={LOGO_BASE64} alt="logo" style={{ height: "6mm", width: "auto", objectFit: "contain" }}/>
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 800, fontSize: "3.8mm", letterSpacing: "0.3mm", whiteSpace: "nowrap" }}>AUM DACRO COATINGS</div>
            <div style={{ color: "#90CAF9", fontSize: "3mm", letterSpacing: "0.2mm" }}>CUSTOMER MEET 2026</div>
          </div>
        </div>

        <div style={{ color: "#BBD6F8", fontSize: "2.8mm", zIndex: 1, letterSpacing: "0.2mm" }}>15th May 2026</div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "1.5mm", background: "linear-gradient(90deg, #1B5E20, #2196F3, #DC143C)" }}/>
      </div>

      {/* CUSTOMER TYPE STRIP */}
      <div style={{ background: typeColor, height: "8mm", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ color: "white", fontWeight: 800, fontSize: "3.5mm", letterSpacing: "1.5mm", textTransform: "uppercase" }}>
          {guest?.customerType || "VISITOR"}
        </span>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4mm 6mm", background: "white" }}>
        <div style={{ fontSize: "7mm", fontWeight: 900, color: "#0C2D5A", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.3mm", lineHeight: 1.15, marginBottom: "2mm", width: "100%", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as React.CSSProperties}>
          {guest?.fullName || "VISITOR NAME"}
        </div>

        <div style={{ width: "20mm", height: "0.5mm", background: typeColor, marginBottom: "2mm" }}/>

        <div style={{ fontSize: "5mm", fontWeight: 900, color: "#1565C0", textAlign: "center", marginBottom: "4mm", letterSpacing: "0.2mm", whiteSpace: "normal", wordBreak: "break-word", overflow: "hidden", width: "100%", boxSizing: "border-box" }}>
          {guest?.companyName || ""}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2.5mm", width: "100%", padding: "0 4mm" }}>
          {(guest?.designation || guest?.jobTitle) && (
            <div style={{ display: "flex", alignItems: "center", gap: "2.5mm" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={typeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              </svg>
              <span style={{ fontSize: "3.8mm", color: "#333", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {guest?.designation || guest?.jobTitle}
              </span>
            </div>
          )}

          {(guest?.department || guest?.dept) && (
            <div style={{ display: "flex", alignItems: "center", gap: "2.5mm" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={typeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span style={{ fontSize: "3.8mm", color: "#374151", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {guest?.department || guest?.dept}
              </span>
            </div>
          )}

          {guest?.visitorId && (
            <div style={{ display: "flex", alignItems: "center", gap: "2.5mm" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={typeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="10" r="2"/><path d="M14 10h4M14 14h4M6 14h4"/>
              </svg>
              <span style={{ fontSize: "3mm", color: "#888", fontFamily: "monospace", letterSpacing: "0.3mm" }}>
                {guest?.visitorId}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM FOOTER */}
      <div style={{ background: "#0C2D5A", height: "12mm", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1mm", background: "linear-gradient(90deg, #1B5E20, #2196F3, #DC143C)" }}/>
        <div style={{ color: "white", fontSize: "3mm", fontWeight: 700, letterSpacing: "0.3mm" }}>AUM DACRO COATINGS</div>
      </div>
    </div>
  );
}

function BadgeBack({ guest }: { guest: any }) {
  const typeColor = getTypeColor(guest?.customerType);

  return (
    <div className="badge-container" style={{
      width: "85mm",
      height: "128mm",
      borderRadius: "3mm",
      background: "white",
      fontFamily: "Arial, sans-serif",
      overflow: "hidden",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      border: "0.1mm solid #eee",
      boxSizing: "border-box"
    }}>
      {/* TOP HEADER */}
      <div style={{
        background: "#0C2D5A",
        height: "38mm",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 6mm",
        flexShrink: 0
      }}>
        <div style={{ position: "absolute", top: "-20mm", right: "-15mm", width: "50mm", height: "50mm", borderRadius: "50%", border: "8mm solid rgba(255,255,255,0.05)" }}/>
        <div style={{ position: "absolute", bottom: "-15mm", left: "-10mm", width: "35mm", height: "35mm", borderRadius: "50%", border: "6mm solid rgba(255,255,255,0.05)" }}/>
        <div style={{ position: "absolute", top: "5mm", left: "5mm", width: "20mm", height: "20mm", borderRadius: "50%", border: "4mm solid rgba(255,255,255,0.06)" }}/>

        <div style={{ display: "flex", alignItems: "center", gap: "3mm", zIndex: 1, marginBottom: "2mm" }}>
          <div style={{ background: "white", borderRadius: "4mm", padding: "1mm 2mm", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={LOGO_BASE64} alt="logo" style={{ height: "6mm", width: "auto", objectFit: "contain" }}/>
          </div>
          <div>
            <div style={{ color: "white", fontWeight: 800, fontSize: "3.8mm", letterSpacing: "0.3mm", whiteSpace: "nowrap" }}>AUM DACRO COATINGS</div>
            <div style={{ color: "#90CAF9", fontSize: "3mm", letterSpacing: "0.2mm" }}>CUSTOMER MEET 2026</div>
          </div>
        </div>

        <div style={{ color: "#BBD6F8", fontSize: "2.8mm", zIndex: 1, letterSpacing: "0.2mm" }}>15th May 2026</div>
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "1.5mm", background: "linear-gradient(90deg, #1B5E20, #2196F3, #DC143C)" }}/>
      </div>

      {/* CUSTOMER TYPE STRIP */}
      <div style={{ background: typeColor, height: "8mm", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <span style={{ color: "white", fontWeight: 800, fontSize: "3.5mm", letterSpacing: "1.5mm", textTransform: "uppercase" }}>
          {guest?.customerType || "VISITOR"}
        </span>
      </div>

      {/* MAIN CONTENT */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "4mm 6mm", background: "white" }}>

        {/* Theme name */}
        <div style={{ fontSize: "3.5mm", fontWeight: 800, color: "#0C2D5A", textAlign: "center", fontStyle: "italic", letterSpacing: "0.2mm", lineHeight: 1.3, marginBottom: "3mm", padding: "0 2mm" }}>
          &quot;The Intelligent Coating Era&quot;
        </div>

        <div style={{ fontSize: "7mm", fontWeight: 900, color: "#0C2D5A", textAlign: "center", textTransform: "uppercase", letterSpacing: "0.3mm", lineHeight: 1.15, marginBottom: "2mm", width: "100%", overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" } as React.CSSProperties}>
          {guest?.fullName || "VISITOR NAME"}
        </div>

        <div style={{ width: "20mm", height: "0.5mm", background: typeColor, marginBottom: "2mm" }}/>

        <div style={{ fontSize: "5mm", fontWeight: 900, color: "#1565C0", textAlign: "center", marginBottom: "4mm", letterSpacing: "0.2mm", whiteSpace: "normal", wordBreak: "break-word", overflow: "hidden", width: "100%", boxSizing: "border-box" }}>
          {guest?.companyName || ""}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2.5mm", width: "100%", padding: "0 4mm" }}>
          {(guest?.designation || guest?.jobTitle) && (
            <div style={{ display: "flex", alignItems: "center", gap: "2.5mm" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={typeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              </svg>
              <span style={{ fontSize: "3.8mm", color: "#333", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {guest?.designation || guest?.jobTitle}
              </span>
            </div>
          )}

          {(guest?.department || guest?.dept) && (
            <div style={{ display: "flex", alignItems: "center", gap: "2.5mm" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={typeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span style={{ fontSize: "3.8mm", color: "#374151", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {guest?.department || guest?.dept}
              </span>
            </div>
          )}

          {guest?.visitorId && (
            <div style={{ display: "flex", alignItems: "center", gap: "2.5mm" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={typeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="8" cy="10" r="2"/><path d="M14 10h4M14 14h4M6 14h4"/>
              </svg>
              <span style={{ fontSize: "3mm", color: "#888", fontFamily: "monospace", letterSpacing: "0.3mm" }}>
                {guest?.visitorId}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM FOOTER */}
      <div style={{ background: "#0C2D5A", height: "12mm", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", flexShrink: 0 }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1mm", background: "linear-gradient(90deg, #1B5E20, #2196F3, #DC143C)" }}/>
        <div style={{ color: "white", fontSize: "3mm", fontWeight: 700, letterSpacing: "0.3mm" }}>AUM DACRO COATINGS</div>
      </div>
    </div>
  );
}

export default function PrintBadgePage() {
  const [guests, setGuests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadFreshData = async () => {
      setLoading(true);
      try {
        const stored = localStorage.getItem("printGuests");
        if (!stored) { setLoading(false); return; }

        const storedGuests = JSON.parse(stored);

        const freshGuests = await Promise.all(
          storedGuests.map(async (g: any) => {
            const visitorId = g.visitorId || g.id;
            if (!visitorId) return g;
            try {
              const q1 = query(collection(db, "guests"), where("visitorId", "==", visitorId));
              const snap1 = await getDocs(q1);
              if (!snap1.empty) return { ...snap1.docs[0].data(), id: snap1.docs[0].id };

              const q2 = query(collection(db, "visitors"), where("visitorId", "==", visitorId));
              const snap2 = await getDocs(q2);
              if (!snap2.empty) return { ...snap2.docs[0].data(), id: snap2.docs[0].id };

              return g;
            } catch {
              return g;
            }
          })
        );

        const cleanGuests = freshGuests.filter((g: any) =>
          g.visitorId !== "ADC2026-TEST" &&
          g.fullName !== "Test Visitor" &&
          g.fullName?.toLowerCase() !== "test"
        );

        setGuests(cleanGuests);
      } catch (err) {
        console.error("Error loading fresh print data:", err);
      }
      setLoading(false);
    };

    loadFreshData();
  }, []);

  const handlePrint = (guestIndex?: number) => {
    const guestsToPrint = guestIndex !== undefined ? [guests[guestIndex]] : guests;

    const frontEls = document.querySelectorAll('.badge-front-hidden');
    const backEls = document.querySelectorAll('.badge-back-hidden');

    let pagesHTML = '';

    guestsToPrint.forEach((guest, i) => {
      const actualIdx = guestIndex !== undefined ? guestIndex : i;
      const frontEl = frontEls[actualIdx];
      const backEl = backEls[actualIdx];
      const frontHTML = frontEl ? frontEl.innerHTML : '';
      const backHTML = backEl ? backEl.innerHTML : '';

      pagesHTML = pagesHTML + '<div class="badge-page"><div class="badge-wrap">' + frontHTML + '</div></div><div class="badge-page"><div class="badge-wrap">' + backHTML + '</div></div>';
    });

    const printWindow = window.open('', '_blank', 'width=800,height=600');

    if (!printWindow) {
      alert('Popups are blocked. Please allow popups for this site and try again.');
      return;
    }

    const htmlContent = '<!DOCTYPE html><html><head><title>Aum Dacro Badge Print</title><style>* { margin: 0; padding: 0; box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; color-adjust: exact !important; } html, body { background: white; margin: 0; padding: 0; } .badge-page { width: 85mm; height: 128mm; page-break-after: always; page-break-inside: avoid; display: flex; align-items: center; justify-content: center; background: white; overflow: hidden; } .badge-page:last-child { page-break-after: avoid; } .badge-wrap { width: 85mm; height: 128mm; overflow: hidden; } @page { size: 85mm 128mm portrait; margin: 0; }</style></head><body>' + pagesHTML + '<script>window.addEventListener("load", function() { setTimeout(function() { window.focus(); window.print(); window.addEventListener("afterprint", function() { window.close(); }); }, 800); });<\/script></body></html>';

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (loading) return <div style={{ padding: 40 }}>Loading fresh visitor data...</div>;

  return (
    <div style={{ minHeight: "100vh" }}>
      {/* CONTROLS BAR */}
      <div className="no-print" style={{
        padding: "16px 24px",
        background: "#0C2D5A",
        display: "flex",
        alignItems: "center",
        gap: 12,
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 1000,
        boxShadow: "0 2px 10px rgba(0,0,0,0.2)"
      }}>
        <button onClick={() => window.history.back()} style={{
          background: "transparent", border: "1px solid white",
          color: "white", borderRadius: 6, padding: "6px 14px", cursor: "pointer", fontWeight: 600
        }}>← Back</button>
        <span style={{ color: "white", fontWeight: 600, flex: 1 }}>
          Lanyard Badge Center — {guests.length} attendee(s)
        </span>
        <button onClick={() => handlePrint()} style={{
          background: "#1AE6E6", border: "none",
          color: "#0D2744", borderRadius: 6,
          padding: "8px 24px", cursor: "pointer", fontWeight: 800,
          boxShadow: "0 4px 10px rgba(26, 230, 230, 0.3)"
        }}>🖨 PRINT ALL</button>
      </div>

      {/* SCREEN PREVIEW */}
      <div className="no-print" style={{ marginTop: 80, padding: 40, background: "#f1f5f9", minHeight: "100vh" }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          {guests.map((guest, idx) => (
            <div key={idx} style={{
              marginBottom: 40,
              background: "white",
              borderRadius: 16,
              padding: "30px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
              border: "1px solid #e2e8f0"
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1e293b' }}>{guest.fullName}</h3>
                  <p style={{ fontSize: 12, color: '#64748b' }}>Portrait Lanyard Badge (85x128mm)</p>
                </div>
                <button
                  onClick={() => handlePrint(idx)}
                  style={{
                    background: '#0D3B6E', color: 'white', border: 'none',
                    padding: '10px 20px', borderRadius: 8, cursor: 'pointer',
                    fontSize: 14, fontWeight: 600
                  }}
                >
                  Print This Badge
                </button>
              </div>

              <div style={{ display: "flex", gap: 40, justifyContent: "center" }}>
                <div>
                  <p style={{ textAlign: "center", fontSize: 12, fontWeight: 800, color: "#94a3b8", marginBottom: 10, letterSpacing: 1 }}>FRONT</p>
                  <div style={{ width: "321px", height: "484px", transformOrigin: 'top center', border: '1px solid #ddd' }}>
                    <BadgeFront guest={guest} />
                  </div>
                </div>
                <div>
                  <p style={{ textAlign: "center", fontSize: 12, fontWeight: 800, color: "#94a3b8", marginBottom: 10, letterSpacing: 1 }}>BACK</p>
                  <div style={{ width: "321px", height: "484px", transformOrigin: 'top center', border: '1px solid #ddd' }}>
                    <BadgeBack guest={guest} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HIDDEN BADGES FOR PRINT EXTRACTION */}
      <div style={{ position: 'fixed', left: '-99999px', top: 0, pointerEvents: 'none', opacity: 0 }}>
        {guests.map((guest, idx) => (
          <React.Fragment key={idx}>
            <div className="badge-front-hidden">
              <BadgeFront guest={guest} />
            </div>
            <div className="badge-back-hidden">
              <BadgeBack guest={guest} />
            </div>
          </React.Fragment>
        ))}
      </div>

      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}