import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import connectToDatabase from "@/lib/mongodb";
import Organization from "@/models/Organization";
import Bill from "@/models/Bill";
import TiffinEntry from "@/models/TiffinEntry";
import { verifyToken } from "@/lib/auth";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const periodName = searchParams.get("periodName");

    if (!periodName) {
      return NextResponse.json({ error: "periodName parameter is required" }, { status: 400 });
    }

    await connectToDatabase();
    const organization = await Organization.findById(id).lean();

    if (!organization) {
      return NextResponse.json({ error: "Organization not found" }, { status: 404 });
    }

    const memberData = (organization.members as { user: { toString: () => string }; status: boolean; role: string }[]).find(m => m.user.toString() === user.userId);
    if (!memberData || memberData.status !== true) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const query: Record<string, unknown> = { organization: id, periodName };
    if (memberData.role !== "admin") {
      query.customer = user.userId;
    }

    const bills = await Bill.find(query).populate("customer", "name email").sort({ createdAt: -1 }).lean();

    const billIds = bills.map(b => b._id);
    const allTiffins = await TiffinEntry.find({ 
      $or: [
        { lunchBill: { $in: billIds } },
        { dinnerBill: { $in: billIds } }
      ]
    }).sort({ date: 1 }).lean();

    const billsWithTiffins = bills.map(bill => {
      const tiffins = allTiffins.filter((t: { lunchBill?: { toString: () => string }; dinnerBill?: { toString: () => string } }) => 
        t.lunchBill?.toString() === bill._id.toString() || 
        t.dinnerBill?.toString() === bill._id.toString()
      );
      return { ...bill, tiffins };
    });

    return NextResponse.json({ bills: billsWithTiffins }, { status: 200 });

  } catch (error: unknown) {
    console.error("GET bills error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
