
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useFirestore } from "@/firebase";
import { doc, getDoc, updateDoc, collection, addDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Camera,
  RefreshCcw,
  Check,
  Loader2,
  CameraOff,
  AlertTriangle,
  User,
  Building2,
  Briefcase,
  CheckCircle2,
  SwitchCamera
} from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { onVisitorCheckedIn } from "@/lib/integrations";
import { updateCheckInSheet } from "@/lib/sheets";

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

export default function CheckInPage() {
  const router = useRouter();
  const { guestId } = useParams() as { guestId: string };
  const { user } = useAuth();
  const { toast } = useToast();
  const firestore = useFirestore();

  const [visitor, setVisitor] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [step, setStep] = useState<"details" | "photo">("details");

  // Photo state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch visitor on load
  useEffect(() => {
    async function fetchVisitor() {
      if (!guestId || !firestore) return;
      try {
        let docRef = doc(firestore, "guests", guestId);
        let docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
          // Fallback to visitors collection if legacy data
          docRef = doc(firestore, "visitors", guestId);
          docSnap = await getDoc(docRef);
        }

        if (docSnap.exists()) {
          setVisitor({ _docId: docSnap.id, ...docSnap.data() });
        } else {
          toast({ variant: "destructive", title: "Visitor not found" });
          router.push("/dashboard/scan");
        }
      } catch (err) {
        console.error(err);
        toast({ variant: "destructive", title: "Error loading visitor" });
      } finally {
        setIsLoading(false);
      }
    }
    fetchVisitor();
  }, [guestId, firestore, router, toast]);

  // Start camera when moving to photo step
  useEffect(() => {
    if (step !== "photo" || capturedImage) return;

    const startCamera = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: facingMode, 
            width: { ideal: 600 }, 
            height: { ideal: 600 } 
          }
        });
        setStream(mediaStream);
        setHasCameraPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
      } catch (err) {
        console.error("Camera error:", err);
        setHasCameraPermission(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
    };
  }, [step, capturedImage, facingMode]);

  const toggleCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const context = canvasRef.current.getContext("2d");
    if (!context) return;
    const size = Math.min(videoRef.current.videoWidth, videoRef.current.videoHeight);
    const startX = (videoRef.current.videoWidth - size) / 2;
    const startY = (videoRef.current.videoHeight - size) / 2;
    canvasRef.current.width = 400;
    canvasRef.current.height = 400;
    context.drawImage(videoRef.current, startX, startY, size, size, 0, 0, 400, 400);
    const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.6);
    setCapturedImage(dataUrl);
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }
    setStream(null);
  };

  const handleCheckIn = async (photoData: string) => {
    if (!photoData) {
      toast({
        variant: "destructive",
        title: "Photo required",
        description: "Please capture a photo before checking in."
      });
      return;
    }

    if (!firestore) return;

    setIsCheckingIn(true);
    try {
      const checkInTime = new Date().toISOString();
      const updateData = {
        checkedIn: true,
        checkInTime: checkInTime,
        photoBase64: photoData,
        checkedInBy: user?.fullName || "Staff",
      };

      await updateDoc(doc(firestore, "guests", guestId), updateData);

      const logData = {
        guestId: guestId || "",
        guestName: visitor?.fullName || "",
        companyName: visitor?.companyName || "",
        customerType: visitor?.customerType || "Guest",
        checkInTime: checkInTime,
        checkedInBy: user?.fullName || "Staff",
        photoBase64: photoData,
        method: visitor?.registrationMethod === "onsite" ? "onsite" : "qr_scan"
      };

      await addDoc(collection(firestore, "checkInLogs"), logData);

      // Webhook and Sheets integration
      updateCheckInSheet(guestId, user?.fullName || "Staff", photoData)
        .then((success) => {
          if (success) toast({
            title: "Synced to Google Sheets ✓",
            className: "bg-green-50 border-green-200 text-green-700"
          });
        }).catch(console.error);

      await onVisitorCheckedIn({ ...visitor, ...updateData });

      router.push(`/dashboard/checkin/${guestId}/success`);
    } catch (err: any) {
      console.error("Check-in error:", err);
      toast({
        variant: "destructive",
        title: "Check-in failed",
        description: err.message || "Please try again."
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const typeColor = TYPE_COLORS[visitor?.customerType] || "#1565C0";

  if (step === "details") {
    if (visitor?.checkedIn) {
      return (
        <div className="max-w-md mx-auto space-y-6 pb-12">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/dashboard/scan"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <h1 className="text-xl font-bold">Visitor Check-In</h1>
          </div>

          <div className="rounded-2xl border border-yellow-500 bg-yellow-50 overflow-hidden">
            <div style={{ height: "6px", background: typeColor }} />
            <div className="p-5">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm font-black text-yellow-700 uppercase tracking-wider">
                  ALREADY CHECKED IN
                </span>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-black" style={{ background: typeColor + "22", color: typeColor }}>
                    {visitor?.fullName?.charAt(0)}
                  </div>
                  <div>
                    <p className="text-lg font-black text-slate-900 leading-tight">
                      {visitor?.fullName}
                    </p>
                    <Badge variant="outline" className="mt-1" style={{ color: typeColor, borderColor: typeColor + "44" }}>
                      {visitor?.customerType}
                    </Badge>
                  </div>
                </div>
                <div className="h-px bg-yellow-200" />
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Building2 className="w-4 h-4" />
                    <span>{visitor?.companyName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Briefcase className="w-4 h-4" />
                    <span>{visitor?.designation}</span>
                  </div>
                </div>
                <div className="h-px bg-yellow-200" />
                <div className="flex items-center gap-2 text-sm text-yellow-700 font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    Checked in at{" "}
                    {visitor?.checkInTime
                      ? new Date(visitor.checkInTime).toLocaleString("en-IN", {
                          day: "numeric", month: "short",
                          hour: "2-digit", minute: "2-digit"
                        })
                      : "—"}
                  </span>
                </div>
                {visitor?.photoBase64 && (
                  <img
                    src={visitor.photoBase64}
                    alt="Check-in photo"
                    className="w-24 h-24 rounded-lg object-cover mt-2 border-2 border-white shadow-sm"
                  />
                )}
              </div>
            </div>
          </div>

          <Button
            className="w-full h-12 font-bold"
            onClick={() => router.push("/dashboard/scan")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Scan Another Visitor
          </Button>
        </div>
      );
    }

    return (
      <div className="max-w-md mx-auto space-y-6 pb-12">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard/scan"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <h1 className="text-xl font-bold">Visitor Check-In</h1>
        </div>

        <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
          <div style={{ height: "6px", background: typeColor }} />
          <div className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black" style={{ background: typeColor + "22", color: typeColor }}>
                {visitor?.fullName?.charAt(0)}
              </div>
              <div>
                <p className="text-xl font-black text-slate-900 leading-tight">
                  {visitor?.fullName}
                </p>
                <Badge variant="outline" className="mt-1" style={{ color: typeColor, borderColor: typeColor + "44" }}>
                  {visitor?.customerType}
                </Badge>
              </div>
            </div>
            <div className="h-px bg-slate-100" />
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-slate-600 font-medium">
                <Building2 className="w-4 h-4" />
                <span>{visitor?.companyName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Briefcase className="w-4 h-4" />
                <span>{visitor?.designation}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <User className="w-4 h-4" />
                <span className="font-mono text-xs uppercase">{guestId}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            className="w-full h-12 text-base font-bold shadow-lg"
            style={{ background: typeColor }}
            onClick={() => setStep("photo")}
          >
            <Camera className="w-5 h-5 mr-2" />
            Proceed to Capture Photo
          </Button>
          <Button
            variant="outline"
            className="w-full h-12 font-bold"
            onClick={() => router.push("/dashboard/scan")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Scan Different Code
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-6 pb-12">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => { setStep("details"); setCapturedImage(null); if (stream) stream.getTracks().forEach(t => t.stop()); }}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-bold">Capture Photo</h1>
        </div>
        <p className="ml-14 text-sm font-semibold text-muted-foreground">
          {visitor?.fullName} · {visitor?.companyName}
        </p>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="w-[280px] h-[280px] rounded-xl overflow-hidden border-2 border-primary bg-black relative shadow-lg">
          {capturedImage ? (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
          ) : (
            <>
              <video 
                ref={videoRef} 
                className="w-full h-full object-cover" 
                style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }} 
                autoPlay 
                muted 
                playsInline 
              />
              {!capturedImage && hasCameraPermission !== false && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full w-10 h-10 bg-black/50 hover:bg-black/70 text-white border-none z-10"
                  onClick={toggleCamera}
                >
                  <SwitchCamera className="w-5 h-5" />
                </Button>
              )}
              {hasCameraPermission === false && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted p-6 text-center">
                  <CameraOff className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-xs font-medium text-muted-foreground">Camera access denied.</p>
                </div>
              )}
            </>
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <div className="w-full space-y-3 px-2">
          {!capturedImage ? (
            <Button
              onClick={capturePhoto}
              className="w-full h-12 bg-primary font-bold text-lg"
              disabled={hasCameraPermission === false}
            >
              <Camera className="w-5 h-5 mr-2" />
              Take Photo
            </Button>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={() => handleCheckIn(capturedImage)}
                className="w-full h-12 bg-green-600 hover:bg-green-700 font-bold text-lg"
                disabled={isCheckingIn}
              >
                {isCheckingIn ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <><Check className="w-5 h-5 mr-2" />Use This Photo & Check In</>
                )}
              </Button>
              <Button variant="outline" onClick={() => setCapturedImage(null)} className="w-full h-12" disabled={isCheckingIn}>
                <RefreshCcw className="w-4 h-4 mr-2" />
                Retake
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
