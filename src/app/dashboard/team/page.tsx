"use client";

import React, { useState, useEffect } from "react";
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  deleteDoc, 
  updateDoc, 
  query, 
  where,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/auth-provider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  ArrowLeft, 
  UserPlus, 
  ShieldCheck, 
  Users, 
  UserCog, 
  Trash2, 
  Eye, 
  EyeOff, 
  Loader2,
  KeyRound
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function TeamManagementPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [members, setMembers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [selectedMemberForPassword, setSelectedMemberForPassword] = useState<any | null>(null);
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Form State
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    password: "",
    role: "Staff"
  });

  // Access Control
  useEffect(() => {
    if (user && user.role !== "Admin") {
      router.push("/dashboard");
    }
  }, [user, router]);

  // Close menu when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.menu-container')) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const fetchMembers = async () => {
    setIsLoading(true);
    try {
      const q = query(collection(db, "team_users"));
      const snapshot = await getDocs(q);
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMembers(list);
    } catch (err: any) {
      console.error("Fetch members error:", err);
      toast({ 
        variant: "destructive", 
        title: "Access Restricted", 
        description: "Unable to load team members. Please check system permissions." 
      });
      setMembers([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.username || !formData.password) {
      toast({ variant: "destructive", title: "Missing Fields", description: "Please fill in all required fields." });
      return;
    }

    setIsSubmitting(true);
    try {
      const usernameLower = formData.username.toLowerCase().trim();
      
      const checkQuery = query(collection(db, "team_users"), where("username", "==", usernameLower));
      const checkSnap = await getDocs(checkQuery);
      
      if (!checkSnap.empty) {
        toast({ variant: "destructive", title: "Error", description: "Username already taken." });
        setIsSubmitting(false);
        return;
      }

      const uid = Date.now().toString();
      const newMember = {
        id: uid,
        uid: uid,
        fullName: formData.fullName.trim(),
        username: usernameLower,
        password: formData.password,
        role: formData.role,
        email: `${usernameLower}@aumdacro.com`,
        createdAt: new Date().toISOString(),
        serverTimestamp: serverTimestamp()
      };

      await setDoc(doc(db, "team_users", uid), newMember);
      
      toast({ title: "Success", description: "Member added successfully." });
      setFormData({ fullName: "", username: "", password: "", role: "Staff" });
      fetchMembers();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMember = async (memberId: string) => {
    if (memberId === user?.id) {
      toast({ variant: "destructive", title: "Action Denied", description: "You cannot delete your own account." });
      return;
    }

    const member = members.find(m => m.id === memberId);
    if (!confirm(`Are you sure you want to delete ${member?.fullName || "this member"}?`)) return;

    try {
      await deleteDoc(doc(db, "team_users", memberId));
      toast({ title: "Deleted", description: "Member removed from system." });
      setOpenMenu(null);
      fetchMembers();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Delete Failed", description: err.message });
    }
  };

  const handleChangeRole = async (member: any) => {
    const newRole = member.role === "Admin" ? "Staff" : "Admin";
    try {
      await updateDoc(doc(db, "team_users", member.id), { role: newRole });
      toast({ title: "Role Updated", description: `${member.fullName} is now ${newRole}.` });
      setOpenMenu(null);
      fetchMembers();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    }
  };

  const togglePasswordVisibility = (memberId: string) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [memberId]: !prev[memberId]
    }));
  };

  const stats = {
    total: members.length,
    admins: members.filter(m => m.role === "Admin").length,
    staff: members.filter(m => m.role === "Staff").length
  };

  if (!user || user.role !== "Admin") return null;

  return (
    <div className="max-w-xl mx-auto space-y-8 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/dashboard/admin">
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold font-headline">Team Members</h1>
          <p className="text-sm text-muted-foreground">Manage staff who can access this app</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", val: stats.total, icon: Users, color: "text-primary" },
          { label: "Admins", val: stats.admins, icon: ShieldCheck, color: "text-blue-600" },
          { label: "Staff", val: stats.staff, icon: UserCog, color: "text-slate-500" },
        ].map(s => (
          <Card key={s.label} className="border-none shadow-sm text-center">
            <CardContent className="p-4">
              <p className="text-lg font-black">{s.val}</p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Add New Member</CardTitle>
          <CardDescription>Grant access to a new team member</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddMember} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input 
                value={formData.fullName} 
                onChange={e => setFormData({...formData, fullName: e.target.value})} 
                placeholder="Ex: Rajesh Kumar"
                className="h-12"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Username</Label>
                <Input 
                  value={formData.username} 
                  onChange={e => setFormData({...formData, username: e.target.value.toLowerCase()})} 
                  placeholder="rajesh_k"
                  className="h-12"
                />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select value={formData.role} onValueChange={v => setFormData({...formData, role: v})}>
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Staff">Staff</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Initial Password</Label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  value={formData.password} 
                  onChange={e => setFormData({...formData, password: e.target.value})} 
                  placeholder="••••••••"
                  className="h-12 pr-10"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full h-12 text-base font-bold bg-[#1565C0]" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><UserPlus className="w-4 h-4 mr-2" />Add Member</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="font-bold text-lg px-1">Current Team</h3>
        {isLoading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : members.length === 0 ? (
          <p className="text-center text-muted-foreground py-10">No team members found.</p>
        ) : (
          <div className="menu-container">
            {members.map((member) => (
              <div key={member.id} style={{
                background: "white",
                border: "1px solid #E2E8F0",
                borderRadius: "12px",
                padding: "14px 16px",
                marginBottom: "10px",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}>

                {/* Avatar */}
                <div style={{
                  width: "42px", height: "42px",
                  borderRadius: "50%",
                  background: member.role === "Admin" ? "#1565C0" : "#718096",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "white", fontWeight: 700, fontSize: "16px",
                  flexShrink: 0
                }}>
                  {member.fullName?.charAt(0).toUpperCase()}
                </div>

                {/* Details — all in one block */}
                <div style={{ flex: 1, minWidth: 0 }}>

                  {/* Row 1: Name + Role pill */}
                  <div style={{
                    display: "flex", alignItems: "center",
                    gap: "8px", flexWrap: "wrap"
                  }}>
                    <span style={{
                      fontWeight: 700, fontSize: "14px", color: "#1A202C"
                    }}>
                      {member.fullName}
                    </span>
                    <span style={{
                      background: member.role === "Admin" ? "#EBF0FA" : "#F0F0F0",
                      color: member.role === "Admin" ? "#1565C0" : "#718096",
                      fontSize: "11px", fontWeight: 700,
                      padding: "2px 8px", borderRadius: "20px",
                      textTransform: "uppercase", letterSpacing: "0.5px"
                    }}>
                      {member.role}
                    </span>
                    {/* YOU badge */}
                    {member.id === user?.id && (
                      <span style={{
                        background: "#F0FFF4", color: "#38A169",
                        fontSize: "10px", fontWeight: 600,
                        padding: "2px 7px", borderRadius: "20px"
                      }}>YOU</span>
                    )}
                  </div>

                  {/* Row 2: Username · Password · Date all in one line */}
                  <div style={{
                    display: "flex", alignItems: "center",
                    gap: "6px", marginTop: "3px",
                    fontSize: "12px", color: "#718096",
                    flexWrap: "wrap"
                  }}>
                    <span>@{member.username}</span>
                    <span style={{ color: "#CBD5E0" }}>·</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      🔑 {visiblePasswords[member.id] ? member.password : "••••••••"}
                      <button 
                        onClick={() => togglePasswordVisibility(member.id)}
                        style={{ 
                          background: 'none', 
                          border: 'none', 
                          cursor: 'pointer', 
                          padding: 0,
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        {visiblePasswords[member.id] ? (
                          <EyeOff size={14} color="#718096" />
                        ) : (
                          <Eye size={14} color="#718096" />
                        )}
                      </button>
                    </span>
                    <span style={{ color: "#CBD5E0" }}>·</span>
                    <span>Added {member.createdAt ? new Date(member.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric"
                    }) : "N/A"}</span>
                  </div>

                </div>

                {/* Three dot menu */}
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <button
                    onClick={() => setOpenMenu(openMenu === member.id ? null : member.id)}
                    style={{
                      background: "none", border: "none",
                      cursor: "pointer", padding: "4px 8px",
                      fontSize: "18px", color: "#718096",
                      borderRadius: "6px"
                    }}>⋮</button>

                  {openMenu === member.id && (
                    <div style={{
                      position: "absolute", right: 0, top: "32px",
                      background: "white", border: "1px solid #E2E8F0",
                      borderRadius: "8px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                      zIndex: 100, minWidth: "160px", overflow: "hidden"
                    }}>
                      <div onClick={() => { setSelectedMemberForPassword(member); setOpenMenu(null); }} style={{
                        padding: "10px 16px", cursor: "pointer",
                        fontSize: "13px", color: "#1A202C",
                        borderBottom: "1px solid #F7FAFC"
                      }}>🔑 Change Password</div>

                      <div onClick={() => handleChangeRole(member)} style={{
                        padding: "10px 16px", cursor: "pointer",
                        fontSize: "13px", color: "#1A202C",
                        borderBottom: "1px solid #F7FAFC"
                      }}>
                        🔄 Make {member.role === "Admin" ? "Staff" : "Admin"}
                      </div>

                      {member.id !== user?.id && (
                        <div onClick={() => handleDeleteMember(member.id)} style={{
                          padding: "10px 16px", cursor: "pointer",
                          fontSize: "13px", color: "#E53E3E"
                        }}>🗑️ Delete Member</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedMemberForPassword && (
        <PasswordChangeModal 
          member={selectedMemberForPassword} 
          onClose={() => setSelectedMemberForPassword(null)} 
          onUpdate={fetchMembers} 
        />
      )}
    </div>
  );
}

function PasswordChangeModal({ member, onClose, onUpdate }: { member: any, onClose: () => void, onUpdate: () => void }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdate = async () => {
    if (!password) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, "team_users", member.id), { password });
      toast({ title: "Updated", description: `Password for ${member.fullName} has been changed.` });
      onUpdate();
      onClose();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xs rounded-2xl">
        <DialogHeader>
          <DialogTitle>Reset Password</DialogTitle>
          <DialogDescription>Set a new password for {member.username}</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input 
              type="text" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="New password..."
              className="h-11"
            />
          </div>
          <Button onClick={handleUpdate} className="w-full h-11" disabled={loading || !password}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save New Password"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
