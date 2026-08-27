import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import Organization from "@/models/Organization";
import TiffinEntry from "@/models/TiffinEntry";
import RentalUnit from "@/models/RentalUnit";
import Bill from "@/models/Bill";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectToDatabase();
    const organization = await Organization.findById(id).lean();

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const memberData = (organization.members as { user: { toString: () => string }; status: boolean; role: string }[]).find(m => m.user.toString() === user.userId);
    if (!memberData || memberData.status !== true) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const today = new Date().toISOString().split("T")[0];
    const monthPrefix = today.substring(0, 7); // YYYY-MM

    let stats: Record<string, unknown> = {};

    if (memberData.role === "admin") {
      // 1. Total Members
      const activeMembers = (organization.members as { status: boolean; role: string }[]).filter(m => m.status === true && m.role !== "admin").length;
      
      // 2. Today's Tiffins
      const todaysEntries = await TiffinEntry.find({
        organization: id,
        date: today
      });
      let todayTiffinsCount = 0;
      todaysEntries.forEach(entry => {
        if (entry.lunchStatus === "consumed") todayTiffinsCount += (1 + entry.lunchExtra);
        if (entry.dinnerStatus === "consumed") todayTiffinsCount += (1 + entry.dinnerExtra);
      });

      // 3. Rental Stats
      const allUnits = await RentalUnit.find({ organization: id });
      const occupiedUnits = allUnits.filter((u: { tenant?: unknown }) => u.tenant);
      const expectedRent = occupiedUnits.reduce((acc: number, unit: { rentAmount?: number }) => acc + (unit.rentAmount || 0), 0);

      // 4. Billing Stats
      const thisMonthBills = await Bill.find({ organization: id, periodName: monthPrefix });
      
      let monthlyTiffinRev = 0;
      
      thisMonthBills.forEach((bill: { tiffinTotal?: number }) => {
        monthlyTiffinRev += bill.tiffinTotal || 0;
      });

      // All unpaid bills for the pending count and outstanding amount
      const allUnpaidBills = await Bill.find({ organization: id, status: { $ne: "paid" } });
      const pendingPayments = allUnpaidBills.length;
      let totalOutstanding = 0;
      allUnpaidBills.forEach((bill: { totalAmount?: number }) => {
        totalOutstanding += bill.totalAmount || 0;
      });

      // 5. Admin Trends Data
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
      });

      const last7DaysEntries = await TiffinEntry.find({
        organization: id,
        date: { $in: last7Days }
      });

      const tiffinTrends = last7Days.map(date => {
        const dayEntries = last7DaysEntries.filter(e => e.date === date);
        let count = 0;
        dayEntries.forEach(entry => {
          if (entry.lunchStatus === "consumed") count += (1 + entry.lunchExtra);
          if (entry.dinnerStatus === "consumed") count += (1 + entry.dinnerExtra);
        });
        return {
          date: date.substring(5), // MM-DD
          count
        };
      });

      const last6Months = Array.from({ length: 6 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - (5 - i));
        return d.toISOString().substring(0, 7);
      });

      const last6MonthsBills = await Bill.find({
        organization: id,
        periodName: { $in: last6Months }
      });

      const revenueTrends = last6Months.map(month => {
        const monthBills = last6MonthsBills.filter(b => b.periodName === month);
        let total = 0;
        let paid = 0;
        monthBills.forEach(b => {
          total += b.totalAmount || 0;
          if (b.status === "paid") paid += b.totalAmount || 0;
        });
        return {
          month,
          total,
          paid
        };
      });

      const recentUnpaidBills = await Bill.find({ organization: id, status: { $ne: "paid" } })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("customer", "name")
        .lean();

      stats = {
        totalMembers: activeMembers,
        todaysTiffins: todayTiffinsCount,
        expectedRent,
        occupancy: {
          occupied: occupiedUnits.length,
          total: allUnits.length
        },
        monthlyTiffinRev,
        pendingPayments,
        totalOutstanding,
        tiffinTrends,
        revenueTrends,
        recentUnpaidBills
      };

    } else {
      // Customer stats
      
      // 1. Month's Tiffin Consumption
      const monthEntries = await TiffinEntry.find({
        organization: id,
        customer: user.userId as string,
        date: { $regex: `^${monthPrefix}` }
      });
      
      let monthlyTiffinsCount = 0;
      monthEntries.forEach(entry => {
        if (entry.lunchStatus === "consumed") monthlyTiffinsCount += (1 + entry.lunchExtra);
        if (entry.dinnerStatus === "consumed") monthlyTiffinsCount += (1 + entry.dinnerExtra);
      });

      // 2. Rental Stat
      const myUnit = await RentalUnit.findOne({ organization: id, tenant: user.userId as string });

      // 3. Billing Stats
      const myBill = await Bill.findOne({ organization: id, customer: user.userId as string, periodName: monthPrefix });
      const tiffinPrice = organization.tiffinPrice || 0;
      
      const estimatedTiffinBill = myBill ? myBill.tiffinTotal : (monthlyTiffinsCount * tiffinPrice);
      const amountPaid = myBill && myBill.status === "paid" ? myBill.totalAmount : 0;
      const amountPending = myBill && myBill.status === "unpaid" ? myBill.totalAmount : 0;
      const otherCharges = myBill ? myBill.otherCharges : 0;

      // 4. Customer Trends Data
      const last14Days = Array.from({ length: 14 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        return d.toISOString().split("T")[0];
      });

      const last14DaysEntries = await TiffinEntry.find({
        organization: id,
        customer: user.userId as string,
        date: { $in: last14Days }
      });

      const consumptionHistory = last14Days.map(date => {
        const entry = last14DaysEntries.find(e => e.date === date);
        let lunch = 0;
        let dinner = 0;
        if (entry) {
          if (entry.lunchStatus === "consumed") lunch += (1 + entry.lunchExtra);
          if (entry.dinnerStatus === "consumed") dinner += (1 + entry.dinnerExtra);
        }
        return {
          date: date.substring(5), // MM-DD
          lunch,
          dinner,
          total: lunch + dinner
        };
      });

      stats = {
        monthlyTiffins: monthlyTiffinsCount,
        monthlyRent: myUnit ? myUnit.rentAmount : 0,
        estimatedTiffinBill,
        amountPaid,
        amountPending,
        otherCharges,
        consumptionHistory
      };
    }

    return NextResponse.json({ stats }, { status: 200 });

  } catch (error: unknown) {
    console.error("GET dashboard stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
