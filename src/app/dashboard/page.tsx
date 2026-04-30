
"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  CheckCircle, 
  Clock, 
  QrCode, 
  UserPlus, 
  Search,
  Zap,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import Link from "next/link";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function DashboardPage() {
  const firestore = useFirestore();

  const guestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "guests");
  }, [firestore]);

  const { data: guests, isLoading: loadingGuests } = useCollection(guestsQuery);

  const totalGuests = guests?.length || 0;
  const checkedInCount = guests?.filter(g => g.checkedIn).length || 0;
  const pendingCount = totalGuests - checkedInCount;

  const stats = [
    { label: "Total Guests", value: totalGuests.toString(), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Checked In", value: checkedInCount.toString(), icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
    { label: "Pending", value: pendingCount.toString(), icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline tracking-tight text-primary">Overview</h1>
          <p className="text-muted-foreground">Track event check-ins and guest registration status.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="border-primary text-primary hover:bg-primary/5">
            <Link href="/dashboard/guests">
              <Search className="w-4 h-4 mr-2" />
              Search Guests
            </Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Link href="/dashboard/scan">
              <QrCode className="w-4 h-4 mr-2" />
              Start Scanning
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-md overflow-hidden hover:shadow-lg transition-all duration-300">
            <CardContent className="p-0">
              <div className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-3xl font-bold mt-1">
                    {loadingGuests ? "..." : stat.value}
                  </p>
                </div>
                <div className={cn("p-4 rounded-2xl", stat.bg)}>
                  <stat.icon className={cn("w-6 h-6", stat.color)} />
                </div>
              </div>
              <div className="px-6 py-3 bg-muted/30 border-t flex items-center text-xs font-medium text-muted-foreground">
                <Zap className="w-3 h-3 mr-1 text-accent animate-pulse" />
                Live from Firestore
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-none shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold">Quick Actions</CardTitle>
              <Zap className="w-5 h-5 text-accent" />
            </div>
            <CardDescription>Commonly used check-in tools</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link href="/dashboard/scan" className="group">
              <div className="p-4 rounded-xl border border-border bg-card hover:bg-primary/5 hover:border-primary/50 transition-all cursor-pointer h-full">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3 text-primary group-hover:scale-110 transition-transform">
                  <QrCode className="w-5 h-5" />
                </div>
                <p className="font-bold text-sm">Scan QR Code</p>
                <p className="text-xs text-muted-foreground mt-1">Instant check-in via guest QR scan</p>
              </div>
            </Link>
            <Link href="/dashboard/register-onsite" className="group">
              <div className="p-4 rounded-xl border border-border bg-card hover:bg-accent/10 hover:border-accent/50 transition-all cursor-pointer h-full">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3 text-accent-foreground group-hover:scale-110 transition-transform">
                  <UserCheck className="w-5 h-5" />
                </div>
                <p className="font-bold text-sm">On-Site Registration</p>
                <p className="text-xs text-muted-foreground mt-1">Register walk-in guests instantly</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl font-bold">System Status</CardTitle>
              <ShieldCheck className="w-5 h-5 text-green-500" />
            </div>
            <CardDescription>Security and database status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium">Firestore Database</span>
                </div>
                <span className="text-xs text-muted-foreground">Connected</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium">Firebase Authentication</span>
                </div>
                <span className="text-xs text-muted-foreground">Secured</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm font-medium">Cloud Storage</span>
                </div>
                <span className="text-xs text-muted-foreground">Ready</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
