"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Html5Qrcode } from "html5-qrcode";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  XCircle, 
  Loader2,
  StopCircle,
  PlayCircle,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  User,
  Building2,
  Briefcase
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function QRScannerPage() {
  const router = useRouter();
  const [visitorIdInput, setVisitorIdInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = "qr-reader";

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  function extractVisitorId(decodedText: string) {
    var text = decodedText.trim();
    if (text.includes("VisitorID:")) {
      text = text.replace("VisitorID:", "").split("|")[0].trim();
    }
    return text;
  }

  const startScanner = async () => {
    setLookupResult(null);
    setError(null);
    
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerContainerId);
      }

      await scannerRef.current.start(
        { facingMode: "environment" },
        { 
          fps: 10, 
          qrbox: { width: 220, height: 220 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          const visitorId = extractVisitorId(decodedText);
          handleLookup(visitorId);
          stopScanner();
        },
        () => {} // silent failure for frames with no QR
      );
      setIsScanning(true);
    } catch (err) {
      console.error("Camera start error:", err);
      setError("Could not access camera. Please check permissions.");
      setIsScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      try {
        await scannerRef.current.stop();
      } catch (e) {
        console.error("Stop error:", e);
      }
    }
    setIsScanning(false);
  };

  const handleLookup = async (id: string) => {
    if (isLoading || !id) return;
    setIsLoading(true);
    setError(null);
    setLookupResult(null);
    
    if (!navigator.onLine) {
      setError("No internet connection. Please check WiFi and try again.");
      setIsLoading(false);
      return;
    }

    const visitorId = extractVisitorId(id);

    try {
      // 1. Search 'guests'
      const q1 = query(collection(db, "guests"), where("visitorId", "==", visitorId));
      let snap = await getDocs(q1);
      
      // 2. Search 'visitors' if not in guests
      if (snap.empty) {
        const q2 = query(collection(db, "visitors"), where("visitorId", "==", visitorId));
        snap = await getDocs(q2);
      }

      if (!snap.empty) {
        const data = snap.docs[0].data();
        setLookupResult({ ...data, _id: snap.docs[0].id });
      } else {
        // Fallback for document ID or field 'id'
        const q3 = query(collection(db, "guests"), where("id", "==", visitorId));
        const snap3 = await getDocs(q3);
        if (!snap3.empty) {
            const data = snap3.docs[0].data();
            setLookupResult({ ...data, _id: snap3.docs[0].id });
        } else {
            setError(`Visitor "${visitorId}" not found`);
        }
      }
    } catch (err) {
      console.error("Lookup error:", err);
      setError("System error during lookup");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-xl font-bold">Scan QR Code</h1>
          <p className="text-xs text-muted-foreground">Point camera at visitor&apos;s QR code</p>
        </div>
      </div>

      {/* Scanner Viewfinder */}
      <Card className="border-none shadow-xl overflow-hidden bg-black relative mx-auto" style={{ width: '280px', height: '280px' }}>
        <div id={scannerContainerId} className="w-full h-full" />
        
        {isScanning && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
             <div className="w-48 h-48 border-2 border-primary/50 rounded-2xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-lg" />
                
                {/* Scan line animation */}
                <div className="absolute left-2 right-2 h-0.5 bg-primary/80 animate-scanline top-0" />
             </div>
          </div>
        )}

        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20 text-white gap-4">
            <QrCode className="w-12 h-12 opacity-30" />
            <Button onClick={startScanner} className="bg-primary hover:bg-primary/90 shadow-lg">
              <PlayCircle className="w-4 h-4 mr-2" />
              Start Scanner
            </Button>
          </div>
        )}
      </Card>

      {isScanning && (
        <Button 
          variant="outline" 
          onClick={stopScanner} 
          className="w-full border-destructive text-destructive hover:bg-destructive/10 h-12"
        >
          <StopCircle className="w-4 h-4 mr-2" />
          Stop Camera
        </Button>
      )}

      {/* Manual Input */}
      <div className="space-y-2">
        <p className="text-center text-[10px] uppercase font-bold text-muted-foreground tracking-widest">Or enter ID manually</p>
        <div className="flex gap-2">
          <Input 
            placeholder="e.g. ADC2026-0001" 
            value={visitorIdInput}
            onChange={e => setVisitorIdInput(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === "Enter" && handleLookup(visitorIdInput)}
            className="font-mono h-12"
          />
          <Button onClick={() => handleLookup(visitorIdInput)} disabled={isLoading} className="h-12 px-6">
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Look Up"}
          </Button>
        </div>
      </div>

      {/* Results Area */}
      <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
        {error && (
          <Alert variant="destructive" className="border-destructive/50">
            <XCircle className="w-4 h-4" />
            <AlertTitle className="font-bold">NOT FOUND</AlertTitle>
            <AlertDescription className="text-xs">
              {error}
              <div className="mt-4 flex flex-col gap-2">
                <Button asChild variant="destructive" size="sm" className="w-full">
                  <Link href="/dashboard/register-onsite">On-Site Registration</Link>
                </Button>
                <Button variant="outline" size="sm" onClick={() => { setError(null); startScanner(); }} className="w-full">Try Again</Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {lookupResult && (
          <div className="space-y-4">
            {lookupResult.checkedIn ? (
              <Alert className="bg-yellow-50 border-yellow-200 text-yellow-800">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <AlertTitle className="font-black text-yellow-900">ALREADY CHECKED IN</AlertTitle>
                <AlertDescription className="text-xs font-medium">
                  {lookupResult.fullName} was checked in at {lookupResult.checkInTime ? new Date(lookupResult.checkInTime).toLocaleTimeString() : 'N/A'}.
                  <div className="mt-3">
                    <Button variant="outline" size="sm" onClick={() => { setLookupResult(null); startScanner(); }} className="w-full border-yellow-300 hover:bg-yellow-100 text-yellow-900">
                      Scan Another
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <Card className="border-none shadow-lg overflow-hidden">
                <div className="h-1.5 bg-green-500" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    Visitor Found
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold leading-none">{lookupResult.fullName}</p>
                      <p className="text-[10px] text-muted-foreground mt-1 font-mono">{lookupResult.visitorId || lookupResult.id}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5 mr-2" />
                      {lookupResult.companyName}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Briefcase className="w-3.5 h-3.5 mr-2" />
                      {lookupResult.designation}
                    </div>
                  </div>

                  <Button asChild className="w-full bg-green-600 hover:bg-green-700 h-12 font-bold text-lg shadow-md">
                    <Link href={`/dashboard/checkin/${lookupResult._id}`}>
                      Confirm & Proceed
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => { setLookupResult(null); startScanner(); }} className="w-full text-muted-foreground">
                    Cancel
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>

      <style jsx global>{`
        #qr-reader {
          border: none !important;
          width: 100% !important;
          height: 100% !important;
        }
        #qr-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          border-radius: 0px !important;
        }
        #qr-reader__scan_region {
          width: 100% !important;
          height: 100% !important;
        }
        #qr-reader__scan_region img { display: none !important; }
        #qr-reader__dashboard { display: none !important; }
        #qr-reader__status_span { display: none !important; }
        #qr-reader__camera_selection { display: none !important; }
        #qr-reader__header_message { display: none !important; }
        
        @keyframes scanline {
          0% { top: 10%; }
          50% { top: 90%; }
          100% { top: 10%; }
        }
        .animate-scanline {
          animation: scanline 2s linear infinite;
        }
      `}</style>
    </div>
  );
}
