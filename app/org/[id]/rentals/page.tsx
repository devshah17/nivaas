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
      const res = await fetch(`/api/organizations/${org._id}`);
      if (res.ok) {
        const data = await res.json();
        // Only allow assigning active members who are not admins
        setMembers(data.organization.members.filter((m: { status: boolean; role: string }) => m.status === true && m.role !== "admin"));
      }
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

  const handleAddUnit = async (e: React.FormEvent) => {
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
  };

  const handleAssignTenant = async (e: React.FormEvent) => {
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
  };

  const handleRemoveTenant = async (unitId: string) => {
    if (!confirm("Are you sure you want to remove this tenant? This will not delete past bills, but stops future billing.")) return;
    try {
      await dispatch(removeTenantAsync({ orgId: org._id, unitId })).unwrap();
      toast.success("Tenant removed");
    } catch {
      toast.error("Failed to remove tenant");
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    if (!confirm("Are you sure you want to delete this unit?")) return;
    try {
      await dispatch(deleteRentalUnitAsync({ orgId: org._id, unitId })).unwrap();
      toast.success("Unit deleted");
    } catch {
      toast.error("Failed to delete unit");
    }
  };

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
        <h1 className="text-2xl font-bold tracking-tight">My Rentals</h1>
        {units.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <Home className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <CardTitle>No active rentals</CardTitle>
            <CardDescription className="mt-2">You are not currently assigned to any room or bed.</CardDescription>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {units.map(unit => (
              <Card key={unit._id} className="overflow-hidden">
                <CardHeader className="border-b bg-muted/20 pb-4 flex flex-row items-start justify-between space-y-0">
                  <div>
                    <CardTitle className="text-lg">{unit.roomName}</CardTitle>
                    <CardDescription>{unit.bedName}</CardDescription>
                  </div>
                  <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center text-primary">
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Rental Management</h1>
        <Button onClick={() => setShowAddUnit(true)}>
          <Plus className="-ml-1 mr-2 h-4 w-4" />
          Add Unit
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {units.map(unit => (
          <Card key={unit._id} className="flex flex-col">
            <CardHeader className="pb-4 flex flex-row items-start justify-between space-y-0 border-b">
              <div>
                <CardTitle className="text-lg">{unit.roomName}</CardTitle>
                <CardDescription>{unit.bedName}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {unit.tenant ? (
                  <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">
                    Occupied
                  </Badge>
                ) : (
                  <Badge variant="secondary">
                    Vacant
                  </Badge>
                )}
                {!unit.tenant && (
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={() => handleDeleteUnit(unit._id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="pt-6 flex-1 bg-muted/10">
              {unit.tenant ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                      {unit.tenant.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium leading-none">{unit.tenant.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">{unit.tenant.email}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Rent</p>
                      <p className="text-sm font-semibold">₹{unit.rentAmount}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Move In</p>
                      <p className="text-sm font-semibold">{new Date(unit.moveInDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex h-full items-center justify-center py-4">
                  <Button variant="outline" onClick={() => setShowAssignTenant(unit._id)} className="w-full">
                    <User className="mr-2 h-4 w-4" />
                    Assign Tenant
                  </Button>
                </div>
              )}
            </CardContent>
            
            {unit.tenant && (
              <CardFooter className="bg-muted/10 pb-6 pt-0">
                <Button variant="outline" className="w-full text-destructive hover:bg-destructive/10" onClick={() => handleRemoveTenant(unit._id)}>
                  Remove Tenant
                </Button>
              </CardFooter>
            )}
          </Card>
        ))}

        {units.length === 0 && (
          <Card className="col-span-full flex flex-col items-center justify-center p-12 text-center">
            <Home className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <CardTitle>No units found</CardTitle>
            <CardDescription className="mt-2">Get started by adding a room or bed.</CardDescription>
          </Card>
        )}
      </div>

      {/* Add Unit Modal */}
      <Dialog open={showAddUnit} onOpenChange={setShowAddUnit}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Home className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Add Rental Unit</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddUnit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="roomName">Room Name/Number</Label>
              <Input
                id="roomName"
                type="text"
                required
                value={newRoom}
                onChange={(e) => setNewRoom(e.target.value)}
                placeholder="e.g. Room 101"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bedName">Bed Name/Number</Label>
              <Input
                id="bedName"
                type="text"
                required
                value={newBed}
                onChange={(e) => setNewBed(e.target.value)}
                placeholder="e.g. Bed A or Single Room"
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full" disabled={processing}>
                {processing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</>
                ) : (
                  "Add Unit"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Assign Tenant Modal */}
      <Dialog open={!!showAssignTenant} onOpenChange={(open) => !open && setShowAssignTenant(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
              <User className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Assign Tenant</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAssignTenant} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tenant">Select Member</Label>
              <select
                id="tenant"
                required
                value={assignData.tenant}
                onChange={(e) => setAssignData({ ...assignData, tenant: e.target.value })}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select a member...</option>
                {members.map(m => (
                  <option key={m.user._id} value={m.user._id}>{m.user.name} ({m.user.email})</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="rentAmount">Monthly Rent (₹)</Label>
              <Input
                id="rentAmount"
                type="number"
                required
                min="0"
                value={assignData.rentAmount}
                onChange={(e) => setAssignData({ ...assignData, rentAmount: e.target.value })}
                placeholder="e.g. 5000"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="moveInDate">Move-in Date</Label>
              <Input
                id="moveInDate"
                type="date"
                required
                value={assignData.moveInDate}
                onChange={(e) => setAssignData({ ...assignData, moveInDate: e.target.value })}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full" disabled={processing}>
                {processing ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Assigning...</>
                ) : (
                  "Assign Tenant"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
