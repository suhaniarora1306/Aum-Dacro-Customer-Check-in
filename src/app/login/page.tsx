"use client";

import React, { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { useFirebase, initiateAnonymousSignIn } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogIn, Loader2, ShieldCheck, Database } from "lucide-react";
import { seedInitialData } from "@/lib/seeding";
import { LOGO_BASE64 } from "@/config/constants";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSeeding, setIsSeeding] = useState(true);
  const { login } = useAuth();
  const { auth } = useFirebase();

  useEffect(() => {
    async function init() {
      try {
        await seedInitialData();
        if (auth && !auth.currentUser) {
          initiateAnonymousSignIn(auth);
        }
      } catch (e) {
        console.warn("Initial system setup check failed:", e);
      } finally {
        setIsSeeding(false);
      }
    }
    init();
  }, [auth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const trimmedUsername = username.trim().toLowerCase();

    try {
      const q = query(
        collection(db, "team_users"),
        where("username", "==", trimmedUsername)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setError("User not found");
      } else {
        const userData = querySnapshot.docs[0].data() as any;
        
        if (userData.password === password) {
          login({
            id: querySnapshot.docs[0].id,
            username: userData.username,
            fullName: userData.fullName,
            role: userData.role,
            email: userData.email
          });
        } else {
          setError("Wrong password");
        }
      }
    } catch (err: any) {
      console.error("Login attempt error:", err);
      setError("Permission error or connection issue");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSeeding) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Database className="w-12 h-12 text-primary animate-bounce" />
          <div className="flex flex-col items-center">
            <p className="text-foreground font-bold text-lg animate-pulse">Initializing System</p>
            <p className="text-muted-foreground text-sm">Configuring security and data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="mb-8 flex flex-col items-center animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
        <img
          src={LOGO_BASE64}
          alt="Aum Dacro Coatings"
          style={{ width: '130px', height: 'auto', display: 'block', margin: '0 auto 16px auto', borderRadius: '8px' }}
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
        />
        <h1 className="text-4xl font-black text-primary font-headline tracking-tighter text-center">
          AUM DACRO COATINGS
        </h1>
        <p className="text-muted-foreground font-medium uppercase tracking-widest text-xs mt-1">Customer Meet 2026</p>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-none ring-1 ring-border animate-in zoom-in-95 duration-500 overflow-hidden">
        <CardHeader className="space-y-1 bg-white border-b">
          <CardTitle className="text-2xl font-bold text-center">Team Login</CardTitle>
          <CardDescription className="text-center">
            Secure access for event coordinators
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 py-2 px-3">
                <AlertDescription className="text-sm font-medium">{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className="bg-muted/30 focus-visible:ring-primary h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-muted/30 focus-visible:ring-primary h-12"
              />
            </div>
            <Button
              type="submit"
              className="w-full h-12 text-base font-bold transition-all hover:scale-[1.01] bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-5 w-5" />
                  Sign in
                </>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center justify-center pb-6 bg-muted/20 border-t">
          <div className="flex items-center text-[10px] uppercase font-bold tracking-tighter text-muted-foreground mt-4">
            <ShieldCheck className="w-3 h-3 mr-1.5 text-green-500" />
            Authenticated Session Secure
          </div>
        </CardFooter>
      </Card>

      <footer className="mt-8 text-xs text-muted-foreground font-medium">
        &copy; 2026 AUM DACRO COATINGS EVENT SERVICES
      </footer>
    </div>
  );
}