"use client";

import { useState, useEffect, useCallback } from "react";
import { useOrg } from "@/components/OrgProvider";
import { Loader2, FileText, CheckCircle, Clock, IndianRupee, Edit2, Plus, Calendar as CalendarIcon, ChevronDown } from "lucide-react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchBillsAsync, generateBillsAsync, toggleBillStatusAsync, updateChargesAsync } from "@/lib/features/bills/billsSlice";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api/client";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function BillsPage() {
  const { org, role } = useOrg();
  const dispatch = useAppDispatch();
  const { bills, loading } = useAppSelector((state) => state.bills);
  
  // Default to current month string "YYYY-MM"
  const [periodName, setPeriodName] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  
  const [members, setMembers] = useState<{ user: { _id: string; name: string } }[]>([]);
  const [generating, setGenerating] = useState(false);

  // Modals
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [genParams, setGenParams] = useState({
    customerId: "all",
    periodName: "",
    startDate: "",
    endDate: "",
    includeTiffin: true,
    includeRent: true
  });

  const [editingBill, setEditingBill] = useState<{ _id: string; otherCharges: number; otherChargesNote?: string; customer: { name: string } } | null>(null);
  const [otherCharges, setOtherCharges] = useState("");
  const [otherChargesNote, setOtherChargesNote] = useState("");
  const [updating, setUpdating] = useState(false);

  const fetchBills = useCallback(() => {
    dispatch(fetchBillsAsync({ orgId: org._id, periodName }));
  }, [dispatch, org._id, periodName]);

  const fetchMembers = useCallback(async () => {
    try {
      const data = await api.org.get(org._id);
      setMembers(data.organization.members.filter((m: { status: boolean; role: string }) => m.status === true && m.role !== "admin"));
    } catch (e) {
      console.error(e);
    }
  }, [org._id]);

  useEffect(() => {
    const load = async () => {
      fetchBills();
      if (role === "admin") {
        await fetchMembers();
      }
    };
    load();
  }, [fetchBills, role, fetchMembers]);

  const openGenerateModal = useCallback(() => {
    const d = new Date();
    const currentMonth = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const firstDay = new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    
    setGenParams({
      customerId: "all",
      periodName: currentMonth,
      startDate: firstDay,
      endDate: lastDay,
      includeTiffin: true,
      includeRent: true
    });
    setShowGenerateModal(true);
  }, []);

  const handleGenerateBills = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genParams.periodName || !genParams.startDate || !genParams.endDate) {
      toast.error("Please fill required fields");
      return;
    }
    
    setGenerating(true);
    try {
      await dispatch(generateBillsAsync({ orgId: org._id, params: genParams })).unwrap();
      toast.success("Bills generated successfully");
      setShowGenerateModal(false);
      setPeriodName(genParams.periodName); // Switch view to newly generated period
      // Need to re-fetch the new period if the periodName is the same, but the effect will handle it if it changes.
      if (periodName === genParams.periodName) {
        fetchBills();
      }
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to generate bills");
    } finally {
      setGenerating(false);
    }
  }, [genParams, org._id, periodName, dispatch, fetchBills]);

  const toggleStatus = useCallback(async (billId: string, currentStatus: string) => {
    try {
      await dispatch(toggleBillStatusAsync({ orgId: org._id, billId, currentStatus })).unwrap();
      toast.success(`Status updated`);
    } catch (e: unknown) {
      toast.error((e as Error).message || "Error updating status");
    }
  }, [dispatch, org._id]);

  const handleUpdateCharges = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBill) return;
    
    setUpdating(true);
    try {
      await dispatch(updateChargesAsync({
        orgId: org._id,
        billId: editingBill._id,
        otherCharges: Number(otherCharges),
        otherChargesNote
      })).unwrap();
      toast.success("Charges updated");
      setEditingBill(null);
    } catch (e: unknown) {
      toast.error((e as Error).message || "Error updating charges");
    } finally {
      setUpdating(false);
    }
  }, [editingBill, org._id, otherCharges, otherChargesNote, dispatch]);

  const openEditModal = useCallback((bill: { _id: string; otherCharges: number; otherChargesNote?: string; customer: { name: string } }) => {
    setEditingBill(bill);
    setOtherCharges(bill.otherCharges.toString());
    setOtherChargesNote(bill.otherChargesNote || "");
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Bills & Invoices</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage and track billing periods.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Input
            type="month"
            value={periodName}
            onChange={(e) => setPeriodName(e.target.value)}
            className="w-auto rounded-xl bg-card border-input focus:border-primary"
          />
          {role === "admin" && (
            <Button onClick={openGenerateModal} className="gradient-primary text-white rounded-xl shadow-sm hover:opacity-90">
              <FileText className="-ml-1 mr-2 h-4 w-4" />
              Generate Bills
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : bills.length === 0 ? (
        <Card className="flex flex-col items-center justify-center p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <CardTitle>No bills found</CardTitle>
          <CardDescription className="mt-2 max-w-sm">
            {role === "admin" 
              ? "Click 'Generate Bills' to calculate amounts for this period based on tiffin consumption and rent." 
              : "No bills have been generated for you for this period yet."}
          </CardDescription>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {bills.map(bill => (
            <Card key={bill._id} className={`flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md border-border ${bill.status === 'paid' ? 'border-emerald-200' : 'hover:border-primary/40'}`}>
              <CardHeader className={`pb-4 border-b flex flex-row items-start justify-between space-y-0 ${bill.status === 'paid' ? 'bg-emerald-50/30' : 'bg-muted/10'}`}>
                <div>
                  <CardTitle className="text-lg">{role === "admin" ? bill.customer.name : "My Bill"}</CardTitle>
                  <CardDescription className="font-medium text-foreground mt-1">{bill.periodName}</CardDescription>
                  <CardDescription className="text-xs mt-0.5">
                    {new Date(bill.startDate).toLocaleDateString()} - {new Date(bill.endDate).toLocaleDateString()}
                  </CardDescription>
                </div>
                <div>
                  {bill.status === 'paid' ? (
                    <Badge variant="default" className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" /> Paid
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-100 flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Unpaid
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="pt-6 pb-2">
                <div className="flex justify-between items-end mb-6">
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="text-3xl font-bold tracking-tight">₹{bill.totalAmount}</span>
                </div>
                
                <div className="space-y-3 text-sm border-t pt-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tiffins ({bill.tiffinCount} × ₹{bill.tiffinRate})</span>
                    <span className="font-medium">₹{bill.tiffinTotal}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rent</span>
                    <span className="font-medium">₹{bill.rentAmount}</span>
                  </div>
                  {(bill.otherCharges > 0 || role === "admin") && (
                    <div className="flex justify-between items-center group">
                      <div className="flex flex-col">
                        <span className="text-muted-foreground">Other Charges</span>
                        {bill.otherChargesNote && <span className="text-xs text-muted-foreground/70">{bill.otherChargesNote}</span>}
                      </div>
                      <div className="flex items-center">
                        <span className="font-medium">₹{bill.otherCharges}</span>
                        {role === "admin" && (
                          <Button variant="ghost" size="icon" onClick={() => openEditModal(bill)} className="ml-1 h-6 w-6 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-opacity">
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {bill.tiffins && bill.tiffins.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <details className="group">
                      <summary className="flex justify-between items-center font-medium cursor-pointer list-none text-sm text-muted-foreground hover:text-primary transition-colors">
                        <span>View Billed Tiffins</span>
                        <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" />
                      </summary>
                      <div className="text-xs mt-3 space-y-1.5 max-h-32 overflow-y-auto pr-2 custom-scrollbar">
                        {(bill.tiffins as { _id: string; date: string; lunchStatus: string; dinnerStatus: string; lunchBill?: string; dinnerBill?: string; lunchExtra: number; dinnerExtra: number }[]).map((t) => (
                          <div key={t._id} className="flex justify-between items-center bg-muted/50 p-1.5 rounded">
                            <span className="font-medium">{new Date(t.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            <div className="flex gap-1.5">
                              {t.lunchStatus === 'consumed' && t.lunchBill?.toString() === bill._id.toString() && (
                                <Badge variant="secondary" className="h-5 px-1.5 py-0 text-[10px] bg-primary/10 text-primary hover:bg-primary/10 font-medium">L {t.lunchExtra > 0 ? `+${t.lunchExtra}` : ''}</Badge>
                              )}
                              {t.dinnerStatus === 'consumed' && t.dinnerBill?.toString() === bill._id.toString() && (
                                <Badge variant="secondary" className="h-5 px-1.5 py-0 text-[10px] bg-orange-100 text-orange-700 hover:bg-orange-100 font-medium">D {t.dinnerExtra > 0 ? `+${t.dinnerExtra}` : ''}</Badge>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </details>
                  </div>
                )}
              </CardContent>

              {role === "admin" && (
                <CardFooter className="pt-2 pb-5 px-5 gap-2 mt-auto border-t bg-muted/5">
                  <Button
                    variant={bill.status === 'paid' ? "outline" : "default"}
                    className={`flex-1 rounded-xl transition-all ${bill.status === 'paid' ? 'hover:bg-destructive hover:text-destructive-foreground hover:border-destructive' : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'}`}
                    onClick={() => toggleStatus(bill._id, bill.status)}
                  >
                    {bill.status === 'paid' ? 'Mark Unpaid' : 'Mark Paid'}
                  </Button>
                  {bill.otherCharges === 0 && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl shrink-0"
                      onClick={() => openEditModal(bill)}
                      title="Add Other Charges"
                    >
                      <Plus className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  )}
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Generate Bills Modal */}
      <Dialog open={showGenerateModal} onOpenChange={setShowGenerateModal}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
              <CalendarIcon className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Generate Bills</DialogTitle>
            <DialogDescription className="text-center">
              Create bills for a specific period or custom cycle.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleGenerateBills} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="customerId">Member(s)</Label>
              <select
                id="customerId"
                value={genParams.customerId}
                onChange={(e) => setGenParams({ ...genParams, customerId: e.target.value })}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="all">All Active Members</option>
                {members.map(m => (
                  <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingPeriod">Billing Period</Label>
              <Input
                id="billingPeriod"
                type="month"
                required
                value={genParams.periodName}
                onChange={(e) => {
                  const val = e.target.value;
                  const updates: Record<string, string> = { periodName: val };
                  if (val) {
                    const [year, month] = val.split('-');
                    if (year && month) {
                      updates.startDate = `${year}-${month}-01`;
                      const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
                      updates.endDate = `${year}-${month}-${lastDay}`;
                    }
                  }
                  setGenParams({ ...genParams, ...updates });
                }}
              />
            </div>
            <div className="flex gap-6 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeTiffin" 
                  checked={genParams.includeTiffin}
                  onCheckedChange={(checked) => setGenParams({ ...genParams, includeTiffin: !!checked })}
                />
                <Label htmlFor="includeTiffin" className="font-normal cursor-pointer">Include Tiffins</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="includeRent" 
                  checked={genParams.includeRent}
                  onCheckedChange={(checked) => setGenParams({ ...genParams, includeRent: !!checked })}
                />
                <Label htmlFor="includeRent" className="font-normal cursor-pointer">Include Rent</Label>
              </div>
            </div>
            
            {genParams.includeTiffin && (
              <div className="pt-2 space-y-2">
                <Label>Tiffin Price (₹)</Label>
                <Input
                  type="number"
                  disabled
                  value={org.tiffinPrice || 0}
                  className="bg-muted text-muted-foreground"
                />
                <p className="text-[11px] text-muted-foreground">
                  Configured in Organization Settings.
                </p>
              </div>
            )}

            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full" disabled={generating}>
                {generating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                ) : (
                  "Generate Bills"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Charges Modal */}
      <Dialog open={!!editingBill} onOpenChange={(open) => !open && setEditingBill(null)}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 mb-4">
              <IndianRupee className="h-6 w-6 text-primary" />
            </div>
            <DialogTitle className="text-center">Other Charges</DialogTitle>
            <DialogDescription className="text-center">
              Update additional charges for {editingBill?.customer?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateCharges} className="space-y-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (₹)</Label>
              <Input
                id="amount"
                type="number"
                required
                value={otherCharges}
                onChange={(e) => setOtherCharges(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="note">Note / Reason</Label>
              <Input
                id="note"
                type="text"
                value={otherChargesNote}
                onChange={(e) => setOtherChargesNote(e.target.value)}
                placeholder="e.g. Late fee, cleaning, etc."
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="submit" className="w-full" disabled={updating}>
                {updating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : (
                  "Save Charges"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
