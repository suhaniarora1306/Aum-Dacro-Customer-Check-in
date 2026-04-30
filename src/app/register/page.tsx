
"use client";

import React, { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, User, Mail, Phone, Building2, Briefcase, GraduationCap } from "lucide-react";
import Image from "next/image";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { registerGuestAction } from "./actions";

export default function RegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const logoImage = PlaceHolderImages.find(img => img.id === "app-logo");

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const result = await registerGuestAction(formData);

    if (result.success) {
      setIsSuccess(true);
      toast({
        title: "Registration Successful",
        description: "Your confirmation has been sent to your WhatsApp and email.",
      });
    } else {
      toast({
        variant: "destructive",
        title: "Registration Failed",
        description: result.error || "Please try again later.",
      });
    }
    setIsLoading(false);
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F0F2F4]">
        <Card className="w-full max-w-md text-center p-8 animate-in zoom-in-95 duration-500">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-primary mb-4">Registration Complete!</h2>
          <p className="text-muted-foreground mb-8">
            Thank you for registering for Customer Meet 2026. Your unique QR code and event details have been sent to your WhatsApp and email address.
          </p>
          <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
            Register Another Guest
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F2F4] flex flex-col items-center py-12 px-4">
      <div className="mb-8 flex flex-col items-center">
        {logoImage && (
          <div className="relative w-20 h-20 mb-4 rounded-xl overflow-hidden shadow-lg">
            <Image
              src={logoImage.imageUrl}
              alt="Logo"
              fill
              className="object-cover"
              data-ai-hint="event logo"
            />
          </div>
        )}
        <h1 className="text-3xl font-bold text-primary tracking-tight">Customer Meet 2026</h1>
        <p className="text-muted-foreground">Guest Registration Portal</p>
      </div>

      <Card className="w-full max-w-2xl shadow-xl border-none">
        <CardHeader className="border-b bg-muted/20 pb-8 pt-8 px-8">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            Registration Form
          </CardTitle>
          <CardDescription>
            Please fill in your professional details to receive your entry QR code.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> Full Name
                </Label>
                <Input id="fullName" name="fullName" placeholder="John Doe" required className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-primary" /> Email Address
                </Label>
                <Input id="email" name="email" type="email" placeholder="john@company.com" required className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="whatsappNumber" className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-primary" /> WhatsApp Number
                </Label>
                <Input id="whatsappNumber" name="whatsappNumber" placeholder="+91 9876543210" required className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="companyName" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" /> Company Name
                </Label>
                <Input id="companyName" name="companyName" placeholder="Tech Solutions Ltd" required className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="department" className="flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" /> Department
                </Label>
                <Input id="department" name="department" placeholder="IT / Operations" required className="h-11" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="designation" className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-primary" /> Designation
                </Label>
                <Input id="designation" name="designation" placeholder="Sr. Manager" required className="h-11" />
              </div>
            </div>

            <Button type="submit" className="w-full h-12 text-lg font-bold mt-4" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                "Submit Registration"
              )}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              By submitting, you agree to receive event-related communications on WhatsApp and Email.
            </p>
          </form>
        </CardContent>
      </Card>
      
      <footer className="mt-12 text-center text-sm text-muted-foreground">
        &copy; 2026 Customer Meet Event Management Team. All rights reserved.
      </footer>
    </div>
  );
}
