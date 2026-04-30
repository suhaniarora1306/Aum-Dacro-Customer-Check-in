

const PABBLY_WEBHOOK_URL = "https://connect.pabbly.com/webhook-listener/webhook/IjU3NjYwNTZmMDYzNjA0MzE1MjZiIg_3D_3D_pc/IjU3NjcwNTZlMDYzNjA0MzE1MjZjNTUzMDUxMzci_pc";

/**
 * Sends visitor data to the central sheet via webhook.
 * Target collection is now 'guests' as per unified registry instruction.
 */
export async function sendToPabbly(eventType: string, visitorData: any) {
  try {
    await fetch(PABBLY_WEBHOOK_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: eventType,
        action: eventType === "visitor_registered" ? "addVisitor" : "updateVisitor",
        collection: "guests", // Standardized target
        visitorId: visitorData.id || visitorData.visitorId || "",
        fullName: visitorData.fullName || "",
        email: visitorData.email || "",
        whatsapp: visitorData.whatsapp || visitorData.whatsappNumber || "",
        companyName: visitorData.companyName || "",
        department: visitorData.department || "",
        designation: visitorData.designation || "",
        customerType: visitorData.customerType || "",
        registrationDate: visitorData.registrationDate || new Date().toLocaleString("en-IN"),
        registrationMethod: visitorData.registrationMethod || "onsite",
        checkedIn: visitorData.checkedIn || false,
        checkInTime: visitorData.checkInTime || "",
        checkedInBy: visitorData.checkedInBy || "",
        photoUrl: visitorData.photoUrl || "",
        badgePrinted: visitorData.badgePrinted || false,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${visitorData.id || visitorData.visitorId || ""}`
      })
    });
    console.log("Pabbly webhook sent:", eventType);
  } catch (err) {
    console.error("Pabbly webhook failed:", err);
  }
}

export async function addVisitorToSheet(visitor: any) {
  await sendToPabbly("visitor_registered", visitor);
}

export async function updateCheckInSheet(visitorId: string, checkedInBy: string, photoUrl: string, visitorData?: any) {
  await sendToPabbly("visitor_checked_in", {
    ...visitorData,
    id: visitorId,
    checkedInBy,
    photoUrl
  });
}

export async function updateBadgePrintedSheet(visitorId: string, visitorData?: any) {
  await sendToPabbly("badge_printed", {
    ...visitorData,
    id: visitorId,
    badgePrinted: true
  });
}
