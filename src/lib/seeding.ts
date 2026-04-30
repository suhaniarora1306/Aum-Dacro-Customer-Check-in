import { db } from "./firebase";
import { collection, getDocs, doc, setDoc, writeBatch } from "firebase/firestore";

/**
 * Seeds initial system data if collections are empty.
 * This includes default team users and event-specific metadata.
 */
export async function seedInitialData() {
  try {
    // Check if team users exist
    const teamUsersRef = collection(db, "team_users");
    const teamUsersSnapshot = await getDocs(teamUsersRef);

    if (teamUsersSnapshot.empty) {
      console.log("Seeding initial team users...");
      const batch = writeBatch(db);
      
      const users = [
        { 
          id: "admin-001", 
          username: "admin", 
          password: "admin123", 
          fullName: "Admin User", 
          role: "Admin", 
          email: "admin@event.com", 
          uid: "admin-001",
          createdAt: new Date().toISOString() 
        },
        { 
          id: "staff-001", 
          username: "staff1", 
          password: "staff123", 
          fullName: "Staff Member", 
          role: "Staff", 
          email: "staff1@event.com", 
          uid: "staff-001",
          createdAt: new Date().toISOString() 
        },
      ];

      for (const user of users) {
        const userDocRef = doc(db, "team_users", user.id);
        batch.set(userDocRef, user);
      }
      
      await batch.commit();
      console.log("Team users seeded successfully.");
    }

    // Check if guest types exist (optional metadata)
    const guestTypesRef = collection(db, "guestTypes");
    const guestTypesSnapshot = await getDocs(guestTypesRef);

    if (guestTypesSnapshot.empty) {
      console.log("Seeding guest categories...");
      const batch = writeBatch(db);
      const categories = [
        { name: "Key Speaker", color: "#B8860B" },
        { name: "OEM", color: "#0D47A1" },
        { name: "Customer", color: "#1B5E20" },
        { name: "Vendor", color: "#4A148C" },
        { name: "Partner", color: "#004D40" },
        { name: "Press/Media", color: "#B71C1C" },
        { name: "Internal Team", color: "#37474F" },
        { name: "Walk-In Guest", color: "#E65100" },
      ];

      categories.forEach((cat) => {
        const docRef = doc(collection(db, "guestTypes"));
        batch.set(docRef, cat);
      });

      await batch.commit();
      console.log("Guest categories seeded.");
    }
  } catch (error) {
    console.error("Critical error during data seeding:", error);
  }
}