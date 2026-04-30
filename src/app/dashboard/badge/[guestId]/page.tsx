"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useFirestore, useDoc, useMemoFirebase, useCollection } from "@/firebase";
import { doc, updateDoc, collection } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, LayoutGrid, Home, Loader2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { updateBadgePrintedSheet } from "@/lib/sheets";

export default function BadgePrintPage() {
  const { guestId } = useParams() as { guestId: string };
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [showGrid, setShowGrid] = useState(false);

  const guestRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return doc(firestore, "guests", guestId);
  }, [firestore, guestId]);

  const { data: guest, isLoading } = useDoc(guestRef);

  const guestTypesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "guestTypes");
  }, [firestore]);
  const { data: guestTypes } = useCollection(guestTypesQuery);

  const customerTypeColor = guestTypes?.find(t => t.name === guest?.customerType)?.color || "#1565C0";

  const handlePrint = async (type: 'single' | 'grid') => {
    if (type === 'grid') setShowGrid(true);
    
    // Slight delay for UI to settle
    setTimeout(async () => {
      window.print();
      if (guestRef) {
        await updateDoc(guestRef, { badgePrinted: true });
        
        // Sync to Google Sheets (Non-blocking)
        updateBadgePrintedSheet(guestId).then((success) => {
          if (success) toast({ title: "Synced to Google Sheets ✓", className: "bg-green-50 border-green-200 text-green-700" });
        }).catch(err => console.error("Sheets badge sync failed:", err));
      }
    }, 500);
  };

  if (isLoading || !guest) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const Badge = ({ className }: { className?: string }) => (
    <div 
      className={cn(
        "badge-container w-[325px] h-[204px] bg-white border border-[#CBD5E0] rounded-[8px] relative shadow-md flex flex-col overflow-hidden",
        className
      )}
    >
      {/* Top Strip */}
      <div className="w-full h-[12px]" style={{ backgroundColor: customerTypeColor }} />
      
      {/* Top Header */}
      <div className="px-3 pt-3 flex justify-between items-start">
        <div className="w-[28px] h-[28px] rounded-full bg-[#1565C0] flex items-center justify-center text-white text-[11px] font-bold">
          AD
        </div>
        <span className="text-[8px] text-[#9E9E9E] font-medium uppercase tracking-tight">Customer Meet 2026</span>
      </div>

      {/* Center Info */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        <h2 className="text-[16px] font-bold text-[#1A202C] leading-tight mb-0.5">{guest.fullName}</h2>
        <p className="text-[11px] text-[#718096] font-medium leading-none">{guest.designation}</p>
        <p className="text-[11px] text-[#718096] font-medium truncate w-full">{guest.companyName}</p>
      </div>

      {/* Footer */}
      <div className="px-3 pb-3 flex justify-between items-end">
        <div className="flex flex-col">
          <span 
            className="text-[9px] font-bold uppercase tracking-wider" 
            style={{ color: customerTypeColor }}
          >
            {guest.customerType}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <img 
            src={`https://api.qrserver.com/v1/create-qr-code/?size=60x60&data=${guest.id}`} 
            alt="QR" 
            className="w-[50px] h-[50px]"
          />
          <span className="text-[8px] font-mono text-[#9E9E9E]">{guest.id}</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-bold">Print Badge</h1>
        </div>
      </div>

      <div className="flex flex-col items-center gap-8 no-print">
        <Badge />

        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
          <Button 
            className="flex-1 h-12 font-bold" 
            onClick={() => handlePrint('single')}
          >
            <Printer className="w-5 h-5 mr-2" />
            Print Single Badge
          </Button>
          <Button 
            variant="outline" 
            className="flex-1 h-12 font-bold" 
            onClick={() => handlePrint('grid')}
          >
            <LayoutGrid className="w-5 h-5 mr-2" />
            Print 4 on A4
          </Button>
        </div>

        <Button variant="ghost" asChild className="text-muted-foreground">
          <Link href="/dashboard">
            <Home className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
        </Button>
      </div>

      {/* Print Grid Overlay */}
      <Dialog open={showGrid} onOpenChange={setShowGrid}>
        <DialogContent className="max-w-[210mm] h-[297mm] p-0 border-none bg-white flex items-center justify-center">
          <div className="grid grid-cols-2 gap-[20px] p-[20mm]">
            <Badge />
            <Badge />
            <Badge />
            <Badge />
          </div>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .badge-container, .badge-container * {
            visibility: visible;
          }
          .no-print {
            display: none !important;
          }
          .badge-container {
            position: absolute;
            left: 0;
            top: 0;
            margin: 0;
            border: none !important;
            box-shadow: none !important;
          }
          @page {
            margin: 0;
            size: auto;
          }
        }
      `}</style>
    </div>
  );
}
