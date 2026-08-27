"use client";

import { useEffect, useState } from "react";
import { Users, Package, TrendingUp, IndianRupee, AlertCircle, Home as HomeIcon } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export default function AdminDashboard({ org }: { org: { _id: string; [key: string]: unknown } }) {
  const [dashboardStats, setDashboardStats] = useState<{
    totalMembers?: number | string;
    todaysTiffins?: number | string;
    monthlyTiffinRev?: number | string;
    expectedRent?: number | string;
    pendingPayments?: number | string;
    occupancy?: { occupied: number; total: number };
    recentUnpaidBills?: { _id: string; customer?: { name: string }; periodName: string; totalAmount: number }[];
    revenueTrends?: { month: string; total: number }[];
  } | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch(`/api/organizations/${org._id}/dashboard`);
        if (res.ok) {
          const data = await res.json();
          setDashboardStats(data.stats);
        }
      } catch (e) {
        console.error(e);
      }
    }
    fetchStats();
  }, [org._id]);

  const stats = [
    { name: "Total Members", value: dashboardStats?.totalMembers ?? "0", icon: Users, color: "text-primary", bg: "bg-primary/10", trend: "Members" },
    { name: "Today's Tiffins", value: dashboardStats?.todaysTiffins ?? "0", icon: Package, color: "text-orange-600", bg: "bg-orange-50", trend: "Active today" },
    { name: "Tiffin Revenue", value: `₹${dashboardStats?.monthlyTiffinRev ?? 0}`, icon: IndianRupee, color: "text-emerald-600", bg: "bg-emerald-50", trend: "This month" },
    { name: "Rent Expected", value: `₹${dashboardStats?.expectedRent ?? 0}`, icon: HomeIcon, color: "text-indigo-600", bg: "bg-indigo-50", trend: "This month" },
    { name: "Unpaid Bills", value: dashboardStats?.pendingPayments ?? "0", icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50", trend: "Needs attention" },
    { name: "Occupancy", value: dashboardStats?.occupancy ? `${dashboardStats.occupancy.occupied}/${dashboardStats.occupancy.total}` : "0/0", icon: TrendingUp, color: "text-violet-600", bg: "bg-violet-50", trend: "Units filled" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">
          Admin Overview
        </h2>
        <Badge variant="outline" className="w-fit text-sm py-1 font-medium bg-white">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Badge>
      </div>
      
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {stats.map((item) => (
          <Card key={item.name} className="overflow-hidden group hover:shadow-md hover:-translate-y-0.5 transition-all duration-150 border border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {item.name}
              </CardTitle>
              <div className={`p-1.5 rounded-lg ${item.bg} group-hover:scale-110 transition-transform`}>
                <item.icon className={`h-3.5 w-3.5 ${item.color}`} />
              </div>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground mt-0.5">{item.trend}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pending Payments</CardTitle>
              <CardDescription>Recent unpaid bills across tenants</CardDescription>
            </div>
            <Link href={`/org/${org._id}/bills`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              View All
            </Link>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center">
            {dashboardStats?.recentUnpaidBills && dashboardStats.recentUnpaidBills.length > 0 ? (
              <div className="space-y-4">
                {dashboardStats.recentUnpaidBills.map((bill: { _id: string; customer?: { name: string }; periodName: string; totalAmount: number }) => (
                  <div key={bill._id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium leading-none">{bill.customer?.name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground mt-1">{bill.periodName}</p>
                    </div>
                    <div className="font-bold">₹{bill.totalAmount}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">No pending payments recorded yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Monthly Trends</CardTitle>
              <CardDescription>Revenue trajectory over time</CardDescription>
            </div>
            <Button variant="outline" size="sm">Analytics</Button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center min-h-62.5">
            {dashboardStats?.revenueTrends && dashboardStats.revenueTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dashboardStats.revenueTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(val) => `₹${val}`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}
                    formatter={(value) => [`₹${value ?? 0}`, 'Revenue']}
                  />
                  <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center h-full">
                <TrendingUp className="h-10 w-10 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">Not enough data to display trends</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
