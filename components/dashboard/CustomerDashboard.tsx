"use client";

import { useEffect, useState } from "react";
import { Package, DollarSign, Receipt, Clock, CreditCard, Home as HomeIcon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function CustomerDashboard({ org }: { org: { _id: string; name: string; [key: string]: unknown } }) {
  interface DashboardStats {
    monthlyTiffins?: number;
    estimatedTiffinBill?: number;
    monthlyRent?: number;
    otherCharges?: number;
    amountPaid?: number;
    amountPending?: number;
    consumptionHistory?: { date: string; lunch: number; dinner: number; total: number }[];
  }
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

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
    { name: "Month's Tiffins", value: dashboardStats?.monthlyTiffins ?? "0", icon: Package, color: "text-blue-600", bg: "bg-blue-50", ring: "ring-blue-100", trend: "Consumed" },
    { name: "Est. Tiffin Bill", value: `₹${dashboardStats?.estimatedTiffinBill ?? 0}`, icon: DollarSign, color: "text-orange-600", bg: "bg-orange-50", ring: "ring-orange-100", trend: "Projected" },
    { name: "Monthly Rent", value: `₹${dashboardStats?.monthlyRent ?? 0}`, icon: HomeIcon, color: "text-indigo-600", bg: "bg-indigo-50", ring: "ring-indigo-100", trend: "Fixed" },
    { name: "Other Charges", value: `₹${dashboardStats?.otherCharges ?? 0}`, icon: Receipt, color: "text-purple-600", bg: "bg-purple-50", ring: "ring-purple-100", trend: "Extra" },
    { name: "Amount Paid", value: `₹${dashboardStats?.amountPaid ?? 0}`, icon: CreditCard, color: "text-emerald-600", bg: "bg-emerald-50", ring: "ring-emerald-100", trend: "Settled" },
    { name: "Amount Pending", value: `₹${dashboardStats?.amountPending ?? 0}`, icon: Clock, color: "text-rose-600", bg: "bg-rose-50", ring: "ring-rose-100", trend: "Due" },
  ];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">
          My Overview
        </h2>
        <Badge variant="outline" className="w-fit text-sm py-1 font-medium bg-white">
          {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Badge>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((item) => (
          <Card key={item.name} className="overflow-hidden group hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.name}
              </CardTitle>
              <div className={`p-2 rounded-md ${item.bg} group-hover:scale-110 transition-transform`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{item.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {item.trend}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="bg-primary text-primary-foreground border-none overflow-hidden relative group hover:shadow-lg transition-shadow">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl opacity-20 transform translate-x-1/2 -translate-y-1/2"></div>
          
          <CardHeader>
            <CardTitle className="text-primary-foreground/90 font-medium">Total Estimated Bill</CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-bold mb-4 tracking-tight">
              ₹{(
                (Number(dashboardStats?.estimatedTiffinBill) || 0) + 
                (Number(dashboardStats?.monthlyRent) || 0) + 
                (Number(dashboardStats?.otherCharges) || 0)
              ).toLocaleString()}
            </div>
            <div className="flex items-center text-primary-foreground/80 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 mr-2 animate-pulse"></span>
              For the current month
            </div>
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Consumption History</CardTitle>
              <CardDescription>Daily tiffin consumption</CardDescription>
            </div>
            <Button variant="outline" size="sm">Details</Button>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-center min-h-62.5">
            {dashboardStats?.consumptionHistory && dashboardStats.consumptionHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboardStats.consumptionHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} allowDecimals={false} />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border))', backgroundColor: 'hsl(var(--background))' }}
                  />
                  <Bar dataKey="lunch" name="Lunch" fill="#F97316" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="dinner" name="Dinner" fill="#3B82F6" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center h-full">
                <Package className="h-10 w-10 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">No history available yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
