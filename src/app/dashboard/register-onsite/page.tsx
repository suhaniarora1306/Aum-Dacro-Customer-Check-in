
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useFirestore } from "@/firebase";
import { collection, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, User, Mail, Phone, Building2, Briefcase, GraduationCap, Tag } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/components/auth-provider";
import { addVisitorToSheet } from "@/lib/sheets";
import { cn } from "@/lib/utils";

const DEPARTMENTS = [
  "Design", "Engineering", "Finance & Accounts", "Manufacturing / Production",
  "Materials / Material Analysis", "Operations", "Purchase / Procurement",
  "Quality (QA / SQA / Supplier Quality)", "R&D / NPD / Product Development",
  "Sales & Marketing", "Strategic Sourcing", "Supply Chain / SCM",
  "Top Management", "Vendor Development / Tier 2 Division"
];

const DESIGNATIONS = [
  "Chairman / Group Director", "Managing Director (MD) / CEO", "President",
  "Executive Vice President (EVP)", "Senior Vice President (SVP)",
  "Vice President (VP) / AVP", "Sr. General Manager", "General Manager (GM)",
  "Deputy General Manager (DGM) / AGM", "Senior Manager", "Manager",
  "Deputy Manager / Assistant Manager", "Senior Engineer / Engineer",
  "Executive / Officer", "Proprietor / Owner / Partner"
];

export default function OnSiteRegistrationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors({});

    const formData = new FormData(e.currentTarget);
    const rawData = {
      fullName: formData.get("fullName") as string,
      email: formData.get("email") as string,
      whatsappNumber: formData.get("whatsappNumber") as string,
      companyName: formData.get("companyName") as string,
      department: formData.get("department") as string,
      designation: formData.get("designation") as string,
    };

    const newErrors: Record<string, string> = {};
    if (!rawData.fullName?.trim()) newErrors.fullName = "Full Name is required";
    if (!rawData.email?.trim()) {
      newErrors.email = "Email address is required";
    } else if (!validateEmail(rawData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!rawData.whatsappNumber?.trim()) newErrors.whatsappNumber = "WhatsApp number is required";
    if (!rawData.companyName?.trim()) newErrors.companyName = "Company name is required";
    if (!rawData.designation || rawData.designation === "Choose Designation") newErrors.designation = "Please select a designation";
    if (!rawData.department || rawData.department === "Choose Department") newErrors.department = "Department is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsSubmitting(false);
      return;
    }

    try {
      if (!firestore) return;

      // Generate a clean visitor ID based on existing count
      const snapshot = await getDocs(collection(firestore, "guests"));
      const count = snapshot.size + 1;
      const guestId = `ADC2026-${count.toString().padStart(4, "0")}`;

      const registrationDate = new Date().toISOString();

      const newGuest = {
        id: guestId,
        visitorId: guestId,
        fullName: rawData.fullName.trim(),
        email: rawData.email.trim().toLowerCase(),
        whatsappNumber: rawData.whatsappNumber.trim(),
        companyName: rawData.companyName.trim(),
        department: rawData.department,
        designation: rawData.designation,
        customerType: "Walk-In Guest",
        registrationDate: registrationDate,
        registrationMethod: "onsite",
        checkedIn: false,
        badgePrinted: false,
        photoBase64: "", 
        qrCodeImageUrl: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${guestId}`,
        qrCodeData: guestId,
        createdAt: serverTimestamp(),
      };

      // Save as PENDING guest
      await setDoc(doc(firestore, "guests", guestId), newGuest);

      // Sync to sheets as registered
      addVisitorToSheet(newGuest).catch(err => console.error("Sheets registration sync failed:", err));

      toast({ title: "Visitor Registered", description: "Proceed to capture check-in photo." });
      
      // Move to STEP 2: Photo Capture
      router.push(`/dashboard/checkin/${guestId}`);
    } catch (err: any) {
      console.error(err);
      toast({ variant: "destructive", title: "Registration failed", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectStyles = "w-full h-[48px] border border-[#CBD5E0] rounded-[8px] px-[12px] text-[14px] bg-white text-[#1A202C] focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none";

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">On-Site Registration</h1>
          <p className="text-sm text-muted-foreground">Step 1: Register visitor details</p>
        </div>
      </div>

      <Card className="border-none shadow-lg">
        <CardContent className="pt-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Full Name <span className="text-destructive">*</span>
                </Label>
                <Input name="fullName" placeholder="John Doe" className={cn("h-[48px]", errors.fullName && "border-destructive")} />
                {errors.fullName && <p className="text-[12px] text-destructive font-medium">{errors.fullName}</p>}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" /> Email Address <span className="text-destructive">*</span>
                </Label>
                <Input name="email" type="email" placeholder="john@company.com" className={cn("h-[48px]", errors.email && "border-destructive")} />
                {errors.email && <p className="text-[12px] text-destructive font-medium">{errors.email}</p>}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" /> WhatsApp Number <span className="text-destructive">*</span>
                </Label>
                <Input name="whatsappNumber" placeholder="+91XXXXXXXXXX" className={cn("h-[48px]", errors.whatsappNumber && "border-destructive")} />
                {errors.whatsappNumber && <p className="text-[12px] text-destructive font-medium">{errors.whatsappNumber}</p>}
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" /> Company Name <span className="text-destructive">*</span>
                </Label>
                <Input name="companyName" placeholder="Tech Solutions" className={cn("h-[48px]", errors.companyName && "border-destructive")} />
                {errors.companyName && <p className="text-[12px] text-destructive font-medium">{errors.companyName}</p>}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary" /> Designation <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <select name="designation" defaultValue="Choose Designation" className={cn(selectStyles, errors.designation && "border-destructive")}>
                    <option disabled>Choose Designation</option>
                    {DESIGNATIONS.map(desig => <option key={desig} value={desig}>{desig}</option>)}
                  </select>
                </div>
                {errors.designation && <p className="text-[12px] text-destructive font-medium">{errors.designation}</p>}
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" /> Department <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <select name="department" defaultValue="Choose Department" className={cn(selectStyles, errors.department && "border-destructive")}>
                    <option disabled>Choose Department</option>
                    {DEPARTMENTS.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                  </select>
                </div>
                {errors.department && <p className="text-[12px] text-destructive font-medium">{errors.department}</p>}
              </div>
            </div>

            <Button type="submit" className="w-full h-[54px] text-lg font-bold shadow-lg" disabled={isSubmitting}>
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Registering...</span>
                </div>
              ) : "Register & Capture Photo"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
