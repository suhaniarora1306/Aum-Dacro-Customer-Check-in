"use client";

import React, { useState, useMemo } from "react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, updateDoc, where, getDocs, setDoc, deleteDoc } from "firebase/firestore";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from "recharts";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Search, 
  FileDown, 
  Printer, 
  Eye, 
  Users, 
  CheckCircle2, 
  Clock, 
  Settings,
  LayoutDashboard,
  ShieldAlert,
  Loader2,
  UserPlus
} from "lucide-react";
import Link from "next/link";
import { APP_NAME } from "@/config/constants";
import { useToast } from "@/hooks/use-toast";

function formatDate(dateValue: any) {
  if (!dateValue) return "N/A";
  try {
    // Handle Firestore timestamp object
    if (dateValue && dateValue.seconds) {
      return new Date(dateValue.seconds * 1000)
        .toLocaleDateString("en-IN");
    }
    // Handle string date
    var d = new Date(dateValue);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-IN");
    }
    // Return as-is if already formatted string
    return dateValue.toString();
  } catch(e) {
    return dateValue.toString();
  }
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const firestore = useFirestore();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  if (user && user.role !== "Admin") {
    router.push("/dashboard");
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <ShieldAlert className="w-12 h-12 text-destructive" />
        <p className="font-bold">Access Denied</p>
      </div>
    );
  }

  const guestsQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return query(collection(firestore, "guests"), orderBy("registrationDate", "desc"));
  }, [firestore]);
  const { data: guests, isLoading: guestsLoading } = useCollection(guestsQuery);

  const guestTypesQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, "guestTypes");
  }, [firestore]);
  const { data: guestTypes } = useCollection(guestTypesQuery);

  const totalRegistered = guests?.length || 0;
  const checkedIn = guests?.filter(g => g.checkedIn).length || 0;
  const pending = totalRegistered - checkedIn;
  const badgePrinted = guests?.filter(g => g.badgePrinted).length || 0;

  const chartData = useMemo(() => {
    if (!guests || !guestTypes) return [];
    return guestTypes.map(type => ({
      name: type.name,
      count: guests.filter(g => g.customerType === type.name).length,
      color: type.color
    }));
  }, [guests, guestTypes]);

  const filteredGuests = useMemo(() => {
    if (!guests) return [];
    return guests.filter(g => {
      const matchesSearch = (g.fullName?.toLowerCase() || "").includes(searchTerm.toLowerCase()) || 
                           (g.companyName?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "All" || 
                           (statusFilter === "Checked In" && g.checkedIn) ||
                           (statusFilter === "Pending" && !g.checkedIn) ||
                           (statusFilter === "Badge Printed" && g.badgePrinted);
      return matchesSearch && matchesStatus;
    });
  }, [guests, searchTerm, statusFilter]);

  const handlePrintBadge = (guest: any) => {
    localStorage.removeItem("printGuests");
    localStorage.setItem("printGuests", JSON.stringify([guest]));
    router.push("/dashboard/print-badge");
  };

  const exportCSV = () => {
    if (!guests) return;
    const headers = [
      "Visitor ID", "Full Name", "Email", "WhatsApp", "Company", 
      "Department", "Designation", "Customer Type", "Registration Date", 
      "Checked In", "Check-In Time", "Badge Printed"
    ];
    
    const rows = guests.map(g => [
      g.id, g.fullName, g.email, g.whatsappNumber, g.companyName,
      g.department, g.designation, g.customerType, g.registrationDate,
      g.checkedIn ? "Yes" : "No", g.checkInTime || "", g.badgePrinted ? "Yes" : "No"
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${APP_NAME}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleToggleType = async (typeId: string, currentStatus: boolean) => {
    if (!firestore) return;
    try {
      const typeRef = doc(firestore, "guestTypes", typeId);
      await updateDoc(typeRef, { isActive: !currentStatus });
    } catch (e) {
      console.error("Failed to update customer type", e);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-primary font-headline">Admin Dashboard</h1>
          <p className="text-muted-foreground">Full event oversight and management.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={exportCSV} disabled={!guests || guests.length === 0}>
            <FileDown className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="w-4 h-4 mr-2" />
              Portal Home
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Registered", val: totalRegistered, icon: Users, color: "text-blue-600" },
          { label: "Checked In", val: checkedIn, icon: CheckCircle2, color: "text-green-600" },
          { label: "Pending", val: pending, icon: Clock, color: "text-amber-600" },
          { label: "Badge Printed", val: badgePrinted, icon: Printer, color: "text-purple-600" },
        ].map(stat => (
          <Card key={stat.label} className="border-none shadow-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
              <p className="text-2xl font-black">{guestsLoading ? "..." : stat.val}</p>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-md bg-white hover:bg-muted/5 transition-colors cursor-pointer" asChild>
        <Link href="/dashboard/team">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <UserPlus className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Team Management</h3>
                <p className="text-sm text-muted-foreground">Manage staff accounts, roles, and access permissions.</p>
              </div>
            </div>
            <Badge variant="outline" className="hidden sm:flex">Configure Team</Badge>
          </CardContent>
        </Link>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Check-ins by Customer Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">Customer Types</CardTitle>
              <Settings className="w-4 h-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {guestTypes?.map(type => (
              <div key={type.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: type.color }} />
                  <span className="text-sm font-medium">{type.name}</span>
                </div>
                <Switch 
                  checked={type.isActive !== false} 
                  onCheckedChange={() => handleToggleType(type.id, type.isActive !== false)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-white border-b">
          <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or company..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              {["All", "Checked In", "Pending"].map(filter => (
                <Button 
                  key={filter}
                  variant={statusFilter === filter ? "default" : "outline"}
                  size="sm"
                  onClick={() => setStatusFilter(filter)}
                  className="text-xs h-8"
                >
                  {filter}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold text-xs uppercase">Visitor ID</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Name</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Company</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Type</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Status</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Reg. Date</TableHead>
                  <TableHead className="font-bold text-xs uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGuests.map((guest) => (
                  <TableRow key={guest.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-mono text-[10px]">{guest.id}</TableCell>
                    <TableCell className="font-bold">{guest.fullName}</TableCell>
                    <TableCell className="text-sm">{guest.companyName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px]">
                        {guest.customerType}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {guest.checkedIn ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">Checked In</Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600 border-amber-200 text-[10px]">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground">
                      {formatDate(guest.registrationDate)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8" 
                          onClick={() => handlePrintBadge(guest)}
                        >
                          <Printer className="w-4 h-4" />
                        </Button>
                        <VisitorDetailModal guest={guest} onPrint={handlePrintBadge} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function VisitorDetailModal({ guest, onPrint }: { guest: any, onPrint: (g: any) => void }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" title="View Details">
          <Eye className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md sm:rounded-2xl">
        <DialogHeader>
          <DialogTitle>Visitor Details</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 pt-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted border-2 border-border flex-shrink-0">
              {guest.photoBase64 ? (
                <img src={guest.photoBase64} alt="Captured" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs text-center p-2">No Photo</div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold">{guest.fullName}</h3>
              <p className="text-sm text-muted-foreground">{guest.id}</p>
              <Badge className="mt-1">{guest.customerType}</Badge>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Company</p>
              <p className="font-medium">{guest.companyName}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Designation</p>
              <p className="font-medium">{guest.designation}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Status</p>
              <p className="font-medium">{guest.checkedIn ? "Checked In" : "Pending"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase">Reg. Date</p>
              <p className="font-medium">{formatDate(guest.registrationDate)}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => onPrint(guest)}>
              Print Badge
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}