
"use client";

import React, { useState, useMemo } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Search, 
  ClipboardList, 
  Clock, 
  User, 
  Building2, 
  Loader2
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

/**
 * Robust date formatting for India locale with time support.
 */
function formatDate(dateValue: any) {
  if (!dateValue) return "N/A";
  try {
    let d: Date;
    // Handle Firestore timestamp object
    if (dateValue && dateValue.seconds) {
      d = new Date(dateValue.seconds * 1000);
    } else {
      // Handle string or number date
      d = new Date(dateValue);
    }
    
    if (isNaN(d.getTime())) return "N/A";
    
    // Requested format: "dd MMM, HH:mm"
    return format(d, "dd MMM, HH:mm");
  } catch(e) {
    return "N/A";
  }
}

export default function CheckInLogsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const firestore = useFirestore();

  // Use the standardized collection name 'checkInLogs'
  const logsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    // Removing orderBy to avoid index errors, sorting client-side instead
    return collection(firestore, "checkInLogs");
  }, [firestore]);

  const { data: rawLogs, isLoading } = useCollection(logsQuery);

  // Client-side sorting: Newest check-ins first
  const sortedLogs = useMemo(() => {
    if (!rawLogs) return [];
    
    return [...rawLogs].sort((a: any, b: any) => {
       const getT = (x: any) => {
         const r = x.checkInTime || x.timestamp || 0;
         if (!r) return 0;
         if (r.toDate) return r.toDate().getTime();
         if (r.seconds) return r.seconds * 1000;
         if (typeof r === "string") return new Date(r).getTime() || 0;
         if (typeof r === "number") return r;
         return 0;
       };
       return getT(b) - getT(a);
    });
  }, [rawLogs]);

  const filteredLogs = sortedLogs.filter(log => 
    (log.guestName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
    (log.companyName?.toLowerCase() || "").includes(searchTerm.toLowerCase())
  );

  const totalCheckIns = sortedLogs.length;
  
  return (
    <div className="max-w-md mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-bold">Check-In Logs</h1>
      </div>

      <div className="grid grid-cols-1 gap-4">
        <Card className="border-none shadow-sm bg-slate-50">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <ClipboardList className="w-5 h-5 text-slate-600 mb-1" />
            <p className="text-2xl font-black text-slate-700">{isLoading ? "..." : totalCheckIns}</p>
            <p className="text-[10px] uppercase font-bold text-slate-600/70 tracking-wider">Total Check-Ins</p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search visitor or company..." 
          className="pl-10 h-12 bg-white border-none shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-muted-foreground">Loading logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
            <ClipboardList className="w-8 h-8 text-muted-foreground/50" />
            <p className="font-bold text-muted-foreground">No check-ins recorded yet</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <Card key={log.id} className="border-none shadow-sm overflow-hidden bg-white hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-base leading-tight">{log.guestName || log.visitorName}</p>
                      <Badge variant="outline" className={cn(
                        "text-[9px] h-4 px-1.5 uppercase font-black",
                        log.method === "qr_scan" ? "border-blue-200 text-blue-600 bg-blue-50" : "border-orange-200 text-orange-600 bg-orange-50"
                      )}>
                        {log.method === "qr_scan" ? "QR Scan" : "On-Site"}
                      </Badge>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Building2 className="w-3.5 h-3.5 mr-1.5" />
                      {log.companyName || "N/A"}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded-full">
                      {log.customerType || "Guest"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-dashed flex items-center justify-between">
                  <div className="flex items-center text-[11px] text-muted-foreground font-medium">
                    <Clock className="w-3.5 h-3.5 mr-1.5" />
                    {formatDate(log.checkInTime)}
                  </div>
                  <div className="flex items-center text-[11px] text-muted-foreground italic">
                    <User className="w-3.5 h-3.5 mr-1.5" />
                    By {log.checkedInBy || "System"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
