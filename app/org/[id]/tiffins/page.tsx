"use client";

import { useState, useEffect, useCallback } from "react";
import { useOrg } from "@/components/OrgProvider";
import { Loader2, Check, X, Minus, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { useAppDispatch, useAppSelector } from "@/lib/hooks";
import { fetchTiffinEntries, updateTiffinEntryAsync, setDate, optimisticUpdate } from "@/lib/features/tiffins/tiffinsSlice";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

export default function TiffinsPage() {
  const { org, role } = useOrg();
  const dispatch = useAppDispatch();
  const { entries, loading, date } = useAppSelector((state) => state.tiffins);
  const [members, setMembers] = useState<{ user: { _id: string; name: string; email: string }; role: string; status: boolean }[]>([]);
  const [updating, setUpdating] = useState<string | null>(null); // "userId-meal"

  const fetchMembers = useCallback(async () => {
    try {
      const res = await fetch(`/api/organizations/${org._id}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.organization.members.filter((m: { status: boolean; role: string }) => m.status === true && m.role !== "admin"));
      }
    } catch (error) {
      console.error(error);
    }
  }, [org._id]);

  // Fetch active members (Admin only)
  useEffect(() => {
    const load = async () => {
      if (role === "admin") {
        await fetchMembers();
      }
    };
    load();
  }, [role, fetchMembers]);

  const fetchEntries = useCallback(() => {
    dispatch(fetchTiffinEntries({ orgId: org._id, date }));
  }, [dispatch, org._id, date]);

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  const updateEntry = async (customerId: string, field: "lunchStatus" | "dinnerStatus", value: string) => {
    setUpdating(`${customerId}-${field}`);
    
    const currentEntry = entries.find(e => (e.customer?._id || e.customer) === customerId) || {
      customer: { _id: customerId },
      lunchStatus: "none",
      lunchExtra: 0,
      dinnerStatus: "none",
      dinnerExtra: 0
    };
    
    const memberInfo = members.find(m => m.user._id === customerId);
    
    // Optimistic UI update via Redux
    dispatch(optimisticUpdate({ customerId, field, value, memberInfo }));

    try {
      await dispatch(updateTiffinEntryAsync({
        orgId: org._id,
        customerId,
        date,
        field,
        value,
        currentEntry,
        members
      })).unwrap();
    } catch {
      toast.error("Failed to update record");
      fetchEntries(); // Revert optimistic
    } finally {
      setUpdating(null);
    }
  };

  const changeDate = (days: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    dispatch(setDate(d.toISOString().split("T")[0]));
  };

  const getEntryForCustomer = (customerId: string) => {
    return (entries.find(e => (e.customer?._id || e.customer) === customerId) || {
      lunchStatus: "none",
      dinnerStatus: "none",
      lunchPaymentStatus: "unpaid",
      dinnerPaymentStatus: "unpaid"
    }) as Record<string, unknown>;
  };

  const renderStatusButtons = (customerId: string, meal: "lunchStatus" | "dinnerStatus") => {
    const entry = getEntryForCustomer(customerId);
    const status = entry[meal];
    
    // Determine payment status
    const paymentStatusField = meal === "lunchStatus" ? "lunchPaymentStatus" : "dinnerPaymentStatus";
    const billField = meal === "lunchStatus" ? "lunchBill" : "dinnerBill";
    const paymentStatus = entry[paymentStatusField];
    const isBilled = !!entry[billField];
    const isPaid = paymentStatus === "paid";
    
    return (
      <div className="flex flex-col space-y-1 w-full">
        <ToggleGroup
          value={[String(status ?? "none")]}
          onValueChange={(values: string[]) => {
            const value = values[0];
            if (value && !isPaid) updateEntry(customerId, meal, value);
          }}
          disabled={isPaid || updating === `${customerId}-${meal}`}
          className="justify-between bg-muted/20 p-1 rounded-lg border border-border/40 flex w-full"
        >
          <ToggleGroupItem 
            value="none" 
            aria-label="Toggle none" 
            className={`flex-1 h-8 px-1 data-[state=on]:bg-background data-[state=on]:shadow-sm data-[state=on]:text-foreground rounded-md`}
          >
            <Minus className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="consumed" 
            aria-label="Toggle consumed"
            className={`flex-1 h-8 px-1 data-[state=on]:bg-emerald-500 data-[state=on]:text-white data-[state=on]:shadow-sm text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md`}
          >
            <Check className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="cancelled" 
            aria-label="Toggle cancelled"
            className={`flex-1 h-8 px-1 data-[state=on]:bg-rose-500 data-[state=on]:text-white data-[state=on]:shadow-sm text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-md`}
          >
            <X className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>
        
        <div className="flex justify-between items-center px-1 min-h-4">
          {updating === `${customerId}-${meal}` ? (
             <span className="text-[9px] text-muted-foreground flex items-center font-medium uppercase tracking-wider">
               <Loader2 className="h-3 w-3 animate-spin mr-1"/> Updating
             </span>
          ) : (
            <div className="flex items-center justify-end w-full gap-1">
              {isPaid && (
                <Badge variant="outline" className="text-[9px] h-4 bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-wider px-1 py-0">Paid</Badge>
              )}
              {isBilled && !isPaid && status !== "none" && (
                <Badge variant="outline" className="text-[9px] h-4 bg-orange-50 text-orange-700 border-orange-200 uppercase tracking-wider px-1 py-0">Billed</Badge>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (role !== "admin") {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">My Tiffins</h1>
          <p className="text-sm text-muted-foreground mt-1">Track your daily meals.</p>
        </div>
        
        <Card className="border-border rounded-2xl overflow-hidden shadow-sm">
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-muted/10 border-b border-border">
            <div className="flex items-center space-x-2 bg-background rounded-xl border border-border p-1 shadow-sm">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => changeDate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="w-32 text-center font-semibold text-sm">
                {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => changeDate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Input 
              type="date" 
              value={date} 
              onChange={(e) => dispatch(setDate(e.target.value))}
              className="w-full sm:w-auto rounded-xl bg-background"
            />
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card className="border-border rounded-2xl shadow-sm">
            <CardContent className="p-0">
              {entries.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
                  <Minus className="h-8 w-8 text-muted-foreground/30 mb-3" />
                  No records found for this date.
                </div>
              ) : (
                  <div className="divide-y divide-border">
                   {(() => {
                     const e0 = entries[0] as {
                       lunchStatus?: string;
                       dinnerStatus?: string;
                       lunchPaymentStatus?: string;
                       dinnerPaymentStatus?: string;
                       lunchBill?: unknown;
                       dinnerBill?: unknown;
                     };
                     return (
                       <>
                         <div className="flex justify-between items-center p-5 sm:p-6 hover:bg-muted/30 transition-colors">
                           <span className="font-semibold text-foreground">Lunch</span>
                           <div className="flex items-center gap-2">
                             {e0.lunchStatus === "consumed" ? (
                               <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100"><Check className="h-3.5 w-3.5 mr-1"/> Consumed</Badge>
                             ) : e0.lunchStatus === "cancelled" ? (
                               <Badge variant="destructive" className="bg-rose-100 text-rose-800 hover:bg-rose-100"><X className="h-3.5 w-3.5 mr-1"/> Cancelled</Badge>
                             ) : (
                               <Badge variant="secondary" className="bg-muted text-muted-foreground"><Minus className="h-3.5 w-3.5 mr-1"/> None</Badge>
                             )}
                             {e0.lunchPaymentStatus === "paid" && (
                               <Badge variant="outline" className="text-[10px] h-5 bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-wider">Paid</Badge>
                             )}
                             {!!e0.lunchBill && e0.lunchPaymentStatus !== "paid" && e0.lunchStatus !== "none" && (
                               <Badge variant="outline" className="text-[10px] h-5 bg-orange-50 text-orange-700 border-orange-200 uppercase tracking-wider">Billed</Badge>
                             )}
                           </div>
                         </div>
                         <div className="flex justify-between items-center p-5 sm:p-6 hover:bg-muted/30 transition-colors">
                           <span className="font-semibold text-foreground">Dinner</span>
                           <div className="flex items-center gap-2">
                             {e0.dinnerStatus === "consumed" ? (
                               <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100"><Check className="h-3.5 w-3.5 mr-1"/> Consumed</Badge>
                             ) : e0.dinnerStatus === "cancelled" ? (
                               <Badge variant="destructive" className="bg-rose-100 text-rose-800 hover:bg-rose-100"><X className="h-3.5 w-3.5 mr-1"/> Cancelled</Badge>
                             ) : (
                               <Badge variant="secondary" className="bg-muted text-muted-foreground"><Minus className="h-3.5 w-3.5 mr-1"/> None</Badge>
                             )}
                             {e0.dinnerPaymentStatus === "paid" && (
                               <Badge variant="outline" className="text-[10px] h-5 bg-emerald-50 text-emerald-700 border-emerald-200 uppercase tracking-wider">Paid</Badge>
                             )}
                             {!!e0.dinnerBill && e0.dinnerPaymentStatus !== "paid" && e0.dinnerStatus !== "none" && (
                               <Badge variant="outline" className="text-[10px] h-5 bg-orange-50 text-orange-700 border-orange-200 uppercase tracking-wider">Billed</Badge>
                             )}
                           </div>
                         </div>
                       </>
                     );
                   })()}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // Admin View
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Daily Tiffins</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage meals for {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
        </div>
        <div className="flex items-center space-x-1 bg-card rounded-xl border border-border p-1 shadow-sm">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => changeDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input 
            type="date" 
            value={date} 
            onChange={(e) => dispatch(setDate(e.target.value))}
            className="h-8 border-0 bg-transparent w-35 focus-visible:ring-0 focus-visible:ring-offset-0 px-2 text-sm font-medium"
          />
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => changeDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading && members.length === 0 ? (
        <Card className="border-border rounded-2xl shadow-sm">
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {members.map((member) => (
            <Card key={member.user._id} className="border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
              <div className="p-2.5 bg-muted/10 border-b border-border flex items-center space-x-2.5">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                  {member.user.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate">{member.user.name}</h3>
                  <p className="text-[10px] text-muted-foreground truncate">{member.user.email}</p>
                </div>
              </div>
              <div className="p-3 pb-1 space-y-2 flex-1">
                <div className="flex items-center gap-3">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-12 shrink-0">Lunch</div>
                  <div className="flex-1">{renderStatusButtons(member.user._id, "lunchStatus")}</div>
                </div>
                <div className="flex items-center gap-3 pt-1 border-t border-border/50">
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider w-12 shrink-0">Dinner</div>
                  <div className="flex-1">{renderStatusButtons(member.user._id, "dinnerStatus")}</div>
                </div>
              </div>
            </Card>
          ))}
          {members.length === 0 && !loading && (
            <div className="col-span-full">
              <Card className="border-border rounded-2xl shadow-sm">
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
                  <Minus className="h-8 w-8 text-muted-foreground/30 mb-3" />
                  <p>No active members found.</p>
                </div>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
