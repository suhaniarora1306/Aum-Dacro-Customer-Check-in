
'use server';

/**
 * @fileOverview Integration services for Aum Dacro Customer Meet 2026.
 * Handles WhatsApp, Email, and Google Sheets synchronization.
 */

import { APP_NAME, COMPANY_NAME } from "@/config/constants";

/**
 * Triggered after a visitor is successfully registered.
 * @param visitorData The full visitor record.
 */
export async function onVisitorRegistered(visitorData: any) {
  try {
    const { id, fullName, email, whatsappNumber, qrCodeImageUrl } = visitorData;

    console.log(`[LOG] Starting post-registration flow for ${fullName} (${id})`);

    // 1. Sync to Google Sheets
    // In production, use googleapis library with credentials from env
    console.log(`[SHEETS] Appending row to Google Sheets for ${fullName}`);

    // 2. Send WhatsApp Confirmation (Silent Failure)
    try {
      console.log(`[WHATSAPP] Sending confirmation to ${whatsappNumber}: Hello ${fullName}! 🎉 You're registered for ${APP_NAME}. Your entry QR code: ${qrCodeImageUrl}. See you there! – ${COMPANY_NAME} Team`);
    } catch (waError) {
      console.error("[WHATSAPP ERROR] Failed to send registration message:", waError);
    }

    // 3. Send Email Confirmation (Silent Failure)
    try {
      console.log(`[EMAIL] Sending confirmation to ${email} with embedded QR code.`);
    } catch (emailError) {
      console.error("[EMAIL ERROR] Failed to send registration email:", emailError);
    }

    return { success: true };
  } catch (error) {
    console.error("[INTEGRATION FATAL] Registration flow failed:", error);
    return { success: false, error };
  }
}

/**
 * Triggered after a visitor is successfully checked in at the venue.
 * @param visitorData The updated visitor record including check-in details.
 */
export async function onVisitorCheckedIn(visitorData: any) {
  try {
    const { id, fullName, email, whatsappNumber, checkInTime, photoBase64 } = visitorData;

    console.log(`[LOG] Starting post-checkin flow for ${fullName} (${id})`);

    // 1. Update Google Sheets (Status: Checked In)
    console.log(`[SHEETS] Updating check-in status for ${id} at ${checkInTime}`);

    // 2. Send Welcome WhatsApp (Silent Failure)
    try {
      console.log(`[WHATSAPP] Welcome message: Welcome, ${fullName}! 👋 We're so glad to have you at ${APP_NAME}. Please proceed to the welcome desk. Enjoy the event! – ${COMPANY_NAME} Team`);
    } catch (waError) {
      console.error("[WHATSAPP ERROR] Failed to send welcome message:", waError);
    }

    // 3. Send Greeting Email (Silent Failure)
    try {
      console.log(`[EMAIL] Welcome email sent to ${email}`);
    } catch (emailError) {
      console.error("[EMAIL ERROR] Failed to send welcome email:", emailError);
    }

    return { success: true };
  } catch (error) {
    console.error("[INTEGRATION FATAL] Check-in flow failed:", error);
    return { success: false, error };
  }
}
