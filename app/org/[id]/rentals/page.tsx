"use client";

import { useState, useEffect, useCallback } from "react";
import { useOrg } from "@/components/OrgProvider";
import { Loader2, Plus, Home, User, IndianRupee, Calendar, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchRentalUnits, addRentalUnitAsync, assignTenantAsync, removeTenantAsync, deleteRentalUnitAsync } from "@/lib/features/rentals/rentalsSlice";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/api/client";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function RentalsPage() {
  const { org, role } = useOrg();
  const dispatch = useAppDispatch();
  const { units, loading } = useAppSelector((state) => state.rentals);
  const [members, setMembers] = useState<{ user: { _id: string; name: string; email: string }; role: string; status: boolean }[]>([]);

  // Modals
  const [showAddUnit, setShowAddUnit] = useState(false);
  const [showAssignTenant, setShowAssignTenant] = useState<string | null>(null); // unitId

  // Forms
  const [newRoom, setNewRoom] = useState("");
  const [newBed, setNewBed] = useState("");
  const [assignData, setAssignData] = useState({ tenant: "", rentAmount: "", moveInDate: "" });
  const [processing, setProcessing] = useState(false);

  const fetchUnits = useCallback(() => {
    dispatch(fetchRentalUnits(org._id));
  }, [dispatch, org._id]);

  const fetchMembers = useCallback(async () => {
    try {
      const data = await api.org.get(org._id);
      // Only allow assigning active members who are not admins
      setMembers(data.organization.members.filter((m: { status: boolean; role: string }) => m.status === true && m.role !== "admin"));
    } catch (e) {
      console.error(e);
    }
  }, [org._id]);

  useEffect(() => {
    const load = async () => {
      fetchUnits();
      if (role === "admin") {
        await fetchMembers();
      }
    };
    load();
  }, [fetchUnits, role, fetchMembers]);

  const handleAddUnit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await dispatch(addRentalUnitAsync({ orgId: org._id, roomName: newRoom, bedName: newBed })).unwrap();
      toast.success("Unit created");
      setShowAddUnit(false);
      setNewRoom("");
      setNewBed("");
    } catch (error: unknown) {
      toast.error((error as Error).message || "Failed to create unit");
    } finally {
      setProcessing(false);
    }
  }, [dispatch, org._id, newRoom, newBed]);

  const handleAssignTenant = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAssignTenant) return;
    setProcessing(true);
    try {
      const tenantInfo = members.find(m => m.user._id === assignData.tenant)?.user;
      await dispatch(assignTenantAsync({
        orgId: org._id,
        unitId: showAssignTenant,
        tenant: assignData.tenant,
        rentAmount: Number(assignData.rentAmount),
        moveInDate: assignData.moveInDate,
        tenantInfo
      })).unwrap();
      
      toast.success("Tenant assigned");
      setShowAssignTenant(null);
      setAssignData({ tenant: "", rentAmount: "", moveInDate: "" });
    } catch {
      toast.error("Failed to assign tenant");
    } finally {
      setProcessing(false);
    }
  }, [showAssignTenant, members, assignData, dispatch, org._id]);

  const handleRemoveTenant = useCallback(async (unitId: string) => {
    if (!confirm("Are you sure you want to remove this tenant? This will not delete past bills, but stops future billing.")) return;
    try {
      await dispatch(removeTenantAsync({ orgId: org._id, unitId })).unwrap();
      toast.success("Tenant removed");
    } catch {
      toast.error("Failed to remove tenant");
    }
  }, [dispatch, org._id]);

  const handleDeleteUnit = useCallback(async (unitId: string) => {
    if (!confirm("Are you sure you want to delete this unit?")) return;
    try {
      await dispatch(deleteRentalUnitAsync({ orgId: org._id, unitId })).unwrap();
      toast.success("Unit deleted");
    } catch {
      toast.error("Failed to delete unit");
    }
  }, [dispatch, org._id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // --- Customer View ---
  if (role !== "admin") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Rentals</h1>
          <p className="text-sm text-muted-foreground mt-1">View your assigned rooms and rent details.</p>
        </div>
        {units.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center border-border rounded-2xl shadow-sm">
            <Home className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <CardTitle className="text-xl">No active rentals</CardTitle>
            <CardDescription className="mt-2 text-base">You are not currently assigned to any room or bed.</CardDescription>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {units.map(unit => (
              <Card key={unit._id} className="overflow-hidden border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="border-b border-border bg-muted/10 pb-4 flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg font-bold text-foreground">{unit.roomName}</CardTitle>
                    <CardDescription className="font-medium text-muted-foreground mt-0.5">{unit.bedName}</CardDescription>
                  </div>
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary shadow-sm border border-primary/20">
                    <Home className="h-5 w-5" />
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div className="flex items-center text-sm">
                      <IndianRupee className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-muted-foreground font-medium mr-2">Rent:</span> 
                      <span className="font-medium">₹{unit.rentAmount}/month</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
                      <span className="text-muted-foreground font-medium mr-2">Move-in:</span> 
                      <span className="font-medium">{new Date(unit.moveInDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  }

  // --- Admin View ---
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Rental Management</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage your properties, rooms, and beds.</p>
        </div>
        <Button onClick={() => setShowAddUnit(true)} className="gradient-primary border-0 rounded-xl shadow-md font-semibold text-white">
          <Plus className="-ml-1 mr-2 h-4 w-4" />
          Add Unit
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {units.map(unit => (
          <Card key={unit._id} className="flex flex-col border-border rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-4 flex flex-row items-start justify-between space-y-0 border-b border-border bg-muted/5">
              <div>
                <CardTitle className="text-lg font-bold text-foreground">{unit.roomName}</CardTitle>
                <CardDescription className="font-medium text-muted-foreground mt-0.5">{unit.bedName}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {unit.tenant ? (
                  <Badge variant="default" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">
                    Occupied
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="bg-muted text-muted-foreground">
                    Vacant
                  </Badge>
                )}
                {!unit.tenant && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => handleDeleteUnit(unit._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-6 flex-1 bg-card">
              {unit.tenant ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-muted/30 p-3 rounded-xl border border-border">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shadow-sm">
                      {unit.tenant.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground leading-none">{unit.tenant.name}</p>
                      <p className="text-xs text-muted-foreground mt-1.5 font-medium">{unit.tenant.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="bg-muted/10 p-3 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Monthly Rent</p>
                      <p className="text-sm font-bold text-foreground">₹{unit.rentAmount}</p>
                    </div>
                    <div className="bg-muted/10 p-3 rounded-xl border border-border">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Move In</p>
                      <p className="text-sm font-bold text-foreground">{new Date(unit.moveInDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center py-6">
                  <Button variant="outline" onClick={() => setShowAssignTenant(unit._id)} className="w-full rounded-xl border-dashed border-2 border-primary/30 text-primary hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-colors h-12">
                    <User className="mr-2 h-4 w-4" />
                    <span className="font-semibold">Assign Tenant</span>
                  </Button>
                </div>
              )}
            </CardContent>
            
            {unit.tenant && (
              <CardFooter className="bg-card pb-6 pt-0">
                <Button variant="outline" className="w-full text-destructive hover:bg-destructive hover:text-destructive-foreground hover:border-destructive transition-colors rounded-xl font-medium" onClick={() => handleRemoveTenant(unit._id)}>
                  Remove Tenant
                </Button>
              </CardFooter>
            )}
          </Card>
        ))}

        {units.length === 0 && (
          <Card className="col-span-full flex flex-col items-center justify-center p-12 text-center border-border rounded-2xl shadow-sm">
            <Home className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <CardTitle className="text-xl">No units found</CardTitle>
            <CardDescription className="mt-2 text-base">Get started by adding a room or bed.</CardDescription>
          </Card>
        )}
      </div>

      {/* Add Unit Modal */}
      <Dialog open={showAddUnit} onOpenChange={setShowAddUnit}>
        <DialogContent className="rounded-2xl sm:rounded-[2rem] p-0 overflow-hidden border-border">
          <div className="p-6 sm:p-8">
            <DialogHeader className="mb-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4 shadow-inner">
                <Home className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-center text-2xl font-bold">Add Rental Unit</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddUnit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="roomName" className="font-semibold text-foreground">Room Name/Number</Label>
                <Input
                  id="roomName"
                  type="text"
                  required
                  value={newRoom}
                  onChange={(e) => setNewRoom(e.target.value)}
                  placeholder="e.g. Room 101"
                  className="rounded-xl h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedName" className="font-semibold text-foreground">Bed Name/Number</Label>
                <Input
                  id="bedName"
                  type="text"
                  required
                  value={newBed}
                  onChange={(e) => setNewBed(e.target.value)}
                  placeholder="e.g. Bed A or Single Room"
                  className="rounded-xl h-11"
                />
              </div>
              <DialogFooter className="pt-6">
                <Button type="submit" className="w-full gradient-primary border-0 rounded-xl h-12 text-base font-semibold shadow-md text-white" disabled={processing}>
                  {processing ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Adding...</>
                  ) : (
                    "Add Unit"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Tenant Modal */}
      <Dialog open={!!showAssignTenant} onOpenChange={(open) => !open && setShowAssignTenant(null)}>
        <DialogContent className="rounded-2xl sm:rounded-[2rem] p-0 overflow-hidden border-border">
          <div className="p-6 sm:p-8">
            <DialogHeader className="mb-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4 shadow-inner">
                <User className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-center text-2xl font-bold">Assign Tenant</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAssignTenant} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="tenant" className="font-semibold text-foreground">Select Member</Label>
                <select
                  id="tenant"
                  required
                  value={assignData.tenant}
                  onChange={(e) => setAssignData({ ...assignData, tenant: e.target.value })}
                  className="flex h-11 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 transition-shadow font-medium"
                >
                  <option value="">Select a member...</option>
                  {members.map(m => (
                    <option key={m.user._id} value={m.user._id}>{m.user.name} ({m.user.email})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="rentAmount" className="font-semibold text-foreground">Monthly Rent (₹)</Label>
                  <Input
                    id="rentAmount"
                    type="number"
                    required
                    min="0"
                    value={assignData.rentAmount}
                    onChange={(e) => setAssignData({ ...assignData, rentAmount: e.target.value })}
                    placeholder="e.g. 5000"
                    className="rounded-xl h-11"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="moveInDate" className="font-semibold text-foreground">Move-in Date</Label>
                  <Input
                    id="moveInDate"
                    type="date"
                    required
                    value={assignData.moveInDate}
                    onChange={(e) => setAssignData({ ...assignData, moveInDate: e.target.value })}
                    className="rounded-xl h-11"
                  />
                </div>
              </div>
              <DialogFooter className="pt-6">
                <Button type="submit" className="w-full gradient-primary border-0 rounded-xl h-12 text-base font-semibold shadow-md text-white" disabled={processing}>
                  {processing ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Assigning...</>
                  ) : (
                    "Assign Tenant"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
