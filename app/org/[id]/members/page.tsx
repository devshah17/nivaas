"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useOrg } from "@/components/OrgProvider";
import { useRouter } from "next/navigation";
import { Loader2, Check, X, Shield, User, Trash2, Settings2, UserPlus } from "lucide-react";
import toast from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function MembersPage() {
  const { org, role } = useOrg();
  const router = useRouter();
  const [members, setMembers] = useState<{ user: { _id: string; name: string; email: string }; role: string; status: boolean; tiffinCycleStart?: number; rentCycleStart?: number }[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [editingMember, setEditingMember] = useState<{ user: { _id: string; name: string }; tiffinCycleStart?: number; rentCycleStart?: number } | null>(null);
  const [tiffinCycle, setTiffinCycle] = useState(1);
  const [rentCycle, setRentCycle] = useState(1);

  const [showAddModal, setShowAddModal] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPhoneNumber, setAddPhoneNumber] = useState("");

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/organizations/${org._id}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.organization.members || []);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [org._id]);

  useEffect(() => {
    const load = async () => {
      if (role !== "admin") {
        router.push(`/org/${org._id}`);
        return;
      }
      
      await fetchMembers();
    };
    load();
  }, [role, org._id, router, fetchMembers]);

  const handleAction = useCallback(async (userId: string, action: string) => {
    setActionLoading(`${userId}-${action}`);
    try {
      const res = await fetch(`/api/organizations/${org._id}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || `Member ${action}d successfully`);
        fetchMembers();
      } else {
        toast.error(data.error || `Failed to ${action} member`);
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setActionLoading(null);
    }
  }, [org._id, fetchMembers]);

  const handleUpdateCycle = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;
    
    setActionLoading(`${editingMember.user._id}-cycle`);
    try {
      const res = await fetch(`/api/organizations/${org._id}/members/${editingMember.user._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-cycle", tiffinCycleStart: Number(tiffinCycle), rentCycleStart: Number(rentCycle) }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Billing cycle updated");
        setEditingMember(null);
        fetchMembers();
      } else {
        toast.error(data.error || "Failed to update cycle");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setActionLoading(null);
    }
  }, [editingMember, org._id, tiffinCycle, rentCycle, fetchMembers]);

  const handleAddMember = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      const res = await fetch(`/api/organizations/${org._id}/members/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: addName, email: addEmail, phoneNumber: addPhoneNumber }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Member added successfully");
        setShowAddModal(false);
        setAddName("");
        setAddEmail("");
        setAddPhoneNumber("");
        fetchMembers();
      } else {
        toast.error(data.error || "Failed to add member");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsAdding(false);
    }
  }, [addName, addEmail, addPhoneNumber, org._id, fetchMembers]);

  const pendingMembers = useMemo(() => members.filter(m => m.status === false), [members]);
  const activeMembers = useMemo(() => members.filter(m => m.status === true), [members]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Members Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage organization members and settings.</p>
        </div>
        <Badge variant="secondary" className="px-4 py-2 font-mono text-sm bg-muted text-foreground rounded-xl border border-border shadow-sm">
          Invite Code: <span className="font-bold ml-2 text-primary">{org.inviteCode}</span>
        </Badge>
      </div>
      
      {pendingMembers.length > 0 && (
        <Card className="border-amber-200 shadow-sm bg-amber-50/30 overflow-hidden rounded-2xl">
          <CardHeader className="bg-amber-100/50 border-b border-amber-200/50 pb-4">
            <CardTitle className="flex items-center gap-2 text-amber-900">
              Pending Requests
              <Badge variant="secondary" className="bg-amber-500 text-white hover:bg-amber-600 border-0 rounded-full px-2.5">
                {pendingMembers.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-amber-200/50">
              {pendingMembers.map((member) => (
                <li key={member.user._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-amber-100/30 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-white border border-amber-200 flex items-center justify-center shadow-sm">
                      <User className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-amber-950 leading-none">{member.user.name}</p>
                      <p className="text-sm text-amber-700/80 mt-1 font-medium">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAction(member.user._id, "approve")}
                      disabled={actionLoading !== null}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
                    >
                      {actionLoading === `${member.user._id}-approve` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <><Check className="h-4 w-4 mr-1" /> Approve</>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction(member.user._id, "reject")}
                      disabled={actionLoading !== null}
                      className="rounded-xl border-amber-200 text-amber-800 hover:bg-amber-100"
                    >
                      {actionLoading === `${member.user._id}-reject` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <><X className="h-4 w-4 mr-1" /> Reject</>
                      )}
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="border-border rounded-2xl overflow-hidden shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0 bg-muted/10 border-b border-border">
          <div>
            <CardTitle className="text-xl font-bold">Active Members</CardTitle>
            <CardDescription className="mt-1 font-medium">Manage all active organization members</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowAddModal(true)} className="gradient-primary border-0 rounded-xl shadow-md text-white font-semibold">
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {activeMembers.map((member) => (
              <li key={member.user._id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center shadow-sm ${member.role === 'admin' ? 'bg-primary text-primary-foreground' : 'bg-muted border border-border text-foreground'}`}>
                    {member.role === "admin" ? (
                      <Shield className="h-5 w-5" />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground leading-none">{member.user.name}</p>
                      {member.role === "admin" && (
                        <Badge variant="default" className="h-5 text-[10px] px-1.5 py-0 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20">Admin</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1.5 font-medium">{member.user.email}</p>
                  </div>
                </div>
                
                {member.user._id !== org.creator && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditingMember(member);
                        setTiffinCycle(member.tiffinCycleStart || 1);
                        setRentCycle(member.rentCycleStart || 1);
                      }}
                      title="Edit Settings"
                      className="rounded-lg hover:bg-muted"
                    >
                      <Settings2 className="h-4 w-4 text-foreground" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if(window.confirm("Are you sure you want to remove this member?")) {
                          handleAction(member.user._id, "remove");
                        }
                      }}
                      disabled={actionLoading !== null}
                      title="Remove Member"
                      className="rounded-lg text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {actionLoading === `${member.user._id}-remove` ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Dialog open={!!editingMember} onOpenChange={(open) => !open && setEditingMember(null)}>
        <DialogContent className="rounded-2xl sm:rounded-[2rem] p-0 overflow-hidden border-border">
          <div className="p-6 sm:p-8">
            <DialogHeader className="mb-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4 shadow-inner">
                <Settings2 className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-center text-2xl font-bold">Member Settings</DialogTitle>
              <DialogDescription className="text-center mt-2 font-medium">
                Settings for <span className="font-bold text-foreground">{editingMember?.user.name}</span>
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleUpdateCycle} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="tiffinCycle" className="font-semibold text-foreground">Tiffin Billing Cycle Start Date (1-31)</Label>
                <Input
                  id="tiffinCycle"
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={tiffinCycle}
                  onChange={(e) => setTiffinCycle(Number(e.target.value))}
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rentCycle" className="font-semibold text-foreground">Rent Billing Cycle Start Date (1-31)</Label>
                <Input
                  id="rentCycle"
                  type="number"
                  min="1"
                  max="31"
                  required
                  value={rentCycle}
                  onChange={(e) => setRentCycle(Number(e.target.value))}
                  className="rounded-xl h-11"
                />
              </div>
              
              <DialogFooter className="pt-6">
                <Button 
                  type="submit" 
                  disabled={actionLoading !== null}
                  className="w-full gradient-primary border-0 rounded-xl h-12 text-base font-semibold shadow-md text-white"
                >
                  {actionLoading ? (
                    <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Saving...</>
                  ) : (
                    "Save Settings"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Member Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="rounded-2xl sm:rounded-[2rem] p-0 overflow-hidden border-border">
          <div className="p-6 sm:p-8">
            <DialogHeader className="mb-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4 shadow-inner">
                <UserPlus className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-center text-2xl font-bold">Add Member</DialogTitle>
              <DialogDescription className="text-center mt-2 font-medium">
                Create a new user and add them directly to this organization. The user will be created but remain unverified.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleAddMember} className="space-y-5">
              <div className="space-y-2">
                <Label className="font-semibold text-foreground">Name</Label>
                <Input 
                  type="text" 
                  value={addName}
                  onChange={(e) => setAddName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-foreground">Email</Label>
                <Input 
                  type="email" 
                  value={addEmail}
                  onChange={(e) => setAddEmail(e.target.value)}
                  placeholder="john@example.com"
                  required
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-foreground">Phone Number (Optional)</Label>
                <Input 
                  type="tel" 
                  value={addPhoneNumber}
                  onChange={(e) => setAddPhoneNumber(e.target.value)}
                  placeholder="+1 234 567 8900"
                  className="rounded-xl h-11"
                />
              </div>
              
              <DialogFooter className="pt-6 sm:justify-between flex-row gap-3">
                <Button type="button" variant="outline" onClick={() => setShowAddModal(false)} className="w-full sm:w-1/2 rounded-xl h-12 font-semibold">Cancel</Button>
                <Button type="submit" disabled={isAdding} className="w-full sm:w-1/2 gradient-primary border-0 rounded-xl h-12 text-base font-semibold shadow-md text-white">
                  {isAdding && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                  Add Member
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
