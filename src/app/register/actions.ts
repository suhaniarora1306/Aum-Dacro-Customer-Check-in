'use server';

import { db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { onVisitorRegistered } from "@/lib/integrations";
import { addVisitorToSheet } from "@/lib/sheets";

export async function registerGuestAction(formData: FormData) {
  try {
    const fullName = formData.get("fullName") as string || "";
    const email = formData.get("email") as string || "";
    const whatsappNumber = formData.get("whatsappNumber") as string || "";
    const companyName = formData.get("companyName") as string || "";
    const department = formData.get("department") as string || "";
    const designation = formData.get("designation") as string || "";
    const customerType = formData.get("customerType") as string || "Guest";

    const guestId = `G-${Date.now()}`;
    // Use free dynamic QR code generator
    const qrCodeImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${guestId}`;

    // Save to Firestore
    const guestData = {
      id: guestId,
      fullName: fullName,
      email: email,
      whatsappNumber: whatsappNumber,
      companyName: companyName,
      department: department,
      designation: designation,
      customerType: customerType,
      registrationDate: new Date().toISOString(),
      qrCodeImageUrl,
      qrCodeData: guestId,
      checkedIn: false,
      photoBase64: "", 
      googleSheetsRowId: "pending",
      confirmationSent: true,
      createdAt: serverTimestamp()
    };

    // Sanitize data (ensure no undefined fields)
    Object.keys(guestData).forEach(key => {
      if ((guestData as any)[key] === undefined) (guestData as any)[key] = "";
    });

    await setDoc(doc(db, "guests", guestId), guestData);

    // Sync to Google Sheets (Non-blocking)
    addVisitorToSheet(guestData).catch(err => console.error("Sheets registration sync failed:", err));

    // Trigger Integrations (Simulated Cloud Function)
    await onVisitorRegistered(guestData);

    return { success: true, guestId };
  } catch (error: any) {
    console.error("Registration Action Error:", error);
    return { success: false, error: error.message };
  }
}
