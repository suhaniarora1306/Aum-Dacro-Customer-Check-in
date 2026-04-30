"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Home, QrCode, User, Printer } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";

export default function CheckInSuccessPage() {
  const { guestId } = useParams() as { guestId: string };
  const [visitor, setVisitor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchVisitor() {
      try {
        const docRef = doc(db, "guests", guestId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setVisitor({ ...docSnap.data(), id: docSnap.id });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchVisitor();
  }, [guestId]);

  const handlePrintBadge = () => {
    if (!visitor) return;
    localStorage.removeItem("printGuests");
    localStorage.setItem("printGuests", JSON.stringify([visitor]));
    router.push("/dashboard/print-badge");
  };

  return (
    <div className="max-w-md mx-auto py-8 space-y-8 animate-in zoom-in-95 duration-500">
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center border-4 border-white shadow-lg">
            <CheckCircle2 className="w-14 h-14 text-green-600" />
          </div>
        </div>
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-primary tracking-tighter">SUCCESSFUL!</h1>
          <p className="text-muted-foreground font-medium">Check-in process complete</p>
        </div>
      </div>

      <Card className="border-none shadow-xl overflow-hidden bg-white">
        <div className="h-2 bg-green-500" />
        <CardContent className="p-0">
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-muted flex-shrink-0 border-2 border-border">
                {visitor?.photoBase64 ? (
                  <img src={visitor.photoBase64} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-primary/10">
                    <User className="w-8 h-8 text-primary" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold leading-tight">{visitor?.fullName}</h3>
                <p className="text-sm text-muted-foreground">{visitor?.companyName}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-dashed">
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Entry Time</p>
                <p className="text-sm font-bold">
                  {visitor?.checkInTime ? format(new Date(visitor.checkInTime), "HH:mm:ss") : "--:--:--"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Logged By</p>
                <p className="text-sm font-bold truncate">{visitor?.checkedInBy || "System"}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3">
        <Button onClick={handlePrintBadge} className="h-12 text-lg font-bold bg-green-600 hover:bg-green-700">
          <Printer className="w-5 h-5 mr-2" />
          Print Badge
        </Button>
        <Button asChild variant="outline" className="h-12 font-bold">
          <Link href="/dashboard/scan">
            <QrCode className="w-5 h-5 mr-2" />
            Next Visitor
          </Link>
        </Button>
        <Button asChild variant="ghost" className="h-12 font-bold text-muted-foreground">
          <Link href="/dashboard">
            <Home className="w-5 h-5 mr-2" />
            Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}