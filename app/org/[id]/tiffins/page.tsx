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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
      <div className="flex flex-col items-center space-y-1">
        <ToggleGroup
          value={[String(status ?? "none")]}
          onValueChange={(values: string[]) => {
            const value = values[0];
            if (value && !isPaid) updateEntry(customerId, meal, value);
          }}
          disabled={isPaid || updating === `${customerId}-${meal}`}
          className="justify-center bg-muted/50 p-1 rounded-md"
        >
          <ToggleGroupItem 
            value="none" 
            aria-label="Toggle none" 
            className={`h-7 px-2 data-[state=on]:bg-background data-[state=on]:shadow-sm data-[state=on]:text-foreground`}
          >
            <Minus className="h-3.5 w-3.5" />
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="consumed" 
            aria-label="Toggle consumed"
            className={`h-7 px-2 data-[state=on]:bg-green-500 data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm text-green-600 hover:text-green-700`}
          >
            <Check className="h-3.5 w-3.5" />
          </ToggleGroupItem>
          <ToggleGroupItem 
            value="cancelled" 
            aria-label="Toggle cancelled"
            className={`h-7 px-2 data-[state=on]:bg-red-500 data-[state=on]:text-primary-foreground data-[state=on]:shadow-sm text-red-600 hover:text-red-700`}
          >
            <X className="h-3.5 w-3.5" />
          </ToggleGroupItem>
        </ToggleGroup>
        
        {isPaid && (
          <Badge variant="outline" className="text-[10px] h-4 bg-green-50 text-green-700 border-green-200 uppercase tracking-wider">Paid</Badge>
        )}
        {isBilled && !isPaid && status !== "none" && (
          <Badge variant="outline" className="text-[10px] h-4 bg-orange-50 text-orange-700 border-orange-200 uppercase tracking-wider">Billed</Badge>
        )}
      </div>
    );
  };

  if (role !== "admin") {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight">My Tiffins</h1>
        
        <Card>
          <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="icon" onClick={() => changeDate(-1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="w-40 text-center font-semibold">
                {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </div>
              <Button variant="outline" size="icon" onClick={() => changeDate(1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Input 
              type="date" 
              value={date} 
              onChange={(e) => dispatch(setDate(e.target.value))}
              className="w-full sm:w-auto"
            />
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              {entries.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">No records found for this date.</div>
              ) : (
                  <div className="divide-y">
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
                         <div className="flex justify-between items-center p-6">
                           <span className="font-medium">Lunch</span>
                           <div className="flex items-center gap-2">
                             {e0.lunchStatus === "consumed" ? (
                               <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><Check className="h-3.5 w-3.5 mr-1"/> Consumed</Badge>
                             ) : e0.lunchStatus === "cancelled" ? (
                               <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100"><X className="h-3.5 w-3.5 mr-1"/> Cancelled</Badge>
                             ) : (
                               <Badge variant="secondary"><Minus className="h-3.5 w-3.5 mr-1"/> None</Badge>
                             )}
                             {e0.lunchPaymentStatus === "paid" && (
                               <Badge variant="outline" className="text-[10px] h-5 bg-green-50 text-green-700 border-green-200 uppercase tracking-wider">Paid</Badge>
                             )}
                             {!!e0.lunchBill && e0.lunchPaymentStatus !== "paid" && e0.lunchStatus !== "none" && (
                               <Badge variant="outline" className="text-[10px] h-5 bg-orange-50 text-orange-700 border-orange-200 uppercase tracking-wider">Billed</Badge>
                             )}
                           </div>
                         </div>
                         <div className="flex justify-between items-center p-6">
                           <span className="font-medium">Dinner</span>
                           <div className="flex items-center gap-2">
                             {e0.dinnerStatus === "consumed" ? (
                               <Badge className="bg-green-100 text-green-800 hover:bg-green-100"><Check className="h-3.5 w-3.5 mr-1"/> Consumed</Badge>
                             ) : e0.dinnerStatus === "cancelled" ? (
                               <Badge variant="destructive" className="bg-red-100 text-red-800 hover:bg-red-100"><X className="h-3.5 w-3.5 mr-1"/> Cancelled</Badge>
                             ) : (
                               <Badge variant="secondary"><Minus className="h-3.5 w-3.5 mr-1"/> None</Badge>
                             )}
                             {e0.dinnerPaymentStatus === "paid" && (
                               <Badge variant="outline" className="text-[10px] h-5 bg-green-50 text-green-700 border-green-200 uppercase tracking-wider">Paid</Badge>
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
        <h1 className="text-2xl font-bold tracking-tight">Daily Tiffin Management</h1>
        <div className="flex items-center space-x-1 bg-background rounded-md border p-1 shadow-sm">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeDate(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Input 
            type="date" 
            value={date} 
            onChange={(e) => dispatch(setDate(e.target.value))}
            className="h-8 border-0 bg-transparent w-35 focus-visible:ring-0 focus-visible:ring-offset-0 px-2"
          />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => changeDate(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card className="overflow-hidden">
        {loading && members.length === 0 ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="w-75">Customer</TableHead>
                  <TableHead className="text-center w-40">Lunch</TableHead>
                  <TableHead className="text-center w-40">Dinner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.user._id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                          {member.user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <span>{member.user.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      {renderStatusButtons(member.user._id, "lunchStatus")}
                    </TableCell>
                    <TableCell className="text-center">
                      {renderStatusButtons(member.user._id, "dinnerStatus")}
                    </TableCell>
                  </TableRow>
                ))}
                {members.length === 0 && !loading && (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                      No active members found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}
