"use client";

import React from "react";
import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { 
  LogOut, 
  LayoutDashboard, 
  Users, 
  ClipboardList, 
  ShieldCheck, 
  QrCode,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from "@/components/ui/sidebar";
import { LOGO_BASE64 } from "@/config/constants";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, loading } = useAuth();
  const pathname = usePathname();

  const NAV_ITEMS = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Guest List", href: "/dashboard/guests", icon: Users },
    { name: "Check-in Logs", href: "/dashboard/logs", icon: ClipboardList },
    { name: "Scan QR", href: "/dashboard/scan", icon: QrCode },
  ];

  if (user?.role === "Admin") {
    NAV_ITEMS.push({ name: "Admin Dashboard", href: "/dashboard/admin", icon: ShieldCheck });
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-semibold flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          Synchronizing Security...
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-[#F0F2F4]">
        <Sidebar variant="sidebar" collapsible="icon">
          <SidebarHeader className="p-4 border-b flex flex-col items-center gap-2">
            <div className="relative w-20 group-data-[collapsible=icon]:w-10 transition-all duration-200 flex items-center justify-center">
              <img
                src={LOGO_BASE64}
                alt="Aum Dacro Coatings"
                style={{ width: '80px', height: 'auto', display: 'block', margin: '0 auto 8px auto', borderRadius: '6px' }}
              />
            </div>
            <div className="flex flex-col items-center text-center overflow-hidden group-data-[collapsible=icon]:hidden">
              <span className="text-sm font-black truncate leading-tight text-primary">Aum Dacro Coatings</span>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Customer Meet 2026</span>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel className="group-data-[collapsible=icon]:hidden">Navigation</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {NAV_ITEMS.map((item) => (
                    <SidebarMenuItem key={item.name}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={pathname === item.href}
                        tooltip={item.name}
                        className={cn(
                          "transition-all duration-200",
                          pathname === item.href 
                            ? "bg-primary/10 text-primary font-semibold border-r-4 border-primary" 
                            : "hover:bg-secondary text-muted-foreground hover:text-foreground"
                        )}
                      >
                        <Link href={item.href}>
                          <item.icon className="w-5 h-5" />
                          <span>{item.name}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t">
            <div className="flex flex-col gap-4 group-data-[collapsible=icon]:items-center">
              <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground font-bold text-xs">
                  {user.fullName?.[0].toUpperCase() || "U"}
                </div>
                <div className="flex flex-col overflow-hidden">
                  <span className="text-xs font-semibold truncate">{user.fullName}</span>
                  <span className="text-[10px] text-muted-foreground">{user.role}</span>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={logout}
                className="w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors px-2 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center"
              >
                <LogOut className="w-4 h-4 group-data-[collapsible=icon]:w-5 group-data-[collapsible=icon]:h-5" />
                <span className="ml-2 group-data-[collapsible=icon]:hidden">Sign Out</span>
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <header className="h-16 border-b bg-white flex items-center justify-between px-6 shrink-0 z-20 shadow-sm">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="md:hidden" />
              <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-bold text-primary">Aum Dacro Coatings</span>
                <ChevronRight className="w-4 h-4" />
                <span className="font-semibold text-foreground">
                  {NAV_ITEMS.find(i => i.href === pathname)?.name || "Overview"}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-bold leading-none">Logged in as</p>
                <p className="text-[10px] text-muted-foreground">{user.fullName}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20 font-bold">
                {user.fullName?.[0].toUpperCase()}
              </div>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
