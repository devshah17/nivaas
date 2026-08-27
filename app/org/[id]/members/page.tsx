"use client";

import { useState, useEffect, useCallback } from "react";
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

  const handleAction = async (userId: string, action: string) => {
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
  };

  const handleUpdateCycle = async (e: React.FormEvent) => {
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
  };

  const handleAddMember = async (e: React.FormEvent) => {
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
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const pendingMembers = members.filter(m => m.status === false);
  const activeMembers = members.filter(m => m.status === true);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Members Management</h1>
        <Badge variant="secondary" className="px-3 py-1 font-mono text-sm bg-muted text-foreground">
          Invite Code: <span className="font-bold ml-1">{org.inviteCode}</span>
        </Badge>
      </div>
      
      {pendingMembers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Pending Requests
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                {pendingMembers.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ul className="divide-y divide-border">
              {pendingMembers.map((member) => (
                <li key={member.user._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">{member.user.name}</p>
                      <p className="text-sm text-muted-foreground mt-1">{member.user.email}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleAction(member.user._id, "approve")}
                      disabled={actionLoading !== null}
                      className="bg-green-600 hover:bg-green-700 text-white"
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

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-4 space-y-0">
          <div>
            <CardTitle>Active Members</CardTitle>
            <CardDescription className="mt-1">Manage all active organization members</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowAddModal(true)}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Member
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {activeMembers.map((member) => (
              <li key={member.user._id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center ${member.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                    {member.role === "admin" ? (
                      <Shield className="h-5 w-5" />
                    ) : (
                      <User className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-none">{member.user.name}</p>
                      {member.role === "admin" && (
                        <Badge variant="default" className="h-5 text-[10px] px-1 py-0">Admin</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{member.user.email}</p>
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
                    >
                      <Settings2 className="h-4 w-4 text-muted-foreground" />
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
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Member Settings</DialogTitle>
            <DialogDescription>
              Settings for {editingMember?.user.name}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateCycle} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tiffinCycle">Tiffin Billing Cycle Start Date (1-31)</Label>
              <Input
                id="tiffinCycle"
                type="number"
                min="1"
                max="31"
                required
                value={tiffinCycle}
                onChange={(e) => setTiffinCycle(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rentCycle">Rent Billing Cycle Start Date (1-31)</Label>
              <Input
                id="rentCycle"
                type="number"
                min="1"
                max="31"
                required
                value={rentCycle}
                onChange={(e) => setRentCycle(Number(e.target.value))}
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="submit" 
                disabled={actionLoading !== null}
              >
                {actionLoading ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...</>
                ) : (
                  "Save Settings"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Member Modal */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>
              Create a new user and add them directly to this organization. The user will be created but remain unverified.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddMember} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                type="text" 
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="John Doe"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input 
                type="email" 
                value={addEmail}
                onChange={(e) => setAddEmail(e.target.value)}
                placeholder="john@example.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Phone Number (Optional)</Label>
              <Input 
                type="tel" 
                value={addPhoneNumber}
                onChange={(e) => setAddPhoneNumber(e.target.value)}
                placeholder="+1 234 567 8900"
              />
            </div>
            
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddModal(false)}>Cancel</Button>
              <Button type="submit" disabled={isAdding}>
                {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Add Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
