"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc, 
  query, 
  where, 
  setDoc, 
  serverTimestamp,
  onSnapshot 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  CheckCircle2, 
  Clock,
  MoreVertical,
  QrCode,
  Loader2,
  Trash2,
  Plus,
  Printer,
  RefreshCw,
  Camera
} from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { addVisitorToSheet } from "@/lib/sheets";
import { useFirestore, useMemoFirebase, useCollection } from "@/firebase";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

const DEPARTMENTS = [
  "Design",
  "Engineering",
  "Finance & Accounts",
  "Manufacturing / Production",
  "Materials / Material Analysis",
  "Operations",
  "Purchase / Procurement",
  "Quality (QA / SQA / Supplier Quality)",
  "R&D / NPD / Product Development",
  "Sales & Marketing",
  "Strategic Sourcing",
  "Supply Chain / SCM",
  "Top Management",
  "Vendor Development / Tier 2 Division"
];

const DESIGNATIONS = [
  "Chairman / Group Director",
  "Managing Director (MD) / CEO",
  "President",
  "Executive Vice President (EVP)",
  "Senior Vice President (SVP)",
  "Vice President (VP) / AVP",
  "Sr. General Manager",
  "General Manager (GM)",
  "Deputy General Manager (DGM) / AGM",
  "Senior Manager",
  "Manager",
  "Deputy Manager / Assistant Manager",
  "Senior Engineer / Engineer",
  "Executive / Officer",
  "Proprietor / Owner / Partner"
];

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

function SearchableDropdown({ options, value, onChange, placeholder }: { options: string[], value: string, onChange: (val: string) => void, placeholder: string }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => { 
      if (!(e.target as HTMLElement).closest('.searchable-dropdown')) setOpen(false); 
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="searchable-dropdown" style={{ position: "relative", width: "100%" }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          height: "40px", border: "1px solid #CBD5E0", borderRadius: "8px",
          padding: "0 12px", display: "flex", alignItems: "center",
          justifyContent: "space-between", cursor: "pointer", background: "white",
          fontSize: "14px", color: "#1A202C"
        }}
      >
        <span className="truncate">{value || placeholder}</span>
        <span style={{ fontSize: "10px" }}>▼</span>
      </div>

      {open && (
        <div style={{
          position: "absolute", top: "44px", left: 0, right: 0,
          background: "white", border: "1px solid #CBD5E0", borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)", zIndex: 1000, maxHeight: "240px",
          overflow: "hidden", display: "flex", flexDirection: "column"
        }}>
          <div style={{ padding: "8px" }}>
            <input
              autoFocus
              placeholder="Search..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: "100%", height: "36px", border: "1px solid #CBD5E0",
                borderRadius: "6px", padding: "0 10px", fontSize: "13px",
                outline: "none", boxSizing: "border-box"
              }}
            />
          </div>
          <div style={{ overflowY: "auto", maxHeight: "180px" }}>
            {filtered.length === 0 && (
              <div style={{ padding: "12px", color: "#718096", fontSize: "13px", textAlign: "center" }}>
                No results found
              </div>
            )}
            {filtered.map(opt => (
              <div
                key={opt}
                onClick={() => { onChange(opt === placeholder ? "" : opt); setOpen(false); setSearch(""); }}
                style={{
                  padding: "10px 16px", cursor: "pointer", fontSize: "14px",
                  background: value === opt ? "#EBF0FA" : "white",
                  color: value === opt ? "#1565C0" : "#1A202C",
                  fontWeight: value === opt ? "600" : "400"
                }}
              >
                {opt}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function GuestListPage() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const router = useRouter();
  
  const [allGuests, setAllGuests] = useState<any[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const seenGuestIds = useRef<Set<string>>(new Set());

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCompany, setSelectedCompany] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedQR, setSelectedQR] = useState<{ id: string, name: string } | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<{ 
    name: string, 
    photo: string, 
    checkInTime: string 
  } | null>(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    whatsappNumber: "",
    companyName: "",
    department: "",
    designation: ""
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [selectedGuestIds, setSelectedGuestIds] = useState<Set<string>>(new Set());
  const [bulkFilter, setBulkFilter] = useState("All");

  const fetchData = async () => {
    setIsDataLoading(true);
    try {
      const guestsQuery = query(collection(db, "guests"));
      const guestsSnap = await getDocs(guestsQuery);
      const guestsList = guestsSnap.docs.map(doc => ({ 
        id: doc.id, 
        docId: doc.id, 
        ...doc.data() 
      }));

      const visitorsQuery = query(collection(db, "visitors"));
      const visitorsSnap = await getDocs(visitorsQuery);
      const visitorsList = visitorsSnap.docs.map(doc => ({ 
        id: doc.id, 
        docId: doc.id, 
        ...doc.data() 
      }));

      const merged = [...guestsList, ...visitorsList];
      setAllGuests(merged);
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Fetch Error", description: "Failed to load guest registries." });
    } finally {
      setIsDataLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePrintBadge = (guest: any) => {
    localStorage.removeItem("printGuests");
    localStorage.setItem("printGuests", JSON.stringify([guest]));
    router.push("/dashboard/print-badge");
  };

  const formatRegDate = (guest: any): string => {
    const raw = guest.registrationDate 
      || guest.createdAt
      || guest.created_at
      || guest.registration_date 
      || guest.timestamp
      || guest.date
      || guest.eventDate
      || guest.regDate
      || guest.reg_date
      || guest.addedAt
      || guest.added_at
      || guest.submittedAt
      || guest.submitted_at
      || null;
    
    if (!raw) return "N/A";
    
    try {
      if (raw && typeof raw.toDate === "function") {
        return format(raw.toDate(), "dd MMM, HH:mm");
      }
      if (raw && raw.seconds) {
        return format(new Date(raw.seconds * 1000), "dd MMM, HH:mm");
      }
      if (typeof raw === "string" && raw.length > 0) {
        const d = new Date(raw);
        if (!isNaN(d.getTime())) return format(d, "dd MMM, HH:mm");
      }
      if (typeof raw === "number") {
        return format(new Date(raw), "dd MMM, HH:mm");
      }
      return formatDate(raw);
    } catch {
      return "N/A";
    }
  };

  useEffect(() => {
    if (allGuests.length === 0) return;
    allGuests.forEach((guest: any) => {
      if (!seenGuestIds.current.has(guest.id)) {
        if (seenGuestIds.current.size > 0 && !guest.checkedIn) {
          toast({
            title: `New Guest: ${guest.fullName}`,
            description: `${guest.companyName} · ${guest.customerType}`,
            action: (
              <Button 
                size="sm"
                onClick={() => handlePrintBadge(guest)}
                className="bg-[#1565C0] text-white hover:bg-[#1565C0]/90 text-[10px] h-7 px-2"
              >
                Print Badge
              </Button>
            ),
          });
        }
        seenGuestIds.current.add(guest.id);
      }
    });
  }, [allGuests, toast]);

  const handleBulkPrint = () => {
    const selectedGuests = allGuests.filter(g => selectedGuestIds.has(g.id));
    if (selectedGuests.length === 0) {
      toast({ variant: "destructive", title: "Selection Required", description: "Please select at least one guest." });
      return;
    }
    localStorage.removeItem("printGuests");
    localStorage.setItem("printGuests", JSON.stringify(selectedGuests));
    router.push("/dashboard/print-badge");
    setIsBulkModalOpen(false);
  };

  const uniqueCompanies = useMemo(() => {
    const companies = allGuests.map(g => g.companyName).filter(Boolean);
    return Array.from(new Set(companies)).sort();
  }, [allGuests]);

  const filteredGuests = useMemo(() => {
    const sorted = [...allGuests].sort((a: any, b: any) => {
      function getTime(g: any): number {
        const raw = g.registrationDate 
          || g.createdAt 
          || g.created_at
          || g.registration_date 
          || g.timestamp
          || g.date
          || g.eventDate
          || g.regDate
          || g.reg_date
          || g.addedAt
          || g.added_at
          || g.submittedAt
          || g.submitted_at
          || null;
        if (!raw) return 0;
        if (raw.toDate) return raw.toDate().getTime();
        if (raw.seconds) return raw.seconds * 1000;
        if (typeof raw === "string") return new Date(raw).getTime() || 0;
        if (typeof raw === "number") return raw;
        return 0;
      }
      return getTime(b) - getTime(a);
    });

    return sorted.filter(guest => {
      const matchesSearch = searchTerm === "" ||
        guest.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCompany = selectedCompany === "" || guest.companyName === selectedCompany;
      const matchesType = selectedType === "" || guest.customerType === selectedType;
      
      const matchesStatus = statusFilter === "All" || 
        (statusFilter === "Checked In" && guest.checkedIn) ||
        (statusFilter === "Pending" && !guest.checkedIn);

      return matchesSearch && matchesCompany && matchesType && matchesStatus;
    });
  }, [allGuests, searchTerm, selectedCompany, selectedType, statusFilter]);

  const handleDeleteGuest = async (visitorId: string, docId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this guest? This cannot be undone."
    );
    if (!confirmed) return;

    try {
      // 1. Delete from Firestore using document ID
      if (docId) {
        // Try deleting from both possible collections for legacy support
        await deleteDoc(doc(db, "guests", docId)).catch(() => {});
        await deleteDoc(doc(db, "visitors", docId)).catch(() => {});
      } else {
        // Fallback: query by visitorId
        const qG = query(collection(db, "guests"), where("visitorId", "==", visitorId));
        const qV = query(collection(db, "visitors"), where("visitorId", "==", visitorId));
        const [snapG, snapV] = await Promise.all([getDocs(qG), getDocs(qV)]);
        
        for (const d of snapG.docs) {
          await deleteDoc(doc(db, "guests", d.id));
        }
        for (const d of snapV.docs) {
          await deleteDoc(doc(db, "visitors", d.id));
        }
      }

      // 2. Also delete matching checkInLogs
      const logsQ = query(
        collection(db, "checkInLogs"),
        where("visitorId", "==", visitorId)
      );
      const logsSnap = await getDocs(logsQ);
      for (const d of logsSnap.docs) {
        await deleteDoc(doc(db, "checkInLogs", d.id));
      }

      // 3. Remove from local state IMMEDIATELY
      setAllGuests(prev => prev.filter(g =>
        g.visitorId !== visitorId && g.id !== docId && g.docId !== docId
      ));

      toast({ title: "Success", description: "Guest deleted successfully" });
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to delete guest" });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.fullName.trim()) errors.fullName = "Full Name is required";
    if (!formData.email.trim()) {
      errors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!formData.whatsappNumber.trim()) {
      errors.whatsappNumber = "WhatsApp number is required";
    } else if (formData.whatsappNumber.replace(/\D/g, '').length < 10) {
      errors.whatsappNumber = "Please enter a valid WhatsApp number";
    }
    if (!formData.companyName.trim()) errors.companyName = "Company name is required";
    if (!formData.department || formData.department === "Choose Department") errors.department = "Select department";
    if (!formData.designation || formData.designation === "Choose Designation") errors.designation = "Select designation";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);
    try {
      const guestId = `ADC2026-${Date.now().toString().slice(-6)}`;
      const newGuest = {
        id: guestId,
        visitorId: guestId,
        fullName: formData.fullName.trim(),
        email: formData.email.trim().toLowerCase(),
        whatsappNumber: formData.whatsappNumber.trim(),
        companyName: formData.companyName.trim(),
        department: formData.department,
        designation: formData.designation,
        customerType: "Guest",
        registrationDate: new Date().toISOString(),
        checkedIn: false,
        badgePrinted: false,
        createdAt: serverTimestamp()
      };
      await setDoc(doc(db, "guests", guestId), newGuest);
      addVisitorToSheet(newGuest).catch(() => {});
      toast({ title: "Success", description: "Guest added successfully" });
      setIsAddModalOpen(false);
      setFormData({ fullName: "", email: "", whatsappNumber: "", companyName: "", department: "", designation: "" });
      fetchData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleGuestSelection = (id: string) => {
    const next = new Set(selectedGuestIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedGuestIds(next);
  };

  const selectStyles = "w-full h-[48px] border border-[#CBD5E0] rounded-lg px-3 text-sm bg-white text-[#1A202C] appearance-none focus:ring-2 focus:ring-primary/20 outline-none";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary font-headline tracking-tight">Guest Registry</h1>
          <p className="text-muted-foreground">
            Total count: <span className="font-bold text-foreground">{allGuests.length}</span> guests tracked.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchData} className="h-9">
            <RefreshCw className={cn("w-4 h-4 mr-2", isDataLoading && "animate-spin")} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsBulkModalOpen(true)}>
            <Printer className="w-4 h-4 mr-2" />
            Print Badges
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-[#1565C0]">
            <Plus className="w-4 h-4 mr-2" />
            Add Guest
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Input 
          placeholder="Search by name or email..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="h-11 bg-white"
        />
        <div className="grid grid-cols-2 gap-4">
          <SearchableDropdown 
            options={["All Companies", ...uniqueCompanies]}
            value={selectedCompany || "All Companies"}
            onChange={(val) => setSelectedCompany(val === "All Companies" ? "" : val)}
            placeholder="All Companies"
          />
          <SearchableDropdown 
            options={["All Types", "Key Speaker", "OEM", "Customer", "Vendor", "Partner", "Press/Media", "Internal Team", "Walk-In Guest"]}
            value={selectedType || "All Types"}
            onChange={(val) => setSelectedType(val === "All Types" ? "" : val)}
            placeholder="All Types"
          />
        </div>
        <div className="flex items-center gap-2">
          {["All", "Checked In", "Pending"].map((status) => (
            <Button
              key={status}
              size="sm"
              variant={statusFilter === status ? "default" : "outline"}
              onClick={() => setStatusFilter(status)}
              className="rounded-full px-6"
            >
              {status}
            </Button>
          ))}
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-white">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow>
                  <TableHead className="font-bold text-xs uppercase">Visitor ID</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Guest Name</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Company</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Type</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Status</TableHead>
                  <TableHead className="font-bold text-xs uppercase">Reg. Date</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isDataLoading ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></TableCell></TableRow>
                ) : filteredGuests.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">No matching guests found.</TableCell></TableRow>
                ) : (
                  filteredGuests.map((guest) => (
                    <TableRow key={guest.id} className="hover:bg-primary/5">
                      <TableCell className="font-mono text-[10px] uppercase">{guest.visitorId || guest.id}</TableCell>
                      <TableCell className="font-bold">{guest.fullName}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">{guest.companyName}</span>
                          <span className="text-[10px] text-muted-foreground uppercase">{guest.designation}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-[10px] uppercase font-bold text-[#1565C0]">
                          {guest.customerType || "Guest"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {guest.checkedIn ? (
                          <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px]">Checked In</Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 text-[10px]">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatRegDate(guest)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handlePrintBadge(guest)}>
                              <Printer className="w-4 h-4 mr-2" /> Print Badge
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelectedQR({ id: guest.id, name: guest.fullName })}>
                              <QrCode className="w-4 h-4 mr-2" />View QR
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setSelectedPhoto({
                              name: guest.fullName,
                              photo: guest.photoBase64 
                                || guest.checkInPhotoUrl 
                                || guest.photo
                                || guest.photoUrl
                                || guest.checkInPhoto
                                || guest.image
                                || "",
                              checkInTime: guest.checkInTime || ""
                            })}>
                              <Camera className="w-4 h-4 mr-2" />
                              View Photo
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={() => handleDeleteGuest(guest.visitorId || guest.id, guest.id)}>
                              <Trash2 className="w-4 h-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Guest</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddGuest} className="space-y-4 pt-4">
            <div className="space-y-4">
              <div className="space-y-1">
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input value={formData.fullName} onChange={e => setFormData({...formData, fullName: e.target.value})} />
                {formErrors.fullName && <p className="text-[10px] text-destructive">{formErrors.fullName}</p>}
              </div>
              <div className="space-y-1">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                {formErrors.email && <p className="text-[10px] text-destructive">{formErrors.email}</p>}
              </div>
              <div className="space-y-1">
                <Label>WhatsApp <span className="text-destructive">*</span></Label>
                <Input value={formData.whatsappNumber} onChange={e => setFormData({...formData, whatsappNumber: e.target.value})} />
                {formErrors.whatsappNumber && <p className="text-[10px] text-destructive">{formErrors.whatsappNumber}</p>}
              </div>
              <div className="space-y-1">
                <Label>Company <span className="text-destructive">*</span></Label>
                <Input value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                {formErrors.companyName && <p className="text-[10px] text-destructive">{formErrors.companyName}</p>}
              </div>
              <div className="space-y-1">
                <Label>Department <span className="text-destructive">*</span></Label>
                <select value={formData.department || "Choose Department"} onChange={e => setFormData({...formData, department: e.target.value})} className={selectStyles}>
                  <option disabled>Choose Department</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {formErrors.department && <p className="text-[10px] text-destructive">{formErrors.department}</p>}
              </div>
              <div className="space-y-1">
                <Label>Designation <span className="text-destructive">*</span></Label>
                <select value={formData.designation || "Choose Designation"} onChange={e => setFormData({...formData, designation: e.target.value})} className={selectStyles}>
                  <option disabled>Choose Designation</option>
                  {DESIGNATIONS.map(desig => <option key={desig} value={desig}>{desig}</option>)}
                </select>
                {formErrors.designation && <p className="text-[10px] text-destructive">{formErrors.designation}</p>}
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full h-12" disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Guest"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isBulkModalOpen} onOpenChange={setIsBulkModalOpen}>
        <DialogContent className="max-w-3xl flex flex-col p-0 max-h-[90vh]">
          <DialogHeader className="p-6 border-b">
            <DialogTitle>Bulk Print Badges</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="flex gap-2">
              {["All", "Pending", "Checked In"].map(status => (
                <Button key={status} size="sm" variant={bulkFilter === status ? "default" : "outline"} onClick={() => setBulkFilter(status)}>
                  {status}
                </Button>
              ))}
            </div>
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead className="text-xs uppercase font-bold">Name</TableHead>
                  <TableHead className="text-xs uppercase font-bold">Company</TableHead>
                  <TableHead className="text-xs uppercase font-bold text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allGuests.filter(g => 
                  bulkFilter === "All" || 
                  (bulkFilter === "Pending" && !g.checkedIn) || 
                  (bulkFilter === "Checked In" && g.checkedIn)
                ).map(guest => (
                  <TableRow key={guest.id}>
                    <TableCell><Checkbox checked={selectedGuestIds.has(guest.id)} onCheckedChange={() => toggleGuestSelection(guest.id)} /></TableCell>
                    <TableCell className="font-bold text-sm">{guest.fullName}</TableCell>
                    <TableCell className="text-xs">{guest.companyName}</TableCell>
                    <TableCell className="text-center">{guest.checkedIn ? <CheckCircle2 className="w-4 h-4 text-green-600 mx-auto" /> : <Clock className="w-4 h-4 text-amber-500 mx-auto" />}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter className="p-6 border-t bg-muted/20">
            <div className="flex justify-between w-full items-center">
              <span className="text-sm font-medium">{selectedGuestIds.size} selected</span>
              <Button onClick={handleBulkPrint} disabled={selectedGuestIds.size === 0}>
                <Printer className="w-4 h-4 mr-2" />
                Print Selected
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedQR} onOpenChange={(open) => !open && setSelectedQR(null)}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader><DialogTitle>{selectedQR?.name}</DialogTitle></DialogHeader>
          <div className="flex flex-col items-center py-6 gap-4">
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${selectedQR?.id}`} alt="QR" className="w-48 h-48" />
            <p className="text-xs font-mono text-muted-foreground">{selectedQR?.id}</p>
          </div>
          <Button onClick={() => setSelectedQR(null)} className="w-full">Close</Button>
        </DialogContent>
      </Dialog>

      <Dialog 
        open={!!selectedPhoto} 
        onOpenChange={(open) => !open && setSelectedPhoto(null)}
      >
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>{selectedPhoto?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {selectedPhoto?.photo ? (
              <img
                src={selectedPhoto.photo}
                alt="Check-in photo"
                style={{
                  width: "200px",
                  height: "200px",
                  borderRadius: "12px",
                  objectFit: "cover",
                  border: "2px solid #E2E8F0",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }}
              />
            ) : (
              <div style={{
                width: "200px", height: "200px",
                borderRadius: "12px",
                background: "#F7FAFC",
                border: "2px solid #E2E8F0",
                display: "flex", alignItems: "center",
                justifyContent: "center",
                color: "#718096", fontSize: "13px"
              }}>
                No photo available
              </div>
            )}
            {selectedPhoto?.checkInTime && (
              <p style={{ fontSize: "12px", color: "#718096" }}>
                Checked in at{" "}
                {(() => {
                  try {
                    const raw = selectedPhoto.checkInTime;
                    if (typeof raw === "string") {
                      return format(new Date(raw), "dd MMM yyyy, HH:mm");
                    }
                    return raw;
                  } catch { return selectedPhoto.checkInTime; }
                })()}
              </p>
            )}
          </div>
          <Button 
            onClick={() => setSelectedPhoto(null)} 
            className="w-full"
          >
            Close
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
