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
};

function BadgeFront({ guest }: { guest: any }) {
  const typeColor = TYPE_COLORS[guest?.customerType] || "#1B5E20";

  return (
    <div className="badge-container" style={{
      width: "105mm",
      height: "148mm",
      background: "white",
      fontFamily: "Arial, sans-serif",
      overflow: "hidden",
      position: "relative",
      display: "flex",
      flexDirection: "column",
      border: "0.1mm solid #eee",
      boxSizing: "border-box"
    }}>

      {/* TOP HEADER — dark navy with diagonal pattern */}
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
        {/* Background circle pattern */}
        <div style={{
          position: "absolute", top: "-20mm", right: "-15mm",
          width: "50mm", height: "50mm", borderRadius: "50%",
          border: "8mm solid rgba(255,255,255,0.05)",
        }}/>
        <div style={{
          position: "absolute", bottom: "-15mm", left: "-10mm",
          width: "35mm", height: "35mm", borderRadius: "50%",
          border: "6mm solid rgba(255,255,255,0.05)",
        }}/>
        <div style={{
          position: "absolute", top: "5mm", left: "5mm",
          width: "20mm", height: "20mm", borderRadius: "50%",
          border: "4mm solid rgba(255,255,255,0.06)",
        }}/>

        {/* Logo + Event name row */}
        <div style={{
          display: "flex", alignItems: "center",
          gap: "3mm", zIndex: 1, marginBottom: "2mm"
        }}>
          <div style={{
            background: "white", borderRadius: "4mm",
            padding: "1.5mm 3mm", display: "flex",
            alignItems: "center", justifyContent: "center"
          }}>
            <img src={LOGO_BASE64} alt="logo"
              style={{ height: "8mm", width: "auto", objectFit: "contain" }}/>
          </div>
          <div>
            <div style={{
              color: "white", fontWeight: 800,
              fontSize: "5mm", letterSpacing: "0.3mm", lineHeight: 1.1
            }}>AUM DACRO COATINGS</div>
            <div style={{
              color: "#90CAF9", fontSize: "3mm", letterSpacing: "0.2mm"
            }}>CUSTOMER MEET 2026</div>
          </div>
        </div>

        {/* Date and venue */}
        <div style={{
          color: "#BBD6F8", fontSize: "2.8mm", zIndex: 1,
          letterSpacing: "0.2mm"
        }}>19th May 2026</div>

        {/* Bottom gradient line */}
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: "1.5mm",
          background: "linear-gradient(90deg, #1B5E20, #2196F3, #DC143C)"
        }}/>
      </div>

      {/* CUSTOMER TYPE STRIP */}
      <div style={{
        background: typeColor,
        height: "8mm",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }}>
        <span style={{
          color: "white", fontWeight: 800,
          fontSize: "3.5mm", letterSpacing: "1.5mm",
          textTransform: "uppercase"
        }}>
          {guest?.customerType || "VISITOR"}
        </span>
      </div>

      {/* MAIN CONTENT */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4mm 6mm",
        background: "white",
      }}>
        {/* Visitor Name */}
        <div style={{
          fontSize: "8.5mm",
          fontWeight: 900,
          color: "#0C2D5A",
          textAlign: "center",
          textTransform: "uppercase",
          letterSpacing: "0.3mm",
          lineHeight: 1.15,
          marginBottom: "3mm",
          width: "100%",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        } as React.CSSProperties}>
          {guest?.fullName || "VISITOR NAME"}
        </div>

        {/* Divider */}
        <div style={{
          width: "20mm", height: "0.5mm",
          background: typeColor, marginBottom: "3mm"
        }}/>

        {/* Company */}
        <div style={{
          fontSize: "4mm", fontWeight: 700,
          color: "#1565C0", textAlign: "center",
          marginBottom: "6mm", letterSpacing: "0.2mm"
        }}>
          {guest?.companyName || ""}
        </div>

        {/* Details with SVG icons */}
        <div style={{ display:"flex", flexDirection:"column", gap:"2.5mm", width:"100%", padding:"0 4mm" }}>

          {/* Designation */}
          {(guest?.designation || guest?.jobTitle) && (
            <div style={{ display:"flex", alignItems:"center", gap:"2.5mm" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={typeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/>
              </svg>
              <span style={{ fontSize:"3.5mm", color:"#333", fontWeight:600 }}>{guest?.designation || guest?.jobTitle}</span>
            </div>
          )}

          {/* Department */}
          {(guest?.department || guest?.dept) && (
            <div style={{ display:"flex", alignItems:"center", gap:"2.5mm" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={typeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              <span style={{ fontSize:"3.5mm", color:"#555" }}>{guest?.department || guest?.dept}</span>
            </div>
          )}

          {/* Visitor ID */}
          {guest?.visitorId && (
            <div style={{ display:"flex", alignItems:"center", gap:"2.5mm" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={typeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <circle cx="8" cy="10" r="2"/>
                <path d="M14 10h4M14 14h4M6 14h4"/>
              </svg>
              <span style={{ fontSize:"3mm", color:"#888", fontFamily:"monospace", letterSpacing:"0.3mm" }}>{guest?.visitorId}</span>
            </div>
          )}
        </div>
      </div>

      {/* BOTTOM FOOTER */}
      <div style={{
        background: "#0C2D5A",
        height: "12mm",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0
      }}>
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0,
          height: "1mm",
          background: "linear-gradient(90deg, #1B5E20, #2196F3, #DC143C)"
        }}/>
        <div style={{
          color: "white", fontSize: "3mm",
          fontWeight: 700, letterSpacing: "0.3mm"
        }}>AUM DACRO COATINGS</div>
        <div style={{
          color: "#90CAF9", fontSize: "2.5mm"
        }}>aumdacro.com</div>
      </div>
    </div>
  );
}

function BadgeBack({ guest }: { guest: any }) {
  const typeColor = TYPE_COLORS[guest?.customerType] || "#1B5E20";
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(guest?.visitorId || 'VISITOR')}`;

  return (
    <div className="badge-container" style={{
      width: "105mm",
      height: "148mm",
      background: "white",
      fontFamily: "Arial, sans-serif",
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      border: "0.1mm solid #eee",
      boxSizing: "border-box"
    }}>

      {/* TOP HEADER */}
      <div style={{
        background: "#0C2D5A",
        height: "28mm",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        flexShrink: 0
      }}>
        <div style={{
          position: "absolute", top: "-10mm", right: "-10mm",
          width: "35mm", height: "35mm", borderRadius: "50%",
          border: "6mm solid rgba(255,255,255,0.06)",
        }}/>
        <div style={{
          position: "absolute", bottom: "-8mm", left: "-8mm",
          width: "25mm", height: "25mm", borderRadius: "50%",
          border: "5mm solid rgba(255,255,255,0.06)",
        }}/>
        <div style={{
          color: "white", fontWeight: 800,
          fontSize: "5mm", letterSpacing: "0.3mm",
          zIndex: 1
        }}>AUM DACRO COATINGS</div>
        <div style={{
          color: "#90CAF9", fontSize: "3mm", zIndex: 1
        }}>CUSTOMER MEET 2026 · 19th May 2026</div>
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: "1.5mm",
          background: "linear-gradient(90deg, #1B5E20, #2196F3, #DC143C)"
        }}/>
      </div>

      {/* QR SECTION */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "4mm",
        background: "white",
      }}>
        {/* QR code with colored border */}
        <div style={{
          border: `3mm solid ${typeColor}`,
          borderRadius: "4mm",
          padding: "3mm",
          background: "white",
          marginBottom: "4mm",
          boxShadow: `0 2mm 8mm rgba(0,0,0,0.15)`,
        }}>
          <img
            src={qrUrl}
            alt="QR Code"
            style={{
              width: "55mm", height: "55mm",
              display: "block",
              imageRendering: "pixelated",
            }}
          />
        </div>

        <div style={{
          fontSize: "3.5mm", color: "#666",
          marginBottom: "3mm", letterSpacing: "0.2mm"
        }}>Scan for check-in</div>

        <div style={{
          fontSize: "5mm", fontWeight: 800,
          color: "#0C2D5A", textAlign: "center",
          marginBottom: "2mm", textTransform: "uppercase"
        }}>{guest?.fullName || ""}</div>

        <div style={{
          fontSize: "4mm", color: "#1565C0",
          fontWeight: 600, textAlign: "center",
          marginBottom: "2mm"
        }}>{guest?.companyName || ""}</div>

        <div style={{
          fontSize: "3mm", color: "#888",
          fontFamily: "monospace",
          letterSpacing: "0.3mm"
        }}>{guest?.visitorId || ""}</div>
      </div>

      {/* CUSTOMER TYPE STRIP */}
      <div style={{
        background: typeColor,
        height: "10mm",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }}>
        <span style={{
          color: "white", fontWeight: 800,
          fontSize: "3.5mm", letterSpacing: "1.5mm",
          textTransform: "uppercase"
        }}>
          {guest?.customerType || "VISITOR"}
        </span>
      </div>

      {/* FOOTER */}
      <div style={{
        background: "#0C2D5A",
        height: "12mm",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }}>
        <div style={{
          color: "#90CAF9", fontSize: "3mm"
        }}>For assistance: events@aumdacro.com</div>
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

        // Fetch fresh data from Firestore for each guest
        const freshGuests = await Promise.all(
          storedGuests.map(async (g: any) => {
            const visitorId = g.visitorId || g.id;
            if (!visitorId) return g;
            try {
              // 1. Search 'guests'
              const q1 = query(
                collection(db, "guests"),
                where("visitorId", "==", visitorId)
              );
              const snap1 = await getDocs(q1);
              if (!snap1.empty) {
                return { ...snap1.docs[0].data(), id: snap1.docs[0].id };
              }

              // 2. Search 'visitors' (legacy/other)
              const q2 = query(
                collection(db, "visitors"),
                where("visitorId", "==", visitorId)
              );
              const snap2 = await getDocs(q2);
              if (!snap2.empty) {
                return { ...snap2.docs[0].data(), id: snap2.docs[0].id };
              }

              return g;
            } catch {
              return g;
            }
          })
        );

        // Filter out test/dummy entries
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
    const guestsToPrint = guestIndex !== undefined
      ? [guests[guestIndex]]
      : guests;

    const frontEls = document.querySelectorAll('.badge-front-hidden');
    const backEls  = document.querySelectorAll('.badge-back-hidden');

    let pagesHTML = '';

    guestsToPrint.forEach((guest, i) => {
      const idx = guestIndex !== undefined ? guestIndex : i;
      const frontHTML = frontEls[idx]?.innerHTML || '';
      const backHTML  = backEls[idx]?.innerHTML  || '';

      // PAGE 1 — FRONT
      // Badge positioned top-left of A4
      pagesHTML += `
        <div class="a4-page">
          <div class="badge-position">
            ${frontHTML}
          </div>
        </div>
      `;

      // PAGE 2 — BACK
      // Badge positioned top-left SAME position as front
      // When duplex flips on long edge — back lands exactly behind front
      pagesHTML += `
        <div class="a4-page">
          <div class="badge-position">
            ${backHTML}
          </div>
        </div>
      `;
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups for this site to print badges');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Badge Print — Aum Dacro Customer Meet 2026</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            @page {
              size: A4 portrait;
              margin: 0;
            }

            html, body {
              width: 210mm;
              height: 297mm;
              background: white;
              margin: 0;
              padding: 0;
            }

            .a4-page {
              width: 210mm;
              height: 297mm;
              position: relative;
              page-break-after: always;
              page-break-inside: avoid;
              background: white;
              margin: 0;
              padding: 0;
            }

            .a4-page:last-child {
              page-break-after: avoid;
            }

            /* Badge always positioned at exact same spot top-left */
            /* So front and back align when duplex flips on long edge */
            .badge-position {
              position: absolute;
              top: 10mm;
              left: 10mm;
              width: 105mm;
              height: 148mm;
              overflow: hidden;
            }
          </style>
        </head>
        <body>
          ${pagesHTML}
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 1000);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  if (loading) return <div style={{ padding: 40 }}>Loading fresh visitor data...</div>;

  return (
    <>
      {/* SCREEN ONLY — controls bar */}
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
          color: "white", borderRadius: 6, padding: "6px 14px", cursor: "pointer",
          fontWeight: 600
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
                  <p style={{ fontSize: 12, color: '#64748b' }}>Half-A4 Lanyard Badge (105x148mm)</p>
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
                  <div style={{ width: "397px", height: "559px", transform: 'scale(0.8)', transformOrigin: 'top center', border: '1px solid #ddd' }}>
                    <BadgeFront guest={guest} />
                  </div>
                </div>
                <div>
                  <p style={{ textAlign: "center", fontSize: 12, fontWeight: 800, color: "#94a3b8", marginBottom: 10, letterSpacing: 1 }}>BACK</p>
                  <div style={{ width: "397px", height: "559px", transform: 'scale(0.8)', transformOrigin: 'top center', border: '1px solid #ddd' }}>
                    <BadgeBack guest={guest} />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* HIDDEN COPIES FOR EXTRACTION */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0, pointerEvents: 'none' }}>
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
    </>
  );
}